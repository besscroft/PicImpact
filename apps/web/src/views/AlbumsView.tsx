import { Button } from "@ui-sdk/solid/button";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/solid/segmented-control";
import { Switch, SwitchThumb } from "@ui-sdk/solid/switch";
import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

import { EmptyState, SwitchRow, albumHref } from "../admin/shared";
import type { AdminPhotoPage, Album } from "../types";
import { getAlbumWorkspace, type AlbumFilter } from "./album-workspace";
import "./album-workspace.css";

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
    <section class="album-workspace" aria-label="相册管理">
      <Show when={error() && !deleting()}>
        <p class="error-banner" role="alert">
          {error()}
        </p>
      </Show>
      <p class="album-announcement" role="status">
        {notice()}
      </p>
      <div class="album-desk">
        <section class="album-register" aria-label="相册列表" ref={list}>
          <div class="album-register-header">
            <SegmentedControl
              class="album-filters"
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
                  <SegmentedControlItem value={item.value}>{item.label}</SegmentedControlItem>
                )}
              </For>
            </SegmentedControl>
            <label class="album-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
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
            <div class="album-table-scroll">
              <table class="album-register-table">
                <thead>
                  <tr>
                    <th scope="col">相册名</th>
                    <th scope="col">路径</th>
                    <th scope="col">主题</th>
                    <th scope="col">公开状态</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={workspace().rows}>
                    {(album) => (
                      <tr data-current={workspace().selected?.id === album.id ? "" : undefined}>
                        <td>
                          <button
                            class="album-select"
                            type="button"
                            aria-current={
                              workspace().selected?.id === album.id ? "true" : undefined
                            }
                            disabled={busy()}
                            onClick={() => selectAlbum(album)}
                          >
                            <span>{album.name}</span>
                          </button>
                        </td>
                        <td class="album-meta-cell">
                          <span class="album-path">{albumHref(album.album_value)}</span>
                        </td>
                        <td class="album-meta-cell">
                          <span class="album-theme-chip">
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
          <footer class="album-table-footer">
            <span>
              {workspace().rows.length === props.albums.length
                ? `共 ${props.albums.length} 个相册`
                : `显示 ${workspace().rows.length} 个，共 ${props.albums.length} 个`}
            </span>
            <span>按相册顺序排列</span>
          </footer>
        </section>
        <aside class="album-inspector" aria-label="相册详情" tabindex={-1} ref={inspector}>
          <Show
            when={editor()}
            keyed
            fallback={
              <Show
                when={workspace().selected}
                fallback={<p class="album-inspector-empty">相册详情将在这里显示。</p>}
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
  return (
    <span class="album-status" data-public={props.album.show === 0 ? "" : undefined}>
      {props.album.show === 0 ? "公开" : "隐藏"}
    </span>
  );
}

function AlbumStatusToggle(props: { album: Album; busy: boolean; onToggle: () => void }) {
  const isPublic = () => props.album.show === 0;
  return (
    <label class="album-status-toggle">
      <Switch checked={isPublic()} disabled={props.busy} onCheckedChange={() => props.onToggle()}>
        <SwitchThumb />
      </Switch>
      <span>{isPublic() ? "公开" : "隐藏"}</span>
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
      <header class="album-identity">
        <div class="album-identity-label">
          <span>相册详情</span>
          <AlbumStatus album={props.album} />
        </div>
        <h2>{props.album.name}</h2>
        <p class="album-path">{albumHref(props.album.album_value)}</p>
      </header>
      <Show when={!previewFailed() && preview()}>
        {(photo) => (
          <img
            class="album-preview"
            src={photo().url}
            alt={photo().alt}
            onError={() => setPreviewFailed(true)}
          />
        )}
      </Show>
      <section class="album-field-block">
        <h3>简介</h3>
        <p>{props.album.detail || "暂无简介"}</p>
      </section>
      <section class="album-field-block">
        <h3>前台展示</h3>
        <dl>
          <div>
            <dt>显示状态</dt>
            <dd>
              <button
                type="button"
                class="album-text-action"
                disabled={props.busy}
                onClick={props.onToggle}
              >
                {props.album.show === 0 ? "设为隐藏" : "设为公开"}
              </button>
            </dd>
          </div>
          <div>
            <dt>相册顺序</dt>
            <dd class="album-number">{props.album.sort}</dd>
          </div>
          <div>
            <dt>相册主题</dt>
            <dd>
              {THEME_OPTIONS.find((item) => item.value === props.album.theme)?.label ?? "默认样式"}
            </dd>
          </div>
        </dl>
      </section>
      <section class="album-field-block">
        <h3>图片设置</h3>
        <dl>
          <div>
            <dt>图片排序</dt>
            <dd>
              {IMAGE_SORTING_OPTIONS.find((item) => item.value === props.album.image_sorting)
                ?.label ?? "未设置"}
            </dd>
          </div>
          <div>
            <dt>随机排序</dt>
            <dd>{props.album.random_show === 0 ? "开启" : "关闭"}</dd>
          </div>
          <div>
            <dt>许可协议</dt>
            <dd>{props.album.license || "未设置"}</dd>
          </div>
        </dl>
      </section>
      <footer class="album-panel-actions">
        <button
          class="album-text-action album-delete"
          type="button"
          disabled={props.busy}
          onClick={props.onDelete}
        >
          删除相册
        </button>
        <button
          class="secondary-button album-edit"
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
  let dialog!: HTMLDialogElement;
  createEffect(
    () => true,
    () => dialog.showModal(),
  );

  return (
    <dialog
      class="album-delete-dialog"
      aria-labelledby="album-delete-title"
      aria-describedby="album-delete-description"
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!props.pending) props.onClose();
      }}
    >
      <header class="album-identity">
        <h2 id="album-delete-title">删除相册</h2>
      </header>
      <div class="album-delete-description" id="album-delete-description">
        <p>「{props.album.name}」将从相册列表和前台移除。相册内的图片仍会保留。</p>
        <p class="album-path">{albumHref(props.album.album_value)}</p>
      </div>
      <Show when={props.error}>
        <p class="error-banner album-form-error" role="alert">
          {props.error}
        </p>
      </Show>
      <footer class="album-panel-actions">
        <button
          class="secondary-button"
          type="button"
          autofocus
          disabled={props.pending}
          onClick={props.onClose}
        >
          取消
        </button>
        <Button
          class="album-danger-button"
          type="button"
          disabled={props.pending}
          onClick={props.onConfirm}
        >
          {props.pending ? "删除中…" : "确认删除"}
        </Button>
      </footer>
    </dialog>
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
    <form class="album-editor" onSubmit={submit}>
      <header class="album-identity">
        <h2>{props.album ? "编辑相册" : "新建相册"}</h2>
      </header>
      <fieldset class="album-fields" disabled={pending()}>
        <label>
          名称
          <input
            ref={nameInput}
            type="text"
            value={name()}
            placeholder="请输入相册名称"
            onInput={(event) => setName(event.currentTarget.value)}
          />
        </label>
        <label>
          前台路径
          <input
            type="text"
            value={albumValue()}
            placeholder="/travel，必须以 / 开头"
            onInput={(event) => setAlbumValue(event.currentTarget.value)}
          />
        </label>
        <label class="span-2">
          简介
          <input
            type="text"
            value={detail()}
            placeholder="请输入相册详情"
            onInput={(event) => setDetail(event.currentTarget.value)}
          />
        </label>
        <label>
          相册顺序
          <input
            type="number"
            value={sort()}
            placeholder="0"
            onInput={(event) => setSort(Number(event.currentTarget.value))}
          />
        </label>
        <label>
          许可协议
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
        <div class="span-2">
          <SwitchRow label="在前台公开" checked={show()} onChange={setShow} />
        </div>
        <div class="span-2">
          <SwitchRow
            label="随机排序"
            detail="开启后相册内图片将随机展示"
            checked={randomShow()}
            onChange={setRandomShow}
          />
        </div>
      </fieldset>
      <Show when={error()}>
        <div class="error-banner album-form-error" role="alert">
          {error()}
        </div>
      </Show>
      <footer class="album-panel-actions">
        <Button class="secondary-button" type="button" disabled={pending()} onClick={props.onClose}>
          取消
        </Button>
        <Button class="primary-button" type="submit" disabled={pending()}>
          {pending() ? "保存中…" : "保存相册"}
        </Button>
      </footer>
    </form>
  );
}
