import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";

import { LoadingState, albumHref, exifField, labelsOf } from "../admin/shared";
import { getJson } from "../api";
import type { Photo, PublicImageDetail } from "../types";

export function PublicPreview(props: { id: string }) {
  const [detail, setDetail] = createSignal<PublicImageDetail | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [downloading, setDownloading] = createSignal(false);
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

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

  // 对齐 v3 direct-download 业务：按存储开关决定走预签名直链还是服务端代理。
  const handleDownload = async () => {
    const current = detail();
    if (!current?.data.url || downloading()) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const configResponse = await fetch("/api/public/download/config");
      const config = (
        configResponse.ok ? await configResponse.json().catch(() => null) : null
      ) as DownloadConfig | null;
      const storageType =
        storageProviderFromUrl(current.data.url) ||
        (typeof config?.data?.driver === "string" && config.data.driver
          ? config.data.driver
          : "r2");
      const directDownload =
        storageType === "s3"
          ? Boolean(config?.data?.s3DirectDownload)
          : Boolean(config?.data?.r2DirectDownload);

      let blob: Blob | null = null;
      let filename = "download.jpg";

      if (directDownload) {
        // 直链模式：服务端发预签名 URL，浏览器直接拉对象存储；失败回落代理下载。
        try {
          const presignedResponse = await fetch(
            `/api/public/download/${encodeURIComponent(current.data.id)}/presigned?storage=${storageType}`,
          );
          if (!presignedResponse.ok) throw new Error("presigned request failed");
          const presigned = (await presignedResponse.json()) as {
            data?: { url?: string; filename?: string };
          };
          const data = presigned?.data;
          if (!data?.url) throw new Error("presigned response missing url");
          const objectResponse = await fetch(data.url);
          if (!objectResponse.ok) throw new Error("object fetch failed");
          blob = await objectResponse.blob();
          if (data.filename) filename = data.filename;
        } catch {
          blob = null;
        }
      }

      if (!blob) {
        const proxyResponse = await fetch(
          `/api/public/download/${encodeURIComponent(current.data.id)}?storage=${storageType}`,
        );
        if (!proxyResponse.ok) throw new Error("download request failed");
        const disposition = proxyResponse.headers.get("content-disposition");
        const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/);
        const plain = disposition?.match(/filename="([^"]+)"/);
        if (encoded) {
          try {
            filename = decodeURIComponent(encoded[1]);
          } catch {
            filename = encoded[1];
          }
        } else if (plain) {
          filename = plain[1];
        }
        blob = await proxyResponse.blob();
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("下载失败，请重试");
      window.open(current?.data.url ?? "", "_blank");
    } finally {
      setDownloading(false);
    }
  };

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
          <button
            class="preview-download"
            type="button"
            disabled={downloading()}
            onClick={() => void handleDownload()}
          >
            {downloading() ? "下载中…" : "下载原图"}
          </button>
        </Show>
        <Show when={downloadError()}>
          <span class="upload-message" role="alert">
            {downloadError()}
          </span>
        </Show>
        <Show when={detail()?.data.album_license}>
          {(license) => <span class="preview-license">{license()}</span>}
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

/** 代理模式上传的 url 带 ?storage=r2|s3 查询参数，可据此判断图片归属的存储。 */
function storageProviderFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).searchParams.get("storage") ?? undefined;
  } catch {
    return undefined;
  }
}

type DownloadConfig = {
  data?: {
    s3DirectDownload?: boolean;
    r2DirectDownload?: boolean;
    driver?: string;
  };
};
