import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/solid/toast";
import { animate } from "motion";
import { Show, createEffect, createSignal } from "solid-js";

import {
  AdminLayout,
  adminPathForView,
  adminViewFromPath,
  type UploadSaveApi,
} from "./admin/AdminLayout";
import { LoadingState, errorBanner, noticeBanner } from "./admin/shared";
import { getJson } from "./api";
import { LoginScreen } from "./LoginScreen";
import { PublicHome } from "./public/HomeView";
import { PublicPreview } from "./public/PreviewView";
import { type AuthUser, type AuthSessionInfo } from "./auth-client";
import type { Album, Config, Dashboard, View } from "./types";
import { AccountView } from "./views/AccountView";
import { AlbumsView } from "./views/AlbumsView";
import { ConfigView, StorageConfigView } from "./views/ConfigView";
import { DashboardView } from "./views/DashboardView";
import { PhotosView } from "./views/PhotosView";
import { UploadView } from "./views/UploadView";

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
  // 初始视图来自 URL，深链 /admin/<view> 可直达对应页面
  const [view, setView] = createSignal<View>(
    adminViewFromPath(window.location.pathname) ?? "dashboard",
  );
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
  const [user, setUser] = createSignal<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [uploadSaveApi, setUploadSaveApi] = createSignal<UploadSaveApi | null>(null);
  const [albumFormApi, setAlbumFormApi] = createSignal<{ open: () => void } | null>(null);

  async function refresh(options: { silent?: boolean } = {}) {
    // silent：数据静默更新，不触发全页骨架屏（用于开关切换等局部变更后的同步）
    if (!options.silent) setLoading(true);
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
        session: { user: AuthUser } | AuthSessionInfo | null;
      }>("/api/session");
      setAuthConfigured(response.configured);
      setAuthenticated(response.authenticated);
      setRegistrationOpen(response.registrationOpen);
      // better-auth 的 get-session 返回 { user, session }，这里取 user 供侧栏与账户设置使用
      const sessionUser = (
        response.session as { user?: AuthUser } | null
      )?.user;
      setUser(sessionUser ?? null);
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

  /* 菜单导航写入 URL，每个菜单页面即一个路由；同视图重复点击不新增历史记录 */
  function navigate(next: View) {
    if (view() === next) return;
    history.pushState(null, "", adminPathForView(next));
    setView(next);
  }

  createEffect(
    () => true,
    () => {
      animate(".app-shell", { opacity: [0, 1], y: [12, 0] }, { duration: 0.45 });
      void loadSession();
      // 非规范路径（/admin/dashboard、未知子段等）归一化到当前视图的规范地址
      if (window.location.pathname !== adminPathForView(view())) {
        history.replaceState(null, "", adminPathForView(view()));
      }
      // 浏览器前进/后退时按 URL 切回对应视图
      window.addEventListener("popstate", () => {
        const next = adminViewFromPath(window.location.pathname) ?? "dashboard";
        setView(next);
        if (window.location.pathname !== adminPathForView(next)) {
          history.replaceState(null, "", adminPathForView(next));
        }
      });
    },
  );

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
        <AdminLayout
          view={view}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen())}
          user={user}
          authConfigured={authConfigured}
          onNavigate={navigate}
          onSignOut={signOut}
          uploadSaveApi={uploadSaveApi}
          albumFormApi={albumFormApi}
        >
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
              <PhotosView albums={albums()} onChanged={() => refresh({ silent: true })} />
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
            <Show when={view() === "account"}>
              <AccountView
                user={user()}
                onUserNameChange={(name) =>
                  setUser((previous) => (previous ? { ...previous, name } : previous))
                }
              />
            </Show>
          </Show>
        </AdminLayout>
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
