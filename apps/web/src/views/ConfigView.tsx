import { Button } from "@ui-sdk/solid/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/solid/tabs";
import { For, Show, createSignal } from "solid-js";

import { STORAGE_PROVIDERS } from "../storage-provider";
import type { Config } from "../types";

export function StorageConfigView(props: {
  configs: Config[];
  onSaveStorage: (values: Record<string, string>) => Promise<boolean>;
}) {
  return (
    <section class="content-grid">
      <Tabs class="storage-tabs" defaultValue="s3">
        <TabsList class="storage-tab-list" aria-label="存储类型">
          <For each={STORAGE_PROVIDERS}>
            {(provider) => <TabsTab value={provider.value}>{provider.label}</TabsTab>}
          </For>
        </TabsList>
        <TabsPanel value="s3">
          <StorageConfigPanel
            title="S3 存储配置"
            fields={S3_STORAGE_FIELDS}
            configs={props.configs}
            onSave={props.onSaveStorage}
          />
        </TabsPanel>
        <TabsPanel value="r2">
          <StorageConfigPanel
            title="R2 存储配置"
            fields={R2_STORAGE_FIELDS}
            configs={props.configs}
            onSave={props.onSaveStorage}
          />
        </TabsPanel>
      </Tabs>
    </section>
  );
}

export function ConfigView() {
  return (
    <section class="content-grid">
      <BackupPanel />
    </section>
  );
}

type ImportPreview = {
  counts: Record<string, number>;
  warnings: string[];
  issues: { path: string; message: string }[];
};

function BackupPanel() {
  const [importPreview, setImportPreview] = createSignal<ImportPreview | null>(null);
  const [importPayload, setImportPayload] = createSignal<unknown>(null);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  async function previewBackup(file: File) {
    setError(null);
    setMessage(null);
    const payload = JSON.parse(await file.text()) as unknown;
    const response = await fetch("/api/backup/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      data?: ImportPreview;
      details?: ImportPreview;
    };
    if (!response.ok) {
      const preview = body.details;
      if (preview) setImportPreview(preview);
      setError("备份校验未通过");
      return;
    }
    setImportPayload(payload);
    setImportPreview(body.data ?? null);
    setMessage("备份已解析，可确认导入");
  }

  async function importBackup() {
    const payload = importPayload();
    if (!payload) return;
    setError(null);
    const response = await fetch("/api/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError("备份导入失败");
      return;
    }
    setImportPayload(null);
    setImportPreview(null);
    setMessage("备份已导入");
  }

  return (
    <section class="backup-panel">
      <div>
        <div class="eyebrow">V3 BACKUP BRIDGE</div>
        <h2>迁移旧数据</h2>
        <p>支持 `picimpact-backup` v1，导入前先预览数量与校验告警。</p>
      </div>
      <div class="backup-actions">
        <label class="file-button">
          选择 JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void previewBackup(file);
            }}
          />
        </label>
        <Button
          class="secondary-button"
          disabled={!importPayload()}
          onClick={() => importBackup()}
        >
          确认导入
        </Button>
      </div>
      <Show when={message()}>
        <span class="upload-message" role="status">
          {message()}
        </span>
      </Show>
      <Show when={error()}>
        <span class="upload-message" role="alert">
          {error()}
        </span>
      </Show>
      <Show when={importPreview()}>
        {(preview) => (
          <div class="preview-grid">
            <PreviewMetric label="Photos" value={preview().counts.images ?? 0} />
            <PreviewMetric label="Albums" value={preview().counts.albums ?? 0} />
            <PreviewMetric label="Config" value={preview().counts.configs ?? 0} />
            <PreviewMetric
              label="Relations"
              value={preview().counts.imageAlbumRelations ?? 0}
            />
          </div>
        )}
      </Show>
    </section>
  );
}

function PreviewMetric(props: { label: string; value: number }) {
  return (
    <div class="preview-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

type StorageField = {
  key: string;
  label: string;
  hint: string;
  secret?: boolean;
  pathStyle?: boolean;
  toggle?: boolean;
};

const S3_STORAGE_FIELDS: StorageField[] = [
  { key: "storage.endpoint", label: "Endpoint", hint: "S3 兼容端地址；AWS S3 可留空" },
  { key: "storage.region", label: "Region", hint: "AWS S3 默认 us-east-1，自定义端点默认 auto" },
  { key: "storage.bucket", label: "Bucket", hint: "存储桶名称" },
  { key: "storage.access_key_id", label: "Access Key ID", hint: "访问密钥 ID" },
  { key: "storage.secret_access_key", label: "Secret Access Key", hint: "访问密钥 Secret", secret: true },
  { key: "storage.force_path_style", label: "Bucket 寻址方式", hint: "默认沿用现有寻址；可选路径式或虚拟主机式", pathStyle: true },
  { key: "storage.public_url", label: "Public URL", hint: "自定义域名，可选" },
  { key: "storage.storage_folder", label: "存储文件夹", hint: "如 picimpact 或 picimpact/images，/ 或空为根路径" },
  { key: "storage.direct_download", label: "直链下载", hint: "开启后下载原图走对象存储预签名直链，关闭则由服务端代理", toggle: true },
];

const R2_STORAGE_FIELDS: StorageField[] = [
  { key: "storage.r2.account_id", label: "Account ID", hint: "Cloudflare 账户 ID" },
  { key: "storage.r2.access_key_id", label: "Access Key ID", hint: "R2 API 访问密钥 ID" },
  { key: "storage.r2.secret_access_key", label: "Secret Access Key", hint: "R2 API 访问密钥 Secret", secret: true },
  { key: "storage.r2.bucket", label: "Bucket", hint: "R2 存储桶名称" },
  { key: "storage.r2.storage_folder", label: "存储文件夹", hint: "如 picimpact 或 picimpact/images，/ 或空为根路径" },
  { key: "storage.r2.public_url", label: "Public URL", hint: "R2 公共访问域名，可选" },
  { key: "storage.r2.direct_download", label: "直链下载", hint: "开启后下载原图走 R2 预签名直链，关闭则由服务端代理", toggle: true },
];

function StorageConfigPanel(props: {
  title: string;
  fields: StorageField[];
  configs: Config[];
  onSave: (values: Record<string, string>) => Promise<boolean>;
}) {
  const [open, setOpen] = createSignal(false);
  const [draft, setDraft] = createSignal<Record<string, string>>({});
  const [pending, setPending] = createSignal(false);

  const configValue = (key: string) =>
    props.configs.find((config) => config.config_key === key)?.config_value ?? "";

  const displayValue = (field: { key: string; secret?: boolean; toggle?: boolean }) => {
    const value = configValue(field.key);
    if (field.toggle) return value === "true" ? "开启" : "关闭";
    if (!value) return "—";
    if (field.secret) {
      return value.length > 4 ? `${"•".repeat(10)}${value.slice(-4)}` : "••••••";
    }
    return value;
  };

  function openDialog() {
    setDraft(Object.fromEntries(props.fields.map((field) => [field.key, configValue(field.key)])));
    setOpen(true);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const saved = await props.onSave(draft());
      if (saved) setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div class="table-shell storage-panel">
        <div class="table-heading">
          <span>{props.title}</span>
          <button class="row-action storage-edit" type="button" onClick={openDialog}>
            编辑
          </button>
        </div>
        <div class="config-list">
          <For each={props.fields}>
            {(field) => (
              <div class="config-row">
                <strong>{field.key}</strong>
                <span>{displayValue(field)}</span>
                <small>{field.hint}</small>
              </div>
            )}
          </For>
        </div>
      </div>
      <Show when={open()}>
        <div class="dialog-overlay">
          <form class="dialog-panel" role="dialog" aria-modal="true" onSubmit={submit}>
            <div class="table-heading dialog-heading">
              <span>编辑{props.title}</span>
              <button
                class="row-action"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                关闭
              </button>
            </div>
            <div class="dialog-body">
              <For each={props.fields}>
                {(field) =>
                  field.pathStyle ? (
                    <label>
                      {field.label}（{field.key}）
                      <select
                        value={draft()[field.key] ?? ""}
                        onChange={(event) =>
                          setDraft({ ...draft(), [field.key]: event.currentTarget.value })
                        }
                      >
                        <option value="">默认</option>
                        <option value="true">路径式：endpoint/bucket</option>
                        <option value="false">虚拟主机式：bucket.endpoint</option>
                      </select>
                    </label>
                  ) : field.toggle ? (
                    <label>
                      {field.label}（{field.key}）
                      <select
                        value={draft()[field.key] === "true" ? "true" : "false"}
                        onChange={(event) =>
                          setDraft({ ...draft(), [field.key]: event.currentTarget.value })
                        }
                      >
                        <option value="false">关闭：服务端代理下载</option>
                        <option value="true">开启：对象存储直链下载</option>
                      </select>
                    </label>
                  ) : (
                    <label>
                      {field.label}（{field.key}）
                      <input
                        type={field.secret ? "password" : "text"}
                        value={draft()[field.key] ?? ""}
                        placeholder={field.hint}
                        onInput={(event) =>
                          setDraft({ ...draft(), [field.key]: event.currentTarget.value })
                        }
                      />
                    </label>
                  )
                }
              </For>
            </div>
            <div class="dialog-footer">
              <Button
                class="secondary-button"
                type="button"
                disabled={pending()}
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button class="primary-button" type="submit" disabled={pending()}>
                保存
              </Button>
            </div>
          </form>
        </div>
      </Show>
    </>
  );
}
