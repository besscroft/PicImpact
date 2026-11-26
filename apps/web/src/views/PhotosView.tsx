import { Button } from "@ui-sdk/solid/button";
import { For, Show, createEffect, createSignal } from "solid-js";

import {
  EXIF_ROWS,
  EmptyState,
  FilterSelect,
  PHOTO_PAGE_SIZE,
  SwitchRow,
  TagInput,
  exifValue,
  formatExifDateTime,
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
    <section class="content-grid">
      <div class="filter-bar">
        <div class="filter-group">
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
        <div class="filter-actions">
          <button
            class="row-action"
            type="button"
            disabled={listLoading() || total() === 0}
            onClick={() => setBatchOpen(true)}
          >
            批量删除
          </button>
          <button class="row-action" type="button" disabled={listLoading()} onClick={reload}>
            刷新
          </button>
        </div>
      </div>

      <Show when={listError()}>
        <div class="error-banner" role="alert">
          {listError()}
        </div>
      </Show>

      <Show
        when={!listLoading()}
        fallback={<div class="list-status">加载中…</div>}
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
          <div class="photo-grid">
            <For each={pageData()?.data ?? []}>
              {(photo) => (
                <article class="photo-card">
                  <div class="photo-card-head">
                    <span class="card-badge">{photo.album_name || "未分组"}</span>
                    <button
                      class="row-action"
                      type="button"
                      aria-label="查看图片"
                      onClick={() => setViewing(photo)}
                    >
                      查看
                    </button>
                  </div>
                  <button
                    class="photo-card-media"
                    type="button"
                    onClick={() => setViewing(photo)}
                  >
                    <Show when={photo.preview_url ?? photo.url} fallback={<span>NO IMAGE</span>}>
                      <img src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    </Show>
                  </button>
                  <div class="photo-card-foot">
                    <div class="photo-card-info">
                      <SwitchRow
                        label={photo.show === 0 ? "公开" : "私有"}
                        checked={photo.show === 0}
                        onChange={(checked) => void updateShow(photo, checked ? 0 : 1)}
                      />
                      <span class="card-badge">排序 {photo.sort}</span>
                    </div>
                    <div class="photo-card-actions">
                      <button
                        class="row-action"
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
                        class="row-action"
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
          <div class="pager">
            <select
              class="filter-select"
              value={String(page())}
              onChange={(event) => setPage(Number(event.currentTarget.value))}
            >
              {Array.from({ length: pages() }, (_, index) => index + 1).map((num) => (
                <option value={String(num)}>第 {num} 页</option>
              ))}
            </select>
            <button
              class="row-action"
              type="button"
              aria-label="上一页"
              disabled={page() <= 1}
              onClick={() => setPage(page() - 1)}
            >
              上一页
            </button>
            <button
              class="row-action"
              type="button"
              aria-label="下一页"
              disabled={page() >= pages()}
              onClick={() => setPage(page() + 1)}
            >
              下一页
            </button>
            <span class="pager-total">共 {total()} 张</span>
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
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submitBindAlbum}>
            <div class="table-heading dialog-heading">
              <span>绑定相册</span>
              <button class="row-action" type="button" onClick={() => setBinding(null)}>
                关闭
              </button>
            </div>
            <div class="dialog-body">
              <label>
                相册
                <select
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
            <div class="dialog-footer">
              <Button class="primary-button" type="submit" disabled={!bindAlbum()}>
                更新
              </Button>
            </div>
          </form>
        </div>
      </Show>

      <Show when={batchOpen()}>
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={(event) => event.preventDefault()}>
            <div class="table-heading dialog-heading">
              <span>批量删除</span>
              <button
                class="row-action"
                type="button"
                onClick={() => {
                  setBatchOpen(false);
                  setBatchIds([]);
                }}
              >
                关闭
              </button>
            </div>
            <div class="dialog-body batch-list">
              <For each={pageData()?.data ?? []}>
                {(photo) => (
                  <label class="batch-item">
                    <input
                      type="checkbox"
                      checked={batchIds().includes(photo.id)}
                      onChange={(event) => toggleBatch(photo.id, event.currentTarget.checked)}
                    />
                    <img src={photo.preview_url ?? photo.url ?? ""} alt="" loading="lazy" />
                    <span class="batch-item-meta">
                      <strong>{photo.id.length > 16 ? `${photo.id.slice(0, 16)}…` : photo.id}</strong>
                      <small>{photo.title || "N/A"}</small>
                    </span>
                  </label>
                )}
              </For>
            </div>
            <div class="dialog-footer">
              <Button
                class="primary-button"
                disabled={batchIds().length === 0 || batchDeleting()}
                onClick={() => void submitBatchDelete()}
              >
                {batchDeleting() ? "删除中…" : `删除 ${batchIds().length} 项`}
              </Button>
            </div>
          </form>
        </div>
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
    <div class="dialog-overlay">
      <form class="dialog-panel dialog-wide" role="dialog" aria-modal="true" onSubmit={submit}>
        <div class="table-heading dialog-heading">
          <span>编辑图片</span>
          <button class="row-action" type="button" onClick={props.onClose}>
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <label>
            标题
            <input
              value={draft().title ?? ""}
              placeholder="请输入图片标题"
              onInput={(event) => update({ title: event.currentTarget.value })}
            />
          </label>
          <label>
            链接
            <input
              value={draft().url ?? ""}
              placeholder="请输入图片链接"
              onInput={(event) => update({ url: event.currentTarget.value })}
            />
          </label>
          <label>
            预览链接
            <input
              value={draft().preview_url ?? ""}
              placeholder="请输入预览链接"
              onInput={(event) => update({ preview_url: event.currentTarget.value })}
            />
          </label>
          <label>
            视频链接
            <input
              value={draft().video_url ?? ""}
              placeholder="请输入视频链接（Live Photo）"
              onInput={(event) => update({ video_url: event.currentTarget.value })}
            />
          </label>
          <label>
            详情
            <input
              value={draft().detail ?? ""}
              placeholder="请输入图片详情"
              onInput={(event) => update({ detail: event.currentTarget.value })}
            />
          </label>
          <div class="field-row">
            <label>
              宽度（px）
              <input
                type="number"
                value={draft().width}
                onInput={(event) => update({ width: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              高度（px）
              <input
                type="number"
                value={draft().height}
                onInput={(event) => update({ height: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
          <div class="field-row">
            <label>
              经度
              <input
                value={draft().lon ?? ""}
                placeholder="请输入经度"
                onInput={(event) => update({ lon: event.currentTarget.value })}
              />
            </label>
            <label>
              纬度
              <input
                value={draft().lat ?? ""}
                placeholder="请输入纬度"
                onInput={(event) => update({ lat: event.currentTarget.value })}
              />
            </label>
          </div>
          <label>
            排序
            <input
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
          <div class="error-banner dialog-error" role="alert">
            {error()}
          </div>
        </Show>
        <div class="dialog-footer">
          <Button class="primary-button" type="submit" disabled={pending()}>
            {pending() ? "更新中…" : "更新"}
          </Button>
        </div>
      </form>
    </div>
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
    <div class="dialog-overlay">
      <div class="dialog-panel dialog-wide" role="dialog" aria-modal="true">
        <div class="table-heading dialog-heading">
          <span>{photo().title || photo().image_name || photo().id}</span>
          <button class="row-action" type="button" onClick={props.onClose}>
            关闭
          </button>
        </div>
        <div class="dialog-body">
          <Show
            when={photo().type === 2 && photo().video_url}
            fallback={
              <img class="view-image" src={photo().preview_url ?? photo().url ?? ""} alt={photo().detail ?? ""} />
            }
          >
            <video class="view-image" src={photo().video_url ?? ""} controls muted loop playsinline />
          </Show>
          <Show when={(photo().labels ?? []).length > 0}>
            <div class="tag-row">
              <For each={photo().labels ?? []}>{(tag) => <span class="tag-chip static">{tag}</span>}</For>
            </div>
          </Show>
          <Show when={exifRows().length > 0}>
            <table class="exif-table">
              <thead>
                <tr>
                  <th>参数</th>
                  <th>值</th>
                </tr>
              </thead>
              <tbody>
                <For each={exifRows()}>
                  {(row) => (
                    <tr>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
          <div class="view-meta">
            <div><span>详情</span><strong>{photo().detail || "—"}</strong></div>
            <div><span>尺寸</span><strong>{photo().width} × {photo().height}</strong></div>
            <div><span>经纬度</span><strong>{photo().lon || "—"} / {photo().lat || "—"}</strong></div>
            <div><span>排序</span><strong>{photo().sort}</strong></div>
          </div>
          <SwitchRow label="显示状态" checked={photo().show === 0} disabled />
          <SwitchRow label="首页显示" checked={photo().show_on_mainpage === 0} disabled />
        </div>
      </div>
    </div>
  );
}
