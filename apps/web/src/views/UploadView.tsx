import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { toast } from "@ui-sdk/solid/toast";

import {
  compressPreviewImage,
  convertHeicToJpeg,
  encodeThumbHash,
  isHeicFile,
  readImageExif,
  readImageSize,
  type ExifInfo,
} from "../photo-client";
import {
  badgeCls,
  badgeDestructive,
  badgeSecondary,
  formatExifDateTime,
  inputCls,
  rowAction,
  selectCls,
  TagInput,
} from "../admin/shared";
import { isStorageProvider, STORAGE_PROVIDERS, type StorageProvider } from "../storage-provider";
import type { Album } from "../types";

type UploadStatus = "pending" | "processing" | "uploading" | "done" | "error";

type UploadItemKind = "image" | "video" | "livephoto";

type UploadItem = {
  id: string;
  kind: UploadItemKind;
  /** image/livephoto 为图片文件（livephoto 的 file 始终是图），video 为视频文件 */
  file: File;
  /** livephoto 的视频部分 */
  videoFile?: File;
  status: UploadStatus;
  error?: string;
  previewUrl?: string;
  degraded?: boolean;
  progress: number;
  width?: number;
  height?: number;
  exif?: ExifInfo;
  gpsLat?: string;
  gpsLon?: string;
  blurhash?: string;
  uploaded?: { key: string; url: string; previewUrl: string };
  /** livephoto 视频部分的上传结果 */
  videoUploaded?: { key: string; url: string };
};

/** 文件主名（去扩展名，小写），LivePhoto 图/视频按同名配对 */
function fileStem(name: string) {
  return name.replace(/\.[^.]+$/, "").toLowerCase();
}

const EXIF_FIELDS: Array<[keyof ExifInfo, string]> = [
  ["dateTime", "拍摄时间"],
  ["lens_model", "镜头"],
  ["focal_length", "焦距"],
  ["f_number", "光圈"],
  ["exposure_time", "快门"],
  ["iso_speed_rating", "ISO"],
  ["exposure_program", "曝光程序"],
  ["exposure_mode", "曝光模式"],
  ["white_balance", "白平衡"],
  ["color_space", "色彩空间"],
  ["bits", "位深"],
];

function exifEntries(exif?: ExifInfo) {
  if (!exif) return [];
  const entries: { label: string; value: string }[] = [];
  const camera = [exif.make, exif.model].filter(Boolean).join(" ");
  if (camera) entries.push({ label: "相机", value: camera });
  for (const [key, label] of EXIF_FIELDS) {
    // String 防御：解析库可能产出非 string 字段，避免在响应式上下文里抛错（Solid 2 会 HALT 整个系统）
    const raw = String(exif[key] ?? "").trim();
    // 拍摄时间从 EXIF 的 2025:03:29 转为阅读习惯的 2025-03-29
    const value = key === "dateTime" ? formatExifDateTime(raw) : raw;
    if (value) entries.push({ label, value });
  }
  return entries;
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  pending: "待上传",
  processing: "处理中",
  uploading: "上传中",
  done: "已上传",
  error: "失败",
};

function uploadStatusCls(status: UploadStatus) {
  if (status === "error") return badgeDestructive;
  if (status === "done") return badgeSecondary;
  return `${badgeCls} border border-border text-muted-foreground`;
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// XMLHttpRequest 才能拿到上传进度事件，fetch 不支持
function uploadWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{
  ok: boolean;
  status: number;
  body: { message?: string; object?: { key: string; url: string; previewUrl: string } } | null;
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        body: (xhr.response as { message?: string } | null) ?? null,
      });
    };
    xhr.onerror = () => reject(new Error("网络错误，上传失败"));
    xhr.send(formData);
  });
}

export function UploadView(props: {
  albums: Album[];
  onChanged: () => Promise<void>;
  registerSave?: (api: {
    save: () => Promise<void>;
    ready: () => boolean;
    hint: () => string;
  } | null) => void;
}) {
  const [album, setAlbum] = createSignal("");
  const [storage, setStorage] = createSignal<StorageProvider>("r2");
  const [title, setTitle] = createSignal("");
  const [detail, setDetail] = createSignal("");
  const [labels, setLabels] = createSignal<string[]>([]);
  const [items, setItems] = createSignal<UploadItem[]>([]);
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [dragOver, setDragOver] = createSignal(false);
  const [running, setRunning] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  const selectedItem = () => {
    const list = items();
    return list.find((entry) => entry.id === selectedId()) ?? list[0];
  };

  const doneCount = () => items().filter((item) => item.status === "done").length;
  const errorCount = () => items().filter((item) => item.status === "error").length;
  const pendingCount = () => items().filter((item) => item.status === "pending").length;
  const hasActive = () =>
    items().some((item) => item.status === "processing" || item.status === "uploading");

  function patchItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addFiles(fileList: FileList | File[]) {
    if (!album()) {
      toast.error("请先选择相册", { description: "选择相册后才能上传文件" });
      return;
    }
    const parseIds: string[] = [];
    const next = [...items()];
    for (const file of Array.from(fileList)) {
      const image = file.type.startsWith("image/");
      const video = file.type.startsWith("video/");
      if (!image && !video) continue;
      const stem = fileStem(file.name);
      // LivePhoto 自动配对：同名（主文件名相同）的图 + 视频合并为一个条目，支持分多次拖入
      if (video) {
        const target = next.find(
          (item) => item.kind === "image" && !item.videoFile && fileStem(item.file.name) === stem,
        );
        if (target) {
          const index = next.indexOf(target);
          next[index] = {
            ...target,
            kind: "livephoto",
            videoFile: file,
            // 图部分可能已上传过，保留 uploaded；视频部分待传
            status: "pending",
            error: undefined,
            progress: 0,
          };
          continue;
        }
      } else {
        const target = next.find((item) => item.kind === "video" && fileStem(item.file.name) === stem);
        if (target) {
          const index = next.indexOf(target);
          // 视频部分若已上传，结果转移到 videoUploaded；图片重新提供
          next[index] = {
            ...target,
            kind: "livephoto",
            file,
            previewUrl: URL.createObjectURL(file),
            videoUploaded: target.uploaded
              ? { key: target.uploaded.key, url: target.uploaded.url }
              : target.videoUploaded,
            uploaded: undefined,
            width: undefined,
            height: undefined,
            exif: undefined,
            gpsLat: undefined,
            gpsLon: undefined,
            blurhash: undefined,
            status: "pending",
            error: undefined,
            progress: 0,
          };
          parseIds.push(target.id);
          continue;
        }
      }
      const item: UploadItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind: image ? "image" : "video",
        file,
        status: "pending",
        progress: 0,
        previewUrl: image ? URL.createObjectURL(file) : undefined,
      };
      next.push(item);
      if (image) parseIds.push(item.id);
    }
    setItems(next);
    // 加入队列后立刻解析图片数据（尺寸 / EXIF），解析结果回填到详情面板
    for (const id of parseIds) {
      const item = next.find((entry) => entry.id === id);
      if (item) void parseItemMeta(item.id, item.file);
    }
    // 选择文件后自动开始上传（仅上传到对象存储，入库需点击「保存」）
    scheduleQueue();
  }

  async function parseItemMeta(id: string, file: File) {
    // EXIF 与尺寸分开解析：HEIC 等浏览器无法解码的格式仍可回填 EXIF
    try {
      const exifResult = await readImageExif(await file.arrayBuffer());
      patchItem(id, {
        exif: exifResult.exif,
        gpsLat: exifResult.gpsLat,
        gpsLon: exifResult.gpsLon,
      });
    } catch (error) {
      console.warn("图片 EXIF 解析失败", error);
    }
    try {
      const size = await readImageSize(file);
      patchItem(id, { width: size.width, height: size.height });
    } catch (error) {
      // 解析失败不影响上传，上传时仍会按原逻辑处理
      console.warn("图片尺寸解析失败", error);
    }
  }

  // 延迟到微任务再启动，避免事件批处理内同步读到旧的 items 快照
  function scheduleQueue() {
    queueMicrotask(() => void runQueue());
  }

  // 顺序处理队列，逐文件更新状态，避免并发压缩多张图的内存压力
  async function runQueue() {
    if (running()) return;
    const provider = storage();
    setRunning(true);
    try {
      for (;;) {
        const next = items().find((item) => item.status === "pending");
        if (!next) break;
        // 单项失败不中断整个队列
        try {
          await uploadItem(next.id, provider);
        } catch (error) {
          console.error("上传处理异常", error);
          patchItem(next.id, {
            status: "error",
            error: error instanceof Error ? error.message : "上传失败",
            progress: 0,
          });
        }
      }
    } finally {
      setRunning(false);
    }
  }

  // 上传仅写入对象存储（persist=0），不入库；入库在点击「保存」时进行
  async function uploadItem(id: string, provider: StorageProvider) {
    const item = items().find((entry) => entry.id === id);
    if (!item) return;

    // LivePhoto：视频部分先独立上传（无预览/EXIF 处理），占进度前半程
    let baseProgress = 0;
    let progressScale = 1;
    if (item.kind === "livephoto") {
      if (!item.videoFile) throw new Error("LivePhoto 缺少视频部分");
      if (!item.videoUploaded) {
        patchItem(id, { status: "uploading", error: undefined, progress: 0 });
        const videoForm = new FormData();
        videoForm.set("file", item.videoFile);
        videoForm.set("storage", provider);
        videoForm.set("persist", "0");
        const videoResult = await uploadWithProgress(videoForm, (percent) =>
          patchItem(id, { progress: Math.round(percent / 2) }),
        );
        if (!videoResult.ok) {
          throw new Error(videoResult.body?.message ?? "LivePhoto 视频上传失败");
        }
        const videoObject = videoResult.body?.object;
        if (!videoObject) throw new Error("上传响应缺少对象信息");
        patchItem(id, { videoUploaded: { key: videoObject.key, url: videoObject.url } });
      }
      baseProgress = 50;
      progressScale = 0.5;
    }

    const isVideo = item.kind === "video";
    const formData = new FormData();
    // HEIC：浏览器无法解码，先转 JPG 作为上传对象（前台 <img> 才能正常显示）
    let uploadFile = item.file;
    if (!isVideo && isHeicFile(uploadFile)) {
      try {
        uploadFile = await convertHeicToJpeg(uploadFile);
        patchItem(id, { degraded: false });
      } catch (cause) {
        console.warn("HEIC 转换失败，降级原样上传", cause);
        patchItem(id, { degraded: true });
      }
    }
    formData.set("file", uploadFile);
    formData.set("storage", provider);
    formData.set("persist", "0");
    if (!isVideo) {
      patchItem(id, { status: "processing", error: undefined, progress: baseProgress });
      try {
        const previewBlob = await compressPreviewImage(uploadFile, { quality: 0.2 });
        formData.set(
          "preview",
          new File([previewBlob], "preview.webp", { type: "image/webp" }),
        );
        // EXIF 从原始文件读取（转换后的 JPG 可能丢元数据）
        const { exif, gpsLat, gpsLon } = await readImageExif(await item.file.arrayBuffer());
        formData.set("exif", JSON.stringify(exif));
        if (gpsLat) formData.set("lat", gpsLat);
        if (gpsLon) formData.set("lon", gpsLon);
        const size = await readImageSize(uploadFile);
        formData.set("width", String(size.width));
        formData.set("height", String(size.height));
        patchItem(id, { width: size.width, height: size.height });
        const blurhash = await encodeThumbHash(uploadFile);
        patchItem(id, { blurhash });
        formData.set("blurhash", blurhash);
      } catch {
        // 浏览器无法解码时降级：原样上传，由后端回退 preview_url 为原图
        patchItem(id, { degraded: true });
      }
    }
    patchItem(id, { status: "uploading", error: undefined, progress: baseProgress });
    try {
      const result = await uploadWithProgress(formData, (percent) =>
        patchItem(id, { progress: baseProgress + Math.round(percent * progressScale) }),
      );
      if (!result.ok) {
        throw new Error(result.body?.message ?? "上传失败");
      }
      const object = result.body?.object;
      if (!object) {
        throw new Error("上传响应缺少对象信息");
      }
      patchItem(id, {
        status: "done",
        error: undefined,
        progress: 100,
        uploaded: { key: object.key, url: object.url, previewUrl: object.previewUrl },
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "上传失败";
      patchItem(id, {
        status: "error",
        error: message,
        progress: 0,
      });
      toast.error(`${item.file.name} 上传失败`, { description: message });
    }
  }

  // 把已上传的图片数据入库；失败时保留条目，可再次点击保存重试
  async function saveUploaded() {
    const done = items().filter(
      (item) => item.status === "done" && item.uploaded,
    );
    const albumValue = album();
    if (!albumValue || done.length === 0 || saving()) return;
    // 单张（含单个 LivePhoto 对）填写基本信息；批量上传不填，入库为空值
    const withMeta = items().length === 1;
    const meta = withMeta
      ? {
          title: title().trim() || null,
          detail: detail().trim() || null,
          labels: labels().length > 0 ? [...labels()] : null,
        }
      : { title: null, detail: null, labels: null };
    setSaving(true);
    try {
      for (const item of done) {
        const uploaded = item.uploaded!;
        const photoId = crypto.randomUUID();
        const response = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: photoId,
            image_name: item.file.name,
            url: uploaded.url,
            preview_url: uploaded.previewUrl,
            video_url:
              item.kind === "video"
                ? uploaded.url
                : item.kind === "livephoto"
                  ? (item.videoUploaded?.url ?? null)
                  : null,
            image_key: uploaded.key,
            type: item.kind === "image" ? 1 : 2,
            title: meta.title,
            detail: meta.detail,
            width: item.width ?? 0,
            height: item.height ?? 0,
            lat: item.gpsLat || null,
            lon: item.gpsLon || null,
            blurhash: item.blurhash || null,
            exif: item.exif ?? null,
            labels: meta.labels,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(payload?.message ?? `保存失败（${response.status}）`);
        }
        // POST /api/photos 不含相册字段，绑定走独立端点
        const bindResponse = await fetch(`/api/photos/${photoId}/album`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ album_value: albumValue }),
        });
        if (!bindResponse.ok) {
          throw new Error("相册绑定失败");
        }
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }
      toast.success(`已保存 ${done.length} 个文件`, {
        description: `相册：${props.albums.find((entry) => entry.album_value === albumValue)?.name ?? albumValue}`,
      });
      await props.onChanged();
    } catch (cause) {
      toast.error("保存失败", {
        description: cause instanceof Error ? cause.message : "请稍后重试",
      });
    } finally {
      setSaving(false);
    }
  }

  function retry(id: string) {
    const item = items().find((entry) => entry.id === id);
    if (!item || item.status !== "error") return;
    patchItem(id, { status: "pending", error: undefined, degraded: false, progress: 0 });
    scheduleQueue();
  }

  function removeItem(id: string) {
    const item = items().find((entry) => entry.id === id);
    if (!item) return;
    if (item.status === "processing" || item.status === "uploading") return;
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((current) => current.filter((entry) => entry.id !== id));
  }

  function clearDone() {
    setItems((current) => {
      for (const item of current) {
        if (item.status === "done" && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      return current.filter((item) => item.status !== "done");
    });
  }

  // 注册保存 API 到页面右上角工具栏（由 App 渲染「保存」按钮）
  createEffect(
    () => true,
    () => {
      props.registerSave?.({
        save: saveUploaded,
        ready: () => album() !== "" && doneCount() > 0 && !saving(),
        hint: () => (doneCount() > 0 && !album() ? "请选择相册后保存" : ""),
      });
    },
  );

  onCleanup(() => {
    props.registerSave?.(null);
    for (const item of items()) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  });

  return (
    <section class="grid gap-3.5">
      <div class="grid grid-cols-2 items-start gap-3.5 max-[767px]:grid-cols-1">
        <div class="grid content-start gap-3.5">
            <div
          class={`grid min-h-[180px] place-items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
            album() ? "cursor-pointer border-input text-muted-foreground hover:bg-muted/50" : "cursor-not-allowed border-input text-muted-foreground opacity-60"
          } ${dragOver() ? "border-ring bg-muted/50" : ""}`}
          role="button"
          tabindex="0"
          aria-disabled={album() ? undefined : "true"}
          title={album() ? undefined : "请先选择相册"}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("input")) return;
            if (!album()) {
              toast.error("请先选择相册", { description: "选择相册后才能上传文件" });
              return;
            }
            event.currentTarget.querySelector("input")?.click();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!album()) {
                toast.error("请先选择相册", { description: "选择相册后才能上传文件" });
                return;
              }
              event.currentTarget.querySelector("input")?.click();
            }
          }}
          onDragOver={(event) => {
            if (!album()) return;
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!album()) {
              toast.error("请先选择相册", { description: "选择相册后才能上传文件" });
              return;
            }
            if (!event.dataTransfer) return;
            addFiles(event.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={running() || !album()}
            style={{ display: "none" }}
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files && files.length > 0) addFiles(files);
              event.currentTarget.value = "";
            }}
          />
          <svg
            class="size-[34px] text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 13V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M4.5 15a4.5 4.5 0 0 0 4 4.5h7a4.5 4.5 0 0 0 4-4.5" />
          </svg>
          <p class="m-0 text-[0.88rem] text-foreground">
            {album() ? "拖拽文件到这里，或点击选择文件（可多选）" : "请先选择相册，再上传文件"}
          </p>
          <small class="text-xs">支持图片与视频；选择后自动上传到对象存储，点击「保存」后入库。</small>
        </div>

        <Show when={items().length > 0}>
          <div class="flex flex-wrap items-center justify-between gap-2.5 text-[0.8rem] text-muted-foreground">
            <span>
              共 {items().length} 个 · 待上传 {pendingCount()} · 已上传 {doneCount()} · 失败{" "}
              {errorCount()}
              {running() ? " · 上传中…" : ""}
            </span>
            <div class="flex items-center gap-2">
              <Show when={doneCount() > 0}>
                <button class={rowAction} type="button" onClick={clearDone}>
                  清空已上传
                </button>
              </Show>
            </div>
          </div>

          <div class="grid gap-2.5">
            <For each={items()}>
              {(item) => (
                <div
                  class={`flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    selectedItem()?.id === item.id ? "border-ring" : "border-border"
                  }`}
                  role="button"
                  tabindex="0"
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
                >
                  <div class="grid size-14 flex-none place-items-center overflow-hidden rounded-lg border border-border bg-secondary">
                    <Show
                      when={item.previewUrl}
                      fallback={<span class="text-xs text-muted-foreground">视频</span>}
                    >
                      <img class="size-full object-cover" src={item.previewUrl ?? ""} alt="" />
                    </Show>
                  </div>
                  <div class="grid min-w-0 flex-1 gap-0.5">
                    <div class="flex min-w-0 items-center gap-1.5">
                      <strong class="min-w-0 truncate text-sm font-medium text-foreground" title={item.file.name}>
                        {item.file.name}
                      </strong>
                      <Show when={item.kind === "livephoto"}>
                        <span class={`${badgeSecondary} flex-none`}>LivePhoto</span>
                      </Show>
                      <Show when={item.kind === "video"}>
                        <span class={`${badgeSecondary} flex-none`}>视频</span>
                      </Show>
                    </div>
                    <span class="text-xs text-muted-foreground">
                      {formatSize(item.file.size)}
                      <Show when={item.kind === "livephoto" && item.videoFile}>
                        {" "}
                        + {item.videoFile!.name}（{formatSize(item.videoFile!.size)}）
                      </Show>
                      <Show when={item.status === "done" && item.degraded}> · 未生成预览图</Show>
                      <Show when={item.error}> · {item.error}</Show>
                    </span>
                    <Show when={item.status === "uploading"}>
                      <div
                        class="h-1 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                      >
                        <div
                          class="h-full rounded-full bg-primary transition-[width] duration-150"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </Show>
                  </div>
                  <span class={uploadStatusCls(item.status)}>
                    {item.status === "uploading"
                      ? `上传中 ${item.progress}%`
                      : STATUS_LABEL[item.status]}
                  </span>
                  <div class="flex flex-none items-center gap-1.5">
                    <Show when={item.status === "error"}>
                      <button class={rowAction} type="button" onClick={() => retry(item.id)}>
                        重试
                      </button>
                    </Show>
                    <button
                      class={rowAction}
                      type="button"
                      aria-label="移除"
                      disabled={item.status === "processing" || item.status === "uploading"}
                      onClick={() => removeItem(item.id)}
                    >
                      移除
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        </div>

        <div class="grid min-w-0 content-start gap-3.5">
          <div class="grid gap-3.5 rounded-xl bg-secondary p-3.5">
          <div class="grid grid-cols-2 gap-3 max-[767px]:grid-cols-1">
            <label class="grid gap-1.5 text-sm font-medium text-foreground">
              存储位置
              <select
                class={selectCls}
                value={storage()}
                disabled={running()}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isStorageProvider(value)) setStorage(value);
                }}
              >
                <For each={STORAGE_PROVIDERS}>
                  {(provider) => <option value={provider.value}>{provider.label}</option>}
                </For>
              </select>
            </label>
            <label class="grid gap-1.5 text-sm font-medium text-foreground">
              相册
              <select
                class={selectCls}
                value={album()}
                onChange={(event) => setAlbum(event.currentTarget.value)}
              >
                <option value="">请选择相册</option>
                <For each={props.albums}>
                  {(item) => <option value={item.album_value}>{item.name}</option>}
                </For>
              </select>
            </label>
          </div>
          <Show
            when={items().length <= 1}
            fallback={
              <p class="m-0 text-xs text-muted-foreground">
                批量上传不填写标题、描述与标签，保存后可在图片管理中逐张编辑。
              </p>
            }
          >
            <label class="grid gap-1.5 text-sm font-medium text-foreground">
              标题
              <input
                class={inputCls}
                type="text"
                value={title()}
                onInput={(event) => setTitle(event.currentTarget.value)}
              />
            </label>
            <label class="grid gap-1.5 text-sm font-medium text-foreground">
              描述
              <textarea
                class={`${inputCls} h-auto resize-none overflow-hidden py-2 leading-4`}
                rows={1}
                value={detail()}
                onInput={(event) => {
                  setDetail(event.currentTarget.value);
                  // 输入时自动增高，默认保持一行高度
                  const el = event.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
              />
            </label>
            <label class="grid gap-1.5 text-sm font-medium text-foreground">
              标签
              <TagInput
                tags={labels()}
                placeholder="输入后回车添加"
                onChange={setLabels}
              />
            </label>
          </Show>
          </div>

          <Show when={selectedItem()}>
            <div class="grid gap-3 rounded-xl bg-secondary p-3.5">
              <div class="flex min-w-0 items-center gap-2.5">
                <div class="grid size-14 flex-none place-items-center overflow-hidden rounded-lg border border-border bg-card">
                  <Show
                    when={selectedItem()!.previewUrl}
                    fallback={<span class="text-xs text-muted-foreground">视频</span>}
                  >
                    <img class="size-full object-cover" src={selectedItem()!.previewUrl ?? ""} alt="" />
                  </Show>
                </div>
                <strong
                  class="min-w-0 truncate text-sm font-medium text-foreground"
                  title={selectedItem()!.file.name}
                >
                  {selectedItem()!.file.name}
                </strong>
              </div>
              <dl class="m-0 grid gap-1.5 text-[0.78rem]">
                <div class="flex justify-between gap-3">
                  <dt class="flex-none text-muted-foreground">尺寸</dt>
                  <dd class="m-0 text-right text-foreground [overflow-wrap:anywhere]">
                    {selectedItem()!.width
                      ? `${selectedItem()!.width} × ${selectedItem()!.height}`
                      : selectedItem()!.kind !== "image"
                        ? "—"
                        : "解析中…"}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="flex-none text-muted-foreground">大小</dt>
                  <dd class="m-0 text-right text-foreground [overflow-wrap:anywhere]">
                    {formatSize(selectedItem()!.file.size)}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="flex-none text-muted-foreground">类型</dt>
                  <dd class="m-0 text-right text-foreground [overflow-wrap:anywhere]">
                    {selectedItem()!.file.type || "未知"}
                  </dd>
                </div>
                <For each={exifEntries(selectedItem()!.exif)}>
                  {(entry) => (
                    <div class="flex justify-between gap-3">
                      <dt class="flex-none text-muted-foreground">{entry.label}</dt>
                      <dd class="m-0 text-right text-foreground [overflow-wrap:anywhere]">
                        {entry.value}
                      </dd>
                    </div>
                  )}
                </For>
                <Show when={selectedItem()!.gpsLat && selectedItem()!.gpsLon}>
                  <div class="flex justify-between gap-3">
                    <dt class="flex-none text-muted-foreground">位置</dt>
                    <dd class="m-0 text-right text-foreground [overflow-wrap:anywhere]">
                      {selectedItem()!.gpsLat}, {selectedItem()!.gpsLon}
                    </dd>
                  </div>
                </Show>
              </dl>
            </div>
          </Show>
        </div>
      </div>
    </section>
  );
}
