# apps/web 实现 direct download（r2DirectDownload / s3DirectDownload）业务

## Context

v3（旧版）已有完整的"直链下载"业务：管理员可为 S3 / R2 分别开启 `s3_direct_download` / `r2_direct_download` 开关；开启后前端下载原图走"对象存储 presigned URL"路径，否则走"服务端代理二进制 + attachment"路径。apps/web（v4 重写版）目前预览页只有一个简单的 `<a href={url} download>` 直链（[PreviewView.tsx](file:///c:/github/PicImpact/apps/web/src/public/PreviewView.tsx#L64)），没有这套业务。本次按 v3 对齐，把该业务完整移植到 apps/web（用户已确认 S3 + R2 都实现）。

## 关键现状（已探索确认）

- apps/web 有**两套 S3 实现**，presign 两条路都要覆盖：
  - [storage-s3.ts](file:///c:/github/PicImpact/apps/web/src/server/storage-s3.ts) `S3ObjectStorage`（Node 入口，@aws-sdk/client-s3）
  - [storage-s3-fetch.ts](file:///c:/github/PicImpact/apps/web/src/server/storage-s3-fetch.ts) `S3FetchObjectStorage`（Worker 入口，纯 fetch + 手写 SigV4，已有 `hmac` / `sha256Hex` / `deriveSigningKey` 可复用，Web Crypto 实现，runtime-neutral）
- [storage.ts](file:///c:/github/PicImpact/apps/web/src/server/storage.ts) `R2ObjectStorage`（Workers R2 binding）无法 presign，需降级为代理下载
- S3 与配置了凭证的 R2 在 [storage-config.ts](file:///c:/github/PicImpact/apps/web/src/server/storage-config.ts) 中都走 S3 实现，presign 对两者均可用
- [store.ts](file:///c:/github/PicImpact/apps/web/src/server/store.ts) `getPublicImage` 经 `asImageRecord`（约 :500）**丢弃了 `image_key`**，需扩展
- 配置命名约定：S3 键无前缀（`storage.bucket`），R2 键带 `.r2.`（`storage.r2.bucket`）；布尔用 'true'/'false' 字符串（如 `storage.force_path_style`）
- 无 toast 库；Solid 2（`createEffect` 两参数形式）；Hono app 保持 runtime-neutral

## 实现步骤

### 1. 存储层：presign 能力
- `src/server/storage.ts`：`ObjectStorage` 增加可选方法 `presignedGetUrl?(key: string, expiresIn?: number): Promise<string>`；`R2ObjectStorage` 不实现（binding 限制）
- `src/server/storage-s3.ts`：用 `@aws-sdk/s3-request-presigner` 的 `getSignedUrl` + `GetObjectCommand` 实现
- `src/server/storage-s3-fetch.ts`：手写 SigV4 query 预签名（GET，query 参数 `X-Amz-Algorithm/AudioCredential…`），复用文件内已有 crypto 辅助函数，保持 runtime-neutral
- `package.json`：新增 `@aws-sdk/s3-request-presigner@3.1177.0`（与 client-s3 锁步；仅 Node 入口使用，Worker bundle 不含）

### 2. store：补回 image_key
- `src/server/store.ts`：`asImageRecord` 带上 `image_key`（返回类型放宽为 `BackupImageRecord & { image_key?: string | null }`），使 `PublicImageRecord` 携带，供下载端点按 key 直取对象

### 3. 下载端点（src/server/app.ts）
- `STORAGE_CONFIG_KEYS` 追加 `storage.direct_download`、`storage.r2.direct_download`（resolver fingerprint 基于全部 storage.* 键，缓存自动失效）
- `GET /api/public/download/config`：读两个开关 + 对 s3/r2 各调一次 `resolveStorage(provider)` 探测 presign 能力，返回 `{ s3DirectDownload, r2DirectDownload, driver }`；每个标志 = `开关 === 'true' && typeof storage?.presignedGetUrl === 'function'`；`driver` 作为前端缺省 storage 参数（替代 v3 用 url 猜测的做法）；`Cache-Control: private, max-age=60`
- `GET /api/public/download/:id/presigned?storage=`：`store.getPublicImage(id)`（404 兜底）；key = `image_key ?? 从 url 推导`（剥 scheme+host 或 `/api/storage/` 前缀，再剥 storageFolder）；filename = `image_name ?? url 尾段 decodeURIComponent`；无 presign 能力 → 400；返回 `{ url, filename }`（原始字符串，不做双重编码）
- `GET /api/public/download/:id?storage=`：`storage.get(key)` 返回二进制 + `Content-Disposition: attachment; filename="…"; filename*=UTF-8''…` + `Cache-Control: private, no-store`
- provider 参数缺省回退 `storage.driver` 配置值；非法值 400；存储未配置 503（复用 `jsonError`）

### 4. 管理界面开关（src/views/ConfigView.tsx）
- `StorageField` 加 `toggle?: boolean`；编辑弹窗渲染 checkbox（'true'/'false'），列表 `displayValue` 对 toggle 显示"开启/关闭"
- `S3_STORAGE_FIELDS` 追加 `storage.direct_download`；`R2_STORAGE_FIELDS` 追加 `storage.r2.direct_download`（hint 说明：开启后下载原图走对象存储直链）

### 5. 前端下载按钮（src/public/PreviewView.tsx）
- `<a download>` 改为 `<button>` + 下载状态 signal；onClick 异步：取 `/api/public/download/config` → 按 flag 走 presigned（fetch 后仍拉 blob）或 proxy → object URL 触发保存；presigned 失败自动回退 proxy；整体失败行内提示 + 兜底 `window.open(url)`
- `PublicImageRecord.album_license` 存在时，按钮下方行内提示 license 文案（替代 v3 的 toast）

### 6. 测试（tests/worker.test.ts）
- config 端点空库返回双 false；`/download/:id` 无图片 404；非法 storage 400；存储未配置 503
- 直接实例化 `S3FetchObjectStorage` 单测校验 presigned URL 结构（含 X-Amz-Algorithm/Credential/Signature 参数）

## 复用清单
- v3 参考：`apps/v3/hono/open/download.ts`（端点与 deriveFilename/buildContentDisposition）、`apps/v3/components/album/preview-image.tsx#handleDownload`（前端流程）
- apps/web：`resolveStorage`（storage-config.ts，带缓存）、`jsonError`（app.ts）、`hmac/sha256Hex/deriveSigningKey`（storage-s3-fetch.ts）、`encodePath`（storage.ts）

## 验证
1. `pnpm --filter @picimpact/web typecheck`
2. `pnpm --filter @picimpact/web test`
3. 手动：`pnpm web:dev` → 管理端配置 S3/R2 并切换 `direct_download` 开关 → `/preview/:id` 点下载原图，开关 true/false 各验一次（观察请求走 presigned 还是 proxy、文件名是否正确）
4. `pnpm dev:cloudflare`（如环境允许）验证 R2 binding 模式降级走 proxy
