import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

import { albumHref, exifField } from "../admin/shared";
import { getJson } from "../api";
import type { Album, PublicImage, PublicImagePage } from "../types";

const galleryGap = 4;
const skeletonRatios = [
  "4 / 5", "1 / 1", "3 / 4", "5 / 4", "2 / 3", "4 / 3",
  "3 / 5", "1 / 1", "5 / 6", "6 / 5", "3 / 4", "4 / 5",
];

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
      <main id="main-content" class="px-1 pt-14 pb-0 min-[640px]:px-2">
        <Show when={error()}>
          <div class="mb-5 rounded-lg border border-gallery-border px-3.5 py-2.5 text-sm text-[#c23f34]" role="alert">
            {error()}
          </div>
        </Show>
        <Show when={!loading()} fallback={<PublicGallerySkeleton />}>
          <Show
            when={photos().length > 0}
            fallback={
              <Show when={!error()}>
                <p class="my-4 text-center">还没有公开照片</p>
              </Show>
            }
          >
            <MasonryGallery photos={photos()} />
            <Show when={page() < pages()}>
              <button
                class="mx-auto my-4 block cursor-pointer rounded-full border border-gallery-border bg-transparent px-3.5 py-1.5 font-[inherit] text-[inherit] text-[inherit] transition-colors hover:bg-gallery-accent disabled:opacity-60"
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
  const isActive = (href: string) => props.activeAlbum === href ? "page" : undefined;

  return (
    <header class="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-gallery-border/50 bg-gallery-bg/80 px-3 backdrop-blur-2xl min-[1024px]:px-4">
      <a class="flex-none text-base font-semibold whitespace-nowrap no-underline transition-opacity hover:opacity-80" href="/">
        PicImpact
      </a>
      <nav class="no-scrollbar mx-4 flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="相册">
        <a
          aria-current={isActive("/")}
          class="flex-none rounded-full px-3 py-1 text-sm whitespace-nowrap transition-colors hover:text-gallery-ink aria-[current=page]:bg-gallery-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-gallery-ink"
          href="/"
        >
          首页
        </a>
        <For each={props.albums}>
          {(album) => (
            <a
              aria-current={isActive(albumHref(album.album_value))}
              class="flex-none rounded-full px-3 py-1 text-sm whitespace-nowrap transition-colors hover:text-gallery-ink aria-[current=page]:bg-gallery-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-gallery-ink"
              href={albumHref(album.album_value)}
            >
              {album.name}
            </a>
          )}
        </For>
      </nav>
      <div class="flex flex-none items-center gap-1">
        <a
          class="grid size-11 cursor-pointer place-items-center rounded-lg text-gallery-muted no-underline transition-colors hover:bg-gallery-accent hover:text-gallery-ink"
          href="/map"
          aria-label="地图"
        >
          <GalleryIcon name="map" class="size-[18px]" />
        </a>
        <button
          class="grid size-11 cursor-pointer place-items-center rounded-lg text-gallery-muted transition-colors hover:bg-gallery-accent hover:text-gallery-ink"
          type="button"
          aria-label="搜索"
        >
          <GalleryIcon name="search" class="size-[18px]" />
        </button>
        <a
          class="grid size-11 cursor-pointer place-items-center rounded-lg text-gallery-muted no-underline transition-colors hover:bg-gallery-accent hover:text-gallery-ink max-[760px]:hidden"
          href="/admin"
          aria-label="管理"
        >
          <GalleryIcon name="admin" class="size-[18px]" />
        </a>
      </div>
    </header>
  );
}

function GalleryIcon(props: { name: "map" | "search" | "admin" | "live"; class?: string }) {
  const paths = {
    map: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z",
    search: "M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0Z M21 21l-6-6",
    admin: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    live: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18Z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z M12 12h.01",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class={props.class}>
      <path d={paths[props.name]} />
    </svg>
  );
}

function MasonryGallery(props: { photos: PublicImage[] }) {
  const [grid, setGrid] = createSignal<HTMLDivElement>();
  const [size, setSize] = createSignal({ width: 0, columns: 2 });

  createEffect(
    grid,
    (element) => {
      if (!element) return;
      const update = () => {
        const width = element.clientWidth;
        const columns = Number(getComputedStyle(element).getPropertyValue("--gallery-columns")) || 2;
        setSize((size) => size.width === width && size.columns === columns ? size : { width, columns });
      };
      const observer = new ResizeObserver(update);
      observer.observe(element);
      update();
      onCleanup(() => observer.disconnect());
    },
  );

  const layout = createMemo(() => {
    const { width, columns: columnCount } = size();
    const columnWidth = Math.max(0, (width - (columnCount - 1) * galleryGap) / columnCount);
    const heights = Array<number>(columnCount).fill(0);
    const items = props.photos.map((photo) => {
      const column = heights.indexOf(Math.min(...heights));
      const top = heights[column];
      const ratio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
      const height = Math.round(columnWidth / ratio);
      heights[column] += height + galleryGap;
      return { top, left: column * (columnWidth + galleryGap), height };
    });
    return { items, columnWidth, height: Math.max(0, Math.max(...heights) - galleryGap) };
  });

  return (
    <div
      ref={setGrid}
      class="relative [--gallery-columns:2] sm:[--gallery-columns:3] lg:[--gallery-columns:4] xl:[--gallery-columns:5]"
      style={{ height: `${layout().height}px` }}
    >
      <For each={props.photos}>
        {(photo, index) => {
          const position = () => layout().items[index()];
          return (
            <a
              class="masonry-item group absolute overflow-hidden rounded-md no-underline"
              href={`/preview/${encodeURIComponent(photo.id)}`}
              style={{
                top: `${position()?.top ?? 0}px`,
                left: `${position()?.left ?? 0}px`,
                width: `${layout().columnWidth}px`,
                height: `${position()?.height ?? 0}px`,
              }}
            >
              <MasonryPhoto photo={photo} priority={index() < 5} />
            </a>
          );
        }}
      </For>
    </div>
  );
}

function MasonryPhoto(props: { photo: PublicImage; priority: boolean }) {
  const title = () => props.photo.title || props.photo.image_name || "未命名照片";
  const source = () => props.photo.preview_url || props.photo.url;
  const exif = createMemo(() => {
    const iso = exifField(props.photo, "iso_speed_rating");
    return [
      exifField(props.photo, "focal_length"),
      exifField(props.photo, "f_number"),
      exifField(props.photo, "exposure_time"),
      iso && `ISO ${iso}`,
    ].filter(Boolean);
  });

  return (
    <div class="relative size-full bg-gallery-accent">
      <Show when={source()}>
        {(src) => (
          <img
            class="block size-full object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105"
            src={src()}
            alt=""
            loading={props.priority ? "eager" : "lazy"}
          />
        )}
      </Show>
      <div class="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 text-white opacity-0 transition-opacity duration-300 group-focus-visible:opacity-100 group-hover:opacity-100">
        <strong class="truncate text-sm font-medium">{title()}</strong>
        <Show when={exif().length > 0}>
          <div class="mt-2 grid grid-cols-2 gap-1.5" aria-hidden="true">
            <For each={exif()}>
              {(value) => (
                <span class="truncate rounded-lg bg-white/15 px-2 py-1 text-xs text-white/90 backdrop-blur-xl">
                  {value}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={props.photo.type === 2}>
        <span class="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs leading-4 text-white backdrop-blur-sm">
          <GalleryIcon name="live" class="size-3.5" /> Live
        </span>
      </Show>
    </div>
  );
}

function PublicGallerySkeleton() {
  return (
    <div
      class="columns-2 gap-1 sm:columns-3 lg:columns-4 xl:columns-5"
      aria-hidden="true"
    >
      <For each={skeletonRatios}>
        {(ratio) => (
          <div
            class="mb-1 break-inside-avoid rounded-md bg-gallery-accent/80"
            style={{ "aspect-ratio": ratio }}
          />
        )}
      </For>
    </div>
  );
}
