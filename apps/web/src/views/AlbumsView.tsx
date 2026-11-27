import { Button } from "@ui-sdk/solid/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@ui-sdk/solid/alert-dialog";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/solid/segmented-control";
import { Switch, SwitchThumb } from "@ui-sdk/solid/switch";
import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

import {
  EmptyState,
  SwitchRow,
  albumHref,
  btnDanger,
  btnOutline,
  btnPrimary,
  cardCls,
  dialogBackdropCls,
  errorBanner,
  fieldCls,
  focusRing,
  inputCls,
  labelCls,
  badgeSecondary,
  selectCls,
  segmentedItemCls,
  segmentedTrackCls,
  switchCls,
  switchThumbCls,
} from "../admin/shared";
import type { AdminPhotoPage, Album } from "../types";
import { getAlbumWorkspace, type AlbumFilter } from "./album-workspace";

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

const FILTERS: { value: AlbumFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "public", label: "公开" },
  { value: "hidden", label: "隐藏" },
];

const textActionCls = `inline-flex min-h-[30px] cursor-pointer items-center bg-transparent px-0 py-0.5 text-[0.82rem] transition-colors hover:underline hover:underline-offset-4 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${focusRing}`;

export function AlbumsView(props: {
  albums: Album[];
  onChanged: () => Promise<Album[]>;
  registerAction?: (api: { open: () => void } | null) => void;
}) {
  const [query, setQuery] = createSignal("");
  const [filter, setFilter] = createSignal<AlbumFilter>("all");
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [editor, setEditor] = createSignal<{ album: Album | null } | null>(null);
  const [deleting, setDeleting] = createSignal<Album | null>(null);
  const [deletePending, setDeletePending] = createSignal(false);
  const [togglingId, setTogglingId] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal("");
  const workspace = createMemo(() =>
    getAlbumWorkspace(props.albums, query(), filter(), selectedId()),
  );
  const busy = () => Boolean(editor() || togglingId() || deleting());
  let inspector!: HTMLElement;
  let list!: HTMLElement;

  createEffect(
    () => true,
    () => {
      props.registerAction?.({
        open: () => {
          if (editor()) {
            inspector.querySelector<HTMLInputElement>("input")?.focus();
            return;
          }
          if (!busy()) openEditor(null);
        },
      });
    },
  );

  onCleanup(() => {
    props.registerAction?.(null);
  });

  function openEditor(album: Album | null) {
    setError(null);
    setNotice("");
    setEditor({ album });
  }

  function selectAlbum(album: Album) {
    setSelectedId(album.id);
    setError(null);
    if (inspector.offsetTop >= list.offsetTop + list.offsetHeight) {
      inspector.focus();
    }
  }

  async function reloadAfterChange() {
    try {
      return await props.onChanged();
    } catch {
      setError("更改已保存，但相册列表刷新失败。请重新加载页面。");
    }
  }

  async function onSaved(path: string, album: Album | null) {
    const updated = await reloadAfterChange();
    const saved = updated?.find((item) =>
      album ? item.id === album.id : item.album_value === path,
    );
    if (saved) {
      if (getAlbumWorkspace([saved], query(), filter(), saved.id).rows.length === 0) {
        setQuery("");
        setFilter("all");
      }
      setSelectedId(saved.id);
    }
    setNotice(album ? "相册已保存" : "相册已新建");
    setEditor(null);
    queueMicrotask(() => inspector.focus());
  }

  async function toggleShow(album: Album) {
    if (busy()) return;
    setTogglingId(album.id);
    setError(null);
    setNotice("");
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}/show`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: album.show === 0 ? 1 : 0 }),
      });
      if (!response.ok) throw new Error("更新失败");
      await reloadAfterChange();
      setNotice(album.show === 0 ? "相册已隐藏" : "相册已公开");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新失败");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    const album = deleting();
    if (!album || deletePending()) return;
    setDeletePending(true);
    setError(null);
    setNotice("");
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("删除失败");
      await reloadAfterChange();
      setDeleting(null);
      setNotice("相册已删除");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <section class="@container flex min-h-full flex-col" aria-label="相册管理">
      <Show when={error() && !deleting()}>
        <p class={`${errorBanner} mb-3`} role="alert">
          {error()}
        </p>
      </Show>
      <Show when={notice()}>
        <p class="mb-3 text-sm text-foreground" role="status">
          {notice()}
        </p>
      </Show>
      <div class="grid flex-1 grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4 @max-[680px]:grid-cols-1 @max-[680px]:content-start">
        <section class={`${cardCls} flex min-w-0 flex-col overflow-clip`} aria-label="相册列表" ref={list}>
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 @max-[350px]:grid @max-[350px]:grid-cols-1">
            <SegmentedControl
              class={segmentedTrackCls}
              aria-label="前台展示筛选"
              value={filter()}
              disabled={busy()}
              onValueChange={(next) => {
                if (next) setFilter(next as AlbumFilter);
              }}
            >
              <SegmentedControlIndicator />
              <For each={FILTERS}>
                {(item) => (
                  <SegmentedControlItem class={segmentedItemCls} value={item.value}>
                    {item.label}
                  </SegmentedControlItem>
                )}
              </For>
            </SegmentedControl>
            <label class="flex min-w-[142px] flex-[0_1_194px] items-center gap-1.5 rounded-lg border border-input px-2 text-muted-foreground transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <svg
                class="size-4 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                class="w-full min-w-0 border-0 bg-transparent py-0.5 text-[0.8rem] text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="搜索名称或路径"
                placeholder="搜索名称或路径"
                value={query()}
                disabled={busy()}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
            </label>
          </div>
          <Show
            when={workspace().rows.length}
            fallback={
              <EmptyState
                title={props.albums.length ? "没有匹配的相册" : "还没有相册"}
                detail={
                  props.albums.length
                    ? "试试其他关键词或切换筛选条件。"
                    : "点击「新建相册」创建第一个相册。"
                }
              />
            }
          >
            <div class="max-h-[min(52vh,520px)] overflow-auto @max-[680px]:max-h-[min(42vh,440px)]">
              <table class="w-full table-fixed border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th scope="col" class="sticky top-0 z-[1] border-b border-border bg-muted/50 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      相册名
                    </th>
                    <th scope="col" class="sticky top-0 z-[1] w-[28%] border-b border-border bg-muted/50 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      路径
                    </th>
                    <th scope="col" class="sticky top-0 z-[1] w-32 border-b border-border bg-muted/50 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      主题
                    </th>
                    <th scope="col" class="sticky top-0 z-[1] w-[108px] border-b border-border bg-muted/50 px-2.5 py-2 text-left text-xs font-medium text-muted-foreground @max-[350px]:w-[75px] @max-[350px]:px-1">
                      公开状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={workspace().rows}>
                    {(album) => (
                      <tr
                        class="transition-colors hover:bg-muted/50 data-current:bg-sidebar-accent data-current:shadow-[inset_2px_0_0_var(--primary)]"
                        data-current={workspace().selected?.id === album.id ? "" : undefined}
                      >
                        <td>
                          <button
                            class="grid min-h-14 w-full cursor-pointer content-center gap-0.5 px-3 py-2 text-left text-[0.9rem] font-semibold text-foreground focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
                            type="button"
                            aria-current={
                              workspace().selected?.id === album.id ? "true" : undefined
                            }
                            disabled={busy()}
                            onClick={() => selectAlbum(album)}
                          >
                            <span class="[overflow-wrap:anywhere]">{album.name}</span>
                          </button>
                        </td>
                        <td class="border-b border-border px-3 py-2 text-[0.82rem] text-muted-foreground">
                          <span class="font-mono text-xs [overflow-wrap:anywhere]">{albumHref(album.album_value)}</span>
                        </td>
                        <td class="border-b border-border px-3 py-2 text-[0.82rem] text-muted-foreground">
                          <span class={`${badgeSecondary} max-w-full truncate`}>
                            {THEME_OPTIONS.find((item) => item.value === album.theme)?.label ??
                              "默认样式"}
                          </span>
                        </td>
                        <td>
                          <AlbumStatusToggle
                            album={album}
                            busy={busy()}
                            onToggle={() => void toggleShow(album)}
                          />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
          <footer class="mt-auto flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs text-muted-foreground">
            <span>
              {workspace().rows.length === props.albums.length
                ? `共 ${props.albums.length} 个相册`
                : `显示 ${workspace().rows.length} 个，共 ${props.albums.length} 个`}
            </span>
            <span>按相册顺序排列</span>
          </footer>
        </section>
        <aside
          class={`${cardCls} flex min-w-0 flex-col focus-visible:outline-none`}
          aria-label="相册详情"
          tabindex={-1}
          ref={inspector}
        >
          <Show
            when={editor()}
            keyed
            fallback={
              <Show
                when={workspace().selected}
                fallback={<p class="p-4.5 text-[0.85rem] text-muted-foreground">相册详情将在这里显示。</p>}
              >
                {(album) => (
                  <AlbumDetails
                    album={album()}
                    busy={busy()}
                    onEdit={() => openEditor(album())}
                    onToggle={() => void toggleShow(album())}
                    onDelete={() => {
                      setError(null);
                      setDeleting(album());
                    }}
                  />
                )}
              </Show>
            }
          >
            {(current) => (
              <AlbumEditor
                album={current.album}
                albums={props.albums}
                onClose={() => {
                  setEditor(null);
                  queueMicrotask(() =>
                    inspector.querySelector<HTMLButtonElement>(".album-edit")?.focus(),
                  );
                }}
                onSaved={(path) => onSaved(path, current.album)}
              />
            )}
          </Show>
        </aside>
      </div>
      <Show when={deleting()} keyed>
        {(album) => (
          <DeleteAlbumDialog
            album={album}
            pending={deletePending()}
            error={error()}
            onClose={() => {
              setDeleting(null);
              setError(null);
            }}
            onConfirm={confirmDelete}
          />
        )}
      </Show>
    </section>
  );
}

function AlbumStatus(props: { album: Album }) {
  const isPublic = () => props.album.show === 0;
  return (
    <span
      class={`inline-flex items-center gap-1.5 text-xs ${
        isPublic() ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span class={`size-1.5 rounded-full border border-current ${isPublic() ? "bg-current" : ""}`} />
      {isPublic() ? "公开" : "隐藏"}
    </span>
  );
}

function AlbumStatusToggle(props: { album: Album; busy: boolean; onToggle: () => void }) {
  const isPublic = () => props.album.show === 0;
  return (
    <label class="inline-flex items-center gap-2 text-xs">
      <Switch
        class={switchCls}
        checked={isPublic()}
        disabled={props.busy}
        onCheckedChange={() => props.onToggle()}
      >
        <SwitchThumb class={switchThumbCls} />
      </Switch>
      <span class={isPublic() ? "text-foreground" : "text-muted-foreground"}>
        {isPublic() ? "公开" : "隐藏"}
      </span>
    </label>
  );
}

function AlbumDetails(props: {
  album: Album;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [preview, setPreview] = createSignal<{ url: string; alt: string } | null>(null);
  const [previewFailed, setPreviewFailed] = createSignal(false);

  createEffect(
    () => props.album.album_value,
    (path) => {
      const controller = new AbortController();
      setPreview(null);
      setPreviewFailed(false);
      const params = new URLSearchParams({ album: path, pageSize: "1" });
      void fetch(`/api/photos?${params}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return;
          const { data } = (await response.json()) as AdminPhotoPage;
          const photo = data[0];
          const url = photo?.preview_url || photo?.url;
          if (url && !controller.signal.aborted) {
            setPreview({ url, alt: photo.title || `${props.album.name}中的照片` });
          }
        })
        .catch(() => undefined);
      onCleanup(() => controller.abort());
    },
  );

  return (
    <>
      <header class="border-b border-border px-4 py-3.5">
        <div class="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>相册详情</span>
          <AlbumStatus album={props.album} />
        </div>
        <h2 class="m-0 text-xl leading-tight font-semibold text-foreground [overflow-wrap:anywhere]">
          {props.album.name}
        </h2>
        <p class="mt-1 mb-0 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {albumHref(props.album.album_value)}
        </p>
      </header>
      <Show when={!previewFailed() && preview()}>
        {(photo) => (
          <img
            class="mx-4 mt-3 block h-[108px] w-[calc(100%-32px)] rounded-md object-cover"
            src={photo().url}
            alt={photo().alt}
            onError={() => setPreviewFailed(true)}
          />
        )}
      </Show>
      <section class="grid gap-1.5 border-b border-border px-4 py-3">
        <h3 class="m-0 text-[0.86rem] font-semibold text-foreground">简介</h3>
        <p class="m-0 text-[0.82rem] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {props.album.detail || "暂无简介"}
        </p>
      </section>
      <section class="grid gap-1.5 border-b border-border px-4 py-3">
        <h3 class="m-0 text-[0.86rem] font-semibold text-foreground">前台展示</h3>
        <dl class="m-0 grid gap-1.5 text-[0.81rem]">
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">显示状态</dt>
            <dd class="m-0 text-right [overflow-wrap:anywhere]">
              <button
                type="button"
                class={textActionCls}
                disabled={props.busy}
                onClick={props.onToggle}
              >
                {props.album.show === 0 ? "设为隐藏" : "设为公开"}
              </button>
            </dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">相册顺序</dt>
            <dd class="m-0 text-right tabular-nums [overflow-wrap:anywhere]">{props.album.sort}</dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">相册主题</dt>
            <dd class="m-0 text-right [overflow-wrap:anywhere]">
              {THEME_OPTIONS.find((item) => item.value === props.album.theme)?.label ?? "默认样式"}
            </dd>
          </div>
        </dl>
      </section>
      <section class="grid gap-1.5 border-b border-border px-4 py-3">
        <h3 class="m-0 text-[0.86rem] font-semibold text-foreground">图片设置</h3>
        <dl class="m-0 grid gap-1.5 text-[0.81rem]">
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">图片排序</dt>
            <dd class="m-0 text-right [overflow-wrap:anywhere]">
              {IMAGE_SORTING_OPTIONS.find((item) => item.value === props.album.image_sorting)
                ?.label ?? "未设置"}
            </dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">随机排序</dt>
            <dd class="m-0 text-right [overflow-wrap:anywhere]">{props.album.random_show === 0 ? "开启" : "关闭"}</dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <dt class="text-muted-foreground">许可协议</dt>
            <dd class="m-0 text-right [overflow-wrap:anywhere]">{props.album.license || "未设置"}</dd>
          </div>
        </dl>
      </section>
      <footer class="mt-auto flex flex-wrap items-center justify-end gap-2 px-4 py-3">
        <button
          class={`${textActionCls} mr-auto text-muted-foreground hover:text-destructive hover:no-underline`}
          type="button"
          disabled={props.busy}
          onClick={props.onDelete}
        >
          删除相册
        </button>
        <button
          class={`${btnOutline} album-edit`}
          type="button"
          disabled={props.busy}
          onClick={props.onEdit}
        >
          编辑相册
        </button>
      </footer>
    </>
  );
}

function DeleteAlbumDialog(props: {
  album: Album;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <AlertDialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <AlertDialogBackdrop class={dialogBackdropCls} />
      <AlertDialogContent
        class={`${cardCls} fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[min(420px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 flex-col p-0`}
        aria-labelledby="album-delete-title"
        aria-describedby="album-delete-description"
      >
        <header class="border-b border-border px-4 py-3.5">
          <AlertDialogTitle
            id="album-delete-title"
            class="m-0 text-lg font-semibold tracking-tight text-foreground"
          >
            删除相册
          </AlertDialogTitle>
        </header>
        <div class="grid gap-2 px-4 py-4 text-[0.88rem] leading-relaxed text-foreground [overflow-wrap:anywhere]">
          <AlertDialogDescription id="album-delete-description" class="m-0">
            「{props.album.name}」将从相册列表和前台移除。相册内的图片仍会保留。
          </AlertDialogDescription>
          <p class="m-0 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {albumHref(props.album.album_value)}
          </p>
        </div>
        <Show when={props.error}>
          <p class={`${errorBanner} mx-4`} role="alert">
            {props.error}
          </p>
        </Show>
        <footer class="flex flex-wrap items-center justify-end gap-2 px-4 pb-4 pt-3">
          <AlertDialogClose class={btnOutline} disabled={props.pending}>
            取消
          </AlertDialogClose>
          <Button class={btnDanger} type="button" disabled={props.pending} onClick={props.onConfirm}>
            {props.pending ? "删除中…" : "确认删除"}
          </Button>
        </footer>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlbumEditor(props: {
  album: Album | null;
  albums: Album[];
  onClose: () => void;
  onSaved: (path: string) => Promise<void>;
}) {
  const [name, setName] = createSignal(props.album?.name ?? "");
  const [albumValue, setAlbumValue] = createSignal(
    props.album ? albumHref(props.album.album_value) : "/",
  );
  const [detail, setDetail] = createSignal(props.album?.detail ?? "");
  const [sort, setSort] = createSignal(props.album?.sort ?? 0);
  const [license, setLicense] = createSignal(props.album?.license ?? "");
  const [theme, setTheme] = createSignal(props.album?.theme ?? "0");
  const [show, setShow] = createSignal(props.album ? props.album.show === 0 : false);
  const [randomShow, setRandomShow] = createSignal(
    props.album ? props.album.random_show === 0 : false,
  );
  const [imageSorting, setImageSorting] = createSignal(props.album?.image_sorting ?? 1);
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let nameInput!: HTMLInputElement;

  createEffect(
    () => true,
    () => nameInput.focus(),
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (pending()) return;
    const path = albumValue().trim();
    if (!name().trim() || !path) {
      setError("请填写相册名称和路由");
      return;
    }
    if (!path.startsWith("/")) {
      setError("路由必须以 / 开头");
      return;
    }
    if (
      props.albums.some(
        (album) => album.id !== props.album?.id && albumHref(album.album_value) === albumHref(path),
      )
    ) {
      setError("这个前台路径已被其他相册使用。");
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
            album_value: path,
            name: name().trim(),
            detail: detail().trim() || null,
            sort: Number(sort()) || 0,
            license: license().trim() || null,
            theme: theme(),
            show: show() ? 0 : 1,
            random_show: randomShow() ? 0 : 1,
            image_sorting: Number(imageSorting()),
          }),
        },
      );
      if (!response.ok) throw new Error("保存失败");
      await props.onSaved(path);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <form class="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <header class="border-b border-border px-4 py-3.5">
        <h2 class="m-0 text-xl leading-tight font-semibold text-foreground">
          {props.album ? "编辑相册" : "新建相册"}
        </h2>
      </header>
      <fieldset
        class="m-0 grid grid-cols-2 gap-3 border-0 border-b border-border p-3.5 @max-[350px]:grid-cols-1"
        disabled={pending()}
      >
        <label class={`${fieldCls} ${labelCls}`}>
          名称
          <input
            ref={nameInput}
            class={inputCls}
            type="text"
            value={name()}
            placeholder="请输入相册名称"
            onInput={(event) => setName(event.currentTarget.value)}
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          前台路径
          <input
            class={inputCls}
            type="text"
            value={albumValue()}
            placeholder="/travel，必须以 / 开头"
            onInput={(event) => setAlbumValue(event.currentTarget.value)}
          />
        </label>
        <label class={`${fieldCls} ${labelCls} col-span-full`}>
          简介
          <input
            class={inputCls}
            type="text"
            value={detail()}
            placeholder="请输入相册详情"
            onInput={(event) => setDetail(event.currentTarget.value)}
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          相册顺序
          <input
            class={inputCls}
            type="number"
            value={sort()}
            placeholder="0"
            onInput={(event) => setSort(Number(event.currentTarget.value))}
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          许可协议
          <input
            class={inputCls}
            type="text"
            value={license()}
            placeholder="如 CC-BY-NC-ND，可选"
            onInput={(event) => setLicense(event.currentTarget.value)}
          />
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          相册主题
          <select
            class={selectCls}
            value={theme()}
            onChange={(event) => setTheme(event.currentTarget.value)}
          >
            <For each={THEME_OPTIONS}>
              {(option) => <option value={option.value}>{option.label}</option>}
            </For>
          </select>
        </label>
        <label class={`${fieldCls} ${labelCls}`}>
          图片排序规则
          <select
            class={selectCls}
            value={imageSorting()}
            onChange={(event) => setImageSorting(Number(event.currentTarget.value))}
          >
            <For each={IMAGE_SORTING_OPTIONS}>
              {(option) => <option value={option.value}>{option.label}</option>}
            </For>
          </select>
        </label>
        <div class="col-span-full">
          <SwitchRow label="在前台公开" checked={show()} onChange={setShow} />
        </div>
        <div class="col-span-full">
          <SwitchRow
            label="随机排序"
            detail="开启后相册内图片将随机展示"
            checked={randomShow()}
            onChange={setRandomShow}
          />
        </div>
      </fieldset>
      <Show when={error()}>
        <div class={`${errorBanner} mx-4 mt-3`} role="alert">
          {error()}
        </div>
      </Show>
      <footer class="mt-auto flex flex-wrap items-center justify-end gap-2 px-4 py-3">
        <Button class={btnOutline} type="button" disabled={pending()} onClick={props.onClose}>
          取消
        </Button>
        <Button class={btnPrimary} type="submit" disabled={pending()}>
          {pending() ? "保存中…" : "保存相册"}
        </Button>
      </footer>
    </form>
  );
}
