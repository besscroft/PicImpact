import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";

import { LoadingState, albumHref, exifField, labelsOf } from "../admin/shared";
import { getJson } from "../api";
import { BlurhashImage } from "../components/BlurhashImage";
import type { Photo, PublicImageDetail } from "../types";

const accentCls = "text-[#6b8f1d]";
const lineCls = "border-[rgba(42,51,40,0.14)]";
const mutedCls = "text-[#6e7a68]";

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
    <div class="min-h-dvh bg-[#f4f6ee] text-[#2a3328] [font-family:'LXGW_Neo_XiHei','Noto_Sans_SC',system-ui,sans-serif]">
      <header
        class={`flex min-h-12 items-center justify-between border-b ${lineCls} px-[4vw] ${mutedCls} max-[760px]:px-[5vw]`}
      >
        <a
          class={`inline-flex cursor-pointer items-center gap-2 border-0 bg-none p-0 text-[0.78rem] no-underline transition-colors hover:text-[#6b8f1d] ${accentCls}`}
          href={albumHref(detail()?.data.album_value ?? "/")}
          aria-label="返回图库"
        >
          <span class="text-[1.45rem] leading-none">× </span>
          <span class="max-[760px]:hidden">返回图库</span>
        </a>
        <span class="max-w-[40vw] truncate text-[0.78rem] text-[#2a3328]">
          {detail()?.data.album_name ?? "Photo"}
        </span>
        <Show when={detail()?.data.url}>
          <button
            class="cursor-pointer border-0 bg-none p-0 font-[inherit] text-[0.78rem] text-inherit transition-colors hover:text-[#6b8f1d] disabled:cursor-default disabled:opacity-60"
            type="button"
            disabled={downloading()}
            onClick={() => void handleDownload()}
          >
            {downloading() ? "下载中…" : "下载原图"}
          </button>
        </Show>
        <Show when={downloadError()}>
          <span class={`text-[0.74rem] ${accentCls}`} role="alert">
            {downloadError()}
          </span>
        </Show>
        <Show when={detail()?.data.album_license}>
          {(license) => (
            <span class="max-w-[40vw] truncate text-[0.72rem] text-[#6b7261]">{license()}</span>
          )}
        </Show>
      </header>
      <Show when={loading()}>
        <LoadingState />
      </Show>
      <Show when={!loading() && error()}>
        <div class="grid min-h-[calc(100dvh-48px)] content-center place-items-center gap-3 text-center">
          <h1 class="m-0 text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-none tracking-[-0.06em] text-[#1d241a]">
            找不到这张照片
          </h1>
          <p class={`m-0 ${mutedCls}`}>{error()}</p>
          <a
            class="inline-flex cursor-pointer items-center rounded-full bg-[#6b8f1d] px-[17px] py-2.5 text-[#f6faec] transition-transform hover:-translate-y-px active:scale-[0.98]"
            href="/"
          >
            返回图库
          </a>
        </div>
      </Show>
      <Show when={!loading() && detail()}>
        {(payload) => {
          const current = () => payload().data;
          const source = () => current().preview_url || current().url;
          return (
            <main
              class={`grid min-h-[calc(100dvh-48px)] grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] max-[1100px]:grid-cols-[minmax(0,1fr)_320px] max-[760px]:block`}
            >
              <section class="relative grid min-h-[90vh] place-items-center px-[6vw] py-[34px] max-[760px]:min-h-[56dvh] max-[760px]:px-[5vw] max-[760px]:py-[18px]">
                <Show
                  when={current().type !== 2}
                  fallback={
                    <video
                      class="block h-[90vh] w-full object-contain max-[760px]:h-[56dvh]"
                      src={current().video_url ?? current().url ?? ""}
                      poster={current().preview_url ?? undefined}
                      controls
                      autoplay
                      muted
                      loop
                    />
                  }
                >
                  <Show
                    when={source()}
                    fallback={
                      <div class="grid h-full min-h-[150px] w-full place-items-center text-[0.62rem] tracking-[0.12em]">
                        NO IMAGE
                      </div>
                    }
                  >
                    <BlurhashImage
                      class="block h-[90vh] w-full bg-[#e8ecdf] max-[760px]:h-[56dvh]"
                      src={source() ?? ""}
                      blurhash={current().blurhash}
                      fit="contain"
                      alt={current().title ?? current().image_name ?? ""}
                    />
                  </Show>
                </Show>
                <Show when={payload().neighbors.previous}>
                  {(previous) => (
                    <a
                      class={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white/80 text-3xl leading-none no-underline backdrop-blur-[10px] transition-colors hover:border-[rgba(107,143,29,0.6)] hover:text-[#6b8f1d] ${lineCls} left-[22px] max-[760px]:left-3 max-[760px]:size-9`}
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
                      class={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white/80 text-3xl leading-none no-underline backdrop-blur-[10px] transition-colors hover:border-[rgba(107,143,29,0.6)] hover:text-[#6b8f1d] ${lineCls} right-[22px] max-[760px]:right-3 max-[760px]:size-9`}
                      href={`/preview/${encodeURIComponent(next().id)}`}
                      aria-label="下一张"
                    >
                      ›
                    </a>
                  )}
                </Show>
              </section>
              <aside
                class={`grid content-start gap-[22px] max-h-[90vh] overflow-y-auto border-l px-[34px] pt-[58px] pb-12 ${lineCls} max-[760px]:min-h-auto max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:px-[5vw] max-[760px]:pt-[30px] max-[760px]:pb-[52px]`}
              >
                <div class="mb-2 text-[0.72rem] tracking-[0.08em] uppercase">PHOTO / DETAIL</div>
                <h1 class="m-0 text-[clamp(1.7rem,3vw,2.8rem)] font-semibold leading-none tracking-[-0.06em] text-[#1d241a]">
                  {current().title || current().image_name || "未命名照片"}
                </h1>
                <Show when={current().detail}>
                  <p class={`m-0 text-[0.9rem] leading-[1.7] ${mutedCls}`}>{current().detail}</p>
                </Show>
                <div class={`grid gap-px border-y ${lineCls}`}>
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
                  <div class="grid gap-2">
                    <span class="text-[0.74rem] text-[#6e7a68]">标签</span>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={labelsOf(current())}>
                        {(label) => (
                          <span class={`rounded-full border px-2 py-1 text-[0.7rem] ${lineCls} ${accentCls}`}>
                            {label}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
                <button
                  class={`w-fit cursor-pointer border-0 bg-transparent p-0 text-[0.76rem] transition-colors hover:text-[#6b8f1d] ${mutedCls}`}
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
      <div class={`flex justify-between gap-4 border-b border-[rgba(42,51,40,0.08)] py-2.5 last:border-b-0`}>
        <span class="text-[0.74rem] text-[#6e7a68]">{props.label}</span>
        <strong class="text-right text-[0.8rem] font-medium text-[#2a3328]">{props.value}</strong>
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
