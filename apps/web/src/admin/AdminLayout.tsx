import { Button } from "@ui-sdk/solid/button";
import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import type { AuthUser } from "../auth-client";
import { siteConfig } from "../site";
import type { View } from "../types";
import { NavIcon, ToolbarIcon, btnPrimary, rowAction } from "./shared";

/* 菜单数据：View 既是路由段也是菜单文案的单一来源 */
export const moduleLabels: Record<View, string> = {
  dashboard: "概览",
  upload: "上传图片",
  photos: "图片管理",
  albums: "相册",
  storage: "存储配置",
  config: "配置",
  account: "账户设置",
};

export type UploadSaveApi = {
  save: () => Promise<void>;
  ready: () => boolean;
  hint: () => string;
};

/* 解析 /admin 与 /admin/<view>；非规范路径（未知子段、/admin/dashboard 等）返回 null，由调用方归一化 */
export function adminViewFromPath(pathname: string): View | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (!pathname.startsWith("/admin/")) return null;
  const segment = decodeURIComponent(pathname.slice("/admin/".length)).split("/")[0];
  if (segment === "dashboard") return null;
  return segment in moduleLabels ? (segment as View) : null;
}

export function adminPathForView(view: View): string {
  return view === "dashboard" ? "/admin" : `/admin/${view}`;
}

function moduleLinkCls(active: boolean, rail: boolean) {
  return `flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
    active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : ""
  }${rail ? " justify-center px-0" : ""}`;
}

/* 红框 1：侧边栏（Logo、菜单、回到首页、用户信息） */
function AdminSidebar(props: {
  view: () => View;
  rail: () => boolean;
  user: () => AuthUser | null;
  authConfigured: () => boolean;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}) {
  return (
    <aside
      class={`flex flex-col overflow-hidden border-r border-sidebar-border bg-sidebar pb-3.5 pt-3 transition-[width] duration-200 ${
        props.rail() ? "w-[58px] px-2" : "w-[232px] px-3"
      }`}
      aria-label="Admin sidebar"
    >
      <button
        class={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          props.rail() ? "justify-center px-0" : ""
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
          class={`overflow-hidden text-ellipsis whitespace-nowrap text-[0.93rem] font-bold tracking-wide text-foreground ${
            props.rail() ? "hidden" : ""
          }`}
        >
          {siteConfig().title}
        </span>
      </button>

      <div class="mt-4 grid gap-0.5">
        <div class={`px-2.5 pb-1 text-xs text-muted-foreground ${props.rail() ? "hidden" : ""}`}>
          菜单
        </div>
        <nav class="grid gap-0.5" aria-label="业务模块">
          <For each={Object.keys(moduleLabels) as View[]}>
            {(item) => (
              <button
                type="button"
                class={moduleLinkCls(props.view() === item, props.rail())}
                onClick={() => props.onNavigate(item)}
              >
                <NavIcon view={item} />
                <span
                  class={`overflow-hidden text-ellipsis whitespace-nowrap ${props.rail() ? "hidden" : ""}`}
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
          class={moduleLinkCls(false, props.rail())}
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <NavIcon view="home" />
          <span
            class={`overflow-hidden text-ellipsis whitespace-nowrap ${props.rail() ? "hidden" : ""}`}
          >
            回到首页
          </span>
        </button>
      </div>

      <div
        class={`mt-3 flex items-center gap-2.5 border-t border-sidebar-border pt-3 ${
          props.rail() ? "justify-center px-0" : "px-2"
        }`}
      >
        <span
          class="grid size-[30px] flex-none place-items-center rounded-full bg-sidebar-accent text-xs font-medium text-foreground"
          aria-hidden="true"
        >
          P
        </span>
        <div class={`grid min-w-0 leading-tight ${props.rail() ? "hidden" : ""}`}>
          <span class="truncate text-[0.82rem] font-semibold text-foreground">
            {props.user()?.name || props.user()?.username || "admin"}
          </span>
          <span class="truncate text-[0.7rem] text-muted-foreground">PicImpact v4</span>
        </div>
        <Show when={props.authConfigured() && !props.rail()}>
          <button
            class={`ml-auto text-xs text-muted-foreground hover:text-foreground ${rowAction}`}
            type="button"
            onClick={props.onSignOut}
          >
            退出
          </button>
        </Show>
      </div>
    </aside>
  );
}

/* 红框 2：顶栏（折叠触发 + 视图上下文操作） */
function AdminHeader(props: {
  view: () => View;
  onToggleSidebar: () => void;
  uploadSaveApi: () => UploadSaveApi | null;
  albumFormApi: () => { open: () => void } | null;
}) {
  return (
    <header class="flex items-center gap-3.5 px-4 pb-2 pt-3.5">
      <button
        class="grid size-[34px] cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        type="button"
        aria-label="切换侧栏"
        onClick={props.onToggleSidebar}
      >
        <ToolbarIcon />
      </button>
      <div class="flex-1" />
      <Show when={props.view() === "albums" && props.albumFormApi()}>
        <Button class={btnPrimary} type="button" onClick={() => props.albumFormApi()!.open()}>
          新建相册
        </Button>
      </Show>
      <Show when={props.view() === "upload" && props.uploadSaveApi()}>
        <span class="text-xs text-destructive">{props.uploadSaveApi()!.hint()}</span>
        <Button
          class={btnPrimary}
          type="button"
          disabled={!props.uploadSaveApi()!.ready()}
          onClick={() => props.uploadSaveApi()!.save()}
          pendingAnnouncement="保存中"
        >
          <span data-show="idle">保存</span>
          <span data-show="pending">保存中…</span>
        </Button>
      </Show>
    </header>
  );
}

/* 管理端基础布局框架：红框 1 侧边栏 + 红框 2 顶栏 + 红框 3 内容区（children） */
export function AdminLayout(props: {
  view: () => View;
  sidebarOpen: () => boolean;
  onToggleSidebar: () => void;
  user: () => AuthUser | null;
  authConfigured: () => boolean;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  uploadSaveApi: () => UploadSaveApi | null;
  albumFormApi: () => { open: () => void } | null;
  children: JSX.Element;
}) {
  const rail = () => !props.sidebarOpen();
  return (
    <main class="grid h-dvh grid-cols-[auto_minmax(0,1fr)] overflow-hidden">
      <AdminSidebar
        view={props.view}
        rail={rail}
        user={props.user}
        authConfigured={props.authConfigured}
        onNavigate={props.onNavigate}
        onSignOut={props.onSignOut}
      />
      <div class="flex min-h-0 min-w-0 flex-col">
        <AdminHeader
          view={props.view}
          onToggleSidebar={props.onToggleSidebar}
          uploadSaveApi={props.uploadSaveApi}
          albumFormApi={props.albumFormApi}
        />
        {/* 红框 3：内容区 */}
        <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 pt-1">
          {props.children}
        </div>
      </div>
    </main>
  );
}
