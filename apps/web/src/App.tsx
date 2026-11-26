import { Button } from "@ui-sdk/solid/button";
import { animate } from "motion";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";

import { LoginScreen } from "./LoginScreen";
import {
  compressPreviewImage,
  encodeThumbHash,
  readImageExif,
  readImageSize,
} from "./photo-client";

type View = "dashboard" | "photos" | "albums" | "config";
type Photo = {
  id: string;
  image_name: string | null;
  url: string | null;
  preview_url: string | null;
  video_url?: string | null;
  width: number;
  height: number;
  title: string | null;
  detail: string | null;
  exif?: Record<string, unknown> | null;
  labels?: string[] | null;
  blurhash?: string | null;
  lat?: string | null;
  lon?: string | null;
  show: number;
  show_on_mainpage: number;
  sort: number;
  createdAt?: string;
  type?: number;
  album_value?: string;
  album_name?: string;
};

type AdminPhotoPage = {
  data: Photo[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};
type Album = {
  id: string;
  album_value: string;
  name: string;
  detail: string | null;
  theme: string;
  show: number;
  sort: number;
  random_show: number;
  license: string | null;
  image_sorting: number;
  daily_weight: number;
};
type Config = {
  config_key: string;
  config_value: string | null;
  detail: string | null;
};

type PublicImage = Photo & {
  album_value?: string;
  album_name?: string;
  album_license?: string | null;
};

type PublicImagePage = {
  data: PublicImage[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

type PublicImageDetail = {
  data: PublicImage;
  neighbors: {
    previous: PublicImage | null;
    next: PublicImage | null;
  };
};

type Dashboard = {
  summary: {
    totalImages: number;
    publicImages: number;
    totalAlbums: number;
    publicAlbums: number;
  };
  coverage: {
    publicRatio: number;
    featuredOnHome: number;
    geoTaggedImages: number;
    taggedImages: number;
  };
  recentUploads: PublicImage[];
  albumBreakdown: Array<{
    name: string;
    album_value: string;
    total: number;
    publicCount: number;
  }>;
  equipmentBreakdown: Array<{
    camera: string;
    lens: string;
    count: number;
  }>;
};

const moduleLabels: Record<View, string> = {
  dashboard: "概览",
  photos: "图片",
  albums: "相册",
  config: "配置",
};

type Route =
  | { kind: "public"; album: string }
  | { kind: "preview"; id: string }
  | { kind: "admin" };

function getRoute(): Route {
  if (typeof window === "undefined") return { kind: "public", album: "/" };
  const pathname = window.location.pathname;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return { kind: "admin" };
  if (pathname.includes("/preview/")) {
    const previewIndex = pathname.lastIndexOf("/preview/");
    return {
      kind: "preview",
      id: decodeURIComponent(pathname.slice(previewIndex + "/preview/".length)),
    };
  }
  return {
    kind: "public",
    album: pathname === "/" ? "/" : decodeURIComponent(pathname),
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`接口 ${path} 返回了非 JSON 响应（Content-Type: ${response.headers.get("content-type") ?? "未知"}）`);
  }
}

function AdminApp() {
  const [view, setView] = createSignal<View>("dashboard");
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [configs, setConfigs] = createSignal<Config[]>([]);
  const [dashboard, setDashboard] = createSignal<Dashboard | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [importPreview, setImportPreview] = createSignal<{
    counts: Record<string, number>;
    warnings: string[];
    issues: { path: string; message: string }[];
  } | null>(null);
  const [importPayload, setImportPayload] = createSignal<unknown>(null);
  const [authReady, setAuthReady] = createSignal(false);
  const [authConfigured, setAuthConfigured] = createSignal(false);
  const [authenticated, setAuthenticated] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(true);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [albumResponse, configResponse, dashboardResponse] = await Promise.all([
        getJson<{ data: Album[] }>("/api/albums"),
        getJson<{ data: Config[] }>("/api/config"),
        getJson<{ data: Dashboard }>("/api/admin/dashboard"),
      ]);
      setAlbums(albumResponse.data);
      setConfigs(configResponse.data);
      setDashboard(dashboardResponse.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadSession() {
    try {
      const response = await getJson<{
        configured: boolean;
        authenticated: boolean;
      }>("/api/session");
      setAuthConfigured(response.configured);
      setAuthenticated(response.authenticated);
      if (!response.configured || response.authenticated) {
        await refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法检查登录状态");
    } finally {
      setAuthReady(true);
    }
  }

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setAuthenticated(false);
  }

  async function saveStorageConfig(values: Record<string, string>) {
    const response = await fetch("/api/storage-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      setError("存储配置保存失败");
      return false;
    }
    setNotice("存储配置已保存");
    await refresh();
    return true;
  }

  async function previewBackup(file: File) {
    const payload = JSON.parse(await file.text()) as unknown;
    const response = await fetch("/api/backup/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      data?: typeof importPreview extends () => infer T ? T : never;
      details?: typeof importPreview extends () => infer T ? T : never;
    };
    if (!response.ok) {
      const preview = body.details;
      if (preview) setImportPreview(preview);
      setError("备份校验未通过");
      return;
    }
    setImportPayload(payload);
    setImportPreview(body.data ?? null);
    setNotice("备份已解析，可确认导入");
  }

  async function importBackup() {
    const payload = importPayload();
    if (!payload) return;
    const response = await fetch("/api/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError("备份导入失败");
      return;
    }
    setImportPayload(null);
    setImportPreview(null);
    setNotice("备份已导入");
    await refresh();
  }

  createEffect(
    () => true,
    () => {
      animate(".app-shell", { opacity: [0, 1], y: [12, 0] }, { duration: 0.45 });
      void loadSession();
    },
  );

  return (
    <div class={`app-shell admin-shell${sidebarOpen() ? "" : " rail"}`}>
      <Show when={!authReady()}>
        <main class="auth-layout">
          <LoadingState />
        </main>
      </Show>

      <Show when={authReady() && authConfigured() && !authenticated()}>
        <main class="auth-layout">
          <LoginScreen
            onAuthenticated={() => {
              setAuthenticated(true);
              void refresh();
            }}
          />
        </main>
      </Show>

      <Show when={authReady() && (!authConfigured() || authenticated())}>
        <main class="workspace">
          <aside class="sidebar" aria-label="Admin sidebar">
            <button
              class="sidebar-brand"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <span class="brand-mark" aria-hidden="true">
                P
              </span>
              <span class="brand-name">PicImpact</span>
            </button>

            <div class="sidebar-group">
              <div class="sidebar-group-label">菜单</div>
              <nav class="module-nav" aria-label="业务模块">
                <For each={Object.keys(moduleLabels) as View[]}>
                  {(item) => (
                    <button
                      type="button"
                      class={`module-link${view() === item ? " active" : ""}`}
                      onClick={() => setView(item)}
                    >
                      <NavIcon view={item} />
                      <span>{moduleLabels[item]}</span>
                    </button>
                  )}
                </For>
              </nav>
            </div>

            <div class="sidebar-group sidebar-bottom">
              <button
                class="module-link"
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <NavIcon view="home" />
                <span>回到首页</span>
              </button>
            </div>

            <div class="sidebar-footer">
              <span class="user-avatar" aria-hidden="true">
                P
              </span>
              <div class="user-meta">
                <span class="user-name">admin</span>
                <span class="user-mail">PicImpact v4</span>
              </div>
              <Show when={authConfigured()}>
                <button class="user-action" type="button" onClick={signOut}>
                  退出
                </button>
              </Show>
            </div>
          </aside>

          <div class="workspace-main">
            <header class="admin-toolbar">
              <button
                class="toolbar-trigger"
                type="button"
                aria-label="切换侧栏"
                onClick={() => setSidebarOpen(!sidebarOpen())}
              >
                <ToolbarIcon />
              </button>
              <div class="toolbar-spacer" />
              <a class="quiet-link" href="/api/health" target="_blank" rel="noreferrer">
                API health
              </a>
              <a class="quiet-link" href="/api/backup/export">
                导出备份
              </a>
              <Button class="primary-button" onClick={() => refresh()} pendingAnnouncement="刷新中">
                <span data-show="idle">刷新数据</span>
                <span data-show="pending">刷新中…</span>
              </Button>
            </header>

            <div class="admin-content">
              <Show when={notice()}>
                <div class="notice" role="status">
                  {notice()}
                </div>
              </Show>
              <Show when={error()}>
                <div class="error-banner" role="alert">
                  {error()}
                </div>
              </Show>

              <Show when={!loading()} fallback={<LoadingState />}>
                <Show when={view() === "photos"}>
                  <PhotosView albums={albums()} onChanged={refresh} />
                </Show>
                <Show when={view() === "dashboard"}>
                  <DashboardView dashboard={dashboard()} />
                </Show>
                <Show when={view() === "albums"}>
                  <AlbumsView albums={albums()} onChanged={refresh} />
                </Show>
                <Show when={view() === "config"}>
                  <ConfigView configs={configs()} onSaveStorage={saveStorageConfig} />
                </Show>
              </Show>

              <Show when={view() === "config"}>
                <section class="backup-panel">
                  <div>
                    <div class="eyebrow">V3 BACKUP BRIDGE</div>
                    <h2>迁移旧数据</h2>
                    <p>支持 `picimpact-backup` v1，导入前先预览数量与校验告警。</p>
                  </div>
                  <div class="backup-actions">
                    <label class="file-button">
                      选择 JSON
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) void previewBackup(file);
                        }}
                      />
                    </label>
                    <Button
                      class="secondary-button"
                      disabled={!importPayload()}
                      onClick={() => importBackup()}
                    >
                      确认导入
                    </Button>
                  </div>
                  <Show when={importPreview()}>
                    {(preview) => (
                      <div class="preview-grid">
                        <PreviewMetric label="Photos" value={preview().counts.images ?? 0} />
                        <PreviewMetric label="Albums" value={preview().counts.albums ?? 0} />
                        <PreviewMetric label="Config" value={preview().counts.configs ?? 0} />
                        <PreviewMetric
                          label="Relations"
                          value={preview().counts.imageAlbumRelations ?? 0}
                        />
                      </div>
                    )}
                  </Show>
                </section>
              </Show>
            </div>
          </div>
        </main>
      </Show>
    </div>
  );
}

function NavIcon(props: { view: View | "home" }) {
  return (
    <svg
      class="module-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <Show when={props.view === "dashboard"}>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </Show>
      <Show when={props.view === "photos"}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </Show>
      <Show when={props.view === "albums"}>
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </Show>
      <Show when={props.view === "config"}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </Show>
      <Show when={props.view === "home"}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </Show>
    </svg>
  );
}

function ToolbarIcon() {
  return (
    <svg
      class="module-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div class="loading-state" aria-live="polite">
      <div class="loading-bar" />
      <div class="loading-bar short" />
      <div class="loading-card" />
    </div>
  );
}

function DashboardView(props: { dashboard: Dashboard | null }) {
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

const PHOTO_PAGE_SIZE = 8;

const EXIF_ROWS: Array<{ key: string; label: string }> = [
  { key: "make", label: "相机品牌" },
  { key: "model", label: "相机型号" },
  { key: "bits", label: "bit 位数" },
  { key: "dateTime", label: "拍摄时间" },
  { key: "exposure_time", label: "快门时间" },
  { key: "f_number", label: "光圈" },
  { key: "exposure_program", label: "曝光程序" },
  { key: "iso_speed_rating", label: "ISO" },
  { key: "focal_length", label: "焦距" },
  { key: "lens_specification", label: "镜头规格" },
  { key: "lens_model", label: "镜头型号" },
  { key: "exposure_mode", label: "曝光模式" },
  { key: "cfa_pattern", label: "CFA 模式" },
  { key: "color_space", label: "色彩空间" },
  { key: "white_balance", label: "白平衡" },
];

function exifValue(exif: Record<string, unknown> | null | undefined, key: string) {
  if (!exif || typeof exif !== "object") return "";
  const value = exif[key];
  return typeof value === "string" ? value : "";
}

function formatExifDateTime(value: string) {
  const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}${value.slice(10)}`;
}

function FilterSelect(props: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      class="filter-select"
      value={props.value}
      onChange={(event) => props.onChange(event.currentTarget.value)}
    >
      <option value="">{props.placeholder}</option>
      <For each={props.options}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  );
}

function TagInput(props: {
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = createSignal("");
  function commit() {
    const value = draft().trim();
    if (!value) return;
    if (!props.tags.includes(value)) props.onChange([...props.tags, value]);
    setDraft("");
  }
  return (
    <div class="tag-input">
      <For each={props.tags}>
        {(tag) => (
          <span class="tag-chip">
            {tag}
            <button
              type="button"
              aria-label={`移除标签 ${tag}`}
              onClick={() => props.onChange(props.tags.filter((item) => item !== tag))}
            >
              ×
            </button>
          </span>
        )}
      </For>
      <input
        value={draft()}
        placeholder={props.placeholder}
        onInput={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}

function SwitchRow(props: {
  label: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label class="switch-row">
      <span class="switch-copy">
        <strong>{props.label}</strong>
        {props.detail ? <small>{props.detail}</small> : null}
      </span>
      <span class="switch">
        <input
          type="checkbox"
          checked={props.checked}
          disabled={props.disabled}
          onChange={(event) => props.onChange?.(event.currentTarget.checked)}
        />
        <i aria-hidden="true" />
      </span>
    </label>
  );
}

function PhotosView(props: { albums: Album[]; onChanged: () => Promise<void> }) {
  const [album, setAlbum] = createSignal("");
  const [showStatus, setShowStatus] = createSignal("");
  const [camera, setCamera] = createSignal("");
  const [lens, setLens] = createSignal("");
  const [page, setPage] = createSignal(1);
  const [pageData, setPageData] = createSignal<AdminPhotoPage | null>(null);
  const [listLoading, setListLoading] = createSignal(true);
  const [listError, setListError] = createSignal<string | null>(null);
  const [cameras, setCameras] = createSignal<string[]>([]);
  const [lenses, setLenses] = createSignal<string[]>([]);
  const [version, setVersion] = createSignal(0);
  const [editing, setEditing] = createSignal<Photo | null>(null);
  const [viewing, setViewing] = createSignal<Photo | null>(null);
  const [binding, setBinding] = createSignal<Photo | null>(null);
  const [bindAlbum, setBindAlbum] = createSignal("");
  const [batchOpen, setBatchOpen] = createSignal(false);
  const [batchIds, setBatchIds] = createSignal<string[]>([]);
  const [batchDeleting, setBatchDeleting] = createSignal(false);

  const reload = () => setVersion((value) => value + 1);

  createEffect(
    () => [album(), showStatus(), camera(), lens(), page(), version()],
    ([nextAlbum, nextShow, nextCamera, nextLens, nextPage]) => {
      void loadPage(nextAlbum, nextShow, nextCamera, nextLens, nextPage);
    },
  );

  createEffect(
    () => true,
    () => {
      void (async () => {
        try {
          const response = await getJson<{ cameras: string[]; lenses: string[] }>(
            "/api/photos/camera-lens-list",
          );
          setCameras(response.cameras ?? []);
          setLenses(response.lenses ?? []);
        } catch {
          // 相机/镜头筛选列表加载失败时保持为空
        }
      })();
    },
  );

  async function loadPage(
    albumValue: string,
    showValue: string,
    cameraValue: string,
    lensValue: string,
    pageValue: number,
  ) {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (albumValue) params.set("album", albumValue);
      if (showValue) params.set("show", showValue);
      if (cameraValue) params.set("camera", cameraValue);
      if (lensValue) params.set("lens", lensValue);
      params.set("page", String(pageValue));
      params.set("pageSize", String(PHOTO_PAGE_SIZE));
      const response = await getJson<AdminPhotoPage>(`/api/photos?${params.toString()}`);
      setPageData(response);
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : "加载失败");
    } finally {
      setListLoading(false);
    }
  }

  async function updateShow(photo: Photo, show: number) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show }),
      });
      if (!response.ok) throw new Error("更新失败");
      reload();
      void props.onChanged();
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : "更新失败");
    }
  }

  async function submitBindAlbum(event: SubmitEvent) {
    event.preventDefault();
    const target = binding();
    const albumValue = bindAlbum();
    if (!target || !albumValue) return;
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(target.id)}/album`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ album_value: albumValue }),
      });
      if (!response.ok) throw new Error("相册绑定失败");
      setBinding(null);
      setBindAlbum("");
      reload();
      void props.onChanged();
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : "相册绑定失败");
    }
  }

  async function submitBatchDelete() {
    if (batchIds().length === 0) return;
    setBatchDeleting(true);
    try {
      const response = await fetch("/api/photos/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: batchIds() }),
      });
      if (!response.ok) throw new Error("删除失败");
      setBatchOpen(false);
      setBatchIds([]);
      reload();
      void props.onChanged();
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : "删除失败");
    } finally {
      setBatchDeleting(false);
    }
  }

  function toggleBatch(id: string, checked: boolean) {
    setBatchIds(
      checked ? [...batchIds(), id] : batchIds().filter((value) => value !== id),
    );
  }

  const albumOptions = () =>
    props.albums.map((item) => ({ value: item.album_value, label: item.name }));
  const total = () => pageData()?.total ?? 0;
  const pages = () => Math.max(1, pageData()?.pages ?? 1);

  return (
    <section class="content-grid">
      <UploadPanel
        albums={props.albums}
        onUploaded={() => {
          reload();
          void props.onChanged();
        }}
      />

      <div class="filter-bar">
        <div class="filter-group">
          <FilterSelect
            value={album()}
            placeholder="全部相册"
            options={albumOptions()}
            onChange={(value) => {
              setAlbum(value);
              setPage(1);
            }}
          />
          <FilterSelect
            value={showStatus()}
            placeholder="全部状态"
            options={[
              { value: "0", label: "公开" },
              { value: "1", label: "私有" },
            ]}
            onChange={(value) => {
              setShowStatus(value);
              setPage(1);
            }}
          />
          <FilterSelect
            value={camera()}
            placeholder="全部相机"
            options={cameras().map((item) => ({ value: item, label: item }))}
            onChange={(value) => {
              setCamera(value);
              setPage(1);
            }}
          />
          <FilterSelect
            value={lens()}
            placeholder="全部镜头"
            options={lenses().map((item) => ({ value: item, label: item }))}
            onChange={(value) => {
              setLens(value);
              setPage(1);
            }}
          />
        </div>
        <div class="filter-actions">
          <button
            class="row-action"
            type="button"
            disabled={listLoading() || total() === 0}
            onClick={() => setBatchOpen(true)}
          >
            批量删除
          </button>
          <button class="row-action" type="button" disabled={listLoading()} onClick={reload}>
            刷新
          </button>
        </div>
      </div>

      <Show when={listError()}>
        <div class="error-banner" role="alert">
          {listError()}
        </div>
      </Show>

      <Show
        when={!listLoading()}
        fallback={<div class="list-status">加载中…</div>}
      >
        <Show
          when={total() > 0}
          fallback={
            <EmptyState
              title="还没有照片"
              detail={album() || showStatus() || camera() || lens() ? "没有符合筛选条件的照片。" : "导入 v3 备份或通过上传写入第一条记录。"}
            />
          }
        >
          <div class="photo-grid">
            <For each={pageData()?.data ?? []}>
              {(photo) => (
                <article class="photo-card">
                  <div class="photo-card-head">
                    <span class="card-badge">{photo.album_name || "未分组"}</span>
                    <button
                      class="row-action"
                      type="button"
                      aria-label="查看图片"
                      onClick={() => setViewing(photo)}
                    >
                      查看
                    </button>
                  </div>
                  <button
                    class="photo-card-media"
                    type="button"
                    onClick={() => setViewing(photo)}
                  >
                    <Show when={photo.preview_url ?? photo.url} fallback={<span>NO IMAGE</span>}>
                      <img src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    </Show>
                  </button>
                  <div class="photo-card-foot">
                    <div class="photo-card-info">
                      <SwitchRow
                        label={photo.show === 0 ? "公开" : "私有"}
                        checked={photo.show === 0}
                        onChange={(checked) => void updateShow(photo, checked ? 0 : 1)}
                      />
                      <span class="card-badge">排序 {photo.sort}</span>
                    </div>
                    <div class="photo-card-actions">
                      <button
                        class="row-action"
                        type="button"
                        aria-label="绑定相册"
                        onClick={() => {
                          setBinding(photo);
                          setBindAlbum(photo.album_value ?? "");
                        }}
                      >
                        相册
                      </button>
                      <button
                        class="row-action"
                        type="button"
                        aria-label="编辑图片"
                        onClick={() => setEditing(photo)}
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                </article>
              )}
            </For>
          </div>
          <div class="pager">
            <select
              class="filter-select"
              value={String(page())}
              onChange={(event) => setPage(Number(event.currentTarget.value))}
            >
              {Array.from({ length: pages() }, (_, index) => index + 1).map((num) => (
                <option value={String(num)}>第 {num} 页</option>
              ))}
            </select>
            <button
              class="row-action"
              type="button"
              aria-label="上一页"
              disabled={page() <= 1}
              onClick={() => setPage(page() - 1)}
            >
              上一页
            </button>
            <button
              class="row-action"
              type="button"
              aria-label="下一页"
              disabled={page() >= pages()}
              onClick={() => setPage(page() + 1)}
            >
              下一页
            </button>
            <span class="pager-total">共 {total()} 张</span>
          </div>
        </Show>
      </Show>

      <Show when={editing()}>
        {(photo) => (
          <PhotoEditDialog
            photo={photo()}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
              void props.onChanged();
            }}
          />
        )}
      </Show>

      <Show when={viewing()}>
        {(photo) => <PhotoViewDialog photo={photo()} onClose={() => setViewing(null)} />}
      </Show>

      <Show when={binding()}>
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submitBindAlbum}>
            <div class="table-heading dialog-heading">
              <span>绑定相册</span>
              <button class="row-action" type="button" onClick={() => setBinding(null)}>
                关闭
              </button>
            </div>
            <div class="dialog-body">
              <label>
                相册
                <select
                  value={bindAlbum()}
                  onChange={(event) => setBindAlbum(event.currentTarget.value)}
                >
                  <option value="">请选择相册</option>
                  <For each={props.albums}>
                    {(item) => <option value={item.album_value}>{item.name}</option>}
                  </For>
                </select>
              </label>
            </div>
            <div class="dialog-footer">
              <Button class="primary-button" type="submit" disabled={!bindAlbum()}>
                更新
              </Button>
            </div>
          </form>
        </div>
      </Show>

      <Show when={batchOpen()}>
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={(event) => event.preventDefault()}>
            <div class="table-heading dialog-heading">
              <span>批量删除</span>
              <button
                class="row-action"
                type="button"
                onClick={() => {
                  setBatchOpen(false);
                  setBatchIds([]);
                }}
              >
                关闭
              </button>
            </div>
            <div class="dialog-body batch-list">
              <For each={pageData()?.data ?? []}>
                {(photo) => (
                  <label class="batch-item">
                    <input
                      type="checkbox"
                      checked={batchIds().includes(photo.id)}
                      onChange={(event) => toggleBatch(photo.id, event.currentTarget.checked)}
                    />
                    <img src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    <span class="batch-item-meta">
                      <strong>{photo.id.length > 16 ? `${photo.id.slice(0, 16)}…` : photo.id}</strong>
                      <small>{photo.title || "N/A"}</small>
                    </span>
                  </label>
                )}
              </For>
            </div>
            <div class="dialog-footer">
              <Button
                class="primary-button"
                disabled={batchIds().length === 0 || batchDeleting()}
                onClick={() => void submitBatchDelete()}
              >
                {batchDeleting() ? "删除中…" : `删除 ${batchIds().length} 项`}
              </Button>
            </div>
          </form>
        </div>
      </Show>
    </section>
  );
}

function PhotoEditDialog(props: { photo: Photo; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = createSignal<Photo>({
    ...props.photo,
    labels: props.photo.labels ? [...props.photo.labels] : [],
  });
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const update = (patch: Partial<Photo>) => setDraft({ ...draft(), ...patch });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const current = draft();
    if (!current.url) {
      setError("请填写图片链接");
      return;
    }
    if (!current.width || current.width <= 0) {
      setError("请填写有效的宽度");
      return;
    }
    if (!current.height || current.height <= 0) {
      setError("请填写有效的高度");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(current.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title ?? null,
          url: current.url,
          preview_url: current.preview_url ?? null,
          video_url: current.video_url ?? null,
          detail: current.detail ?? null,
          width: current.width,
          height: current.height,
          lon: current.lon ?? null,
          lat: current.lat ?? null,
          sort: current.sort,
          labels: current.labels ?? [],
          show: current.show,
          show_on_mainpage: current.show_on_mainpage,
        }),
      });
      if (!response.ok) throw new Error("更新失败");
      props.onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div class="dialog-overlay">
      <form class="dialog-panel dialog-wide" role="dialog" aria-modal="true" onSubmit={submit}>
        <div class="table-heading dialog-heading">
          <span>编辑图片</span>
          <button class="row-action" type="button" onClick={props.onClose}>
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <label>
            标题
            <input
              value={draft().title ?? ""}
              placeholder="请输入图片标题"
              onInput={(event) => update({ title: event.currentTarget.value })}
            />
          </label>
          <label>
            链接
            <input
              value={draft().url ?? ""}
              placeholder="请输入图片链接"
              onInput={(event) => update({ url: event.currentTarget.value })}
            />
          </label>
          <label>
            预览链接
            <input
              value={draft().preview_url ?? ""}
              placeholder="请输入预览链接"
              onInput={(event) => update({ preview_url: event.currentTarget.value })}
            />
          </label>
          <label>
            视频链接
            <input
              value={draft().video_url ?? ""}
              placeholder="请输入视频链接（Live Photo）"
              onInput={(event) => update({ video_url: event.currentTarget.value })}
            />
          </label>
          <label>
            详情
            <input
              value={draft().detail ?? ""}
              placeholder="请输入图片详情"
              onInput={(event) => update({ detail: event.currentTarget.value })}
            />
          </label>
          <div class="field-row">
            <label>
              宽度（px）
              <input
                type="number"
                value={draft().width}
                onInput={(event) => update({ width: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              高度（px）
              <input
                type="number"
                value={draft().height}
                onInput={(event) => update({ height: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
          <div class="field-row">
            <label>
              经度
              <input
                value={draft().lon ?? ""}
                placeholder="请输入经度"
                onInput={(event) => update({ lon: event.currentTarget.value })}
              />
            </label>
            <label>
              纬度
              <input
                value={draft().lat ?? ""}
                placeholder="请输入纬度"
                onInput={(event) => update({ lat: event.currentTarget.value })}
              />
            </label>
          </div>
          <label>
            排序
            <input
              type="number"
              value={draft().sort}
              onInput={(event) => update({ sort: Number(event.currentTarget.value) })}
            />
          </label>
          <TagInput
            tags={draft().labels ?? []}
            placeholder="添加标签后回车"
            onChange={(tags) => update({ labels: tags })}
          />
          <SwitchRow
            label="显示状态"
            detail="关闭后图片不会在前台显示"
            checked={draft().show === 0}
            onChange={(checked) => update({ show: checked ? 0 : 1 })}
          />
          <SwitchRow
            label="首页显示"
            detail="开启后图片会显示在首页"
            checked={draft().show_on_mainpage === 0}
            onChange={(checked) => update({ show_on_mainpage: checked ? 0 : 1 })}
          />
        </div>
        <Show when={error()}>
          <div class="error-banner dialog-error" role="alert">
            {error()}
          </div>
        </Show>
        <div class="dialog-footer">
          <Button class="primary-button" type="submit" disabled={pending()}>
            {pending() ? "更新中…" : "更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PhotoViewDialog(props: { photo: Photo; onClose: () => void }) {
  const photo = () => props.photo;
  const exifRows = () =>
    EXIF_ROWS.map((row) => {
      const raw = exifValue(photo().exif, row.key);
      return {
        label: row.label,
        value: row.key === "dateTime" && raw ? formatExifDateTime(raw) : raw,
      };
    }).filter((row) => row.value);

  return (
    <div class="dialog-overlay">
      <div class="dialog-panel dialog-wide" role="dialog" aria-modal="true">
        <div class="table-heading dialog-heading">
          <span>{photo().title || photo().image_name || photo().id}</span>
          <button class="row-action" type="button" onClick={props.onClose}>
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <Show
            when={photo().type === 2 && photo().video_url}
            fallback={
              <img class="view-image" src={photo().preview_url ?? photo().url ?? ""} alt={photo().detail ?? ""} />
            }
          >
            <video class="view-image" src={photo().video_url ?? ""} controls muted loop playsinline />
          </Show>
          <Show when={(photo().labels ?? []).length > 0}>
            <div class="tag-row">
              <For each={photo().labels ?? []}>{(tag) => <span class="tag-chip static">{tag}</span>}</For>
            </div>
          </Show>
          <Show when={exifRows().length > 0}>
            <table class="exif-table">
              <thead>
                <tr>
                  <th>参数</th>
                  <th>值</th>
                </tr>
              </thead>
              <tbody>
                <For each={exifRows()}>
                  {(row) => (
                    <tr>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
          <div class="view-meta">
            <div><span>详情</span><strong>{photo().detail || "—"}</strong></div>
            <div><span>尺寸</span><strong>{photo().width} × {photo().height}</strong></div>
            <div><span>经纬度</span><strong>{photo().lon || "—"} / {photo().lat || "—"}</strong></div>
            <div><span>排序</span><strong>{photo().sort}</strong></div>
          </div>
          <SwitchRow label="显示状态" checked={photo().show === 0} disabled />
          <SwitchRow label="首页显示" checked={photo().show_on_mainpage === 0} disabled />
        </div>
      </div>
    </div>
  );
}

function UploadPanel(props: {
  albums: Album[];
  onUploaded: () => void;
}) {
  const [mode, setMode] = createSignal<"single" | "multiple">("single");
  const [album, setAlbum] = createSignal("");
  const [uploaded, setUploaded] = createSignal<Photo | null>(null);
  const [title, setTitle] = createSignal("");
  const [detail, setDetail] = createSignal("");
  const [labels, setLabels] = createSignal<string[]>([]);
  const [pending, setPending] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal<string | null>(null);

  function reset() {
    setUploaded(null);
    setTitle("");
    setDetail("");
    setLabels([]);
  }

  async function uploadOne(file: File, albumValue: string) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("album", albumValue);
    if (!file.type.startsWith("video/")) {
      setMessage(`正在处理 ${file.name}（生成预览图 / EXIF / thumbhash）…`);
      const previewBlob = await compressPreviewImage(file, { quality: 0.2 });
      formData.set(
        "preview",
        new File([previewBlob], "preview.webp", { type: "image/webp" }),
      );
      const { exif, gpsLat, gpsLon } = await readImageExif(await file.arrayBuffer());
      formData.set("exif", JSON.stringify(exif));
      if (gpsLat) formData.set("lat", gpsLat);
      if (gpsLon) formData.set("lon", gpsLon);
      const size = await readImageSize(file);
      formData.set("width", String(size.width));
      formData.set("height", String(size.height));
      formData.set("blurhash", await encodeThumbHash(file));
    }
    const response = await fetch("/api/photos/upload", { method: "POST", body: formData });
    const body = (await response.json().catch(() => null)) as { data?: Photo; message?: string } | null;
    if (!response.ok) {
      throw new Error(body?.message ?? "上传失败");
    }
    if (!body?.data) throw new Error("上传失败");
    return body.data;
  }

  async function handleSingleFile(
    event: Event & { currentTarget: HTMLInputElement },
  ) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!album()) {
      setMessage("请先选择相册");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const photo = await uploadOne(file, album());
      setUploaded(photo);
      setMessage("上传成功，请完善信息后保存");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setPending(false);
    }
  }

  async function saveUploaded(event: SubmitEvent) {
    event.preventDefault();
    const current = uploaded();
    if (!current) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(current.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title() || null,
          detail: detail() || null,
          labels,
        }),
      });
      if (!response.ok) throw new Error("保存失败");
      setMessage("照片已保存");
      reset();
      props.onUploaded();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleMultipleFiles(
    event: Event & { currentTarget: HTMLInputElement },
  ) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;
    if (!album()) {
      setMessage("请先选择相册");
      return;
    }
    setPending(true);
    setMessage(null);
    let success = 0;
    let failed = 0;
    for (const file of files) {
      try {
        await uploadOne(file, album());
        success += 1;
      } catch {
        failed += 1;
      }
    }
    setPending(false);
    setMessage(`批量上传完成：成功 ${success} 个${failed ? `，失败 ${failed} 个` : ""}`);
    if (success > 0) {
      props.onUploaded();
    }
  }

  return (
    <div class="upload-panel">
      <div class="upload-head">
        <div class="upload-tabs">
          <button
            class={`row-action${mode() === "single" ? " active" : ""}`}
            type="button"
            onClick={() => {
              setMode("single");
              reset();
              setMessage(null);
            }}
          >
            单张上传
          </button>
          <button
            class={`row-action${mode() === "multiple" ? " active" : ""}`}
            type="button"
            onClick={() => {
              setMode("multiple");
              reset();
              setMessage(null);
            }}
          >
            批量上传
          </button>
        </div>
        <select
          class="filter-select"
          value={album()}
          onChange={(event) => setAlbum(event.currentTarget.value)}
        >
          <option value="">请选择相册</option>
          <For each={props.albums}>
            {(item) => <option value={item.album_value}>{item.name}</option>}
          </For>
        </select>
      </div>
      <Show
        when={mode() === "single"}
        fallback={
          <label class="dropzone">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              disabled={pending() || !album()}
              onChange={handleMultipleFiles}
            />
            <span>
              {pending() ? "上传中…" : "拖拽或点击选择文件（可多选，将自动保存）"}
            </span>
          </label>
        }
      >
        <div class="upload-single">
          <label class="dropzone">
            <input
              type="file"
              accept="image/*,video/*"
              disabled={pending() || !album()}
              onChange={handleSingleFile}
            />
            <span>{pending() ? "上传中…" : "拖拽或点击选择文件"}</span>
          </label>
          <Show when={uploaded()}>
            {(photo) => (
              <form class="upload-form" onSubmit={saveUploaded}>
                <label>
                  标题
                  <input
                    value={title()}
                    placeholder="请输入标题"
                    onInput={(event) => setTitle(event.currentTarget.value)}
                  />
                </label>
                <label>
                  URL
                  <input disabled value={photo().url ?? ""} />
                </label>
                <label>
                  预览 URL
                  <input disabled value={photo().preview_url ?? ""} />
                </label>
                <div class="field-row">
                  <label>
                    宽度
                    <input disabled value={photo().width} />
                  </label>
                  <label>
                    高度
                    <input disabled value={photo().height} />
                  </label>
                </div>
                <div class="field-row">
                  <label>
                    经度
                    <input disabled value={photo().lon ?? ""} />
                  </label>
                  <label>
                    纬度
                    <input disabled value={photo().lat ?? ""} />
                  </label>
                </div>
                <label>
                  详情
                  <input
                    value={detail()}
                    placeholder="请输入详情"
                    onInput={(event) => setDetail(event.currentTarget.value)}
                  />
                </label>
                <TagInput
                  tags={labels()}
                  placeholder="添加标签后回车"
                  onChange={setLabels}
                />
                <Button class="primary-button" type="submit" disabled={saving()}>
                  {saving() ? "保存中…" : "保存照片"}
                </Button>
              </form>
            )}
          </Show>
        </div>
      </Show>
      <Show when={message()}>
        <span class="upload-message" role="status">
          {message()}
        </span>
      </Show>
    </div>
  );
}

const THEME_OPTIONS = [
  { value: "0", label: "默认样式" },
  { value: "1", label: "简约样式" },
  { value: "2", label: "拍立得样式" },
];

const IMAGE_SORTING_OPTIONS = [
  { value: 1, label: "上传时间 新→旧" },
  { value: 2, label: "拍摄时间 新→旧" },
  { value: 3, label: "上传时间 旧→新" },
  { value: 4, label: "拍摄时间 旧→新" },
];

function AlbumsView(props: { albums: Album[]; onChanged: () => Promise<void> }) {
  const [formOpen, setFormOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<Album | null>(null);
  const [deleting, setDeleting] = createSignal<Album | null>(null);
  const [deletePending, setDeletePending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function toggleShow(album: Album) {
    setError(null);
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}/show`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: album.show === 0 ? 1 : 0 }),
      });
      if (!response.ok) throw new Error("更新失败");
      await props.onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新失败");
    }
  }

  async function confirmDelete() {
    const album = deleting();
    if (!album || deletePending()) return;
    setDeletePending(true);
    setError(null);
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("删除失败");
      setDeleting(null);
      await props.onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <section class="content-grid">
      <div class="summary-row">
        <SummaryMetric label="相册" value={props.albums.length} detail="v3 album_value" />
        <SummaryMetric
          label="展示中"
          value={props.albums.filter((album) => album.show === 0).length}
          detail="show = 0"
        />
      </div>
      <div class="table-shell">
        <div class="table-heading">
          <span>Album index</span>
          <button
            class="row-action storage-edit"
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            新建相册
          </button>
          <span>{props.albums.length} records</span>
        </div>
        <Show when={error()}>
          <span class="upload-message" role="alert">
            {error()}
          </span>
        </Show>
        <Show
          when={props.albums.length > 0}
          fallback={
            <EmptyState
              title="还没有相册"
              detail="新建相册或导入 v3 备份，旧相册会保持原有 album_value。"
            />
          }
        >
          <div class="album-grid">
            <For each={props.albums}>
              {(album) => (
                <article class="album-tile">
                  <div class="album-index">{album.sort.toString().padStart(2, "0")}</div>
                  <div>
                    <h3>{album.name}</h3>
                    <p>{album.album_value}</p>
                  </div>
                  <div class="album-actions">
                    <span class={`row-status${album.show !== 0 ? " hidden" : ""}`}>
                      {album.show === 0 ? "公开" : "隐藏"}
                    </span>
                    <button class="row-action" type="button" onClick={() => toggleShow(album)}>
                      {album.show === 0 ? "隐藏" : "公开"}
                    </button>
                    <button
                      class="row-action"
                      type="button"
                      onClick={() => {
                        setEditing(album);
                        setFormOpen(true);
                      }}
                    >
                      编辑
                    </button>
                    <button class="row-action" type="button" onClick={() => setDeleting(album)}>
                      删除
                    </button>
                  </div>
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={formOpen()}>
        <AlbumFormDialog
          album={editing()}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await props.onChanged();
          }}
        />
      </Show>
      <Show when={deleting()}>
        {(album) => (
          <div class="dialog-overlay">
            <div class="dialog-panel" role="dialog" aria-modal="true">
              <div class="table-heading dialog-heading">
                <span>确认删除相册</span>
                <button
                  class="row-action"
                  type="button"
                  onClick={() => setDeleting(null)}
                  aria-label="关闭"
                >
                  关闭
                </button>
              </div>
              <div class="dialog-body">
                <p>名称：{album().name}</p>
                <p>路由：{album().album_value}</p>
                <p>删除后相册不再展示，图片-相册关联保留。</p>
              </div>
              <div class="dialog-footer">
                <Button
                  class="secondary-button"
                  type="button"
                  disabled={deletePending()}
                  onClick={() => setDeleting(null)}
                >
                  取消
                </Button>
                <Button
                  class="primary-button"
                  type="button"
                  disabled={deletePending()}
                  onClick={() => confirmDelete()}
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </Show>
    </section>
  );
}

function AlbumFormDialog(props: {
  album: Album | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = createSignal(props.album?.name ?? "");
  const [albumValue, setAlbumValue] = createSignal(props.album?.album_value ?? "/");
  const [detail, setDetail] = createSignal(props.album?.detail ?? "");
  const [sort, setSort] = createSignal(props.album?.sort ?? 0);
  const [license, setLicense] = createSignal(props.album?.license ?? "");
  const [theme, setTheme] = createSignal(props.album?.theme ?? "0");
  const [show, setShow] = createSignal(props.album?.show ?? 1);
  const [randomShow, setRandomShow] = createSignal(props.album?.random_show ?? 1);
  const [imageSorting, setImageSorting] = createSignal(props.album?.image_sorting ?? 1);
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!name().trim() || !albumValue().trim()) {
      setError("名称和路由为必填项");
      return;
    }
    if (!albumValue().startsWith("/")) {
      setError("路由必须以 / 开头");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        props.album ? `/api/albums/${encodeURIComponent(props.album.id)}` : "/api/albums",
        {
          method: props.album ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            album_value: albumValue().trim(),
            name: name().trim(),
            detail: detail().trim() || null,
            sort: Number(sort()) || 0,
            license: license().trim() || null,
            theme: theme(),
            show: Number(show()),
            random_show: Number(randomShow()),
            image_sorting: Number(imageSorting()),
          }),
        },
      );
      if (!response.ok) throw new Error("保存失败");
      await props.onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div class="dialog-overlay">
      <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submit}>
        <div class="table-heading dialog-heading">
          <span>{props.album ? "编辑相册" : "新建相册"}</span>
          <button class="row-action" type="button" onClick={props.onClose} aria-label="关闭">
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <label>
            名称
            <input
              type="text"
              value={name()}
              placeholder="相册名称"
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <label>
            路由（album_value）
            <input
              type="text"
              value={albumValue()}
              placeholder="/travel，必须以 / 开头"
              onInput={(event) => setAlbumValue(event.currentTarget.value)}
            />
          </label>
          <label>
            详情
            <input
              type="text"
              value={detail()}
              placeholder="相册简介，可选"
              onInput={(event) => setDetail(event.currentTarget.value)}
            />
          </label>
          <label>
            排序（sort）
            <input
              type="number"
              value={sort()}
              placeholder="0"
              onInput={(event) => setSort(Number(event.currentTarget.value))}
            />
          </label>
          <label>
            License
            <input
              type="text"
              value={license()}
              placeholder="如 CC-BY-NC-ND，可选"
              onInput={(event) => setLicense(event.currentTarget.value)}
            />
          </label>
          <label>
            相册主题
            <select value={theme()} onChange={(event) => setTheme(event.currentTarget.value)}>
              <For each={THEME_OPTIONS}>
                {(option) => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </label>
          <label>
            显示状态
            <select value={show()} onChange={(event) => setShow(Number(event.currentTarget.value))}>
              <option value={0}>公开</option>
              <option value={1}>隐藏</option>
            </select>
          </label>
          <label>
            随机排序（random_show）
            <select
              value={randomShow()}
              onChange={(event) => setRandomShow(Number(event.currentTarget.value))}
            >
              <option value={0}>启用随机排序</option>
              <option value={1}>默认排序</option>
            </select>
          </label>
          <label>
            图片排序规则
            <select
              value={imageSorting()}
              onChange={(event) => setImageSorting(Number(event.currentTarget.value))}
            >
              <For each={IMAGE_SORTING_OPTIONS}>
                {(option) => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </label>
          <Show when={error()}>
            <span class="upload-message" role="alert">
              {error()}
            </span>
          </Show>
        </div>
        <div class="dialog-footer">
          <Button
            class="secondary-button"
            type="button"
            disabled={pending()}
            onClick={props.onClose}
          >
            取消
          </Button>
          <Button class="primary-button" type="submit" disabled={pending()}>
            {pending() ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ConfigView(props: {
  configs: Config[];
  onSaveStorage: (values: Record<string, string>) => Promise<boolean>;
}) {
  return (
    <section class="content-grid">
      <StorageConfigPanel
        title="存储驱动"
        fields={STORAGE_COMMON_FIELDS}
        configs={props.configs}
        onSave={props.onSaveStorage}
      />
      <StorageConfigPanel
        title="S3 存储配置"
        fields={S3_STORAGE_FIELDS}
        configs={props.configs}
        onSave={props.onSaveStorage}
      />
      <StorageConfigPanel
        title="R2 存储配置"
        fields={R2_STORAGE_FIELDS}
        configs={props.configs}
        onSave={props.onSaveStorage}
      />
    </section>
  );
}

type StorageField = {
  key: string;
  label: string;
  hint: string;
  secret?: boolean;
  driver?: boolean;
};

// 通用项：驱动选择 + 上传上限（S3 / R2 共用）
const STORAGE_COMMON_FIELDS: StorageField[] = [
  { key: "storage.driver", label: "存储驱动", hint: "s3 / r2", driver: true },
  { key: "storage.max_upload_bytes", label: "上传上限", hint: "单文件最大字节数，默认 26214400" },
];

const S3_STORAGE_FIELDS: StorageField[] = [
  { key: "storage.endpoint", label: "Endpoint", hint: "S3 兼容端地址" },
  { key: "storage.region", label: "Region", hint: "默认 auto" },
  { key: "storage.bucket", label: "Bucket", hint: "存储桶名称" },
  { key: "storage.access_key_id", label: "Access Key ID", hint: "访问密钥 ID" },
  { key: "storage.secret_access_key", label: "Secret Access Key", hint: "访问密钥 Secret", secret: true },
  { key: "storage.public_url", label: "Public URL", hint: "自定义域名，可选" },
  { key: "storage.storage_folder", label: "存储文件夹", hint: "如 picimpact 或 picimpact/images，/ 或空为根路径" },
];

const R2_STORAGE_FIELDS: StorageField[] = [
  { key: "storage.r2.account_id", label: "Account ID", hint: "Cloudflare 账户 ID" },
  { key: "storage.r2.access_key_id", label: "Access Key ID", hint: "R2 API 访问密钥 ID" },
  { key: "storage.r2.secret_access_key", label: "Secret Access Key", hint: "R2 API 访问密钥 Secret", secret: true },
  { key: "storage.r2.bucket", label: "Bucket", hint: "R2 存储桶名称" },
  { key: "storage.r2.storage_folder", label: "存储文件夹", hint: "如 picimpact 或 picimpact/images，/ 或空为根路径" },
  { key: "storage.r2.public_url", label: "Public URL", hint: "R2 公共访问域名，可选" },
];

function StorageConfigPanel(props: {
  title: string;
  fields: StorageField[];
  configs: Config[];
  onSave: (values: Record<string, string>) => Promise<boolean>;
}) {
  const [open, setOpen] = createSignal(false);
  const [draft, setDraft] = createSignal<Record<string, string>>({});
  const [pending, setPending] = createSignal(false);

  const configValue = (key: string) =>
    props.configs.find((config) => config.config_key === key)?.config_value ?? "";

  const displayValue = (field: { key: string; secret?: boolean }) => {
    const value = configValue(field.key);
    if (!value) return "—";
    if (field.secret) {
      return value.length > 4 ? `${"•".repeat(10)}${value.slice(-4)}` : "••••••";
    }
    return value;
  };

  function openDialog() {
    setDraft(Object.fromEntries(props.fields.map((field) => [field.key, configValue(field.key)])));
    setOpen(true);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const saved = await props.onSave(draft());
      if (saved) setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div class="table-shell storage-panel">
        <div class="table-heading">
          <span>{props.title}</span>
          <button class="row-action storage-edit" type="button" onClick={openDialog}>
            编辑
          </button>
        </div>
        <div class="config-list">
          <For each={props.fields}>
            {(field) => (
              <div class="config-row">
                <strong>{field.key}</strong>
                <span>{displayValue(field)}</span>
                <small>{field.hint}</small>
              </div>
            )}
          </For>
        </div>
      </div>
      <Show when={open()}>
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submit}>
            <div class="table-heading dialog-heading">
              <span>编辑{props.title}</span>
              <button
                class="row-action"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                关闭
              </button>
            </div>
            <div class="dialog-body">
              <For each={props.fields}>
                {(field) =>
                  field.driver ? (
                    <label>
                      存储驱动（{field.key}）
                      <select
                        value={draft()[field.key] ?? ""}
                        onChange={(event) =>
                          setDraft({ ...draft(), [field.key]: event.currentTarget.value })
                        }
                      >
                        <option value="">未设置</option>
                        <option value="s3">s3</option>
                        <option value="r2">r2</option>
                      </select>
                    </label>
                  ) : (
                    <label>
                      {field.label}（{field.key}）
                      <input
                        type="text"
                        value={draft()[field.key] ?? ""}
                        placeholder={field.hint}
                        onInput={(event) =>
                          setDraft({ ...draft(), [field.key]: event.currentTarget.value })
                        }
                      />
                    </label>
                  )
                }
              </For>
            </div>
            <div class="dialog-footer">
              <Button
                class="secondary-button"
                type="button"
                disabled={pending()}
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button class="primary-button" type="submit" disabled={pending()}>
                保存
              </Button>
            </div>
          </form>
        </div>
      </Show>
    </>
  );
}

function PublicHome(props: { album: string }) {
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [photos, setPhotos] = createSignal<PublicImage[]>([]);
  const [page, setPage] = createSignal(1);
  const [pages, setPages] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function load(reset = true) {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const [albumResponse, pageResponse] = await Promise.all([
        getJson<{ data: Album[] }>("/api/public/albums"),
        getJson<PublicImagePage>(
          `/api/public/images?album=${encodeURIComponent(props.album)}&page=${reset ? 1 : page() + 1}&pageSize=60`,
        ),
      ]);
      setAlbums(albumResponse.data);
      setPhotos((current) => (reset ? pageResponse.data : [...current, ...pageResponse.data]));
      setPage(pageResponse.page);
      setPages(pageResponse.pages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图库加载失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  createEffect(
    () => props.album,
    () => {
      void load();
    },
  );

  return (
    <div class="public-shell">
      <PublicNav albums={albums()} activeAlbum={props.album} />
      <main class="public-content">
        <Show when={error()}>
          <div class="error-banner" role="alert">
            {error()}
          </div>
        </Show>
        <Show when={!loading()} fallback={<PublicGallerySkeleton />}>
          <Show
            when={photos().length > 0}
            fallback={
              <div class="public-empty">
                <span>还没有公开照片</span>
                <p>管理员将照片设为公开并加入首页后，它们会出现在这里。</p>
              </div>
            }
          >
            <div class="masonry-grid">
              <For each={photos()}>
                {(photo, index) => <MasonryPhoto photo={photo} priority={index() < 5} />}
              </For>
            </div>
            <Show when={page() < pages()}>
              <button
                class="load-more-button"
                type="button"
                disabled={loadingMore()}
                onClick={() => void load(false)}
              >
                {loadingMore() ? "加载中…" : "加载更多"}
              </button>
            </Show>
          </Show>
        </Show>
      </main>
    </div>
  );
}

function PublicNav(props: { albums: Album[]; activeAlbum: string }) {
  return (
    <header class="public-nav">
      <a class="public-brand" href="/">
        <span class="public-brand-mark">P</span>
        <span>PicImpact</span>
      </a>
      <nav class="public-albums" aria-label="相册">
        <a class={props.activeAlbum === "/" ? "active" : ""} href="/">
          首页
        </a>
        <For each={props.albums}>
          {(album) => (
            <a
              class={props.activeAlbum === album.album_value ? "active" : ""}
              href={albumHref(album.album_value)}
            >
              {album.name}
            </a>
          )}
        </For>
      </nav>
      <div class="public-nav-tools">
        <a class="public-nav-tool" href="/map" aria-label="地图">
          ⌖
        </a>
        <button class="public-nav-tool" type="button" aria-label="搜索">
          ⌕
        </button>
        <button
          class="public-nav-tool"
          type="button"
          aria-label="切换主题"
          onClick={() => document.documentElement.classList.toggle("light-mode")}
        >
          ◐
        </button>
        <a class="public-admin-link" href="/admin">
          管理
        </a>
      </div>
    </header>
  );
}

function albumHref(albumValue: string) {
  return albumValue === "/" ? "/" : `/${albumValue.replace(/^\/+/, "")}`;
}

function MasonryPhoto(props: { photo: PublicImage; priority?: boolean }) {
  const title = props.photo.title || props.photo.image_name || "未命名照片";
  const source = props.photo.preview_url || props.photo.url;
  const ratio =
    props.photo.width > 0 && props.photo.height > 0
      ? `${props.photo.width} / ${props.photo.height}`
      : "4 / 3";
  return (
    <a class="masonry-item" href={`/preview/${encodeURIComponent(props.photo.id)}`}>
      <div class="masonry-media" style={{ "aspect-ratio": ratio }}>
        <Show when={source} fallback={<div class="masonry-fallback">NO IMAGE</div>}>
          <img src={source ?? ""} alt={title} loading={props.priority ? "eager" : "lazy"} />
        </Show>
        <div class="masonry-overlay">
          <strong>{title}</strong>
          <span>{exifSummary(props.photo)}</span>
        </div>
        <Show when={props.photo.type === 2}>
          <span class="live-badge">LIVE</span>
        </Show>
      </div>
    </a>
  );
}

function PublicGallerySkeleton() {
  return (
    <div class="masonry-grid skeleton-grid" aria-hidden="true">
      <For each={Array.from({ length: 12 })}>
        {(_, index) => <div class="gallery-skeleton" style={{ "aspect-ratio": `${3 + (index() % 3)} / 4` }} />}
      </For>
    </div>
  );
}

function PublicPreview(props: { id: string }) {
  const [detail, setDetail] = createSignal<PublicImageDetail | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getJson<PublicImageDetail>(`/api/public/images/${encodeURIComponent(props.id)}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片不存在");
    } finally {
      setLoading(false);
    }
  }

  createEffect(
    () => props.id,
    () => {
      void load();
    },
  );

  createEffect(
    () => detail(),
    () => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const current = detail();
        if (!current) return;
        if (event.key === "Escape") {
          window.location.href = albumHref(current.data.album_value ?? "/");
        } else if (event.key === "ArrowLeft" && current.neighbors.previous) {
          window.location.href = `/preview/${encodeURIComponent(current.neighbors.previous.id)}`;
        } else if (event.key === "ArrowRight" && current.neighbors.next) {
          window.location.href = `/preview/${encodeURIComponent(current.neighbors.next.id)}`;
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
    },
  );

  return (
    <div class="preview-shell">
      <header class="preview-topbar">
        <a
          class="preview-close"
          href={albumHref(detail()?.data.album_value ?? "/")}
          aria-label="返回图库"
        >
          × <span>返回图库</span>
        </a>
        <span class="preview-counter">
          {detail()?.data.album_name ?? "Photo"}
        </span>
        <Show when={detail()?.data.url}>
          <a class="preview-download" href={detail()?.data.url ?? ""} download>
            下载原图
          </a>
        </Show>
      </header>
      <Show when={loading()}>
        <LoadingState />
      </Show>
      <Show when={!loading() && error()}>
        <div class="preview-error">
          <h1>找不到这张照片</h1>
          <p>{error()}</p>
          <a class="primary-button" href="/">
            返回图库
          </a>
        </div>
      </Show>
      <Show when={!loading() && detail()}>
        {(payload) => {
          const current = () => payload().data;
          const source = () => current().preview_url || current().url;
          return (
            <main class="preview-layout">
              <section class="preview-stage">
                <Show
                  when={current().type !== 2}
                  fallback={
                    <video
                      class="preview-media"
                      src={current().video_url ?? current().url ?? ""}
                      poster={current().preview_url ?? undefined}
                      controls
                      autoplay
                      muted
                      loop
                    />
                  }
                >
                  <Show when={source()} fallback={<div class="preview-no-image">NO IMAGE</div>}>
                    <img
                      class="preview-media"
                      src={source() ?? ""}
                      alt={current().title ?? current().image_name ?? ""}
                    />
                  </Show>
                </Show>
                <Show when={payload().neighbors.previous}>
                  {(previous) => (
                    <a
                      class="preview-arrow previous"
                      href={`/preview/${encodeURIComponent(previous().id)}`}
                      aria-label="上一张"
                    >
                      ‹
                    </a>
                  )}
                </Show>
                <Show when={payload().neighbors.next}>
                  {(next) => (
                    <a
                      class="preview-arrow next"
                      href={`/preview/${encodeURIComponent(next().id)}`}
                      aria-label="下一张"
                    >
                      ›
                    </a>
                  )}
                </Show>
              </section>
              <aside class="preview-inspector">
                <div class="eyebrow">PHOTO / DETAIL</div>
                <h1>{current().title || current().image_name || "未命名照片"}</h1>
                <Show when={current().detail}>
                  <p class="preview-detail">{current().detail}</p>
                </Show>
                <div class="preview-facts">
                  <PreviewFact label="尺寸" value={`${current().width} × ${current().height}`} />
                  <PreviewFact label="相册" value={current().album_name ?? "首页"} />
                  <PreviewFact label="相机" value={exifField(current(), "make", "model")} />
                  <PreviewFact label="镜头" value={exifField(current(), "lens_model")} />
                  <PreviewFact label="光圈" value={exifField(current(), "f_number")} />
                  <PreviewFact label="快门" value={exifField(current(), "exposure_time")} />
                  <PreviewFact label="ISO" value={exifField(current(), "iso_speed_rating")} />
                  <PreviewFact label="焦段" value={exifField(current(), "focal_length")} />
                </div>
                <Show when={labelsOf(current()).length > 0}>
                  <div class="preview-tags">
                    <span class="fact-label">标签</span>
                    <div>
                      <For each={labelsOf(current())}>{(label) => <span>{label}</span>}</For>
                    </div>
                  </div>
                </Show>
                <button
                  class="copy-link"
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                  }}
                >
                  复制分享链接
                </button>
              </aside>
            </main>
          );
        }}
      </Show>
    </div>
  );
}

function PreviewFact(props: { label: string; value: string | null }) {
  return (
    <Show when={props.value}>
      <div class="preview-fact">
        <span>{props.label}</span>
        <strong>{props.value}</strong>
      </div>
    </Show>
  );
}

function exifField(photo: Photo, ...keys: string[]) {
  const exif = photo.exif;
  if (!exif || typeof exif !== "object") return null;
  for (const key of keys) {
    const value = exif[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function exifSummary(photo: Photo) {
  return [
    exifField(photo, "make", "model"),
    exifField(photo, "f_number"),
    exifField(photo, "focal_length"),
  ]
    .filter(Boolean)
    .join(" · ");
}

function labelsOf(photo: Photo) {
  return Array.isArray(photo.labels)
    ? photo.labels.filter((label): label is string => typeof label === "string")
    : [];
}

function SummaryMetric(props: { label: string; value: number; detail: string }) {
  return (
    <div class="summary-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.detail}</small>
    </div>
  );
}

function PreviewMetric(props: { label: string; value: number }) {
  return (
    <div class="preview-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function EmptyState(props: { title: string; detail: string }) {
  return (
    <div class="empty-state">
      <span class="empty-line" aria-hidden="true" />
      <h3>{props.title}</h3>
      <p>{props.detail}</p>
    </div>
  );
}

function App() {
  const route = getRoute();
  if (route.kind === "admin") return <AdminApp />;
  if (route.kind === "preview") return <PublicPreview id={route.id} />;
  return <PublicHome album={route.album} />;
}

export default App;
