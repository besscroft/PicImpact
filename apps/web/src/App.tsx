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

import {
  LoadingState,
  NavIcon,
  ToolbarIcon,
  btnPrimary,
  errorBanner,
  noticeBanner,
  rowAction,
} from "./admin/shared";
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

  const rail = () => !sidebarOpen();

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

  const moduleLink = (active: boolean) =>
    `flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
      active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : ""
    }${rail() ? " justify-center px-0" : ""}`;

  return (
    <div class="app-shell">
      <Show when={!authReady()}>
        <main class="grid min-h-dvh place-items-center px-[5vw] py-12">
          <LoadingState />
        </main>
      </Show>

      <Show when={authReady() && authConfigured() && !authenticated()}>
        <main class="grid min-h-dvh place-items-center px-[5vw] py-12">
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
        <main class="grid h-dvh grid-cols-[auto_minmax(0,1fr)] overflow-hidden">
          <aside
            class={`flex flex-col overflow-hidden border-r border-sidebar-border bg-sidebar pb-3.5 pt-3 transition-[width] duration-200 ${
              rail() ? "w-[58px] px-2" : "w-[232px] px-3"
            }`}
            aria-label="Admin sidebar"
          >
            <button
              class={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                rail() ? "justify-center px-0" : ""
              }`}
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <span
                class="grid size-8 flex-none place-items-center rounded-full border border-sidebar-border text-sm font-semibold text-foreground"
                aria-hidden="true"
              >
                P
              </span>
              <span
                class={`overflow-hidden whitespace-nowrap text-[0.93rem] font-bold tracking-wide text-foreground ${
                  rail() ? "hidden" : ""
                }`}
              >
                PicImpact
              </span>
            </button>

            <div class="mt-4 grid gap-0.5">
              <div
                class={`px-2.5 pb-1 text-xs text-muted-foreground ${rail() ? "hidden" : ""}`}
              >
                菜单
              </div>
              <nav class="grid gap-0.5" aria-label="业务模块">
                <For each={Object.keys(moduleLabels) as View[]}>
                  {(item) => (
                    <button
                      type="button"
                      class={moduleLink(view() === item)}
                      onClick={() => setView(item)}
                    >
                      <NavIcon view={item} />
                      <span
                        class={`overflow-hidden text-ellipsis whitespace-nowrap ${
                          rail() ? "hidden" : ""
                        }`}
                      >
                        {moduleLabels[item]}
                      </span>
                    </button>
                  )}
                </For>
              </nav>
            </div>

            <div class="mt-auto grid gap-0.5">
              <button
                class={moduleLink(false)}
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <NavIcon view="home" />
                <span
                  class={`overflow-hidden text-ellipsis whitespace-nowrap ${
                    rail() ? "hidden" : ""
                  }`}
                >
                  回到首页
                </span>
              </button>
            </div>

            <div
              class={`mt-3 flex items-center gap-2.5 border-t border-sidebar-border pt-3 ${
                rail() ? "justify-center px-0" : "px-2"
              }`}
            >
              <span
                class="grid size-[30px] flex-none place-items-center rounded-full bg-sidebar-accent text-xs font-medium text-foreground"
                aria-hidden="true"
              >
                P
              </span>
              <div class={`grid min-w-0 leading-tight ${rail() ? "hidden" : ""}`}>
                <span class="truncate text-[0.82rem] font-semibold text-foreground">admin</span>
                <span class="truncate text-[0.7rem] text-muted-foreground">PicImpact v4</span>
              </div>
              <Show when={authConfigured() && !rail()}>
                <button class={`ml-auto text-xs text-muted-foreground hover:text-foreground ${rowAction}`} type="button" onClick={signOut}>
                  退出
                </button>
              </Show>
            </div>
          </aside>

          <div class="flex min-w-0 min-h-0 flex-col">
            <header class="flex items-center gap-3.5 px-4 pb-2 pt-3.5">
              <button
                class="grid size-[34px] cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                type="button"
                aria-label="切换侧栏"
                onClick={() => setSidebarOpen(!sidebarOpen())}
              >
                <ToolbarIcon />
              </button>
              <div class="flex-1" />
              <Show when={view() === "albums" && albumFormApi()}>
                <Button class={btnPrimary} type="button" onClick={() => albumFormApi()!.open()}>
                  新建相册
                </Button>
              </Show>
              <Show when={view() === "upload" && uploadSaveApi()}>
                <span class="text-xs text-destructive">{uploadSaveApi()!.hint()}</span>
                <Button
                  class={btnPrimary}
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

            <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 pt-1">
              <Show when={notice()}>
                <div class={noticeBanner} role="status">
                  {notice()}
                </div>
              </Show>
              <Show when={error()}>
                <div class={`${errorBanner} mb-5`} role="alert">
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
