# 图片管理与图片上传拆分（参考 v3 设计）

## Summary

将 apps/web 后台现有的「图片」视图（上传面板 + 管理列表混在一起）拆分为两个独立后台视图，对齐 v3 的信息架构：

- **上传图片**（新视图，对齐 v3 上传页形态）：相册选择、拖拽/多选文件、逐文件上传卡片（缩略图 / 文件名 / 状态：排队 → 处理中 → 上传中 → 成功 / 失败）、失败重试、移除文件、进度汇总。
- **图片管理**（由现有 PhotosView 拆出）：筛选栏（相册/显隐/相机/镜头）、卡片网格、显隐切换、绑定相册、编辑、查看、批量删除、分页 —— 保持现有能力不变，仅移除上传面板。

同时按用户确认的方案，把 App.tsx（约 2700 行单文件）拆分为独立组件文件，App.tsx 只留壳与路由。

后端 API 无需改动：`/api/photos/upload`（[app.ts:298](file:///c:/github/PicImpact/apps/web/src/server/app.ts#L298)）已支持 file + preview + exif + width/height + blurhash + album 一次落库；`/api/photos`、批量删除、绑定相册、显隐切换均已存在。

## Current State Analysis

### apps/web 现状

- `View = "dashboard" | "photos" | "albums" | "config"`，侧边栏由 [App.tsx:113](file:///c:/github/PicImpact/apps/web/src/App.tsx#L113) 的 `moduleLabels` + `Object.keys(moduleLabels)` 渲染（[App.tsx:316](file:///c:/github/PicImpact/apps/web/src/App.tsx#L316)），图标集中在 [NavIcon](file:///c:/github/PicImpact/apps/web/src/App.tsx#L460)。
- [PhotosView](file:///c:/github/PicImpact/apps/web/src/App.tsx#L794)：顶部内嵌 [UploadPanel](file:///c:/github/PicImpact/apps/web/src/App.tsx#L1462)（单张/批量 tab + 相册选择 + 顺序上传 + 一条汇总消息），下方是筛选栏 + `photo-grid` 卡片网格 + 编辑/查看/绑定相册/批量删除弹窗 + 分页。
- 客户端处理管线已在 [photo-client.ts](file:///c:/github/PicImpact/apps/web/src/photo-client.ts)：`compressPreviewImage`（WebP 预览）、`readImageExif`（EXIF/GPS）、`readImageSize`、`encodeThumbHash`。
- 视频文件跳过预览图/EXIF/尺寸处理，直接上传（现有 UploadPanel 逻辑，[App.tsx:1487](file:///c:/github/PicImpact/apps/web/src/App.tsx#L1487)）。
- 样式类集中在 [styles.css](file:///c:/github/PicImpact/apps/web/src/styles.css)：`upload-panel`、`filter-bar`、`photo-grid`、`photo-card`、`dialog-overlay/dialog-panel`、`pager` 等。
- 技术约束（AGENTS.md）：Solid 2，使用 `createEffect(compute, effect)` 两参数形式；Hono app 保持 runtime-neutral。

### v3 参考

- 侧边栏独立菜单：`/admin/upload`（上传图片）在 [app-sidebar.tsx:50](file:///c:/github/PicImpact/apps/v3/components/layout/admin/app-sidebar.tsx#L50)，`/admin/list`（图片管理）在 [app-sidebar.tsx:55](file:///c:/github/PicImpact/apps/v3/components/layout/admin/app-sidebar.tsx#L55)。
- 上传页 [multiple-file-upload.tsx](file:///c:/github/PicImpact/apps/v3/components/admin/upload/multiple-file-upload.tsx)：顶部存储/相册选择 → 拖拽 Dropzone（提示文案 + 数量上限）→ 逐文件卡片（预览、元信息、删除）→ 每个文件独立处理（EXIF/GPS → thumbhash → 上传 → 落库），并发处理，toast 汇总。
- 管理页 [list-props.tsx](file:///c:/github/PicImpact/apps/v3/components/admin/list/list-props.tsx)：筛选栏 + 批量删除/刷新按钮 + 卡片网格（相册 Badge、查看、显隐 Switch、排序 Badge、绑定相册、编辑）+ 分页 + 空状态区分（无数据 vs 筛选无结果）。

## Proposed Changes

### 1. 拆分组件文件（代码组织）

| 新文件 | 内容（自 App.tsx 迁出） |
| --- | --- |
| `src/types.ts` | `View`、`Photo`、`Album`、`Config`、`AdminPhotoPage`、`PublicImage`、`PublicImagePage`、`PublicImageDetail`、`Dashboard` 等类型 |
| `src/api.ts` | `getJson` 助手 |
| `src/admin/shared.tsx` | `NavIcon`、`ToolbarIcon`、`LoadingState`、`EmptyState`、`FilterSelect`、`TagInput`、`SwitchRow`、`exifValue`、`formatExifDateTime`、`PHOTO_PAGE_SIZE` |
| `src/views/DashboardView.tsx` | `DashboardView` + `DashboardHeading` + `DashboardMetric` + `CoverageMetric` |
| `src/views/PhotosView.tsx` | `PhotosView`（见第 3 点）+ `PhotoEditDialog` + `PhotoViewDialog` |
| `src/views/UploadView.tsx` | **新建**（见第 4 点） |
| `src/views/AlbumsView.tsx` | `AlbumsView` + `AlbumFormDialog` |
| `src/views/ConfigView.tsx` | `ConfigView` + `StorageConfigPanel`，并把目前内联在 AdminApp 里的 V3 备份迁移面板（[App.tsx:410-451](file:///c:/github/PicImpact/apps/web/src/App.tsx#L410)）随视图迁入 |
| `src/public/HomeView.tsx` | `PublicHome` + `PublicNav` + `MasonryPhoto` + `PublicGallerySkeleton` + `albumHref` + `SummaryMetric` |
| `src/public/PreviewView.tsx` | `PublicPreview` + `PreviewFact` + `exifField` + `exifSummary` + `labelsOf` + `PreviewMetric` |

`App.tsx` 保留：`getRoute`、`AdminApp`（壳 + 侧栏 + 工具栏 + 视图切换）、`App` 根组件。跨文件仅导出视图组件与类型，不改行为。

### 2. 菜单拆分（App.tsx + types.ts）

- `View` 增加 `"upload"`：`"dashboard" | "upload" | "photos" | "albums" | "config"`。
- `moduleLabels`（按 v3 命名与顺序）：`dashboard: "概览"`, `upload: "上传图片"`, `photos: "图片管理"`, `albums: "相册"`, `config: "配置"`。侧边栏渲染逻辑不变（遍历 `moduleLabels` 的 keys，自动出现新菜单项）。
- `NavIcon` 增加 `upload` 分支（上传云/箭头 SVG，风格与现有图标一致）。
- `AdminApp` 增加视图分支：`<Show when={view() === "upload"}><UploadView albums={albums()} onChanged={refresh} onGoManage={() => setView("photos")} /></Show>`；`photos` 分支传参不变。

### 3. PhotosView → 纯管理视图（src/views/PhotosView.tsx）

- 删除顶部 `<UploadPanel …/>` 引用与 `UploadPanel` 函数本体。
- 空态文案改为引导上传：「还没有照片」+「通过「上传图片」页写入第一条记录。」（不再提上传面板）。
- 其余（筛选栏、网格、显隐切换、绑定相册、编辑/查看弹窗、批量删除、分页）保持现有实现原样迁移。

### 4. 新建 UploadView（src/views/UploadView.tsx，对齐 v3）

**布局（复用现有样式类，新增少量 CSS）：**

1. 顶部配置行：相册选择（必选，`filter-select`；未选相册时禁用选择文件）。
2. 拖拽 Dropzone：点击打开文件选择器（`multiple`）+ `dragover/dragleave/drop` 拖拽支持；提示文案（支持图片/视频、可多选）。
3. 上传队列：逐文件卡片 `upload-item` —— 左侧缩略图（`URL.createObjectURL`，视频显示占位图标），中间文件名 + 格式化大小 + 状态行，右侧操作（失败重试 / 移除）。
4. 汇总条：`共 N 个 · 成功 X · 失败 Y`；全部完成后提供「去图片管理查看」按钮（`onGoManage`）与「清空已完成」。

**逐文件状态机：** `pending`（排队）→ `processing`（生成预览/EXIF/thumbhash，仅图片）→ `uploading`（POST 中）→ `done` | `error`（记录错误信息，可重试）。

**处理管线（复用 photo-client.ts，对齐 v3 流程）：**

- 图片：`compressPreviewImage`（quality 0.2，WebP）→ `readImageExif`（exif + lat/lon）→ `readImageSize`（width/height）→ `encodeThumbHash`（blurhash）→ `FormData`（file + preview + exif + lat + lon + width + height + blurhash + album）→ `POST /api/photos/upload`。
- 视频：跳过客户端处理，仅 `file + album`。
- HEIC/浏览器无法解码的图：处理阶段抛错时降级为「原样上传、无预览图/EXIF」（后端已把 `preview_url` 回退为原图 url），状态标注「已上传（未生成预览）」。本次不实现 v3 的 HEIC 服务端转换（apps/web 无对应能力）。

**决策：顺序上传**（与现有实现一致）。逐文件状态实时更新，避免客户端并发压缩多张图的内存压力；这与 v3 的 Promise.all 并发不同，是刻意取舍。

**上传成功后：** 调用 `props.onChanged()` 刷新全局数据（概览计数等）。

**CSS（styles.css 新增）：** `.upload-view`、`.upload-dropzone`（含 `.dragover` 态）、`.upload-queue`、`.upload-item`（缩略图/元信息/状态徽标/操作区）、状态徽标色（`.upload-status.done/.error/.uploading/.processing`）。配色沿用 `.app-shell` 作用域 CSS 变量。

## Assumptions & Decisions

1. 后端接口全部复用，不改 Hono 路由与 store 层。
2. 上传视图顺序上传；不实现 HEIC 转换、OpenList 存储选择（apps/web 仅 S3/R2，由存储配置决定）。
3. 「图片管理」能力保持现状（已对齐 v3 列表页核心能力），仅移除上传面板并调整空态文案。
4. 视频上传行为与现状一致（无预览/EXIF）。
5. 不改 UI SDK 组件本体（遵守 AGENTS.md），仅按现有 `Button` 等用法组合。
6. 公共前台（HomeView/PreviewView）只做等价迁移，不改任何行为与文案。

## Verification

1. `pnpm -F @picimpact/web typecheck`（tsc --noEmit）通过。
2. `pnpm -F @picimpact/web build` 通过。
3. `pnpm -F @picimpact/web dev` 手动验证：
   - 侧边栏出现「概览 / 上传图片 / 图片管理 / 相册 / 配置」，高亮切换正确；
   - 上传图片页：未选相册不可选文件；选相册后多选 2+ 张图 + 1 个视频 → 逐文件卡片状态流转（处理中 → 上传中 → 成功），缩略图与汇总条正确；故意断网制造一条失败 → 显示错误并可重试成功；「清空已完成」「去图片管理查看」可用；
   - 图片管理页：筛选/显隐切换/绑定相册/编辑/查看/批量删除/分页与拆分前行为一致；空库时显示引导文案；
   - 上传成功后概览数据与图片管理列表能刷新出新记录；
   - 前台首页与预览页（`/`、`/preview/:id`）渲染与拆分前一致。
