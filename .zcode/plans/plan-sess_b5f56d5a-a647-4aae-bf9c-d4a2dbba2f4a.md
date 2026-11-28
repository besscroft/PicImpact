# 上传页：单张详情 / 批量跳过 / LivePhoto 成对上传

## Context

当前 v4 上传页只有一种混合模式：全局"标题/描述/标签"字段应用到本次所有上传（批量语义），没有单张详情填写，也没有 LivePhoto 支持（iPhone LivePhoto 图是 HEIC，浏览器解码不了，目前只能降级原样上传导致前台显示裂图）。目标：

1. **单张上传完善**：只上传一个文件时显示详情表单（标题/描述/标签），保存时写入
2. **批量上传**：多文件时自动隐藏表单（"批量不填基本信息"），保存时空值入库，逻辑上无需用户干预
3. **LivePhoto 上传**：同名文件自动配对（`IMG_1234.HEIC/JPG` + `IMG_1234.MOV` 主文件名相同即一对，大小写不敏感），HEIC 自动转 JPG；未配对上的视频按普通视频处理；批量导出 LivePhoto 拖一次全部自动配对

**探索结论（决定了方案形状）**：
- DB schema 完全兼容：`video_url` 列 + `type: 1|2` 已存在，无需迁移。LivePhoto = 一条记录 `type=2`、`url`=图片对象、`video_url`=MOV（v3 同款语义）
- 服务端零改动：`POST /api/photos/upload` 已支持 `video/*`（含 MOV）与 persist=0；`POST /api/photos` schema 已接受 `type/video_url`；相册绑定端点 `PUT /api/photos/:id/album` 已存在
- 前台零改动：PreviewView 对 `type=2` 用 `<video src={video_url} poster={preview_url}>` 播放（LivePhoto 的 MOV 直接可播）、HomeView 有 Live 徽章、PhotosView 编辑对话框已支持 video_url
- **顺带修复现存缺口**：`saveUploaded` 入库时从未调相册绑定端点，保存的图实际没进相册
- **新依赖**：`heic-to`（v3 同款）客户端 HEIC→JPG 转换

## 改动文件

### 1. `apps/web/package.json`
新增依赖 `heic-to`（v3 客户端 HEIC 转换同款库）。

### 2. `apps/web/src/photo-client.ts`
新增 `convertHeicToJpeg(file): Promise<File>`：`heicTo({ blob, type: "image/jpeg" })` 封装 + `isHeicFile(file)` 判断（MIME `image/heic|heif` 或扩展名 `.heic/.heif`，MIME 可能为空所以扩展名兜底）。转换后文件重命名为 `.jpg`。

### 3. `apps/web/src/views/UploadView.tsx`（主要改造）

**UploadItem 扩展**：
```ts
kind: "image" | "video" | "livephoto";   // 新增
videoFile?: File;                        // livephoto 的视频部分
videoUploaded?: { key: string; url: string };  // 视频部分上传结果
```

**addFiles 配对逻辑**：每个新文件按 stem（去扩展名、小写）尝试与现有条目合并——视频 + 已有同 stem 图片（无 videoFile）→ 该条目升级为 livephoto；图片 + 已有同 stem 视频 → 视频条目升级为 livephoto（图片做 `file`）；否则按类型新建条目。支持同一次拖入和分两次拖入。

**uploadItem 按 kind 分支**：
- `image`：现有流程，前置 HEIC 检测——`isHeicFile` 时先 `convertHeicToJpeg`，preview/EXIF/尺寸/thumbhash/原图上传都用转换后 JPG（`image_name` 用 `.jpg` 名）；转换失败走现有 `degraded` 路径
- `video`：现有流程不变（只发 file/storage/persist）
- `livephoto`：先传视频部分（persist=0 → `videoUploaded`），再走图片完整流程（含 HEIC 转换）→ `uploaded`；进度合并映射（视频占 0-49%，图片占 50-100%）；任一部分失败 → item error，重试重传两部分

**saveUploaded 按 kind 分支 + 修复相册绑定**：
- 逐条 `POST /api/photos` 后追加 `PUT /api/photos/:id/album { album_value: album() }`
- payload：`image` → 现状；`video` → `type: 2, video_url: url`（现状）；`livephoto` → `type: 2, url: 图片url, video_url: 视频url` + 图片侧的 preview/blurhash/exif/width/height/lat/lon
- **单张/批量**：保存时 `items().length === 1` 用表单值（title/detail/labels），`> 1` 全部空值——批量即"不填基本信息"

**表单显隐**：`items().length === 1` 显示 标题/描述/标签 表单（视频单条也显示）；`> 1` 隐藏并显示一行提示"批量上传不填写标题、描述与标签，保存后可在图片管理中逐张编辑"。

**列表项渲染**：livephoto 条目显示"LivePhoto"徽标（badgeSecondary，图+视频两行文件名），视频条目显示"视频"徽标。

### 不改动

服务端（app.ts/storage/db）、前台（HomeView/PreviewView）、PhotosView、AdminLayout。

## 验证

1. `pnpm web:typecheck` + `pnpm web:test`
2. dev server 浏览器实测（沿用现有注入测试流程）：
   - 单张图：表单可见，填标题/标签 → 保存 → 确认入库且**相册绑定成功**（图片管理可见、dashboard 数字更新）
   - 批量多图：表单自动隐藏 + 提示可见，保存后记录 title/detail/labels 为空
   - LivePhoto 配对：构造同名 JPG+MOV 对拖入 → 列表出现 LivePhoto 条目（图+视频）→ 保存 → 一条 `type=2` 记录（url=图、video_url=MOV），PreviewView 可播放
   - 未配对视频单独拖入 → 普通视频条目，保存后 PreviewView 视频播放正常
   - HEIC：需一张真实 HEIC 样片（请提供一张，如 iPhone 导出），验证转换后上传、前台正常显示；无样片时至少验证转换失败走 degraded 路径不卡死
