import { Button } from "@ui-sdk/solid/button";
import { For, Show, createSignal } from "solid-js";

import { EmptyState } from "../admin/shared";
import type { Album } from "../types";

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

export function SummaryMetric(props: { label: string; value: number; detail: string }) {
  return (
    <div class="summary-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.detail}</small>
    </div>
  );
}

export function AlbumsView(props: { albums: Album[]; onChanged: () => Promise<void> }) {
  const [formOpen, setFormOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<Album | null>(null);
  const [deleting, setDeleting] = createSignal<Album | null>(null);
  const [deletePending, setDeletePending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function toggleShow(album: Album) {
    setError(null);
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}/show`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: album.show === 0 ? 1 : 0 }),
      });
      if (!response.ok) throw new Error("更新失败");
      await props.onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新失败");
    }
  }

  async function confirmDelete() {
    const album = deleting();
    if (!album || deletePending()) return;
    setDeletePending(true);
    setError(null);
    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("删除失败");
      setDeleting(null);
      await props.onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <section class="content-grid">
      <div class="summary-row">
        <SummaryMetric label="相册" value={props.albums.length} detail="v3 album_value" />
        <SummaryMetric
          label="展示中"
          value={props.albums.filter((album) => album.show === 0).length}
          detail="show = 0"
        />
      </div>
      <div class="table-shell">
        <div class="table-heading">
          <span>Album index</span>
          <button
            class="row-action storage-edit"
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            新建相册
          </button>
          <span>{props.albums.length} records</span>
        </div>
        <Show when={error()}>
          <span class="upload-message" role="alert">
            {error()}
          </span>
        </Show>
        <Show
          when={props.albums.length > 0}
          fallback={
            <EmptyState
              title="还没有相册"
              detail="新建相册或导入 v3 备份，旧相册会保持原有 album_value。"
            />
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
                  <div class="album-actions">
                    <span class={`row-status${album.show !== 0 ? " hidden" : ""}`}>
                      {album.show === 0 ? "公开" : "隐藏"}
                    </span>
                    <button class="row-action" type="button" onClick={() => toggleShow(album)}>
                      {album.show === 0 ? "隐藏" : "公开"}
                    </button>
                    <button
                      class="row-action"
                      type="button"
                      onClick={() => {
                        setEditing(album);
                        setFormOpen(true);
                      }}
                    >
                      编辑
                    </button>
                    <button class="row-action" type="button" onClick={() => setDeleting(album)}>
                      删除
                    </button>
                  </div>
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={formOpen()}>
        <AlbumFormDialog
          album={editing()}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await props.onChanged();
          }}
        />
      </Show>
      <Show when={deleting()}>
        {(album) => (
          <div class="dialog-overlay">
            <div class="dialog-panel" role="dialog" aria-modal="true">
              <div class="table-heading dialog-heading">
                <span>确认删除相册</span>
                <button
                  class="row-action"
                  type="button"
                  onClick={() => setDeleting(null)}
                  aria-label="关闭"
                >
                  关闭
                </button>
              </div>
              <div class="dialog-body">
                <p>名称：{album().name}</p>
                <p>路由：{album().album_value}</p>
                <p>删除后相册不再展示，图片-相册关联保留。</p>
              </div>
              <div class="dialog-footer">
                <Button
                  class="secondary-button"
                  type="button"
                  disabled={deletePending()}
                  onClick={() => setDeleting(null)}
                >
                  取消
                </Button>
                <Button
                  class="primary-button"
                  type="button"
                  disabled={deletePending()}
                  onClick={() => confirmDelete()}
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </Show>
    </section>
  );
}

function AlbumFormDialog(props: {
  album: Album | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = createSignal(props.album?.name ?? "");
  const [albumValue, setAlbumValue] = createSignal(props.album?.album_value ?? "/");
  const [detail, setDetail] = createSignal(props.album?.detail ?? "");
  const [sort, setSort] = createSignal(props.album?.sort ?? 0);
  const [license, setLicense] = createSignal(props.album?.license ?? "");
  const [theme, setTheme] = createSignal(props.album?.theme ?? "0");
  const [show, setShow] = createSignal(props.album?.show ?? 1);
  const [randomShow, setRandomShow] = createSignal(props.album?.random_show ?? 1);
  const [imageSorting, setImageSorting] = createSignal(props.album?.image_sorting ?? 1);
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!name().trim() || !albumValue().trim()) {
      setError("名称和路由为必填项");
      return;
    }
    if (!albumValue().startsWith("/")) {
      setError("路由必须以 / 开头");
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
            album_value: albumValue().trim(),
            name: name().trim(),
            detail: detail().trim() || null,
            sort: Number(sort()) || 0,
            license: license().trim() || null,
            theme: theme(),
            show: Number(show()),
            random_show: Number(randomShow()),
            image_sorting: Number(imageSorting()),
          }),
        },
      );
      if (!response.ok) throw new Error("保存失败");
      await props.onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div class="dialog-overlay">
      <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submit}>
        <div class="table-heading dialog-heading">
          <span>{props.album ? "编辑相册" : "新建相册"}</span>
          <button class="row-action" type="button" onClick={props.onClose} aria-label="关闭">
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <label>
            名称
            <input
              type="text"
              value={name()}
              placeholder="相册名称"
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <label>
            路由（album_value）
            <input
              type="text"
              value={albumValue()}
              placeholder="/travel，必须以 / 开头"
              onInput={(event) => setAlbumValue(event.currentTarget.value)}
            />
          </label>
          <label>
            详情
            <input
              type="text"
              value={detail()}
              placeholder="相册简介，可选"
              onInput={(event) => setDetail(event.currentTarget.value)}
            />
          </label>
          <label>
            排序（sort）
            <input
              type="number"
              value={sort()}
              placeholder="0"
              onInput={(event) => setSort(Number(event.currentTarget.value))}
            />
          </label>
          <label>
            License
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
            显示状态
            <select value={show()} onChange={(event) => setShow(Number(event.currentTarget.value))}>
              <option value={0}>公开</option>
              <option value={1}>隐藏</option>
            </select>
          </label>
          <label>
            随机排序（random_show）
            <select
              value={randomShow()}
              onChange={(event) => setRandomShow(Number(event.currentTarget.value))}
            >
              <option value={0}>启用随机排序</option>
              <option value={1}>默认排序</option>
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
          <Show when={error()}>
            <span class="upload-message" role="alert">
              {error()}
            </span>
          </Show>
        </div>
        <div class="dialog-footer">
          <Button
            class="secondary-button"
            type="button"
            disabled={pending()}
            onClick={props.onClose}
          >
            取消
          </Button>
          <Button class="primary-button" type="submit" disabled={pending()}>
            {pending() ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
