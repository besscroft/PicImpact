import { Button } from "@ui-sdk/solid/button";
import { For, Show, createSignal, onCleanup } from "solid-js";

import {
  compressPreviewImage,
  encodeThumbHash,
  readImageExif,
  readImageSize,
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
};

const STATUS_LABEL: Record<UploadStatus, string> = {
  pending: "待上传",
  processing: "处理中",
  uploading: "上传中",
  done: "成功",
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
): Promise<{ ok: boolean; status: number; body: { message?: string } | null }> {
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
  onGoManage: () => void;
}) {
  const [album, setAlbum] = createSignal("");
  const [storage, setStorage] = createSignal<StorageProvider>("r2");
  const [title, setTitle] = createSignal("");
  const [detail, setDetail] = createSignal("");
  const [items, setItems] = createSignal<UploadItem[]>([]);
  const [dragOver, setDragOver] = createSignal(false);
  const [running, setRunning] = createSignal(false);

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
  }

  // 文件只暂存待上传，由「开始上传」按钮或重试手动触发队列
  function startUpload() {
    if (!album() || running() || pendingCount() === 0) return;
    scheduleQueue();
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
    let changed = false;
    try {
      for (;;) {
        const next = items().find((item) => item.status === "pending");
        if (!next) break;
        // 单项失败不中断整个队列
        try {
          if (await uploadItem(next.id, provider)) changed = true;
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
      if (changed) void props.onChanged();
    }
  }

  async function uploadItem(id: string, provider: StorageProvider) {
    const item = items().find((entry) => entry.id === id);
    if (!item) return;
    const albumValue = album();
    if (!albumValue) {
      patchItem(id, { status: "error", error: "请先选择相册" });
      return;
    }
    const formData = new FormData();
    formData.set("file", item.file);
    formData.set("storage", provider);
    formData.set("album", albumValue);
    // 批量填写：每个文件轮到上传时读取当前输入值
    if (title().trim()) formData.set("title", title().trim());
    if (detail().trim()) formData.set("detail", detail().trim());
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
        formData.set("blurhash", await encodeThumbHash(item.file));
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
      patchItem(id, { status: "done", error: undefined, progress: 100 });
      return true;
    } catch (cause) {
      patchItem(id, {
        status: "error",
        error: cause instanceof Error ? cause.message : "上传失败",
        progress: 0,
      });
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

  onCleanup(() => {
    for (const item of items()) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  });

  return (
    <section class="content-grid upload-view">
      <div class="upload-config">
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
        <label class="upload-config-field">
          标题（可选）
          <input
            class="upload-config-input"
            type="text"
            value={title()}
            placeholder="应用到本次所有上传"
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </label>
        <label class="upload-config-field">
          描述（可选）
          <input
            class="upload-config-input"
            type="text"
            value={detail()}
            placeholder="应用到本次所有上传"
            onChange={(event) => setDetail(event.currentTarget.value)}
          />
        </label>
        <span class="upload-config-hint">上传的图片会归入所选相册，可在图片管理中调整。</span>
      </div>

      <div
        class={`upload-dropzone${dragOver() ? " dragover" : ""}`}
        role="button"
        tabindex="0"
        aria-disabled={album() ? undefined : "true"}
        onClick={(event) => {
          if (!album()) return;
          if ((event.target as HTMLElement).closest("input")) return;
          event.currentTarget.querySelector("input")?.click();
        }}
        onKeyDown={(event) => {
          if (!album()) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.querySelector("input")?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (album()) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!album() || !event.dataTransfer) return;
          addFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          disabled={!album() || running()}
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
        <p>
          {album()
            ? "拖拽文件到这里，或点击选择文件（可多选）"
            : "请先选择相册，再选择要上传的文件"}
        </p>
        <small>支持图片与视频；加入队列后点击「开始上传」。</small>
      </div>

      <Show when={items().length > 0}>
        <div class="upload-summary">
          <span>
            共 {items().length} 个 · 待上传 {pendingCount()} · 成功 {doneCount()} · 失败{" "}
            {errorCount()}
            {running() ? " · 上传中…" : ""}
          </span>
          <div class="upload-summary-actions">
            <Show when={pendingCount() > 0}>
              <Button
                class="primary-button"
                type="button"
                disabled={!album() || running()}
                onClick={startUpload}
              >
                开始上传
              </Button>
            </Show>
            <Show when={doneCount() > 0}>
              <button class="row-action" type="button" onClick={clearDone}>
                清空已完成
              </button>
              <Button
                class="primary-button"
                type="button"
                disabled={running()}
                onClick={() => props.onGoManage()}
              >
                去图片管理查看
              </Button>
            </Show>
          </div>
        </div>

        <div class="upload-queue">
          <For each={items()}>
            {(item) => (
              <div class={`upload-item ${item.status}`}>
                <div class="upload-thumb">
                  <Show when={item.previewUrl} fallback={<span class="upload-thumb-fallback">视频</span>}>
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
    </section>
  );
}
