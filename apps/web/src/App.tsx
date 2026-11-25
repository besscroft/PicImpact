import { Button } from "@ui-sdk/solid/button";
import { animate } from "motion";
import { For, Show, createMemo, createEffect, createSignal } from "solid-js";

import { LoginScreen } from "./LoginScreen";

type View = "photos" | "albums" | "config";
type Photo = {
  id: string;
  image_name: string | null;
  url: string | null;
  preview_url: string | null;
  width: number;
  height: number;
  title: string | null;
  detail: string | null;
  show: number;
};
type Album = {
  album_value: string;
  name: string;
  detail: string | null;
  show: number;
  sort: number;
};
type Config = {
  config_key: string;
  config_value: string | null;
  detail: string | null;
};

const moduleLabels: Record<View, string> = {
  photos: "Photos",
  albums: "相册",
  config: "配置",
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }
  return response.json() as Promise<T>;
}

function App() {
  const [view, setView] = createSignal<View>("photos");
  const [photos, setPhotos] = createSignal<Photo[]>([]);
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [configs, setConfigs] = createSignal<Config[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [importPreview, setImportPreview] = createSignal<{
    counts: Record<string, number>;
    warnings: string[];
    issues: { path: string; message: string }[];
  } | null>(null);
  const [importPayload, setImportPayload] = createSignal<unknown>(null);
  const [configKey, setConfigKey] = createSignal("");
  const [configValue, setConfigValue] = createSignal("");
  const [authReady, setAuthReady] = createSignal(false);
  const [authConfigured, setAuthConfigured] = createSignal(false);
  const [authenticated, setAuthenticated] = createSignal(false);

  const activeLabel = createMemo(() => moduleLabels[view()]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [photoResponse, albumResponse, configResponse] = await Promise.all([
        getJson<{ data: Photo[] }>("/api/photos"),
        getJson<{ data: Album[] }>("/api/albums"),
        getJson<{ data: Config[] }>("/api/config"),
      ]);
      setPhotos(photoResponse.data);
      setAlbums(albumResponse.data);
      setConfigs(configResponse.data);
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

  async function saveConfig() {
    if (!configKey().trim()) return;
    const response = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_key: configKey().trim(),
        config_value: configValue(),
      }),
    });
    if (!response.ok) {
      setError("配置保存失败");
      return;
    }
    setConfigKey("");
    setConfigValue("");
    setNotice("配置已保存");
    await refresh();
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
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-block">
          <div class="brand-mark" aria-hidden="true">
            P
          </div>
          <div>
            <div class="brand-name">PicImpact</div>
            <div class="brand-caption">Web rewrite / v4 foundation</div>
          </div>
        </div>
        <Show when={!authConfigured() || authenticated()}>
          <div class="topbar-actions">
            <a class="quiet-link" href="/api/health" target="_blank" rel="noreferrer">
              API health
            </a>
            <a class="quiet-link" href="/api/backup/export">
              导出备份
            </a>
            <Show when={authConfigured()}>
              <button class="quiet-link quiet-button" type="button" onClick={signOut}>
                退出登录
              </button>
            </Show>
          </div>
        </Show>
      </header>

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
          <aside class="sidebar" aria-label="业务模块">
            <div class="sidebar-heading">Workspace</div>
            <nav class="module-nav">
              <For each={Object.keys(moduleLabels) as View[]}>
                {(item) => (
                  <button
                    type="button"
                    class={`module-link${view() === item ? " active" : ""}`}
                    onClick={() => setView(item)}
                  >
                    <span class="module-dot" aria-hidden="true" />
                    <span>{moduleLabels[item]}</span>
                  </button>
                )}
              </For>
            </nav>
            <div class="sidebar-footer">
              <span class="status-dot" aria-hidden="true" />
              <span>Storage ready</span>
            </div>
          </aside>

          <section class="content">
            <div class="page-heading">
              <div>
                <div class="eyebrow">PICIMPACT / ADMIN</div>
                <h1>{activeLabel()}</h1>
                <p>保留 v3 数据模型，给新的运行时一个更轻的管理面。</p>
              </div>
              <Button class="primary-button" onClick={() => refresh()} pendingAnnouncement="刷新中">
                <span data-show="idle">刷新数据</span>
                <span data-show="pending">刷新中…</span>
              </Button>
            </div>

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
                <PhotosView photos={photos()} onUploaded={() => refresh()} />
              </Show>
              <Show when={view() === "albums"}>
                <AlbumsView albums={albums()} />
              </Show>
              <Show when={view() === "config"}>
                <ConfigView
                  configs={configs()}
                  configKey={configKey()}
                  configValue={configValue()}
                  onKey={setConfigKey}
                  onValue={setConfigValue}
                  onSave={saveConfig}
                />
              </Show>
            </Show>

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
          </section>
        </main>
      </Show>
    </div>
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

function PhotosView(props: { photos: Photo[]; onUploaded: () => Promise<void> }) {
  return (
    <section class="content-grid">
      <div class="summary-row">
        <SummaryMetric label="总照片" value={props.photos.length} detail="数据库记录" />
        <SummaryMetric
          label="可见"
          value={props.photos.filter((photo) => photo.show === 1).length}
          detail="show = 1"
        />
        <SummaryMetric
          label="已归档"
          value={props.photos.filter((photo) => photo.show === 0).length}
          detail="show = 0"
        />
      </div>
      <PhotoUpload onUploaded={props.onUploaded} />
      <div class="table-shell">
        <div class="table-heading">
          <span>Photo index</span>
          <span>{props.photos.length} records</span>
        </div>
        <Show
          when={props.photos.length > 0}
          fallback={
            <EmptyState title="还没有照片" detail="导入 v3 备份或通过 API 写入第一条记录。" />
          }
        >
          <div class="photo-list">
            <For each={props.photos}>
              {(photo) => (
                <div class="photo-row">
                  <div class="photo-thumb">
                    <Show when={photo.preview_url ?? photo.url} fallback={<span>NO IMAGE</span>}>
                      <img src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    </Show>
                  </div>
                  <div class="photo-meta">
                    <strong>{photo.title || photo.image_name || photo.id}</strong>
                    <span>
                      {photo.width} × {photo.height} · {photo.id}
                    </span>
                  </div>
                  <span class={`row-status${photo.show !== 1 ? " hidden" : ""}`}>
                    {photo.show === 1 ? "visible" : "hidden"}
                  </span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}

function PhotoUpload(props: { onUploaded: () => Promise<void> }) {
  const [file, setFile] = createSignal<File | null>(null);
  const [title, setTitle] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const [message, setMessage] = createSignal<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!file()) return;
    setPending(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file()!);
    formData.set("title", title());
    try {
      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(body?.message ?? "上传失败");
      }
      setFile(null);
      setTitle("");
      setMessage("照片已上传");
      await props.onUploaded();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <form class="upload-strip" onSubmit={submit}>
      <div class="upload-copy">
        <div class="eyebrow">ADD PHOTO</div>
        <strong>上传一张新照片</strong>
        <span>{file()?.name ?? "支持图片或视频，单文件默认最大 25 MB"}</span>
      </div>
      <input
        class="upload-title"
        value={title()}
        placeholder="可选标题"
        onInput={(event) => setTitle(event.currentTarget.value)}
      />
      <label class="file-button">
        选择文件
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
        />
      </label>
      <Button class="primary-button" type="submit" disabled={!file() || pending()}>
        {pending() ? "上传中…" : "上传"}
      </Button>
      <Show when={message()}>
        <span class="upload-message" role="status">
          {message()}
        </span>
      </Show>
    </form>
  );
}

function AlbumsView(props: { albums: Album[] }) {
  return (
    <section class="content-grid">
      <div class="summary-row">
        <SummaryMetric label="相册" value={props.albums.length} detail="v3 album_value" />
        <SummaryMetric
          label="展示中"
          value={props.albums.filter((album) => album.show === 1).length}
          detail="show = 1"
        />
      </div>
      <div class="table-shell">
        <div class="table-heading">
          <span>Album index</span>
          <span>{props.albums.length} records</span>
        </div>
        <Show
          when={props.albums.length > 0}
          fallback={
            <EmptyState title="还没有相册" detail="导入备份后，旧相册会保持原有 album_value。" />
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
                  <span class={`row-status${album.show !== 1 ? " hidden" : ""}`}>
                    {album.show === 1 ? "visible" : "hidden"}
                  </span>
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}

function ConfigView(props: {
  configs: Config[];
  configKey: string;
  configValue: string;
  onKey: (value: string) => void;
  onValue: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section class="content-grid">
      <div class="table-shell">
        <div class="table-heading">
          <span>Config registry</span>
          <span>{props.configs.length} records</span>
        </div>
        <Show
          when={props.configs.length > 0}
          fallback={<EmptyState title="还没有配置" detail="用下面的表单创建第一条配置。" />}
        >
          <div class="config-list">
            <For each={props.configs}>
              {(config) => (
                <div class="config-row">
                  <strong>{config.config_key}</strong>
                  <span>{config.config_value || "—"}</span>
                  <small>{config.detail || "No description"}</small>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      <form
        class="config-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSave();
        }}
      >
        <div class="eyebrow">ADD OR UPDATE</div>
        <label>
          Key
          <input
            value={props.configKey}
            placeholder="site_title"
            onInput={(event) => props.onKey(event.currentTarget.value)}
          />
        </label>
        <label>
          Value
          <textarea
            value={props.configValue}
            placeholder="PicImpact"
            rows="4"
            onInput={(event) => props.onValue(event.currentTarget.value)}
          />
        </label>
        <Button class="primary-button" type="submit">
          保存配置
        </Button>
      </form>
      <div class="storage-config-note">
        <div class="eyebrow">OBJECT STORAGE</div>
        <h3>存储配置也写入这里</h3>
        <p>
          不要把对象存储密钥放进环境变量。逐项保存下面的配置键，修改后下一次上传请求会读取新配置。
        </p>
        <div class="storage-key-list">
          <code>storage.driver = memory | s3 | r2</code>
          <code>storage.endpoint</code>
          <code>storage.region</code>
          <code>storage.bucket</code>
          <code>storage.access_key_id</code>
          <code>storage.secret_access_key</code>
          <code>storage.public_url</code>
          <code>storage.max_upload_bytes</code>
        </div>
      </div>
    </section>
  );
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

export default App;
