import { Button } from "@ui-sdk/solid/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { For, Show, createEffect, createSignal } from "solid-js";

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
    <section class="grid gap-5">
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
          <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
            <For each={pageData()?.data ?? []}>
              {(photo) => (
                <article class={`${cardCls} flex flex-col overflow-hidden`}>
                  <div class="flex items-center justify-between gap-2 border-b border-border px-2.5 py-2">
                    <span class={`${badgeSecondary} truncate`}>{photo.album_name || "未分组"}</span>
                    <button
                      class={rowAction}
                      type="button"
                      aria-label="查看图片"
                      onClick={() => setViewing(photo)}
                    >
                      查看
                    </button>
                  </div>
                  <button
                    class="grid h-[180px] w-full cursor-pointer place-items-center border-0 bg-secondary p-0 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    type="button"
                    onClick={() => setViewing(photo)}
                  >
                    <Show when={photo.preview_url ?? photo.url} fallback={<span class="text-xs tracking-widest text-muted-foreground">NO IMAGE</span>}>
                      <img class="max-h-[180px] max-w-full object-contain" src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    </Show>
                  </button>
                  <div class="mt-auto flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
                    <div class="flex min-w-0 items-center gap-2">
                      <SwitchRow
                        label={photo.show === 0 ? "公开" : "私有"}
                        checked={photo.show === 0}
                        onChange={(checked) => void updateShow(photo, checked ? 0 : 1)}
                      />
                      <span class={`${badgeSecondary} truncate`}>排序 {photo.sort}</span>
                    </div>
                    <div class="flex gap-1.5">
                      <button
                        class={rowAction}
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
                        class={rowAction}
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
          <div class="mt-4 flex items-center gap-2.5">
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
              链接
              <input
                class={inputCls}
                value={draft().url ?? ""}
                placeholder="请输入图片链接"
                onInput={(event) => update({ url: event.currentTarget.value })}
              />
            </label>
            <label class={`${fieldCls} ${labelCls}`}>
              预览链接
              <input
                class={inputCls}
                value={draft().preview_url ?? ""}
                placeholder="请输入预览链接"
                onInput={(event) => update({ preview_url: event.currentTarget.value })}
              />
            </label>
            <label class={`${fieldCls} ${labelCls}`}>
              视频链接
              <input
                class={inputCls}
                value={draft().video_url ?? ""}
                placeholder="请输入视频链接（Live Photo）"
                onInput={(event) => update({ video_url: event.currentTarget.value })}
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
            <div class="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
              <label class={`${fieldCls} ${labelCls}`}>
                宽度（px）
                <input
                  class={inputCls}
                  type="number"
                  value={draft().width}
                  onInput={(event) => update({ width: Number(event.currentTarget.value) })}
                />
              </label>
              <label class={`${fieldCls} ${labelCls}`}>
                高度（px）
                <input
                  class={inputCls}
                  type="number"
                  value={draft().height}
                  onInput={(event) => update({ height: Number(event.currentTarget.value) })}
                />
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3.5 max-[767px]:grid-cols-1">
              <label class={`${fieldCls} ${labelCls}`}>
                经度
                <input
                  class={inputCls}
                  value={draft().lon ?? ""}
                  placeholder="请输入经度"
                  onInput={(event) => update({ lon: event.currentTarget.value })}
                />
              </label>
              <label class={`${fieldCls} ${labelCls}`}>
                纬度
                <input
                  class={inputCls}
                  value={draft().lat ?? ""}
                  placeholder="请输入纬度"
                  onInput={(event) => update({ lat: event.currentTarget.value })}
                />
              </label>
            </div>
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
    <Dialog defaultOpen onOpenChange={(open) => { if (!open) props.onClose(); }}>
      <DialogBackdrop class={dialogBackdropCls} />
      <DialogContent aria-label="查看图片">
        <header class={dialogHeadingCls}>
          <DialogTitle class={dialogTitleCls}>
            {photo().title || photo().image_name || photo().id}
          </DialogTitle>
          <DialogClose class={rowAction}>关闭</DialogClose>
        </header>
        <div class={dialogBodyCls}>
          <Show
            when={photo().type === 2 && photo().video_url}
            fallback={
              <img
                class="col-span-full max-h-[46dvh] w-full max-w-full rounded-lg bg-secondary object-contain"
                src={photo().preview_url ?? photo().url ?? ""}
                alt={photo().detail ?? ""}
              />
            }
          >
            <video
              class="col-span-full max-h-[46dvh] w-full max-w-full rounded-lg bg-secondary object-contain"
              src={photo().video_url ?? ""}
              controls
              muted
              loop
              playsinline
            />
          </Show>
          <Show when={(photo().labels ?? []).length > 0}>
            <div class="col-span-full flex flex-wrap gap-1.5">
              <For each={photo().labels ?? []}>
                {(tag) => <span class={`${badgeSecondary} cursor-default`}>{tag}</span>}
              </For>
            </div>
          </Show>
          <Show when={exifRows().length > 0}>
            <table class={`${exifTableCls} col-span-full`}>
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
          <div class="col-span-full grid gap-2">
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
          <SwitchRow label="显示状态" checked={photo().show === 0} disabled />
          <SwitchRow label="首页显示" checked={photo().show_on_mainpage === 0} disabled />
        </div>
      </DialogContent>
    </Dialog>
  );
}
