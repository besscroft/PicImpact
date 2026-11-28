import { Button } from "@ui-sdk/solid/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { For, Show, createEffect, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { animate } from "motion";

import {
  EXIF_ROWS,
  EmptyState,
  FilterSelect,
  PHOTO_PAGE_SIZE,
  SwitchRow,
  TagInput,
  badgeSecondary,
  btnPrimary,
  cardCls,
  dialogBackdropCls,
  dialogBodyCls,
  dialogContentCls,
  dialogFooterCls,
  dialogHeadingCls,
  dialogTitleCls,
  errorBanner,
  exifCellCls,
  exifTableCls,
  exifValue,
  focusRing,
  formatExifDateTime,
  fieldCls,
  inputCls,
  labelCls,
  metaCls,
  rowAction,
  selectAutoCls,
  selectCls,
} from "../admin/shared";
import { getJson } from "../api";
import type { AdminPhotoPage, Album, Photo } from "../types";

/* 卡片操作统一为图标按钮，参考 v3 的简约样式 */
const iconActionCls = `inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export function PhotosView(props: { albums: Album[]; onChanged: () => Promise<void> }) {
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
      // 详情栏跟随最新数据：照片被删除或不在当前筛选结果时自动收起
      const current = viewing();
      if (current) {
        setViewing(response.data.find((item) => item.id === current.id) ?? null);
      }
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
      // 静默更新本地数据（列表徽标与详情开关即时反映），不重载列表、不触发骨架屏
      const current = pageData();
      if (current) {
        setPageData({
          ...current,
          data: current.data.map((item) =>
            item.id === photo.id ? { ...item, show, show_on_mainpage: item.show_on_mainpage } : item,
          ),
        });
      }
      const viewingCurrent = viewing();
      if (viewingCurrent && viewingCurrent.id === photo.id) {
        setViewing({ ...viewingCurrent, show });
      }
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
    <section class="@container flex flex-col gap-5 min-[1010px]:h-full">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap gap-2">
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
        <div class="flex gap-2">
          <button
            class={rowAction}
            type="button"
            disabled={listLoading() || total() === 0}
            onClick={() => setBatchOpen(true)}
          >
            批量删除
          </button>
          <button class={rowAction} type="button" disabled={listLoading()} onClick={reload}>
            刷新
          </button>
        </div>
      </div>

      <Show when={listError()}>
        <div class={errorBanner} role="alert">
          {listError()}
        </div>
      </Show>

      <Show
        when={!listLoading()}
        fallback={<div class="rounded-xl border border-dashed border-input p-10 text-center text-sm text-muted-foreground">加载中…</div>}
      >
        <Show
          when={total() > 0}
          fallback={
            <EmptyState
              title="还没有照片"
              detail={album() || showStatus() || camera() || lens() ? "没有符合筛选条件的照片。" : "通过「上传图片」页写入第一条记录。"}
            />
          }
        >
          <div class="flex gap-3.5 min-[1010px]:min-h-0 min-[1010px]:flex-1">
            <div class="min-w-0 flex-1 min-[1010px]:flex min-[1010px]:min-h-0 min-[1010px]:flex-col">
              <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] content-start gap-3.5 min-[1010px]:min-h-0 min-[1010px]:flex-1 min-[1010px]:overflow-y-auto">
                <For each={pageData()?.data ?? []}>
                  {(photo) => (
                    <article
                      class={`${cardCls} group relative flex flex-col overflow-hidden data-current:ring-2 data-current:ring-ring/50`}
                      data-current={viewing()?.id === photo.id ? "" : undefined}
                    >
                      <button
                        class="block h-[180px] w-full cursor-pointer border-0 bg-secondary p-0 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        type="button"
                        aria-label={`查看 ${photo.title || photo.image_name || "图片"}`}
                        onClick={() => setViewing(photo)}
                      >
                        <Show when={photo.preview_url ?? photo.url} fallback={<span class="text-xs tracking-widest text-muted-foreground">NO IMAGE</span>}>
                          <img
                            class="h-[180px] w-full object-cover"
                            src={photo.preview_url ?? photo.url ?? ""}
                            alt=""
                            loading="lazy"
                          />
                        </Show>
                      </button>
                      <Show when={photo.preview_url ?? photo.url}>
                        <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-2.5 pt-10 text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                          <span class="truncate text-sm font-semibold text-white">
                            {photo.title || photo.image_name || photo.id}
                          </span>
                          <span class="truncate text-xs text-white/85">
                            {[photo.album_name, photoFormat(photo), `${photo.width} × ${photo.height}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <Show when={photo.show === 0 || (photo.labels?.length ?? 0) > 0}>
                            <div class="flex flex-wrap gap-1.5">
                              <Show when={photo.show === 0}>
                                <span class="rounded-full bg-white/25 px-2 py-0.5 text-xs text-white">私有</span>
                              </Show>
                              <For each={(photo.labels ?? []).slice(0, 3)}>
                                {(tag) => (
                                  <span class="rounded-full bg-white/25 px-2 py-0.5 text-xs text-white">{tag}</span>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      </Show>
                    </article>
                  )}
                </For>
              </div>
              <div class="mt-4 flex items-center gap-2.5 min-[1010px]:shrink-0">
                <select
                  class={selectAutoCls}
                  value={String(page())}
                  onChange={(event) => setPage(Number(event.currentTarget.value))}
                >
                  {Array.from({ length: pages() }, (_, index) => index + 1).map((num) => (
                    <option value={String(num)}>第 {num} 页</option>
                  ))}
                </select>
                <button
                  class={rowAction}
                  type="button"
                  aria-label="上一页"
                  disabled={page() <= 1}
                  onClick={() => setPage(page() - 1)}
                >
                  上一页
                </button>
                <button
                  class={rowAction}
                  type="button"
                  aria-label="下一页"
                  disabled={page() >= pages()}
                  onClick={() => setPage(page() + 1)}
                >
                  下一页
                </button>
                <span class={metaCls}>共 {total()} 张</span>
              </div>
            </div>
            <Show when={viewing()}>
              <PhotoInspector
                photo={viewing()!}
                onBind={() => {
                  const current = viewing();
                  if (!current) return;
                  setBinding(current);
                  setBindAlbum(current.album_value ?? "");
                }}
                onEdit={() => {
                  const current = viewing();
                  if (current) setEditing(current);
                }}
                onToggleShow={(checked) => {
                  const current = viewing();
                  if (current) void updateShow(current, checked ? 0 : 1);
                }}
                onClose={() => setViewing(null)}
              />
            </Show>
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

      <Show when={binding()}>
        {(photo) => (
          <Dialog
            defaultOpen
            onOpenChange={(open) => {
              if (!open) setBinding(null);
            }}
          >
            <DialogBackdrop class={dialogBackdropCls} />
            <DialogContent class={`${dialogContentCls} w-[min(520px,100%)]`} aria-label="绑定相册">
              <form class="flex min-h-0 flex-1 flex-col" onSubmit={submitBindAlbum}>
                <header class={dialogHeadingCls}>
                  <DialogTitle class={dialogTitleCls}>绑定相册</DialogTitle>
                  <DialogClose class={rowAction}>关闭</DialogClose>
                </header>
                <div class={dialogBodyCls}>
                  <label class={`${fieldCls} ${labelCls}`}>
                    相册
                    <select
                      class={selectCls}
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
                <footer class={dialogFooterCls}>
                  <Button class={btnPrimary} type="submit" disabled={!bindAlbum()}>
                    更新
                  </Button>
                </footer>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </Show>

      <Show when={batchOpen()}>
        <Dialog
          defaultOpen
          onOpenChange={(open) => {
            if (!open) {
              setBatchOpen(false);
              setBatchIds([]);
            }
          }}
        >
          <DialogBackdrop class={dialogBackdropCls} />
          <DialogContent aria-label="批量删除">
            <form class="flex min-h-0 flex-1 flex-col" onSubmit={(event) => event.preventDefault()}>
              <header class={dialogHeadingCls}>
                <DialogTitle class={dialogTitleCls}>批量删除</DialogTitle>
                <DialogClose class={rowAction}>关闭</DialogClose>
              </header>
              <div class={`${dialogBodyCls} !flex !grid-cols-1 flex-col`}>
                <div class="flex flex-col gap-2">
                  <For each={pageData()?.data ?? []}>
                    {(photo) => (
                      <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 transition-colors has-checked:border-ring">
                        <input
                          type="checkbox"
                          class="accent-primary"
                          checked={batchIds().includes(photo.id)}
                          onChange={(event) => toggleBatch(photo.id, event.currentTarget.checked)}
                        />
                        <img class="size-11 rounded-lg object-cover" src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                        <span class="grid min-w-0 gap-0.5">
                          <strong class="truncate text-[0.82rem] font-medium text-foreground">
                            {photo.id.length > 16 ? `${photo.id.slice(0, 16)}…` : photo.id}
                          </strong>
                          <small class="text-xs text-muted-foreground">{photo.title || "N/A"}</small>
                        </span>
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <footer class={dialogFooterCls}>
                <Button
                  class={btnPrimary}
                  disabled={batchIds().length === 0 || batchDeleting()}
                  onClick={() => void submitBatchDelete()}
                >
                  {batchDeleting() ? "删除中…" : `删除 ${batchIds().length} 项`}
                </Button>
              </footer>
            </form>
          </DialogContent>
        </Dialog>
      </Show>
    </section>
  );
}

/* 悬浮信息用：从文件名/链接后缀推断格式（JPG、WEBP…），取不到则返回空串 */
function photoFormat(photo: Photo) {
  const source = photo.image_name || photo.url || "";
  const match = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(source);
  return match ? match[1].toUpperCase() : "";
}

function CardIcon(props: { class?: string; children?: JSX.Element }) {
  return (
    <svg
      class={props.class ?? "size-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
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
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(current.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title ?? null,
          detail: current.detail ?? null,
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
    <Dialog defaultOpen onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent class={`${dialogContentCls} w-[min(520px,100%)]`} aria-label="编辑图片">
        <form class="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <header class={dialogHeadingCls}>
            <DialogTitle class={dialogTitleCls}>编辑图片</DialogTitle>
            <DialogClose class={rowAction}>关闭</DialogClose>
          </header>
          <div class={dialogBodyCls}>
            <label class={`${fieldCls} ${labelCls}`}>
              标题
              <input
                class={inputCls}
                value={draft().title ?? ""}
                placeholder="请输入图片标题"
                onInput={(event) => update({ title: event.currentTarget.value })}
              />
            </label>
            <label class={`${fieldCls} ${labelCls}`}>
              详情
              <input
                class={inputCls}
                value={draft().detail ?? ""}
                placeholder="请输入图片详情"
                onInput={(event) => update({ detail: event.currentTarget.value })}
              />
            </label>
            <label class={`${fieldCls} ${labelCls}`}>
              排序
              <input
                class={inputCls}
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
            <div class={`${errorBanner} mx-5`} role="alert">
              {error()}
            </div>
          </Show>
          <footer class={dialogFooterCls}>
            <Button class={btnPrimary} type="submit" disabled={pending()}>
              {pending() ? "更新中…" : "更新"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* 图片详情栏 —— 替代弹窗，宽约两张卡片，滑入动画；窄容器时悬浮在右侧 */
function PhotoInspector(props: {
  photo: Photo;
  onBind: () => void;
  onEdit: () => void;
  onToggleShow: (checked: boolean) => void;
  onClose: () => void;
}) {
  const photo = () => props.photo;
  let inspector!: HTMLElement;

  createEffect(
    () => true,
    () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      animate(inspector, { opacity: [0, 1], x: [36, 0] }, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
    },
  );

  const exifRows = () =>
    EXIF_ROWS.map((row) => {
      const raw = exifValue(photo().exif, row.key);
      return {
        label: row.label,
        value: row.key === "dateTime" && raw ? formatExifDateTime(raw) : raw,
      };
    }).filter((row) => row.value);

  return (
    <aside
      ref={inspector}
      class={`${cardCls} flex flex-col overflow-hidden @max-[1009px]:fixed @max-[1009px]:inset-y-3 @max-[1009px]:right-3 @max-[1009px]:z-40 @max-[1009px]:w-[min(494px,calc(100vw-24px))] @max-[1009px]:shadow-xl @min-[1010px]:h-full @min-[1010px]:w-[494px] @min-[1010px]:shrink-0`}
      aria-label="图片详情"
    >
      <header class="flex flex-none items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <h2 class="m-0 min-w-0 truncate text-sm font-semibold text-foreground">
          {photo().title || photo().image_name || photo().id}
        </h2>
        <div class="flex flex-none gap-1.5">
          <button
            class={iconActionCls}
            type="button"
            aria-label="绑定相册"
            onClick={() => props.onBind()}
          >
            <CardIcon>
              <path d="M14 4a1 1 0 0 1 1-1" />
              <path d="M15 10a1 1 0 0 1-1-1" />
              <path d="M21 4a1 1 0 0 0-1-1" />
              <path d="M21 9a1 1 0 0 1-1 1" />
              <path d="m3 7 3 3 3-3" />
              <path d="M6 10V5a2 2 0 0 1 2-2h2" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </CardIcon>
          </button>
          <button
            class={iconActionCls}
            type="button"
            aria-label="编辑图片"
            onClick={() => props.onEdit()}
          >
            <CardIcon>
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </CardIcon>
          </button>
          <button class={iconActionCls} type="button" aria-label="关闭详情" onClick={props.onClose}>
            <CardIcon>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </CardIcon>
          </button>
        </div>
      </header>
      <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        <Show
          when={photo().type === 2 && photo().video_url}
          fallback={
            <div class="aspect-[3/2] w-full overflow-hidden rounded-lg bg-secondary">
              <img
                class="h-full w-full object-cover"
                src={photo().preview_url ?? photo().url ?? ""}
                alt={photo().detail ?? ""}
              />
            </div>
          }
        >
          <video
            class="aspect-[3/2] w-full rounded-lg bg-secondary object-cover"
            src={photo().video_url ?? ""}
            controls
            muted
            loop
            playsinline
          />
        </Show>
        <Show when={(photo().labels ?? []).length > 0}>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <For each={photo().labels ?? []}>
              {(tag) => <span class={`${badgeSecondary} cursor-default`}>{tag}</span>}
            </For>
          </div>
        </Show>
        <Show when={exifRows().length > 0}>
          <table class={`${exifTableCls} mt-3`}>
            <thead>
              <tr>
                <th class={exifCellCls}>参数</th>
                <th class={exifCellCls}>值</th>
              </tr>
            </thead>
            <tbody>
              <For each={exifRows()}>
                {(row) => (
                  <tr>
                    <td class={`${exifCellCls} text-muted-foreground`}>{row.label}</td>
                    <td class={exifCellCls}>{row.value}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
        <div class="mt-3 grid gap-2">
          <div class="flex justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
            <span class="text-xs text-muted-foreground">详情</span>
            <strong class="text-[0.82rem] font-medium text-foreground">{photo().detail || "—"}</strong>
          </div>
          <div class="flex justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
            <span class="text-xs text-muted-foreground">尺寸</span>
            <strong class="text-[0.82rem] font-medium text-foreground">{photo().width} × {photo().height}</strong>
          </div>
          <div class="flex justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
            <span class="text-xs text-muted-foreground">经纬度</span>
            <strong class="text-[0.82rem] font-medium text-foreground">{photo().lon || "—"} / {photo().lat || "—"}</strong>
          </div>
          <div class="flex justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2">
            <span class="text-xs text-muted-foreground">排序</span>
            <strong class="text-[0.82rem] font-medium text-foreground">{photo().sort}</strong>
          </div>
        </div>
        <div class="mt-3 grid gap-2">
          <SwitchRow
            label="显示状态"
            detail="关闭后图片不会在前台显示"
            checked={photo().show === 0}
            onChange={(checked) => props.onToggleShow(checked)}
          />
          <SwitchRow label="首页显示" checked={photo().show_on_mainpage === 0} disabled />
        </div>
      </div>
    </aside>
  );
}
