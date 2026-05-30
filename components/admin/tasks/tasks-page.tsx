'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'

import { Switch } from '~/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { fetcher } from '~/lib/utils/fetcher'
import type { AlbumType } from '~/types'
import type { AdminTaskScope, PreprocessTaskScope } from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_PREPROCESS_IMAGES, ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA } from '~/types/admin-tasks'
import TaskRunPanel, { type ScopeControlProps, type TaskRunPanelConfig } from '~/components/admin/tasks/task-run-panel'

type AlbumOption = Pick<AlbumType, 'id' | 'name' | 'album_value'>

const METADATA_DEFAULT_SCOPE: AdminTaskScope = { albumValue: 'all', showStatus: -1 }
const PREPROCESS_DEFAULT_SCOPE: PreprocessTaskScope = { force: false }

// The server raises this exact message (HTTP 400) when no variant storage
// backend has been chosen; surface a friendlier hint instead of the raw error.
const VARIANT_STORAGE_NOT_CONFIGURED = 'Variant storage backend is not configured'

function MetadataScopeControl({ scope, setScope, disabled }: ScopeControlProps<AdminTaskScope>) {
  const tx = useTranslations()
  const { data: albums } = useSWR<AlbumOption[]>('/api/v1/albums', fetcher)

  return (
    <div className='flex w-fit flex-wrap items-end gap-3'>
      <label className='flex w-[8.75rem] shrink-0 flex-col gap-1.5'>
        <span className='text-sm font-medium text-foreground'>{tx('Words.album')}</span>
        <Select value={scope.albumValue} onValueChange={(albumValue) => setScope((current) => ({ ...current, albumValue }))} disabled={disabled}>
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
          disabled={disabled}
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
  )
}

function PreprocessScopeControl({ scope, setScope, disabled }: ScopeControlProps<PreprocessTaskScope>) {
  const t = useTranslations('Tasks')

  return (
    <label className='flex w-fit items-center gap-3 rounded-[0.95rem] border border-border/70 bg-background/75 px-3.5 py-2.5'>
      <Switch
        checked={scope.force}
        onCheckedChange={(force) => setScope((current) => ({ ...current, force }))}
        disabled={disabled}
      />
      <span className='flex flex-col'>
        <span className='text-sm font-medium text-foreground'>{t('preprocessForceLabel')}</span>
        <span className='text-xs leading-5 text-muted-foreground'>{t('preprocessForceHint')}</span>
      </span>
    </label>
  )
}

export default function TasksPage() {
  const t = useTranslations('Tasks')
  const tx = useTranslations()

  const albumName = useMemo(() => {
    return (albumValue: string, albums: AlbumOption[] | undefined) =>
      albumValue === 'all' ? tx('Words.all') : albums?.find((album) => album.album_value === albumValue)?.name || albumValue
  }, [tx])

  const showLabel = useMemo(() => {
    return (showStatus: AdminTaskScope['showStatus']) =>
      showStatus === 0 ? tx('Words.public') : showStatus === 1 ? tx('Words.private') : tx('Words.all')
  }, [tx])

  // Metadata scope labels need album names, so read the (already cached) album
  // list here to keep `scopeLabel` synchronous and matching prior behaviour.
  const { data: metadataAlbums } = useSWR<AlbumOption[]>('/api/v1/albums', fetcher)
  const albumsLoading = !metadataAlbums

  const metadataConfig = useMemo<TaskRunPanelConfig<AdminTaskScope>>(() => ({
    basePath: '/api/v1/tasks',
    taskKey: ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA,
    defaultScope: METADATA_DEFAULT_SCOPE,
    previewCountQuery: (scope) =>
      new URLSearchParams({ albumValue: scope.albumValue, showStatus: String(scope.showStatus) }).toString(),
    scopeLabel: (scope) => `${albumName(scope.albumValue, metadataAlbums)} / ${showLabel(scope.showStatus)}`,
    ScopeControl: MetadataScopeControl,
    renderExtraHints: () => (albumsLoading ? <p>{t('albumsLoading')}</p> : null),
    extraBooting: albumsLoading,
  }), [albumName, showLabel, metadataAlbums, albumsLoading, t])

  const preprocessConfig = useMemo<TaskRunPanelConfig<PreprocessTaskScope>>(() => ({
    basePath: '/api/v1/preprocess-tasks',
    taskKey: ADMIN_TASK_KEY_PREPROCESS_IMAGES,
    defaultScope: PREPROCESS_DEFAULT_SCOPE,
    previewCountQuery: (scope) => (scope.force ? 'force=true' : ''),
    scopeLabel: (scope) => (scope.force ? t('preprocessScopeForce') : t('preprocessScopeMissing')),
    ScopeControl: PreprocessScopeControl,
    // With `force` on, every image is reprocessed even when the preview-count of
    // missing-variant images is 0, so the start button must stay enabled.
    canStartWithoutPreview: (scope) => scope.force,
    mapStartError: (error) => (error.message === VARIANT_STORAGE_NOT_CONFIGURED ? t('preprocessStorageMissing') : null),
  }), [t])

  return (
    <Tabs defaultValue='metadata' className='gap-4'>
      <TabsList className='grid w-full max-w-md grid-cols-2'>
        <TabsTrigger value='metadata'>{t('tabMetadata')}</TabsTrigger>
        <TabsTrigger value='preprocess'>{t('tabPreprocess')}</TabsTrigger>
      </TabsList>
      <TabsContent value='metadata'>
        <TaskRunPanel config={metadataConfig} />
      </TabsContent>
      <TabsContent value='preprocess'>
        <TaskRunPanel config={preprocessConfig} />
      </TabsContent>
    </Tabs>
  )
}
