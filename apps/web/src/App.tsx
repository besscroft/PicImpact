import { Button } from "@ui-sdk/solid/button";
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
                <Show when={view() === "dashboard"}>
                  <DashboardView dashboard={dashboard()} />
                </Show>
                <Show when={view() === "upload"}>
                  <UploadView
                    albums={albums()}
                    onChanged={refreshDashboard}
                    onGoManage={() => setView("photos")}
                  />
                </Show>
                <Show when={view() === "photos"}>
                  <PhotosView albums={albums()} onChanged={refresh} />
                </Show>
                <Show when={view() === "albums"}>
                  <AlbumsView albums={albums()} onChanged={refresh} />
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
  if (route.kind === "admin") return <AdminApp />;
  if (route.kind === "preview") return <PublicPreview id={route.id} />;
  return <PublicHome album={route.album} />;
}

export default App;
