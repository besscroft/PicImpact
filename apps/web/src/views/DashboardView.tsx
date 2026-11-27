import { For, Show } from "solid-js";

import { EmptyState, LoadingState, cardCls, metaCls } from "../admin/shared";
import type { Dashboard } from "../types";

export function DashboardView(props: { dashboard: Dashboard | null }) {
  return (
    <Show when={props.dashboard} fallback={<LoadingState />}>
      {(dashboard) => (
        <section class="grid gap-5">
          <div class="grid grid-cols-4 gap-2.5 max-[760px]:grid-cols-2">
            <DashboardMetric label="照片总数" value={dashboard().summary.totalImages} />
            <DashboardMetric label="公开照片" value={dashboard().summary.publicImages} />
            <DashboardMetric label="首页精选" value={dashboard().coverage.featuredOnHome} />
            <DashboardMetric label="相册" value={dashboard().summary.totalAlbums} />
          </div>

          <div class="grid grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)] gap-5 max-[1100px]:grid-cols-1">
            <section class={`${cardCls} p-5`}>
              <DashboardHeading title="最近上传" detail="按上传时间排序的最新内容" />
              <Show
                when={dashboard().recentUploads.length > 0}
                fallback={<EmptyState title="还没有上传" detail="从照片管理中上传第一张图片。" />}
              >
                <div class="grid grid-cols-3 gap-2.5 max-[760px]:grid-cols-2">
                  <For each={dashboard().recentUploads}>
                    {(photo) => (
                      <a
                        class="group grid gap-2 text-[0.8rem] text-foreground no-underline"
                        href={`/preview/${encodeURIComponent(photo.id)}`}
                      >
                        <Show
                          when={photo.preview_url ?? photo.url}
                          fallback={
                            <div class="grid h-full min-h-[150px] place-items-center text-[0.62rem] tracking-widest text-muted-foreground">
                              NO IMAGE
                            </div>
                          }
                        >
                          <img
                            class="block aspect-video w-full bg-secondary object-cover transition-colors group-hover:text-foreground"
                            src={photo.preview_url ?? photo.url ?? ""}
                            alt={photo.title ?? photo.image_name ?? ""}
                            loading="lazy"
                          />
                        </Show>
                        <span>{photo.title || photo.image_name || "未命名照片"}</span>
                      </a>
                    )}
                  </For>
                </div>
              </Show>
            </section>

            <section class={`${cardCls} p-5`}>
              <DashboardHeading title="内容覆盖" detail="公开内容的当前状态" />
              <div class="grid gap-5">
                <CoverageMetric
                  label="公开比例"
                  value={`${dashboard().coverage.publicRatio}%`}
                  percent={dashboard().coverage.publicRatio}
                />
                <CoverageMetric
                  label="首页精选"
                  value={dashboard().coverage.featuredOnHome}
                  percent={dashboard().summary.totalImages
                    ? (dashboard().coverage.featuredOnHome / dashboard().summary.totalImages) * 100
                    : 0}
                />
                <CoverageMetric
                  label="地理信息"
                  value={dashboard().coverage.geoTaggedImages}
                  percent={dashboard().summary.totalImages
                    ? (dashboard().coverage.geoTaggedImages / dashboard().summary.totalImages) * 100
                    : 0}
                />
                <CoverageMetric
                  label="已加标签"
                  value={dashboard().coverage.taggedImages}
                  percent={dashboard().summary.totalImages
                    ? (dashboard().coverage.taggedImages / dashboard().summary.totalImages) * 100
                    : 0}
                />
              </div>
            </section>
          </div>

          <section class={`${cardCls} p-5`}>
            <DashboardHeading title="相册分布" detail="每个相册的图片与公开数量" />
            <Show
              when={dashboard().albumBreakdown.length > 0}
              fallback={<EmptyState title="还没有相册数据" detail="为照片绑定相册后会显示在这里。" />}
            >
              <div class="grid">
                <For each={dashboard().albumBreakdown}>
                  {(album) => (
                    <div class="grid grid-cols-[minmax(130px,0.8fr)_minmax(100px,1fr)_auto] items-center gap-4 border-t border-border py-3.5 max-[760px]:grid-cols-[1fr_auto] max-[760px]:[&>[data-bar]]:col-span-full max-[760px]:[&>[data-bar]]:row-start-2">
                      <div class="grid gap-1">
                        <strong class="text-[0.87rem] font-medium text-foreground">{album.name}</strong>
                        <span class={metaCls}>{album.album_value}</span>
                      </div>
                      <div class="h-1 overflow-hidden rounded-full bg-muted" data-bar>
                        <span
                          class="block h-full rounded-full bg-primary"
                          style={{
                            width: `${album.total ? (album.publicCount / album.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small class={metaCls}>
                        {album.publicCount} / {album.total}
                      </small>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </section>
        </section>
      )}
    </Show>
  );
}

function DashboardHeading(props: { title: string; detail: string }) {
  return (
    <div class="mb-4.5 flex items-end justify-between gap-4">
      <div>
        <div class={`mb-1.5 ${metaCls}`}>ADMIN / OVERVIEW</div>
        <h2 class="m-0 text-lg font-semibold tracking-tight text-foreground">{props.title}</h2>
      </div>
      <span class={metaCls}>{props.detail}</span>
    </div>
  );
}

function DashboardMetric(props: { label: string; value: number }) {
  return (
    <div class={`${cardCls} grid gap-2 p-5`}>
      <span class={metaCls}>{props.label}</span>
      <strong class="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {props.value}
      </strong>
    </div>
  );
}

function CoverageMetric(props: { label: string; value: number | string; percent: number }) {
  return (
    <div class="grid gap-2">
      <div class="flex items-center justify-between gap-3">
        <span class={metaCls}>{props.label}</span>
        <strong class="text-[0.95rem] font-medium text-foreground">{props.value}</strong>
      </div>
      <div class="h-1 overflow-hidden rounded-full bg-muted">
        <span
          class="block h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, props.percent))}%` }}
        />
      </div>
    </div>
  );
}
