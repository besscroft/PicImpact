import type { ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Eye,
  Globe2,
  Images,
  MapPinned,
  Sparkles,
  Tags,
} from 'lucide-react'

import { AlbumBreakdownChart } from '~/components/admin/dashboard/album-breakdown-chart'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { fetchAdminDashboardData } from '~/server/db/query/dashboard'

function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'show-up-motion relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {children}
    </section>
  )
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="font-display text-[1.35rem] leading-none text-foreground sm:text-[1.55rem]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-border/70 bg-background/70 p-3 sm:p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </div>
      </div>
      <p className="mt-2.5 font-display text-[1.95rem] leading-none tracking-tight text-foreground sm:text-[2.1rem]">
        {value}
      </p>
    </div>
  )
}

function CoverageCard({
  label,
  value,
  detail,
  percent,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  percent?: number
  icon: LucideIcon
}) {
  return (
    <div className="flex h-full flex-col rounded-[1.1rem] bg-background/55 px-3 py-3 sm:px-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </div>
      </div>

      <p className="mt-2 font-display text-[1.75rem] leading-none tracking-tight text-foreground sm:text-[1.9rem]">
        {value}
      </p>

      <p className="mt-auto line-clamp-1 pt-2 text-[0.74rem] leading-4 text-muted-foreground">
        {detail}
      </p>

      {typeof percent === 'number' && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function EquipmentCard({
  rank,
  camera,
  lens,
  count,
  countLabel,
  maxCount,
}: {
  rank: number
  camera: string
  lens: string
  count: number
  countLabel: string
  maxCount: number
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{camera}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{lens}</p>
            </div>
            <p className="font-display text-3xl leading-none text-foreground">{countLabel}</p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((count / maxCount) * 100, 6)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function Admin() {
  const [dashboard, locale, t] = await Promise.all([
    fetchAdminDashboardData(),
    getLocale(),
    getTranslations(),
  ])

  const numberFormatter = new Intl.NumberFormat(locale)
  const percentFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: dashboard.coverage.publicRatio % 1 === 0 ? 0 : 1,
  })
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const summaryCards = [
    {
      icon: Images,
      label: t('Dashboard.totalImages'),
      value: numberFormatter.format(dashboard.summary.totalImages),
    },
    {
      icon: Eye,
      label: t('Dashboard.publicImages'),
      value: numberFormatter.format(dashboard.summary.publicImages),
    },
  ]

  const publicRatioDetail =
    dashboard.summary.totalImages === 0
      ? t('Dashboard.coverageEmptyPublic')
      : dashboard.coverage.publicRatio === 100
        ? t('Dashboard.coverageAllPublic')
        : t('Dashboard.coverageSomePublic', {
            count: numberFormatter.format(dashboard.summary.publicImages),
          })

  const featuredDetail =
    dashboard.coverage.featuredOnHome === 0
      ? t('Dashboard.coverageNoFeatured')
      : t('Dashboard.coverageFeatured', {
          count: numberFormatter.format(dashboard.coverage.featuredOnHome),
        })

  const geoDetail =
    dashboard.coverage.geoTaggedImages === 0
      ? t('Dashboard.coverageNoGeo')
      : t('Dashboard.coverageHasGeo', {
          count: numberFormatter.format(dashboard.coverage.geoTaggedImages),
        })

  const tagDetail =
    dashboard.coverage.taggedImages === 0
      ? t('Dashboard.coverageNoTags')
      : t('Dashboard.coverageHasTags', {
          count: numberFormatter.format(dashboard.coverage.taggedImages),
        })

  const equipmentMax = dashboard.equipmentBreakdown[0]?.count || 1

  return (
    <div className="relative overflow-hidden px-1 py-2 sm:px-2">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-12 top-24 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[-5rem] top-0 h-72 w-72 rounded-full bg-secondary blur-3xl" />
        <div className="absolute bottom-8 left-1/3 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(25rem,1fr)] xl:items-stretch">
          <DashboardPanel className="hidden flex-col px-5 py-5 sm:flex sm:px-6 sm:py-6">
            <SectionHeading
              title={t('Dashboard.recentUploads')}
              action={
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/admin/list">
                    {t('Dashboard.openImageManagement')}
                    <ArrowRight />
                  </Link>
                </Button>
              }
            />

            {dashboard.recentUploads.length === 0 ? (
              <div className="mt-6 rounded-[1.35rem] border border-dashed border-border/80 bg-background/60 px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">{t('Dashboard.recentUploadsEmpty')}</p>
                <div className="mt-5">
                  <Button asChild className="rounded-full">
                    <Link href="/admin/upload">
                      {t('Link.upload')}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboard.recentUploads.map((item) => {
                  const createdAt = new Date(item.createdAt)
                  const imageTitle = item.title || item.imageName || t('Dashboard.untitled')
                  const albumName = item.albumNames || t('Dashboard.unassignedAlbum')

                  return (
                    <Link
                      key={item.id}
                      href="/admin/list"
                      className="group flex h-full flex-col rounded-[1.3rem] border border-border/70 bg-background/70 p-3 transition-transform duration-300 ease-out hover:-translate-y-0.5"
                    >
                      <div
                        className="relative overflow-hidden rounded-[1rem] border border-border/60 bg-secondary/60"
                        style={{ aspectRatio: '16 / 10' }}
                      >
                        {item.preview_url || item.url ? (
                          <Image
                            src={item.preview_url || item.url || ''}
                            alt={imageTitle}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 24vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                            <Images className="size-5" />
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/35 to-transparent px-3 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="line-clamp-1 text-sm font-medium text-foreground">{imageTitle}</p>
                            <Badge
                              variant={item.show === 0 ? 'secondary' : 'outline'}
                              className="shrink-0 rounded-full bg-background/80 backdrop-blur-sm"
                            >
                              {item.show === 0 ? t('Dashboard.statusPublic') : t('Dashboard.statusPrivate')}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{albumName}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
                        <span>{dateFormatter.format(createdAt)}</span>
                        <span className="inline-flex items-center gap-1 text-foreground/70 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                          {t('Dashboard.uploadedAt')}
                          <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel className="flex h-full flex-col px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid h-full gap-3 xl:grid-rows-[auto_1fr]">
              <div className="grid auto-rows-fr gap-2.5 sm:grid-cols-2">
                {summaryCards.map((item) => (
                  <StatCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>

              <div className="flex h-full flex-col pt-1">
                <div className="flex items-center gap-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {t('Dashboard.coverageTitle')}
                  </p>
                  <div className="h-px flex-1 bg-border/70" />
                </div>

                <div className="mt-3 grid flex-1 auto-rows-fr gap-2 sm:grid-cols-2">
                  <CoverageCard
                    icon={Globe2}
                    label={t('Dashboard.publicRatio')}
                    value={`${percentFormatter.format(dashboard.coverage.publicRatio)}%`}
                    percent={dashboard.coverage.publicRatio}
                    detail={publicRatioDetail}
                  />
                  <CoverageCard
                    icon={Sparkles}
                    label={t('Dashboard.featuredOnHome')}
                    value={numberFormatter.format(dashboard.coverage.featuredOnHome)}
                    detail={featuredDetail}
                  />
                  <CoverageCard
                    icon={MapPinned}
                    label={t('Dashboard.geoTaggedImages')}
                    value={numberFormatter.format(dashboard.coverage.geoTaggedImages)}
                    detail={geoDetail}
                  />
                  <CoverageCard
                    icon={Tags}
                    label={t('Dashboard.taggedImages')}
                    value={numberFormatter.format(dashboard.coverage.taggedImages)}
                    detail={tagDetail}
                  />
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel className="px-5 py-5 sm:px-6 sm:py-6">
          <SectionHeading
            title={t('Dashboard.albumBreakdown')}
            action={
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/admin/album">
                  {t('Link.album')}
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          <div className="mt-6">
            <AlbumBreakdownChart
              data={dashboard.albumBreakdown}
              totalLabel={t('Dashboard.totalLabel')}
              publicLabel={t('Dashboard.publicLabel')}
              emptyLabel={t('Dashboard.albumBreakdownEmpty')}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel className="px-5 py-5 sm:px-6 sm:py-6">
          <SectionHeading title={t('Dashboard.equipmentBreakdown')} />

          {dashboard.equipmentBreakdown.length === 0 ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-border/80 bg-background/60 px-4 py-6 text-sm text-muted-foreground">
              {t('Dashboard.equipmentBreakdownEmpty')}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.equipmentBreakdown.map((item, index) => {
                const camera = item.camera === 'Unknown' ? t('Dashboard.unknown') : item.camera
                const lens = item.lens === 'Unknown' ? t('Dashboard.unknown') : item.lens

                return (
                  <EquipmentCard
                    key={`${item.camera}-${item.lens}`}
                    rank={index + 1}
                    camera={camera}
                    lens={lens}
                    count={item.count}
                    countLabel={numberFormatter.format(item.count)}
                    maxCount={equipmentMax}
                  />
                )
              })}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
