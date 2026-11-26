import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";

import { LoadingState, albumHref, exifField, labelsOf } from "../admin/shared";
import { getJson } from "../api";
import type { Photo, PublicImageDetail } from "../types";

export function PublicPreview(props: { id: string }) {
  const [detail, setDetail] = createSignal<PublicImageDetail | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getJson<PublicImageDetail>(`/api/public/images/${encodeURIComponent(props.id)}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片不存在");
    } finally {
      setLoading(false);
    }
  }

  createEffect(
    () => props.id,
    () => {
      void load();
    },
  );

  createEffect(
    () => detail(),
    () => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const current = detail();
        if (!current) return;
        if (event.key === "Escape") {
          window.location.href = albumHref(current.data.album_value ?? "/");
        } else if (event.key === "ArrowLeft" && current.neighbors.previous) {
          window.location.href = `/preview/${encodeURIComponent(current.neighbors.previous.id)}`;
        } else if (event.key === "ArrowRight" && current.neighbors.next) {
          window.location.href = `/preview/${encodeURIComponent(current.neighbors.next.id)}`;
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
    },
  );

  return (
    <div class="preview-shell">
      <header class="preview-topbar">
        <a
          class="preview-close"
          href={albumHref(detail()?.data.album_value ?? "/")}
          aria-label="返回图库"
        >
          × <span>返回图库</span>
        </a>
        <span class="preview-counter">
          {detail()?.data.album_name ?? "Photo"}
        </span>
        <Show when={detail()?.data.url}>
          <a class="preview-download" href={detail()?.data.url ?? ""} download>
            下载原图
          </a>
        </Show>
      </header>
      <Show when={loading()}>
        <LoadingState />
      </Show>
      <Show when={!loading() && error()}>
        <div class="preview-error">
          <h1>找不到这张照片</h1>
          <p>{error()}</p>
          <a class="primary-button" href="/">
            返回图库
          </a>
        </div>
      </Show>
      <Show when={!loading() && detail()}>
        {(payload) => {
          const current = () => payload().data;
          const source = () => current().preview_url || current().url;
          return (
            <main class="preview-layout">
              <section class="preview-stage">
                <Show
                  when={current().type !== 2}
                  fallback={
                    <video
                      class="preview-media"
                      src={current().video_url ?? current().url ?? ""}
                      poster={current().preview_url ?? undefined}
                      controls
                      autoplay
                      muted
                      loop
                    />
                  }
                >
                  <Show when={source()} fallback={<div class="preview-no-image">NO IMAGE</div>}>
                    <img
                      class="preview-media"
                      src={source() ?? ""}
                      alt={current().title ?? current().image_name ?? ""}
                    />
                  </Show>
                </Show>
                <Show when={payload().neighbors.previous}>
                  {(previous) => (
                    <a
                      class="preview-arrow previous"
                      href={`/preview/${encodeURIComponent(previous().id)}`}
                      aria-label="上一张"
                    >
                      ‹
                    </a>
                  )}
                </Show>
                <Show when={payload().neighbors.next}>
                  {(next) => (
                    <a
                      class="preview-arrow next"
                      href={`/preview/${encodeURIComponent(next().id)}`}
                      aria-label="下一张"
                    >
                      ›
                    </a>
                  )}
                </Show>
              </section>
              <aside class="preview-inspector">
                <div class="eyebrow">PHOTO / DETAIL</div>
                <h1>{current().title || current().image_name || "未命名照片"}</h1>
                <Show when={current().detail}>
                  <p class="preview-detail">{current().detail}</p>
                </Show>
                <div class="preview-facts">
                  <PreviewFact label="尺寸" value={`${current().width} × ${current().height}`} />
                  <PreviewFact label="相册" value={current().album_name ?? "首页"} />
                  <PreviewFact label="相机" value={exifField(current(), "make", "model")} />
                  <PreviewFact label="镜头" value={exifField(current(), "lens_model")} />
                  <PreviewFact label="光圈" value={exifField(current(), "f_number")} />
                  <PreviewFact label="快门" value={exifField(current(), "exposure_time")} />
                  <PreviewFact label="ISO" value={exifField(current(), "iso_speed_rating")} />
                  <PreviewFact label="焦段" value={exifField(current(), "focal_length")} />
                </div>
                <Show when={labelsOf(current()).length > 0}>
                  <div class="preview-tags">
                    <span class="fact-label">标签</span>
                    <div>
                      <For each={labelsOf(current())}>{(label) => <span>{label}</span>}</For>
                    </div>
                  </div>
                </Show>
                <button
                  class="copy-link"
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                  }}
                >
                  复制分享链接
                </button>
              </aside>
            </main>
          );
        }}
      </Show>
    </div>
  );
}

function PreviewFact(props: { label: string; value: string | null }) {
  return (
    <Show when={props.value}>
      <div class="preview-fact">
        <span>{props.label}</span>
        <strong>{props.value}</strong>
      </div>
    </Show>
  );
}
