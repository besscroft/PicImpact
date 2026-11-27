import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { toast } from "@ui-sdk/solid/toast";

import {
  compressPreviewImage,
  encodeThumbHash,
  readImageExif,
  readImageSize,
  type ExifInfo,
} from "../photo-client";
import { isStorageProvider, STORAGE_PROVIDERS, type StorageProvider } from "../storage-provider";
import type { Album } from "../types";

type UploadStatus = "pending" | "processing" | "uploading" | "done" | "error";

type UploadItem = {
  id: string;
  file: File;
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
};

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
    const value = exif[key].trim();
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
    const accepted: UploadItem[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "pending",
        progress: 0,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    if (accepted.length === 0) return;
    setItems((current) => [...current, ...accepted]);
    // 加入队列后立刻解析图片数据（尺寸 / EXIF），解析结果回填到详情面板
    for (const item of accepted) {
      if (!item.file.type.startsWith("video/")) void parseItemMeta(item.id, item.file);
    }
    // 选择文件后自动开始上传（仅上传到对象存储，入库需点击「保存」）
    scheduleQueue();
  }

  async function parseItemMeta(id: string, file: File) {
    try {
      const [exifResult, size] = await Promise.all([
        readImageExif(await file.arrayBuffer()),
        readImageSize(file),
      ]);
      patchItem(id, {
        width: size.width,
        height: size.height,
        exif: exifResult.exif,
        gpsLat: exifResult.gpsLat,
        gpsLon: exifResult.gpsLon,
      });
    } catch (error) {
      // 解析失败不影响上传，上传时仍会按原逻辑处理
      console.warn("图片信息解析失败", error);
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
    const formData = new FormData();
    formData.set("file", item.file);
    formData.set("storage", provider);
    formData.set("persist", "0");
    if (!item.file.type.startsWith("video/")) {
      patchItem(id, { status: "processing", error: undefined, progress: 0 });
      try {
        const previewBlob = await compressPreviewImage(item.file, { quality: 0.2 });
        formData.set(
          "preview",
          new File([previewBlob], "preview.webp", { type: "image/webp" }),
        );
        const { exif, gpsLat, gpsLon } = await readImageExif(await item.file.arrayBuffer());
        formData.set("exif", JSON.stringify(exif));
        if (gpsLat) formData.set("lat", gpsLat);
        if (gpsLon) formData.set("lon", gpsLon);
        const size = await readImageSize(item.file);
        formData.set("width", String(size.width));
        formData.set("height", String(size.height));
        const blurhash = await encodeThumbHash(item.file);
        patchItem(id, { blurhash });
        formData.set("blurhash", blurhash);
      } catch {
        // 浏览器无法解码（如 HEIC）时降级：原样上传，由后端回退 preview_url 为原图
        patchItem(id, { degraded: true });
      }
    }
    patchItem(id, { status: "uploading", error: undefined, progress: 0 });
    try {
      const result = await uploadWithProgress(formData, (percent) =>
        patchItem(id, { progress: percent }),
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
    setSaving(true);
    try {
      for (const item of done) {
        const uploaded = item.uploaded!;
        const response = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            image_name: item.file.name,
            url: uploaded.url,
            preview_url: uploaded.previewUrl,
            video_url: item.file.type.startsWith("video/") ? uploaded.url : null,
            image_key: uploaded.key,
            type: item.file.type.startsWith("video/") ? 2 : 1,
            title: title().trim() || null,
            detail: detail().trim() || null,
            width: item.width ?? 0,
            height: item.height ?? 0,
            lat: item.gpsLat || null,
            lon: item.gpsLon || null,
            blurhash: item.blurhash || null,
            exif: item.exif ?? null,
            labels: null,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(payload?.message ?? `保存失败（${response.status}）`);
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
    <section class="content-grid upload-view">
      <div class="upload-layout">
        <div class="upload-side">
          <div class="upload-config">
          <div class="upload-config-row">
            <label class="upload-config-field">
              存储位置
              <select
                class="filter-select"
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
            <label class="upload-config-field">
              相册
              <select
                class="filter-select"
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
          <label class="upload-config-field">
            标题（可选）
            <input
              class="upload-config-input"
              type="text"
              value={title()}
              placeholder="应用到本次所有上传"
              onInput={(event) => setTitle(event.currentTarget.value)}
            />
          </label>
          <label class="upload-config-field">
            描述（可选）
            <textarea
              class="upload-config-input upload-config-textarea"
              rows={1}
              value={detail()}
              placeholder="应用到本次所有上传"
              onInput={(event) => {
                setDetail(event.currentTarget.value);
                // 输入时自动增高，默认保持一行高度
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
          </label>
          </div>

          <Show when={selectedItem()}>
            <div class="upload-details">
              <div class="upload-details-head">
                <div class="upload-thumb">
                  <Show
                    when={selectedItem()!.previewUrl}
                    fallback={<span class="upload-thumb-fallback">视频</span>}
                  >
                    <img src={selectedItem()!.previewUrl ?? ""} alt="" />
                  </Show>
                </div>
                <strong title={selectedItem()!.file.name}>{selectedItem()!.file.name}</strong>
              </div>
              <dl class="upload-details-list">
                <div>
                  <dt>尺寸</dt>
                  <dd>
                    {selectedItem()!.width
                      ? `${selectedItem()!.width} × ${selectedItem()!.height}`
                      : selectedItem()!.file.type.startsWith("video/")
                        ? "—"
                        : "解析中…"}
                  </dd>
                </div>
                <div>
                  <dt>大小</dt>
                  <dd>{formatSize(selectedItem()!.file.size)}</dd>
                </div>
                <div>
                  <dt>类型</dt>
                  <dd>{selectedItem()!.file.type || "未知"}</dd>
                </div>
                <For each={exifEntries(selectedItem()!.exif)}>
                  {(entry) => (
                    <div>
                      <dt>{entry.label}</dt>
                      <dd>{entry.value}</dd>
                    </div>
                  )}
                </For>
                <Show when={selectedItem()!.gpsLat && selectedItem()!.gpsLon}>
                  <div>
                    <dt>位置</dt>
                    <dd>
                      {selectedItem()!.gpsLat}, {selectedItem()!.gpsLon}
                    </dd>
                  </div>
                </Show>
              </dl>
            </div>
          </Show>
        </div>

        <div class="upload-main">
            <div
          class={`upload-dropzone${dragOver() ? " dragover" : ""}${album() ? "" : " disabled"}`}
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
          <p>{album() ? "拖拽文件到这里，或点击选择文件（可多选）" : "请先选择相册，再上传文件"}</p>
          <small>支持图片与视频；选择后自动上传到对象存储，点击「保存」后入库。</small>
        </div>

        <Show when={items().length > 0}>
          <div class="upload-summary">
            <span>
              共 {items().length} 个 · 待上传 {pendingCount()} · 已上传 {doneCount()} · 失败{" "}
              {errorCount()}
              {running() ? " · 上传中…" : ""}
            </span>
            <div class="upload-summary-actions">
              <Show when={doneCount() > 0}>
                <button class="row-action" type="button" onClick={clearDone}>
                  清空已上传
                </button>
              </Show>
            </div>
          </div>

          <div class="upload-queue">
            <For each={items()}>
              {(item) => (
                <div
                  class={`upload-item ${item.status}${selectedItem()?.id === item.id ? " selected" : ""}`}
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
                  <div class="upload-thumb">
                    <Show
                      when={item.previewUrl}
                      fallback={<span class="upload-thumb-fallback">视频</span>}
                    >
                      <img src={item.previewUrl ?? ""} alt="" />
                    </Show>
                  </div>
                  <div class="upload-meta">
                    <strong title={item.file.name}>{item.file.name}</strong>
                    <span>
                      {formatSize(item.file.size)}
                      <Show when={item.status === "done" && item.degraded}> · 未生成预览图</Show>
                      <Show when={item.error}> · {item.error}</Show>
                    </span>
                    <Show when={item.status === "uploading"}>
                      <div
                        class="upload-progress"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                      >
                        <div
                          class="upload-progress-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </Show>
                  </div>
                  <span class={`upload-status ${item.status}`}>
                    {item.status === "uploading"
                      ? `上传中 ${item.progress}%`
                      : STATUS_LABEL[item.status]}
                  </span>
                  <div class="upload-item-actions">
                    <Show when={item.status === "error"}>
                      <button class="row-action" type="button" onClick={() => retry(item.id)}>
                        重试
                      </button>
                    </Show>
                    <button
                      class="row-action"
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
      </div>
    </section>
  );
}
