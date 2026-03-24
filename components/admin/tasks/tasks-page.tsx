'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight, Clock3, LoaderCircle, MapPinned, RefreshCw, TriangleAlert, Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Progress } from '~/components/ui/progress'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '~/lib/utils'
import { fetcher } from '~/lib/utils/fetcher'
import type { AlbumType } from '~/types'
import type {
  AdminTaskError,
  AdminTaskIssue,
  AdminTaskPreviewCount,
  AdminTaskRunBase,
  AdminTaskRunDetail,
  AdminTaskRunSummary,
  AdminTaskRunsResponse,
  AdminTaskScope,
  AdminTaskStatus,
} from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA } from '~/types/admin-tasks'

type ApiEnvelope<T> = { code: number; message: string; data: T }
type AlbumOption = Pick<AlbumType, 'id' | 'name' | 'album_value'>

const DEFAULT_SCOPE: AdminTaskScope = { albumValue: 'all', showStatus: -1 }
const HISTORY_RECENT_LIMIT = 10
const HISTORY_VISIBLE_ROWS = 3
const HISTORY_CARD_MIN_HEIGHT_REM = 10.75
const HISTORY_SCROLL_MAX_HEIGHT = `${HISTORY_VISIBLE_ROWS * HISTORY_CARD_MIN_HEIGHT_REM}rem`
const panelClass = 'show-up-motion relative overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/82 shadow-sm backdrop-blur-sm'

function statusClass(status: AdminTaskStatus) {
  switch (status) {
    case 'queued':
    case 'cancelling':
      return 'border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-300'
    case 'running':
      return 'border-primary/30 bg-primary/10 text-primary'
    case 'succeeded':
      return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
    case 'failed':
      return 'border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-300'
    case 'cancelled':
    default:
      return 'border-border/80 bg-secondary text-secondary-foreground'
  }
}

function issueClass(level: AdminTaskIssue['level']) {
  if (level === 'error') {
    return 'border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-300'
  }

  if (level === 'warning') {
    return 'border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-300'
  }

  return 'border-slate-400/35 bg-slate-500/10 text-slate-700 dark:text-slate-300'
}

function progressOf(run: AdminTaskRunBase | null) {
  if (!run || run.totalCount <= 0) return 0
  return Math.min(100, Math.round((run.processedCount / run.totalCount) * 100))
}

function formatDate(value: string | null, formatter: Intl.DateTimeFormat, fallback: string) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : formatter.format(date)
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !payload) throw new Error(payload?.message || 'Request failed')
  return payload.data
}

async function getJson<T>(url: string) {
  const response = await fetch(url)
  return readApi<T>(response)
}

async function postJson<T>(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return readApi<T>(response)
}

function formatStageToken(stage: string) {
  return stage.replace(/-/g, ' ').toUpperCase()
}

function formatCodeToken(code: string) {
  return code.replace(/_/g, ' ').toUpperCase()
}

function normalizeIssueText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s.,:;!?()[\]{}"'`_-]+/g, ' ')
    .trim()
}

function isGenericTimeoutDetail(detail: string) {
  const normalized = normalizeIssueText(detail)
  return normalized === 'the operation was aborted due to timeout'
    || normalized === 'this operation was aborted'
    || normalized === 'signal is aborted without reason'
}

function issueDetailText(issue: AdminTaskIssue, httpLabel: string | null) {
  const detail = issue.detail?.trim()
  if (!detail) return null

  const normalizedDetail = normalizeIssueText(detail)
  if (!normalizedDetail) return null

  if (normalizedDetail === normalizeIssueText(issue.summary)) return null
  if (httpLabel && normalizedDetail === normalizeIssueText(httpLabel)) return null
  if (issue.code === 'timeout' && isGenericTimeoutDetail(detail)) return null

  return detail
}

function DetailMetaRow({ items }: { items: Array<string | null | undefined> }) {
  const filtered = items.filter((item): item is string => Boolean(item))
  if (filtered.length === 0) return null

  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] tracking-[0.12em] text-muted-foreground'>
      {filtered.map((item, index) => (
        <span key={`${item}-${index}`} className='inline-flex items-center gap-2'>
          {index > 0 ? <span className='h-1 w-1 rounded-full bg-border/80' /> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className='animate-pulse space-y-5'>
      <div className='grid gap-5 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] xl:items-start'>
        <div className='space-y-5'>
          <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
            <div className='h-4 w-28 rounded-full bg-border/55' />
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <div className='h-20 rounded-[1.15rem] bg-background/75' />
              <div className='h-20 rounded-[1.15rem] bg-background/75' />
              <div className='h-20 rounded-[1.15rem] bg-background/75' />
              <div className='h-20 rounded-[1.15rem] bg-background/75' />
            </div>
          </section>
          <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
            <div className='h-4 w-24 rounded-full bg-border/55' />
            <div className='mt-4 h-24 rounded-[1.15rem] bg-background/75' />
          </section>
        </div>
        <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
          <div className='h-4 w-24 rounded-full bg-border/55' />
          <div className='mt-4 space-y-3'>
            <div className='h-32 rounded-[1.15rem] bg-background/75' />
            <div className='h-32 rounded-[1.15rem] bg-background/75' />
          </div>
        </section>
      </div>
    </div>
  )
}

function ErrorDetailCard({
  title,
  error,
  dateFormatter,
  fallback,
}: {
  title: string
  error: AdminTaskError
  dateFormatter: Intl.DateTimeFormat
  fallback: string
}) {
  return (
    <section className='rounded-[1.45rem] border border-rose-400/35 bg-rose-500/10 p-4 sm:p-5 text-rose-700 dark:text-rose-300'>
      <div className='flex items-center gap-2'>
        <TriangleAlert className='size-4' />
        <h3 className='font-medium'>{title}</h3>
      </div>
      <div className='mt-4 space-y-3'>
        <DetailMetaRow items={[
          formatStageToken(error.stage),
          formatCodeToken(error.code),
          formatDate(error.at, dateFormatter, fallback),
        ]}
        />
        <p className='text-sm leading-6 text-rose-800 dark:text-rose-200'>{error.message}</p>
        {error.detail ? (
          <div className='rounded-[1rem] border border-rose-400/25 bg-background/70 px-3 py-2.5 text-sm leading-6 text-rose-900/80 whitespace-pre-wrap break-words dark:text-rose-100/85'>
            {error.detail}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function IssueDetailCard({
  issue,
  dateFormatter,
  fallback,
  infoLabel,
  warningLabel,
  errorLabel,
}: {
  issue: AdminTaskIssue
  dateFormatter: Intl.DateTimeFormat
  fallback: string
  infoLabel: string
  warningLabel: string
  errorLabel: string
}) {
  const httpLabel = issue.httpStatus
    ? `HTTP ${issue.httpStatus}${issue.httpStatusText ? ` ${issue.httpStatusText}` : ''}`
    : null
  const detailText = issueDetailText(issue, httpLabel)

  return (
    <article className='overflow-hidden rounded-[1.15rem] border border-border/70 bg-background/78'>
      <div className='space-y-2.5 p-3.5 sm:p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground sm:text-[0.98rem]'>{issue.imageTitle}</p>
              <p className='mt-1 truncate text-xs text-muted-foreground'>{issue.imageId}</p>
            </div>
            <Badge variant='outline' className={cn('rounded-full px-2.5 py-0.5', issueClass(issue.level))}>
              {issue.level === 'error' ? errorLabel : issue.level === 'warning' ? warningLabel : infoLabel}
            </Badge>
          </div>

          <DetailMetaRow items={[
            formatStageToken(issue.stage),
            formatCodeToken(issue.code),
            formatDate(issue.at, dateFormatter, fallback),
            httpLabel,
          ]}
          />

          <p className='text-sm leading-6 text-foreground/88'>{issue.summary}</p>

          {detailText ? (
            <div className='rounded-[1rem] border border-border/60 bg-background/72 px-3 py-2.5 text-sm leading-6 text-muted-foreground whitespace-pre-wrap break-words'>
              {detailText}
            </div>
          ) : null}
      </div>
    </article>
  )
}

export default function TasksPage() {
  const t = useTranslations('Tasks')
  const tx = useTranslations()
  const locale = useLocale()
  const numberFormatter = new Intl.NumberFormat(locale)
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' })
  const [scope, setScope] = useState<AdminTaskScope>(DEFAULT_SCOPE)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const kickingRef = useRef(false)
  const previewQuery = new URLSearchParams({ albumValue: scope.albumValue, showStatus: String(scope.showStatus) }).toString()

  const { data: albums, isLoading: albumsLoading } = useSWR<AlbumOption[]>('/api/v1/albums', fetcher)
  const { data: runsData, isLoading: runsLoading, mutate: mutateRuns } = useSWR<AdminTaskRunsResponse>(
    '/api/v1/tasks/runs',
    getJson,
    { refreshInterval: 5000 }
  )
  const { data: previewData, isLoading: previewLoading } = useSWR<AdminTaskPreviewCount>(
    `/api/v1/tasks/preview-count?${previewQuery}`,
    getJson
  )
  const { data: selectedRunDetail, isLoading: detailLoading, error: detailError } = useSWR<AdminTaskRunDetail>(
    selectedRunId ? `/api/v1/tasks/runs/${selectedRunId}` : null,
    getJson
  )

  const activeRun = runsData?.activeRun ?? null
  const recentRuns = runsData?.recentRuns ?? []
  const selectedRunSummary = recentRuns.find((run) => run.id === selectedRunId) ?? null
  const selectedRun = selectedRunDetail ?? selectedRunSummary

  const albumName = (albumValue: string) =>
    albumValue === 'all' ? tx('Words.all') : albums?.find((album) => album.album_value === albumValue)?.name || albumValue
  const showLabel = (showStatus: AdminTaskScope['showStatus']) =>
    showStatus === 0 ? tx('Words.public') : showStatus === 1 ? tx('Words.private') : tx('Words.all')
  const statusLabel = (status: AdminTaskStatus) =>
    status === 'queued'
      ? t('statusQueued')
      : status === 'running'
        ? t('statusRunning')
        : status === 'cancelling'
          ? t('statusCancelling')
          : status === 'succeeded'
            ? t('statusSucceeded')
            : status === 'failed'
              ? t('statusFailed')
              : t('statusCancelled')
  const scopeLabel = (taskScope: AdminTaskScope) => `${albumName(taskScope.albumValue)} / ${showLabel(taskScope.showStatus)}`

  async function refreshTaskData() {
    await mutateRuns()
  }

  useEffect(() => {
    if (!activeRun?.id || activeRun.status === 'cancelling') return

    let cancelled = false

    const runKick = async () => {
      if (kickingRef.current) return
      kickingRef.current = true

      try {
        await postJson<AdminTaskRunSummary>(`/api/v1/tasks/runs/${activeRun.id}/kick`)
        if (!cancelled) {
          await mutateRuns()
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : t('kickFailed'))
      } finally {
        kickingRef.current = false
      }
    }

    void runKick()
    const timer = window.setInterval(() => {
      void runKick()
    }, 4500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [activeRun?.id, activeRun?.status, mutateRuns, t])

  async function handleStartTask() {
    try {
      setIsStarting(true)
      await postJson<AdminTaskRunSummary>('/api/v1/tasks/runs', {
        taskKey: ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA,
        scope,
      })
      toast.success(t('startSuccess'))
      await refreshTaskData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('startFailed'))
    } finally {
      setIsStarting(false)
    }
  }

  async function handleCancelTask() {
    if (!activeRun?.id || activeRun.status === 'cancelling') return

    try {
      setIsCancelling(true)
      await postJson<AdminTaskRunSummary>(`/api/v1/tasks/runs/${activeRun.id}/cancel`)
      toast.success(t('cancelSuccess'))
      await refreshTaskData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('cancelFailed'))
    } finally {
      setIsCancelling(false)
    }
  }

  const previewCount = previewData?.totalCount ?? 0
  const activeProgress = progressOf(activeRun)
  const cancelPending = isCancelling || activeRun?.status === 'cancelling'
  const canStart = !activeRun && previewCount > 0 && !isStarting
  const booting = albumsLoading || (!runsData && runsLoading)
  const detailBooting = Boolean(selectedRunId) && detailLoading && !selectedRunDetail
  return (
    <>
      <div className='relative overflow-hidden px-1 py-2 sm:px-2'>
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
          <div className='absolute -left-10 top-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl' />
          <div className='absolute right-[-4rem] top-16 h-64 w-64 rounded-full bg-secondary blur-3xl' />
          <div className='absolute bottom-6 left-1/3 h-44 w-44 rounded-full bg-primary/8 blur-3xl' />
        </div>

        <div className='relative space-y-6'>
          <section className={cn(panelClass, 'px-5 py-4 sm:px-6 sm:py-5')}>
            <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent' />
            <div className='flex flex-col gap-4'>
              <div className={cn('flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between', !activeRun && 'hidden')}>
                {activeRun ? (
                  <div className='flex flex-wrap items-center gap-2 xl:justify-end'>
                    <Badge variant='outline' className={cn('rounded-full px-3 py-1', statusClass(activeRun.status))}>
                      {statusLabel(activeRun.status)}
                    </Badge>
                    <Badge variant='outline' className='rounded-full border-border/80 bg-background/70 px-3 py-1 text-muted-foreground'>
                      {ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA}
                    </Badge>
                    <Badge variant='outline' className='rounded-full border-border/80 bg-background/70 px-3 py-1 text-muted-foreground'>
                      {scopeLabel(activeRun.scope)}
                    </Badge>
                    <Button
                      variant='outline'
                      onClick={handleCancelTask}
                      disabled={cancelPending}
                      className='min-w-32 rounded-full px-4'
                    >
                      {cancelPending ? <LoaderCircle className='animate-spin' /> : <TriangleAlert />}
                      {cancelPending ? t('cancelling') : t('cancel')}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div
                className={cn(
                  'grid gap-4 xl:items-start',
                  activeRun ? 'xl:grid-cols-[minmax(0,1.04fr)_minmax(19rem,0.96fr)]' : 'xl:grid-cols-1'
                )}
              >
                {activeRun ? (
                  <div className='space-y-4 xl:border-r xl:border-border/55 xl:pr-5'>
                    <div className='grid gap-3 rounded-[1.35rem] border border-border/70 bg-background/62 p-4'>
                      <div className='grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end'>
                        <div>
                          <p className='text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground'>
                            {t('progressLabel')}
                          </p>
                          <p className='mt-1.5 font-display text-[2.15rem] leading-none tracking-tight text-foreground sm:text-[2.45rem]'>
                            {activeProgress}%
                          </p>
                        </div>
                        <div className='grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-3'>
                          <div className='rounded-[0.95rem] bg-background/78 px-3 py-2.5'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('matchedCount')}</p>
                            <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(activeRun.totalCount)}</p>
                          </div>
                          <div className='rounded-[0.95rem] bg-background/78 px-3 py-2.5'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('processedLabel')}</p>
                            <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(activeRun.processedCount)}</p>
                          </div>
                          <div className='rounded-[0.95rem] bg-background/78 px-3 py-2.5'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('startedAtLabel')}</p>
                            <p className='mt-1 text-base font-medium text-foreground'>
                              {formatDate(activeRun.startedAt || activeRun.createdAt, dateFormatter, t('notAvailable'))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Progress value={activeProgress} className='h-2 bg-primary/15' />
                    </div>

                    <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
                      <div className='rounded-[1rem] border border-border/60 bg-background/70 px-3 py-2.5'>
                        <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('processedLabel')}</p>
                        <p className='mt-1.5 font-display text-[1.55rem] leading-none tracking-tight text-foreground'>{numberFormatter.format(activeRun.processedCount)}</p>
                      </div>
                      <div className='rounded-[1rem] border border-border/60 bg-emerald-500/8 px-3 py-2.5 text-emerald-700 dark:text-emerald-300'>
                        <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('successLabel')}</p>
                        <p className='mt-1.5 font-display text-[1.55rem] leading-none tracking-tight'>{numberFormatter.format(activeRun.successCount)}</p>
                      </div>
                      <div className='rounded-[1rem] border border-border/60 bg-amber-500/10 px-3 py-2.5 text-amber-700 dark:text-amber-300'>
                        <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('skippedLabel')}</p>
                        <p className='mt-1.5 font-display text-[1.55rem] leading-none tracking-tight'>{numberFormatter.format(activeRun.skippedCount)}</p>
                      </div>
                      <div className='rounded-[1rem] border border-border/60 bg-rose-500/10 px-3 py-2.5 text-rose-700 dark:text-rose-300'>
                        <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('failedLabel')}</p>
                        <p className='mt-1.5 font-display text-[1.55rem] leading-none tracking-tight'>{numberFormatter.format(activeRun.failedCount)}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className={cn('space-y-4', activeRun ? 'xl:pl-1' : 'min-w-0')}>
                  <div className='flex w-fit flex-wrap items-end gap-3'>
                    <label className='flex w-[8.75rem] shrink-0 flex-col gap-1.5'>
                      <span className='text-sm font-medium text-foreground'>{tx('Words.album')}</span>
                      <Select value={scope.albumValue} onValueChange={(albumValue) => setScope((current) => ({ ...current, albumValue }))}>
                        <SelectTrigger className='h-10 w-full rounded-[0.95rem] bg-background/75'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>{tx('Words.all')}</SelectItem>
                          {albums?.map((album) => (
                            <SelectItem key={album.id} value={album.album_value}>{album.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>

                    <label className='flex w-[8.75rem] shrink-0 flex-col gap-1.5'>
                      <span className='text-sm font-medium text-foreground'>{tx('Words.showStatus')}</span>
                      <Select
                        value={String(scope.showStatus)}
                        onValueChange={(value) => setScope((current) => ({
                          ...current,
                          showStatus: value === '0' ? 0 : value === '1' ? 1 : -1,
                        }))}
                      >
                        <SelectTrigger className='h-10 w-full rounded-[0.95rem] bg-background/75'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='-1'>{tx('Words.all')}</SelectItem>
                          <SelectItem value='0'>{tx('Words.public')}</SelectItem>
                          <SelectItem value='1'>{tx('Words.private')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                  </div>

                  <div className='grid gap-3 rounded-[1.3rem] border border-primary/15 bg-primary/7 p-3 lg:grid-cols-[minmax(8.5rem,0.32fr)_minmax(0,1fr)] lg:items-stretch'>
                    <div className='flex min-h-[8.5rem] flex-col justify-between rounded-[1rem] bg-background/82 px-3.5 py-3'>
                      <p className='text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground'>{t('previewLabel')}</p>
                      <p className='font-display text-[2.15rem] leading-none tracking-tight text-foreground sm:text-[2.35rem]'>{previewLoading ? '...' : numberFormatter.format(previewCount)}</p>
                    </div>

                    <div className='grid min-h-[8.5rem] gap-3 rounded-[1rem] border border-border/70 bg-background/78 px-3.5 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch'>
                      <div className='space-y-2 md:flex md:h-full md:flex-col md:justify-between md:space-y-0'>
                        <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('currentSelection')}</p>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground'>{scopeLabel(scope)}</span>
                        </div>
                      </div>

                      <Button onClick={handleStartTask} disabled={!canStart} className='h-10 w-full rounded-full md:min-w-40 md:self-center md:w-auto'>
                        {isStarting ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
                        {isStarting ? t('starting') : t('start')}
                      </Button>

                      {!activeRun && previewCount < 1 && !previewLoading ? (
                        <div className='md:col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-6 text-muted-foreground'>
                          <p>{t('noMatchHint')}</p>
                          {albumsLoading ? <p>{t('albumsLoading')}</p> : null}
                        </div>
                      ) : null}
                      {activeRun || albumsLoading ? (
                        <div className='md:col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-6 text-muted-foreground'>
                          {activeRun ? <p>{t('runningHint')}</p> : null}
                          {albumsLoading ? <p>{t('albumsLoading')}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={cn(panelClass, 'px-5 py-5 sm:px-6 sm:py-6')}>
            <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent' />
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-sm font-medium text-primary/80'>{t('historyEyebrow')}</p>
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground'>
                    {t('historyRecentLimit', { count: HISTORY_RECENT_LIMIT })}
                  </div>
                  <Button variant='outline' size='sm' onClick={() => void refreshTaskData()} className='rounded-full'>
                    <RefreshCw />
                    {tx('Button.refresh')}
                  </Button>
                </div>
              </div>
              {recentRuns.length > 0 ? (
                <div className='overflow-hidden rounded-[1.45rem] border border-border/70 bg-background/50'>
                  <ScrollArea className='w-full' type='always' style={recentRuns.length > HISTORY_VISIBLE_ROWS ? { height: HISTORY_SCROLL_MAX_HEIGHT } : { maxHeight: HISTORY_SCROLL_MAX_HEIGHT }}>
                    <div>
                      {recentRuns.map((run, index) => (
                        <button
                          key={run.id}
                          type='button'
                          onClick={() => setSelectedRunId(run.id)}
                          className={cn(
                            'group grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-primary/6 sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] lg:items-center',
                            index > 0 ? 'border-t border-border/60' : null
                          )}
                          style={{ minHeight: `${HISTORY_CARD_MIN_HEIGHT_REM}rem` }}
                        >
                          <div className='min-w-0 space-y-3'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge variant='outline' className={cn('rounded-full px-2.5 py-0.5', statusClass(run.status))}>
                                {statusLabel(run.status)}
                              </Badge>
                              <span className='text-xs uppercase tracking-[0.14em] text-muted-foreground'>
                                {formatDate(run.createdAt, dateFormatter, t('notAvailable'))}
                              </span>
                            </div>

                            <div className='space-y-1'>
                              <p className='truncate text-base font-medium text-foreground'>{scopeLabel(run.scope)}</p>
                              <p className='text-sm leading-6 text-muted-foreground'>{t('matchedCount')}: {numberFormatter.format(run.totalCount)}</p>
                            </div>

                            <Progress value={progressOf(run)} className='h-2 bg-primary/12' />
                          </div>

                          <div className='grid gap-2 text-sm text-muted-foreground sm:grid-cols-3 lg:grid-cols-3'>
                            <div className='rounded-[1rem] bg-background/70 px-3 py-2'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em]'>{t('successLabel')}</p>
                              <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(run.successCount)}</p>
                            </div>
                            <div className='rounded-[1rem] bg-background/70 px-3 py-2'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em]'>{t('skippedLabel')}</p>
                              <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(run.skippedCount)}</p>
                            </div>
                            <div className='rounded-[1rem] bg-background/70 px-3 py-2'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em]'>{t('failedLabel')}</p>
                              <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(run.failedCount)}</p>
                            </div>
                          </div>

                          <div className='flex items-center justify-between gap-3 lg:justify-end'>
                            <span className='inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors group-hover:border-primary/25 group-hover:text-foreground'>
                              {t('detailView')}
                              <ChevronRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>

                </div>
              ) : (
                <div className='rounded-[1.35rem] border border-dashed border-border/80 bg-background/55 px-4 py-5 text-sm leading-6 text-muted-foreground'>
                  {booting ? t('loading') : t('noHistory')}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={Boolean(selectedRunId)} onOpenChange={(open) => { if (!open) setSelectedRunId(null) }}>
        {selectedRunId ? (
          <DialogContent className='grid h-[min(92dvh,56rem)] max-h-[calc(100dvh-1.5rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-border/70 bg-background/95 p-0 shadow-[0_24px_80px_rgba(90,56,25,0.18)] sm:max-w-[56rem]'>
            <div className='relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden'>
              <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-6 top-4 h-28 w-28 rounded-full bg-primary/8 blur-3xl' />
                <div className='absolute right-[-2rem] top-0 h-36 w-36 rounded-full bg-secondary/70 blur-3xl' />
              </div>

              <DialogHeader className='relative gap-4 border-b border-border/60 px-5 py-5 text-left sm:px-6'>
                {selectedRun ? (
                  <>
                    <div className='space-y-2'>
                      <p className='text-[0.68rem] uppercase tracking-[0.22em] text-primary/75'>{t('detailEyebrow')}</p>
                      <DialogTitle className='font-display text-[1.45rem] leading-none text-foreground sm:text-[1.7rem]'>{scopeLabel(selectedRun.scope)}</DialogTitle>
                      <DialogDescription className='max-w-2xl text-sm leading-6 text-muted-foreground'>{t('detailDescription')}</DialogDescription>
                    </div>

                    <div className='flex flex-wrap items-center gap-2 pr-8 sm:pr-10'>
                      <Badge variant='outline' className={cn('rounded-full px-3 py-1', statusClass(selectedRun.status))}>
                        {statusLabel(selectedRun.status)}
                      </Badge>
                      <Badge variant='outline' className='rounded-full border-border/80 bg-background/75 px-3 py-1 text-muted-foreground'>
                        {formatDate(selectedRun.createdAt, dateFormatter, t('notAvailable'))}
                      </Badge>
                      <Badge variant='outline' className='rounded-full border-border/80 bg-background/75 px-3 py-1 text-muted-foreground'>
                        {ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className='animate-pulse space-y-3'>
                    <div className='h-3 w-20 rounded-full bg-border/55' />
                    <div className='h-8 w-56 rounded-full bg-border/60' />
                    <div className='h-4 w-72 rounded-full bg-border/50' />
                  </div>
                )}
              </DialogHeader>

              <ScrollArea className='min-h-0'>
                <div className='space-y-5 px-5 py-5 sm:px-6 sm:py-6'>
                  {selectedRun ? (
                    <section className='rounded-[1.6rem] border border-border/70 bg-background/68 p-4 sm:p-5'>
                      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] lg:items-end'>
                        <div className='space-y-4'>
                          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                            <div>
                              <p className='text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground'>{t('progressLabel')}</p>
                              <p className='mt-2 font-display text-[3rem] leading-none tracking-tight text-foreground sm:text-[3.5rem]'>{progressOf(selectedRun)}%</p>
                            </div>
                            <div className='space-y-1 text-sm leading-6 text-muted-foreground sm:text-right'>
                              <p>{t('matchedCount')}: {numberFormatter.format(selectedRun.totalCount)}</p>
                              <p>{t('processedLabel')}: {numberFormatter.format(selectedRun.processedCount)}</p>
                            </div>
                          </div>
                          <Progress value={progressOf(selectedRun)} className='h-2.5 bg-primary/15' />
                        </div>

                        <div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3'>
                          <div className='rounded-[1.2rem] border border-border/60 bg-emerald-500/8 px-4 py-3 text-emerald-700 dark:text-emerald-300'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('successLabel')}</p>
                            <p className='mt-2 font-display text-[1.9rem] leading-none tracking-tight'>{numberFormatter.format(selectedRun.successCount)}</p>
                          </div>
                          <div className='rounded-[1.2rem] border border-border/60 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-300'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('skippedLabel')}</p>
                            <p className='mt-2 font-display text-[1.9rem] leading-none tracking-tight'>{numberFormatter.format(selectedRun.skippedCount)}</p>
                          </div>
                          <div className='rounded-[1.2rem] border border-border/60 bg-rose-500/10 px-4 py-3 text-rose-700 dark:text-rose-300'>
                            <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('failedLabel')}</p>
                            <p className='mt-2 font-display text-[1.9rem] leading-none tracking-tight'>{numberFormatter.format(selectedRun.failedCount)}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className='rounded-[1.6rem] border border-border/70 bg-background/68 p-4 sm:p-5'>
                      <div className='animate-pulse space-y-4'>
                        <div className='h-4 w-24 rounded-full bg-border/55' />
                        <div className='h-12 w-32 rounded-full bg-border/60' />
                        <div className='h-2.5 rounded-full bg-border/45' />
                      </div>
                    </section>
                  )}

                  {detailBooting ? (
                    <DetailSkeleton />
                  ) : detailError ? (
                    <section className='rounded-[1.45rem] border border-rose-400/35 bg-rose-500/10 p-4 sm:p-5 text-rose-700 dark:text-rose-300'>
                      <p className='text-sm leading-6'>{detailError instanceof Error ? detailError.message : t('kickFailed')}</p>
                    </section>
                  ) : selectedRunDetail ? (
                    <div className='grid gap-5 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] xl:items-start'>
                      <div className='space-y-5'>
                        <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
                          <div className='flex items-center gap-2 text-foreground'>
                            <Wrench className='size-4 text-primary' />
                            <h3 className='font-medium'>{t('countsTitle')}</h3>
                          </div>
                          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                            <div className='rounded-[1.15rem] bg-background/75 px-4 py-3 text-sm leading-6 text-muted-foreground'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('matchedCount')}</p>
                              <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(selectedRunDetail.totalCount)}</p>
                            </div>
                            <div className='rounded-[1.15rem] bg-background/75 px-4 py-3 text-sm leading-6 text-muted-foreground'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('processedLabel')}</p>
                              <p className='mt-1 text-base font-medium text-foreground'>{numberFormatter.format(selectedRunDetail.processedCount)}</p>
                            </div>
                          </div>
                        </section>

                        <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
                          <div className='flex items-center gap-2 text-foreground'>
                            <Clock3 className='size-4 text-primary' />
                            <h3 className='font-medium'>{t('timelineTitle')}</h3>
                          </div>
                          <div className='mt-4 space-y-3'>
                            <div className='rounded-[1.15rem] bg-background/75 px-4 py-3 text-sm leading-6 text-muted-foreground'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('startedAtLabel')}</p>
                              <p className='mt-1 text-foreground'>{formatDate(selectedRunDetail.startedAt || selectedRunDetail.createdAt, dateFormatter, t('notAvailable'))}</p>
                            </div>
                            <div className='rounded-[1.15rem] bg-background/75 px-4 py-3 text-sm leading-6 text-muted-foreground'>
                              <p className='text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground'>{t('finishedAtLabel')}</p>
                              <p className='mt-1 text-foreground'>{formatDate(selectedRunDetail.finishedAt, dateFormatter, t('unfinished'))}</p>
                            </div>
                          </div>
                        </section>

                        {selectedRunDetail.lastError ? (
                          <ErrorDetailCard
                            title={t('lastErrorTitle')}
                            error={selectedRunDetail.lastError}
                            dateFormatter={dateFormatter}
                            fallback={t('notAvailable')}
                          />
                        ) : null}
                      </div>

                      <section className='rounded-[1.45rem] border border-border/70 bg-background/62 p-4 sm:p-5'>
                        <div className='flex items-center gap-2 text-foreground'>
                          <MapPinned className='size-4 text-primary' />
                          <h3 className='font-medium'>{t('issuesTitle')}</h3>
                        </div>
                        <div className='mt-4 space-y-3'>
                          {selectedRunDetail.recentIssues.length > 0 ? (
                            selectedRunDetail.recentIssues.map((issue, index) => (
                              <IssueDetailCard
                                key={`${issue.imageId}-${issue.code}-${index}`}
                                issue={issue}
                                dateFormatter={dateFormatter}
                                fallback={t('notAvailable')}
                                infoLabel={t('issueInfo')}
                                warningLabel={t('issueWarning')}
                                errorLabel={t('issueError')}
                              />
                            ))
                          ) : (
                            <div className='rounded-[1.15rem] border border-dashed border-border/80 bg-background/60 px-4 py-4 text-sm leading-6 text-muted-foreground'>
                              {t('noIssues')}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}

