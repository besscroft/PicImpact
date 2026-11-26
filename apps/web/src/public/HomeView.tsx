import { For, Show, createEffect, createSignal } from "solid-js";

import { albumHref, exifSummary } from "../admin/shared";
import { getJson } from "../api";
import type { Album, PublicImage, PublicImagePage } from "../types";

export function PublicHome(props: { album: string }) {
  const [albums, setAlbums] = createSignal<Album[]>([]);
  const [photos, setPhotos] = createSignal<PublicImage[]>([]);
  const [page, setPage] = createSignal(1);
  const [pages, setPages] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function load(reset = true) {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const [albumResponse, pageResponse] = await Promise.all([
        getJson<{ data: Album[] }>("/api/public/albums"),
        getJson<PublicImagePage>(
          `/api/public/images?album=${encodeURIComponent(props.album)}&page=${reset ? 1 : page() + 1}&pageSize=60`,
        ),
      ]);
      setAlbums(albumResponse.data);
      setPhotos((current) => (reset ? pageResponse.data : [...current, ...pageResponse.data]));
      setPage(pageResponse.page);
      setPages(pageResponse.pages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图库加载失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  createEffect(
    () => props.album,
    () => {
      void load();
    },
  );

  return (
    <div class="public-shell">
      <PublicNav albums={albums()} activeAlbum={props.album} />
      <main class="public-content">
        <Show when={error()}>
          <div class="error-banner" role="alert">
            {error()}
          </div>
        </Show>
        <Show when={!loading()} fallback={<PublicGallerySkeleton />}>
          <Show
            when={photos().length > 0}
            fallback={
              <div class="public-empty">
                <span>还没有公开照片</span>
                <p>管理员将照片设为公开并加入首页后，它们会出现在这里。</p>
              </div>
            }
          >
            <div class="masonry-grid">
              <For each={photos()}>
                {(photo, index) => <MasonryPhoto photo={photo} priority={index() < 5} />}
              </For>
            </div>
            <Show when={page() < pages()}>
              <button
                class="load-more-button"
                type="button"
                disabled={loadingMore()}
                onClick={() => void load(false)}
              >
                {loadingMore() ? "加载中…" : "加载更多"}
              </button>
            </Show>
          </Show>
        </Show>
      </main>
    </div>
  );
}

function PublicNav(props: { albums: Album[]; activeAlbum: string }) {
  return (
    <header class="public-nav">
      <a class="public-brand" href="/">
        <span class="public-brand-mark">P</span>
        <span>PicImpact</span>
      </a>
      <nav class="public-albums" aria-label="相册">
        <a class={props.activeAlbum === "/" ? "active" : ""} href="/">
          首页
        </a>
        <For each={props.albums}>
          {(album) => (
            <a
              class={props.activeAlbum === album.album_value ? "active" : ""}
              href={albumHref(album.album_value)}
            >
              {album.name}
            </a>
          )}
        </For>
      </nav>
      <div class="public-nav-tools">
        <a class="public-nav-tool" href="/map" aria-label="地图">
          ⌖
        </a>
        <button class="public-nav-tool" type="button" aria-label="搜索">
          ⌕
        </button>
        <a class="public-admin-link" href="/admin">
          管理
        </a>
      </div>
    </header>
  );
}

function MasonryPhoto(props: { photo: PublicImage; priority?: boolean }) {
  const title = props.photo.title || props.photo.image_name || "未命名照片";
  const source = props.photo.preview_url || props.photo.url;
  const ratio =
    props.photo.width > 0 && props.photo.height > 0
      ? `${props.photo.width} / ${props.photo.height}`
      : "4 / 3";
  return (
    <a class="masonry-item" href={`/preview/${encodeURIComponent(props.photo.id)}`}>
      <div class="masonry-media" style={{ "aspect-ratio": ratio }}>
        <Show when={source} fallback={<div class="masonry-fallback">NO IMAGE</div>}>
          <img src={source ?? ""} alt={title} loading={props.priority ? "eager" : "lazy"} />
        </Show>
        <div class="masonry-overlay">
          <strong>{title}</strong>
          <span>{exifSummary(props.photo)}</span>
        </div>
        <Show when={props.photo.type === 2}>
          <span class="live-badge">LIVE</span>
        </Show>
      </div>
    </a>
  );
}

function PublicGallerySkeleton() {
  return (
    <div class="masonry-grid skeleton-grid" aria-hidden="true">
      <For each={Array.from({ length: 12 })}>
        {(_, index) => <div class="gallery-skeleton" style={{ "aspect-ratio": `${3 + (index() % 3)} / 4` }} />}
      </For>
    </div>
  );
}
