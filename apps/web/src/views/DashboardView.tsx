import { For, Show } from "solid-js";

import { EmptyState, LoadingState } from "../admin/shared";
import type { Dashboard } from "../types";

export function DashboardView(props: { dashboard: Dashboard | null }) {
  return (
    <Show when={props.dashboard} fallback={<LoadingState />}>
      {(dashboard) => (
        <section class="dashboard-grid">
          <div class="dashboard-summary">
            <DashboardMetric label="照片总数" value={dashboard().summary.totalImages} />
            <DashboardMetric label="公开照片" value={dashboard().summary.publicImages} />
            <DashboardMetric label="首页精选" value={dashboard().coverage.featuredOnHome} />
            <DashboardMetric label="相册" value={dashboard().summary.totalAlbums} />
          </div>

          <div class="dashboard-columns">
            <section class="dashboard-panel recent-panel">
              <DashboardHeading title="最近上传" detail="按上传时间排序的最新内容" />
              <Show
                when={dashboard().recentUploads.length > 0}
                fallback={<EmptyState title="还没有上传" detail="从照片管理中上传第一张图片。" />}
              >
                <div class="recent-grid">
                  <For each={dashboard().recentUploads}>
                    {(photo) => (
                      <a class="recent-card" href={`/preview/${encodeURIComponent(photo.id)}`}>
                        <Show
                          when={photo.preview_url ?? photo.url}
                          fallback={<div class="recent-image empty">NO IMAGE</div>}
                        >
                          <img
                            class="recent-image"
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

            <section class="dashboard-panel coverage-panel">
              <DashboardHeading title="内容覆盖" detail="公开内容的当前状态" />
              <div class="coverage-list">
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

          <section class="dashboard-panel">
            <DashboardHeading title="相册分布" detail="每个相册的图片与公开数量" />
            <Show
              when={dashboard().albumBreakdown.length > 0}
              fallback={<EmptyState title="还没有相册数据" detail="为照片绑定相册后会显示在这里。" />}
            >
              <div class="breakdown-list">
                <For each={dashboard().albumBreakdown}>
                  {(album) => (
                    <div class="breakdown-row">
                      <div>
                        <strong>{album.name}</strong>
                        <span>{album.album_value}</span>
                      </div>
                      <div class="breakdown-bar">
                        <span
                          style={{
                            width: `${album.total ? (album.publicCount / album.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small>
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
    <div class="dashboard-heading">
      <div>
        <div class="eyebrow">ADMIN / OVERVIEW</div>
        <h2>{props.title}</h2>
      </div>
      <span>{props.detail}</span>
    </div>
  );
}

function DashboardMetric(props: { label: string; value: number }) {
  return (
    <div class="dashboard-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function CoverageMetric(props: { label: string; value: number | string; percent: number }) {
  return (
    <div class="coverage-metric">
      <div>
        <span>{props.label}</span>
        <strong>{props.value}</strong>
      </div>
      <div class="coverage-track">
        <span style={{ width: `${Math.min(100, Math.max(0, props.percent))}%` }} />
      </div>
    </div>
  );
}
