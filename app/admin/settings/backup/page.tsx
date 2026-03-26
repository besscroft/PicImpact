'use client'

import { useMemo, useState } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import { CheckCircle2, FileJson, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from '~/components/ui/file-upload'
import type { BackupImportResult, BackupPreviewData } from '~/types/backup'

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
}

const INCLUDED_SCOPE = ['configs', 'albums', 'images', 'imageAlbumRelations']
const EXCLUDED_SCOPE = ['user', 'session', 'account', 'two_factor', 'passkey', 'verification', 'admin_task_runs', 'daily_images']

function createLocalPreview(message: string): BackupPreviewData {
  return {
    valid: false,
    format: null,
    version: null,
    exportedAt: null,
    source: null,
    scope: {
      included: INCLUDED_SCOPE,
      excluded: EXCLUDED_SCOPE,
    },
    counts: {
      configs: 0,
      albums: 0,
      images: 0,
      imageAlbumRelations: 0,
    },
    warnings: [],
    issues: [{
      path: '$',
      message,
    }],
  }
}

function parseFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return 'picimpact-backup-v1.json'
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1])
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i)
  return match?.[1] ?? 'picimpact-backup-v1.json'
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  )
}

export default function BackupSettingsPage() {
  const t = useTranslations('Backup')
  const linkT = useTranslations('Link')
  const buttonT = useTranslations('Button')

  const [files, setFiles] = useState<File[]>([])
  const [previewData, setPreviewData] = useState<BackupPreviewData | null>(null)
  const [parsedEnvelope, setParsedEnvelope] = useState<unknown>(null)
  const [importResult, setImportResult] = useState<BackupImportResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedFile = files[0] ?? null
  const canImport = Boolean(previewData?.valid && parsedEnvelope)

  const scopeBadges = useMemo(() => [
    ...INCLUDED_SCOPE.map((item) => ({ item, type: 'include' as const })),
    ...EXCLUDED_SCOPE.map((item) => ({ item, type: 'exclude' as const })),
  ], [])

  async function downloadBackup() {
    try {
      setExportLoading(true)
      const response = await fetch('/api/v1/backup/export', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = parseFileName(response.headers.get('content-disposition'))
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)

      toast.success(t('exportSuccess'))
    } catch {
      toast.error(t('exportFailed'))
    } finally {
      setExportLoading(false)
    }
  }

  async function previewImport() {
    if (!selectedFile) {
      toast.error(t('selectFileFirst'))
      return
    }

    try {
      setPreviewLoading(true)
      setImportResult(null)

      const fileText = await selectedFile.text()
      let parsed: unknown

      try {
        parsed = JSON.parse(fileText)
      } catch {
        setParsedEnvelope(null)
        setPreviewData(createLocalPreview(t('invalidJson')))
        toast.error(t('invalidJson'))
        return
      }

      const response = await fetch('/api/v1/backup/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      })

      const payload = await response.json() as ApiResponse<BackupPreviewData>
      setPreviewData(payload.data)

      if (!response.ok || payload.code !== 200 || !payload.data?.valid) {
        setParsedEnvelope(null)
        toast.error(payload.message || t('previewFailed'))
        return
      }

      setParsedEnvelope(parsed)
      toast.success(t('previewSuccess'))
    } catch {
      setParsedEnvelope(null)
      setPreviewData(createLocalPreview(t('previewFailed')))
      toast.error(t('previewFailed'))
    } finally {
      setPreviewLoading(false)
    }
  }

  async function confirmImport() {
    if (!parsedEnvelope || !previewData?.valid) {
      toast.error(t('previewBeforeImport'))
      return
    }

    try {
      setImportLoading(true)
      const response = await fetch('/api/v1/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedEnvelope),
      })

      const payload = await response.json() as ApiResponse<BackupImportResult>
      if (!response.ok || payload.code !== 200) {
        toast.error(payload.message || t('importFailed'))
        return
      }

      setImportResult(payload.data)
      setFiles([])
      setParsedEnvelope(null)
      setConfirmOpen(false)
      toast.success(t('importSuccess'))
    } catch {
      toast.error(t('importFailed'))
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-base font-medium">{linkT('backup')}</div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>

      <Alert className="border-amber-300/60 bg-amber-50/70 text-amber-950 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        <ShieldAlert className="size-4" />
        <AlertTitle>{t('sensitiveTitle')}</AlertTitle>
        <AlertDescription>
          <p>{t('sensitiveDescription')}</p>
          <p>{t('excludedDescription')}</p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <Card className="border-border/70 bg-card/95 shadow-[0_18px_50px_rgba(90,56,25,0.08)]">
          <CardHeader>
            <CardTitle>{t('exportTitle')}</CardTitle>
            <CardDescription>{t('exportDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {scopeBadges.map(({ item, type }) => (
                <div
                  key={`${type}-${item}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item}</span>
                  <Badge variant={type === 'include' ? 'default' : 'outline'}>
                    {type === 'include' ? t('includedBadge') : t('excludedBadge')}
                  </Badge>
                </div>
              ))}
            </div>
            <Alert className="border-border/70 bg-background/70">
              <FileJson className="size-4" />
              <AlertTitle>{t('exportFormatTitle')}</AlertTitle>
              <AlertDescription>{t('exportFormatDescription')}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              disabled={exportLoading}
              onClick={downloadBackup}
              className="min-w-36"
            >
              {exportLoading && <ReloadIcon className="size-4 animate-spin" />}
              {t('downloadButton')}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-[0_18px_50px_rgba(90,56,25,0.08)]">
          <CardHeader>
            <CardTitle>{t('importTitle')}</CardTitle>
            <CardDescription>{t('importDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              value={files}
              onValueChange={(nextFiles) => {
                setFiles(nextFiles.slice(0, 1))
                setPreviewData(null)
                setParsedEnvelope(null)
                setImportResult(null)
              }}
              accept=".json,application/json"
              maxFiles={1}
              multiple={false}
              onFileReject={() => {
                toast.error(t('fileRejected'))
              }}
            >
              <FileUploadDropzone className="rounded-2xl border-dashed border-border/70 bg-[radial-gradient(circle_at_top,rgba(203,168,124,0.16),transparent_55%),linear-gradient(180deg,rgba(255,251,246,0.95),rgba(255,255,255,0.92))] px-6 py-10 text-center dark:bg-[radial-gradient(circle_at_top,rgba(203,168,124,0.16),transparent_55%),linear-gradient(180deg,rgba(38,32,28,0.96),rgba(24,21,19,0.92))]">
                <div className="mx-auto flex max-w-lg flex-col items-center gap-3">
                  <div className="rounded-full border border-border/70 bg-background/80 p-3 shadow-sm">
                    <FileJson className="size-5 text-foreground/80" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{t('dropzoneTitle')}</div>
                    <p className="text-sm text-muted-foreground">{t('dropzoneDescription')}</p>
                  </div>
                  <Badge variant="outline">{t('dropzoneHint')}</Badge>
                </div>
              </FileUploadDropzone>

              <FileUploadList>
                {files.map((file) => (
                  <FileUploadItem key={`${file.name}-${file.lastModified}`} value={file}>
                    <FileUploadItemPreview />
                    <FileUploadItemMetadata />
                    <FileUploadItemDelete asChild>
                      <Button variant="ghost" size="sm" type="button">
                        {t('removeFile')}
                      </Button>
                    </FileUploadItemDelete>
                  </FileUploadItem>
                ))}
              </FileUploadList>
            </FileUpload>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={!selectedFile || previewLoading}
                onClick={previewImport}
              >
                {previewLoading && <ReloadIcon className="size-4 animate-spin" />}
                {t('previewButton')}
              </Button>
              <Button
                disabled={!canImport}
                onClick={() => setConfirmOpen(true)}
              >
                {t('importButton')}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{t('importHint')}</p>
          </CardContent>
        </Card>
      </div>

      {previewData && (
        <Card className="border-border/70 bg-card/95 shadow-[0_18px_50px_rgba(90,56,25,0.08)]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>{t('previewTitle')}</CardTitle>
              <Badge variant={previewData.valid ? 'default' : 'destructive'}>
                {previewData.valid ? t('validBadge') : t('invalidBadge')}
              </Badge>
            </div>
            <CardDescription>{t('previewDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatItem label="configs" value={previewData.counts.configs} />
              <StatItem label="albums" value={previewData.counts.albums} />
              <StatItem label="images" value={previewData.counts.images} />
              <StatItem label="relations" value={previewData.counts.imageAlbumRelations} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{t('previewMeta')}</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div><span className="text-muted-foreground">{t('metaFormat')}</span> {previewData.format ?? '-'}</div>
                  <div><span className="text-muted-foreground">{t('metaVersion')}</span> {previewData.version ?? '-'}</div>
                  <div><span className="text-muted-foreground">{t('metaExportedAt')}</span> {previewData.exportedAt ?? '-'}</div>
                  <div><span className="text-muted-foreground">{t('metaSource')}</span> {previewData.source ? `${previewData.source.orm} / ${previewData.source.database}` : '-'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{t('previewScope')}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewData.scope.included.map((item) => (
                    <Badge key={`included-${item}`} variant="default">{item}</Badge>
                  ))}
                  {previewData.scope.excluded.map((item) => (
                    <Badge key={`excluded-${item}`} variant="outline">{item}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {previewData.warnings.length > 0 && (
              <Alert className="border-amber-300/60 bg-amber-50/70 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                <TriangleAlert className="size-4" />
                <AlertTitle>{t('warningsTitle')}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-5">
                    {previewData.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {previewData.issues.length > 0 && (
              <Alert variant="destructive">
                <TriangleAlert className="size-4" />
                <AlertTitle>{t('issuesTitle')}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-5">
                    {previewData.issues.map((issue) => (
                      <li key={`${issue.path}-${issue.message}`}>
                        <span className="font-medium">{issue.path}</span>: {issue.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card className="border-border/70 bg-card/95 shadow-[0_18px_50px_rgba(90,56,25,0.08)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <CardTitle>{t('resultTitle')}</CardTitle>
            </div>
            <CardDescription>{t('resultDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatItem label="configs" value={`${importResult.entities.configs.createdCount}/${importResult.entities.configs.updatedCount}`} />
              <StatItem label="albums" value={`${importResult.entities.albums.createdCount}/${importResult.entities.albums.updatedCount}`} />
              <StatItem label="images" value={`${importResult.entities.images.createdCount}/${importResult.entities.images.updatedCount}`} />
              <StatItem label="relations" value={`${importResult.entities.imageAlbumRelations.addedCount}/${importResult.entities.imageAlbumRelations.unchangedCount}`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{t('resultStats')}</div>
                <div className="mt-3 space-y-2">
                  <div>{t('createdLabel')}: {importResult.entities.configs.createdCount + importResult.entities.albums.createdCount + importResult.entities.images.createdCount}</div>
                  <div>{t('updatedLabel')}: {importResult.entities.configs.updatedCount + importResult.entities.albums.updatedCount + importResult.entities.images.updatedCount}</div>
                  <div>{t('relationReplacedLabel')}: {importResult.entities.imageAlbumRelations.replacedImageCount}</div>
                  <div>{t('relationRemovedLabel')}: {importResult.entities.imageAlbumRelations.removedCount}</div>
                </div>
              </div>

              <Alert className="border-emerald-300/60 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
                <CheckCircle2 className="size-4" />
                <AlertTitle>{t('dailyRefreshTitle')}</AlertTitle>
                <AlertDescription>
                  <p>{importResult.dailyRefresh.message}</p>
                  <p>{t('importedAtLabel')}: {importResult.importedAt}</p>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[32rem]">
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>{t('confirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="font-medium text-foreground">{selectedFile?.name ?? '-'}</div>
              <div className="mt-2 text-muted-foreground">{t('confirmCounts', {
                configs: previewData?.counts.configs ?? 0,
                albums: previewData?.counts.albums ?? 0,
                images: previewData?.counts.images ?? 0,
                relations: previewData?.counts.imageAlbumRelations ?? 0,
              })}</div>
            </div>
            <Alert className="border-amber-300/60 bg-amber-50/70 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              <ShieldAlert className="size-4" />
              <AlertTitle>{t('confirmWarningTitle')}</AlertTitle>
              <AlertDescription>{t('confirmWarningDescription')}</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {buttonT('canal')}
            </Button>
            <Button disabled={importLoading || !canImport} onClick={confirmImport}>
              {importLoading && <ReloadIcon className="size-4 animate-spin" />}
              {t('confirmImportButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
