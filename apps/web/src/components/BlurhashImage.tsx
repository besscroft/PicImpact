import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { thumbHashToDataURL } from "thumbhash";

/**
 * thumbhash base64 → data URL，模块级 LRU 缓存（同 v3 use-blurhash 的策略）：
 * 解码要走 canvas 转换，瀑布流滚动 / 分页切换时同一张图会反复挂载，
 * 以原始 hash 为 key 缓存避免重复解码；Map 按插入序淘汰，命中时重新插入
 * 即可实现“最近使用”语义。
 */
const DECODED_CACHE_LIMIT = 512;
const decodedCache = new Map<string, string>();

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function blurhashDataUrl(hash: string | null | undefined): string | null {
  // thumbHashToDataURL 依赖 canvas，非浏览器环境（单测 node）直接跳过。
  if (!hash || typeof document === "undefined") return null;
  const cached = decodedCache.get(hash);
  if (cached !== undefined) {
    decodedCache.delete(hash);
    decodedCache.set(hash, cached);
    return cached;
  }
  let dataUrl: string;
  try {
    dataUrl = thumbHashToDataURL(base64ToBytes(hash));
  } catch {
    return null;
  }
  decodedCache.set(hash, dataUrl);
  if (decodedCache.size > DECODED_CACHE_LIMIT) {
    const oldest = decodedCache.keys().next().value;
    if (oldest !== undefined) decodedCache.delete(oldest);
  }
  return dataUrl;
}

/**
 * 带 blurhash 占位的图片：真实图加载完成前显示 thumbhash 解码出的模糊图，
 * 加载完成后由占位层淡入切换成原图；无 blurhash 时退化为容器背景色占位。
 *
 * 入场动画放在独立淡入层上，不占用 img 自身的 transform 过渡，
 * 避免和调用方的 hover 缩放等效果冲突。object-fit 用内联样式下发，
 * 以防动态拼接 class 导致 Tailwind 扫描不到。
 */
export function BlurhashImage(props: {
  src: string;
  alt?: string;
  blurhash?: string | null;
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
  /** 容器（占位背景）的 class，负责尺寸、圆角、底色等布局样式。 */
  class?: string;
  /** 原图 img 的附加 class，如 hover 缩放。 */
  imgClass?: string;
  onError?: (event: Event) => void;
}) {
  const [loaded, setLoaded] = createSignal(false);
  // src 变化（如预览页切换上一张/下一张）时回到占位态，等待新图加载。
  createEffect(
    () => props.src,
    () => {
      setLoaded(false);
    },
  );

  const fit = () => (props.fit === "contain" ? "contain" : "cover");
  const placeholder = createMemo(() => blurhashDataUrl(props.blurhash));

  return (
    <div class={`relative overflow-hidden ${props.class ?? ""}`}>
      <Show when={placeholder()}>
        {(dataUrl) => (
          <img
            class="absolute inset-0 size-full"
            style={{ "object-fit": fit() }}
            src={dataUrl()}
            alt=""
            aria-hidden="true"
          />
        )}
      </Show>
      <div
        class="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ opacity: loaded() ? 1 : 0 }}
      >
        <img
          class="block size-full"
          style={{ "object-fit": fit() }}
          src={props.src}
          alt={props.alt ?? ""}
          loading={props.loading}
          onLoad={() => setLoaded(true)}
          onError={(event) => props.onError?.(event)}
        />
      </div>
    </div>
  );
}
