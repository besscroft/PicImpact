import 'server-only'

import dayjs from 'dayjs'
import ExifReader from 'exifreader'
import sharp from 'sharp'
import { DOMParser } from '@xmldom/xmldom'

import type { ExifType } from '~/types'
import type { AdminTaskIssue, AdminTaskStage } from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA } from '~/types/admin-tasks'

const exifDomParser = new DOMParser()
const FETCH_TIMEOUT_MS = 20_000

export class MetadataTaskCancelledError extends Error {
  constructor(message = 'Task cancellation requested.') {
    super(message)
    this.name = 'MetadataTaskCancelledError'
  }
}

const EMPTY_EXIF: ExifType = {
  make: '',
  model: '',
  bits: '',
  data_time: '',
  exposure_time: '',
  f_number: '',
  exposure_program: '',
  iso_speed_rating: '',
  focal_length: '',
  lens_specification: '',
  lens_model: '',
  exposure_mode: '',
  cfa_pattern: '',
  color_space: '',
  white_balance: '',
}

type ExifTag = {
  value?: unknown
  description?: string
}

type ExifTags = Record<string, ExifTag>

type IssueInput = {
  level: AdminTaskIssue['level']
  stage: AdminTaskStage
  code: string
  summary: string
  detail?: string | null
  httpStatus?: number | null
  httpStatusText?: string | null
}

type CoordinateUpdateResult = {
  updates: Pick<MetadataRefreshUpdate, 'lat' | 'lon'>
  issue?: AdminTaskIssue
}

export type MetadataRefreshImage = {
  id: string
  image_name: string | null
  title: string | null
  url: string | null
  exif: unknown
  width: number
  height: number
  lat: string | null
  lon: string | null
}

export type MetadataRefreshUpdate = {
  exif?: ExifType
  width?: number
  height?: number
  lat?: string
  lon?: string
}

export type MetadataRefreshResult = {
  outcome: 'success' | 'skipped' | 'failed'
  updates: MetadataRefreshUpdate
  issues: AdminTaskIssue[]
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cancellationReasonMessage(reason: unknown) {
  if (reason instanceof Error && reason.message.trim()) return reason.message
  if (typeof reason === 'string' && reason.trim()) return reason.trim()
  return 'Task cancellation requested.'
}

export function createMetadataTaskCancelledError(reason?: unknown) {
  return reason instanceof MetadataTaskCancelledError
    ? reason
    : new MetadataTaskCancelledError(cancellationReasonMessage(reason))
}

export function isMetadataTaskCancelledError(error: unknown): error is MetadataTaskCancelledError {
  return error instanceof MetadataTaskCancelledError
    || (error instanceof Error && error.name === 'MetadataTaskCancelledError')
}

export function throwIfMetadataTaskCancelled(signal?: AbortSignal) {
  if (!signal?.aborted) return
  throw createMetadataTaskCancelledError(signal.reason)
}

function nullableString(value: unknown) {
  const normalized = cleanString(value)
  return normalized || null
}

function pickImageTitle(image: Pick<MetadataRefreshImage, 'id' | 'title' | 'image_name'>) {
  return cleanString(image.title) || cleanString(image.image_name) || image.id
}

function toErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return null
}

function timeoutDetail(error: unknown) {
  const fallback = `Fetch timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`
  const detail = toErrorDetail(error)
  if (!detail) return fallback

  const normalized = detail.toLowerCase().replace(/\s+/g, ' ').trim()
  if (
    normalized === 'the operation was aborted due to timeout'
    || normalized === 'this operation was aborted'
    || normalized === 'signal is aborted without reason'
  ) {
    return fallback
  }

  return detail
}

function normalizeExif(input: Partial<ExifType> | null | undefined): ExifType | null {
  const exif: ExifType = {
    make: cleanString(input?.make),
    model: cleanString(input?.model),
    bits: cleanString(input?.bits),
    data_time: cleanString(input?.data_time),
    exposure_time: cleanString(input?.exposure_time),
    f_number: cleanString(input?.f_number),
    exposure_program: cleanString(input?.exposure_program),
    iso_speed_rating: cleanString(input?.iso_speed_rating),
    focal_length: cleanString(input?.focal_length),
    lens_specification: cleanString(input?.lens_specification),
    lens_model: cleanString(input?.lens_model),
    exposure_mode: cleanString(input?.exposure_mode),
    cfa_pattern: cleanString(input?.cfa_pattern),
    color_space: cleanString(input?.color_space),
    white_balance: cleanString(input?.white_balance),
  }

  if (exif.data_time && !dayjs(exif.data_time).isValid()) {
    exif.data_time = ''
  }

  return Object.values(exif).some(Boolean) ? exif : null
}

function normalizeStoredExif(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null
  }

  return normalizeExif(input as Partial<ExifType>)
}

function areExifEqual(left: ExifType | null, right: ExifType | null) {
  return JSON.stringify(left ?? EMPTY_EXIF) === JSON.stringify(right ?? EMPTY_EXIF)
}

function rationalToNumber(value: [number, number]) {
  const [numerator, denominator] = value
  if (!denominator) {
    return null
  }

  return numerator / denominator
}

function normalizeCoordinate(value: number) {
  const rounded = Number(value.toFixed(6))
  return rounded.toString()
}

function gpsTripletToDecimal(
  coordinates: [[number, number], [number, number], [number, number]] | undefined,
  reference: unknown,
  positiveRef: string,
  negativeRef: string,
) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 3) {
    return null
  }

  const [degrees, minutes, seconds] = coordinates
  const degreeValue = rationalToNumber(degrees)
  const minuteValue = rationalToNumber(minutes)
  const secondValue = rationalToNumber(seconds)

  if (
    degreeValue === null
    || minuteValue === null
    || secondValue === null
  ) {
    return null
  }

  let decimal = degreeValue + minuteValue / 60 + secondValue / 3600
  const ref = Array.isArray(reference) ? reference.join('') : cleanString(reference)

  if (ref === negativeRef) {
    decimal *= -1
  } else if (ref !== positiveRef && ref !== negativeRef) {
    return null
  }

  return decimal
}

function createIssue(
  image: MetadataRefreshImage,
  { level, stage, code, summary, detail = null, httpStatus = null, httpStatusText = null }: IssueInput,
): AdminTaskIssue {
  return {
    imageId: image.id,
    imageTitle: pickImageTitle(image),
    taskKey: ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA,
    level,
    stage,
    code,
    summary,
    detail,
    httpStatus,
    httpStatusText: nullableString(httpStatusText),
    at: new Date().toISOString(),
  }
}

function createSkippedReasonIssue(image: MetadataRefreshImage): AdminTaskIssue {
  return createIssue(image, {
    level: 'info',
    stage: 'persist',
    code: 'metadata_already_current',
    summary: 'Metadata is already up to date.',
    detail: 'The refreshed metadata matched the stored values, so no changes were required.',
  })
}

function getCoordinateUpdates(tags: ExifTags | null, image: MetadataRefreshImage): CoordinateUpdateResult {
  if (!tags) {
    return { updates: {} }
  }

  const updates: Pick<MetadataRefreshUpdate, 'lat' | 'lon'> = {}
  const detailParts: string[] = []

  const hasLatitude = Boolean(tags.GPSLatitude || tags.GPSLatitudeRef)
  const latitude = gpsTripletToDecimal(
    tags.GPSLatitude?.value as [[number, number], [number, number], [number, number]] | undefined,
    tags.GPSLatitudeRef?.value,
    'N',
    'S',
  )
  if (typeof latitude === 'number') {
    if (latitude >= -90 && latitude <= 90) {
      updates.lat = normalizeCoordinate(latitude)
    } else {
      detailParts.push(`Latitude ${latitude} is out of range.`)
    }
  } else if (hasLatitude) {
    detailParts.push('Latitude could not be parsed from EXIF GPS tags.')
  }

  const hasLongitude = Boolean(tags.GPSLongitude || tags.GPSLongitudeRef)
  const longitude = gpsTripletToDecimal(
    tags.GPSLongitude?.value as [[number, number], [number, number], [number, number]] | undefined,
    tags.GPSLongitudeRef?.value,
    'E',
    'W',
  )
  if (typeof longitude === 'number') {
    if (longitude >= -180 && longitude <= 180) {
      updates.lon = normalizeCoordinate(longitude)
    } else {
      detailParts.push(`Longitude ${longitude} is out of range.`)
    }
  } else if (hasLongitude) {
    detailParts.push('Longitude could not be parsed from EXIF GPS tags.')
  }

  if (detailParts.length > 0) {
    return {
      updates,
      issue: createIssue(image, {
        level: 'warning',
        stage: 'parse-exif',
        code: 'invalid_gps_coordinates',
        summary: 'Ignored invalid GPS coordinates.',
        detail: detailParts.join(' '),
      }),
    }
  }

  return { updates }
}

function buildNormalizedExifFromTags(tags: ExifTags | null) {
  if (!tags) {
    return null
  }

  return normalizeExif({
    make: tags.Make?.description,
    model: tags.Model?.description,
    bits: tags['Bits Per Sample']?.description,
    data_time: tags.DateTimeOriginal?.description || tags.DateTime?.description,
    exposure_time: tags.ExposureTime?.description,
    f_number: tags.FNumber?.description,
    exposure_program: tags.ExposureProgram?.description,
    iso_speed_rating: tags.ISOSpeedRatings?.description,
    focal_length: tags.FocalLength?.description,
    lens_specification: tags.LensSpecification?.description,
    lens_model: tags.LensModel?.description,
    exposure_mode: tags.ExposureMode?.description,
    cfa_pattern: tags.CFAPattern?.description,
    color_space: tags.ColorSpace?.description,
    white_balance: tags.WhiteBalance?.description,
  })
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.name === 'TimeoutError' || error.name === 'AbortError' || /timeout/i.test(error.message)
}

export async function refreshImageMetadata(image: MetadataRefreshImage, signal?: AbortSignal): Promise<MetadataRefreshResult> {
  throwIfMetadataTaskCancelled(signal)

  if (!image.url) {
    return {
      outcome: 'failed',
      updates: {},
      issues: [createIssue(image, {
        level: 'error',
        stage: 'prepare',
        code: 'missing_source_url',
        summary: 'Missing source image URL.',
        detail: 'The image record does not include an original image URL.',
      })],
    }
  }

  let buffer: Buffer
  const fetchSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]) : AbortSignal.timeout(FETCH_TIMEOUT_MS)

  try {
    throwIfMetadataTaskCancelled(signal)
    const response = await fetch(image.url, {
      signal: fetchSignal,
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        outcome: 'failed',
        updates: {},
        issues: [createIssue(image, {
          level: 'error',
          stage: 'fetch',
          code: 'http_error',
          summary: 'Failed to fetch the original image.',
          detail: `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
          httpStatus: response.status,
          httpStatusText: response.statusText,
        })],
      }
    }

    buffer = Buffer.from(await response.arrayBuffer())
    throwIfMetadataTaskCancelled(signal)
  } catch (error) {
    if (signal?.aborted || isMetadataTaskCancelledError(error)) {
      throw createMetadataTaskCancelledError(signal?.reason ?? error)
    }

    const timeout = isTimeoutError(error)
    return {
      outcome: 'failed',
      updates: {},
      issues: [createIssue(image, {
        level: 'error',
        stage: 'fetch',
        code: timeout ? 'timeout' : 'fetch_error',
        summary: timeout ? 'Timed out while fetching the original image.' : 'Failed to fetch the original image.',
        detail: timeout ? timeoutDetail(error) : (toErrorDetail(error) || 'Unknown fetch error.'),
      })],
    }
  }

  const issues: AdminTaskIssue[] = []
  let tags: ExifTags | null = null
  let exifCandidate: ExifType | null = null

  try {
    throwIfMetadataTaskCancelled(signal)
    tags = await ExifReader.load(buffer, {
      async: true,
      domParser: exifDomParser,
    }) as ExifTags
    throwIfMetadataTaskCancelled(signal)
    exifCandidate = buildNormalizedExifFromTags(tags)
  } catch (error) {
    if (signal?.aborted || isMetadataTaskCancelledError(error)) {
      throw createMetadataTaskCancelledError(signal?.reason ?? error)
    }

    tags = null
    issues.push(createIssue(image, {
      level: 'warning',
      stage: 'parse-exif',
      code: 'exif_read_failed',
      summary: 'Failed to parse EXIF metadata.',
      detail: toErrorDetail(error) || 'ExifReader could not parse the image metadata payload.',
    }))
  }

  let widthCandidate: number | undefined
  let heightCandidate: number | undefined

  try {
    throwIfMetadataTaskCancelled(signal)
    const metadata = await sharp(buffer).metadata()
    throwIfMetadataTaskCancelled(signal)

    if (metadata.width && metadata.width > 0) {
      widthCandidate = metadata.width
    }
    if (metadata.height && metadata.height > 0) {
      heightCandidate = metadata.height
    }
  } catch (error) {
    if (signal?.aborted || isMetadataTaskCancelledError(error)) {
      throw createMetadataTaskCancelledError(signal?.reason ?? error)
    }

    widthCandidate = undefined
    heightCandidate = undefined
    issues.push(createIssue(image, {
      level: 'warning',
      stage: 'read-dimensions',
      code: 'read_dimensions_failed',
      summary: 'Failed to read image dimensions.',
      detail: toErrorDetail(error) || 'Sharp could not read image dimensions from the downloaded file.',
    }))
  }

  throwIfMetadataTaskCancelled(signal)
  const updates: MetadataRefreshUpdate = {}
  const coordinateResult = getCoordinateUpdates(tags, image)
  const storedExif = normalizeStoredExif(image.exif)

  if (coordinateResult.issue) {
    issues.push(coordinateResult.issue)
  }

  if (exifCandidate && !areExifEqual(storedExif, exifCandidate)) {
    updates.exif = exifCandidate
  }
  if (typeof widthCandidate === 'number' && widthCandidate !== image.width) {
    updates.width = widthCandidate
  }
  if (typeof heightCandidate === 'number' && heightCandidate !== image.height) {
    updates.height = heightCandidate
  }
  if (coordinateResult.updates.lat && coordinateResult.updates.lat !== cleanString(image.lat)) {
    updates.lat = coordinateResult.updates.lat
  }
  if (coordinateResult.updates.lon && coordinateResult.updates.lon !== cleanString(image.lon)) {
    updates.lon = coordinateResult.updates.lon
  }

  if (Object.keys(updates).length > 0) {
    return {
      outcome: 'success',
      updates,
      issues,
    }
  }

  const hasAnyParsedMetadata =
    Boolean(exifCandidate) ||
    typeof widthCandidate === 'number' ||
    typeof heightCandidate === 'number' ||
    Boolean(coordinateResult.updates.lat) ||
    Boolean(coordinateResult.updates.lon)

  if (!hasAnyParsedMetadata) {
    issues.push(createIssue(image, {
      level: 'warning',
      stage: 'prepare',
      code: 'no_valid_metadata',
      summary: 'No valid metadata could be extracted.',
      detail: 'The refreshed image did not yield usable EXIF, dimensions, or GPS coordinates.',
    }))
  } else {
    issues.push(createSkippedReasonIssue(image))
  }

  return {
    outcome: 'skipped',
    updates: {},
    issues,
  }
}
