import { Button } from "@ui-sdk/solid/button";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/solid/toast";
import { animate } from "motion";
import { For, Show, createEffect, createSignal } from "solid-js";

import { LoadingState, NavIcon, ToolbarIcon } from "./admin/shared";
import { getJson } from "./api";
import { LoginScreen } from "./LoginScreen";
import { PublicHome } from "./public/HomeView";
import { PublicPreview } from "./public/PreviewView";
import type { Album, Config, Dashboard, View } from "./types";
import { AlbumsView } from "./views/AlbumsView";
import { ConfigView, StorageConfigView } from "./views/ConfigView";
import { DashboardView } from "./views/DashboardView";
import { PhotosView } from "./views/PhotosView";
import { UploadView } from "./views/UploadView";

const moduleLabels: Record<View, string> = {
  dashboard: "概览",
  upload: "上传图片",
  photos: "图片管理",
  albums: "相册",
  storage: "存储配置",
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

function AdminApp() {
  const [view, setView] = createSignal<View>("dashboard");
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [configs, setConfigs] = createSignal<Config[]>([]);
  const [dashboard, setDashboard] = createSignal<Dashboard | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [authReady, setAuthReady] = createSignal(false);
  const [authConfigured, setAuthConfigured] = createSignal(false);
  const [authenticated, setAuthenticated] = createSignal(false);
  const [registrationOpen, setRegistrationOpen] = createSignal(false);
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [uploadSaveApi, setUploadSaveApi] = createSignal<{
    save: () => Promise<void>;
    ready: () => boolean;
    hint: () => string;
  } | null>(null);
  const [albumFormApi, setAlbumFormApi] = createSignal<{ open: () => void } | null>(null);

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

  async function refreshDashboard() {
    try {
      const response = await getJson<{ data: Dashboard }>("/api/admin/dashboard");
      setDashboard(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "概览刷新失败");
    }
  }

  async function refreshAlbums() {
    const response = await getJson<{ data: Album[] }>("/api/albums");
    setAlbums(response.data);
    void refreshDashboard();
    return response.data;
  }

  async function loadSession() {
    try {
      const response = await getJson<{
        configured: boolean;
        authenticated: boolean;
        registrationOpen: boolean;
      }>("/api/session");
      setAuthConfigured(response.configured);
      setAuthenticated(response.authenticated);
      setRegistrationOpen(response.registrationOpen);
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
    const { data } = (await response.json()) as { data: Config[] };
    setConfigs((previous) => {
      const updated = new Map(previous.map((config) => [config.config_key, config]));
      for (const config of data) updated.set(config.config_key, config);
      return [...updated.values()];
    });
    setError(null);
    setNotice("存储配置已保存");
    return true;
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
            registrationOpen={registrationOpen()}
            onRegistrationClosed={() => setRegistrationOpen(false)}
            onAuthenticated={() => {
              setRegistrationOpen(false);
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
              <Show when={view() === "albums" && albumFormApi()}>
                <Button
                  class="primary-button"
                  type="button"
                  onClick={() => albumFormApi()!.open()}
                >
                  新建相册
                </Button>
              </Show>
              <Show when={view() === "upload" && uploadSaveApi()}>
                <span class="toolbar-hint">{uploadSaveApi()!.hint()}</span>
                <Button
                  class="primary-button"
                  type="button"
                  disabled={!uploadSaveApi()!.ready()}
                  onClick={() => uploadSaveApi()!.save()}
                  pendingAnnouncement="保存中"
                >
                  <span data-show="idle">保存</span>
                  <span data-show="pending">保存中…</span>
                </Button>
              </Show>
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
                <Show when={view() === "dashboard"}>
                  <DashboardView dashboard={dashboard()} />
                </Show>
                <Show when={view() === "upload"}>
                  <UploadView
                    albums={albums()}
                    onChanged={refreshDashboard}
                    registerSave={setUploadSaveApi}
                  />
                </Show>
                <Show when={view() === "photos"}>
                  <PhotosView albums={albums()} onChanged={refresh} />
                </Show>
                <Show when={view() === "albums"}>
                  <AlbumsView
                    albums={albums()}
                    onChanged={refreshAlbums}
                    registerAction={setAlbumFormApi}
                  />
                </Show>
                <Show when={view() === "storage"}>
                  <StorageConfigView configs={configs()} onSaveStorage={saveStorageConfig} />
                </Show>
                <Show when={view() === "config"}>
                  <ConfigView />
                </Show>
              </Show>
            </div>
          </div>
        </main>
      </Show>
    </div>
  );
}

function App() {
  const route = getRoute();
  const content =
    route.kind === "admin" ? (
      <AdminApp />
    ) : route.kind === "preview" ? (
      <PublicPreview id={route.id} />
    ) : (
      <PublicHome album={route.album} />
    );
  return (
    <>
      {content}
      <ToastRegion side="bottom" align="end" aria-label="通知">
        {(item) => (
          <Toast>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              data-show="success"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m16 9-5.5 5.5L8 12" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              data-show="error"
              aria-hidden="true"
            >
              <path d="m15 9-6 6" />
              <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" />
              <path d="m9 9 6 6" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              data-show="loading"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <div data-slot="stack">
              <ToastTitle />
              <ToastDescription />
            </div>
            <Show when={item.action}>
              <ToastAction data-variant="solid" />
            </Show>
            <ToastClose aria-label="关闭">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </ToastClose>
          </Toast>
        )}
      </ToastRegion>
    </>
  );
}

export default App;
