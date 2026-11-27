# 全站 Tailwind CSS v4 化 + 后台切换 shadcn preset `bcivVKXQ`（Nova / Zinc / Inter）

## Summary

1. 在 apps/web 引入 **Tailwind CSS v4**（含 preflight，标准接入），与项目已有的 **@ui-sdk/solid** 无头组件体系结合。
2. **后台**（`.app-shell` 作用域：登录页 + 概览/上传/图片/相册/存储/配置）设计语言切换为 shadcn preset `bcivVKXQ`：**Style: Nova · Base Color: Zinc · Theme: Zinc · Chart: Zinc · Heading/Font: Inter · Icons: Lucide · Radius: Default (0.625rem) · Menu: Default/Solid · Menu Accent: Subtle · Base: Base UI**（已在 ui.shadcn.com/create 核实）。
3. **全站 CSS 尽量 Tailwind utilities 化**（用户明确要求）：前台 HomeView / PreviewView 的手写 CSS 也全部改写为 utilities；最终 styles.css 只保留「token 定义块 + @theme 映射 + 少量 ui-sdk 变量联动的机制 CSS + 少量全局规则」，删除全部组件级 CSS（含 album-workspace.css）。
4. 前台**视觉现状保持不变**（浅米绿配色、暗色偏好、瀑布流布局），只换实现载体；后台按 Nova/Zinc 规格重塑。

## Current State Analysis

- 入口 [App.tsx](file:///c:/github/PicImpact/apps/web/src/App.tsx)：按路由渲染 `AdminApp`（`.app-shell.admin-shell`）/ `PublicPreview` / `PublicHome` + `ToastRegion`。
- 已用 @ui-sdk：`Button`（App/LoginScreen/Albums/Photos/Config）、`Toast` 全家桶、`Tabs`（ConfigView）、`SegmentedControl` + `Switch`（AlbumsView）。
- 待迁移手写交互件：[shared.tsx SwitchRow](file:///c:/github/PicImpact/apps/web/src/admin/shared.tsx#L215)（原生 checkbox + `.switch`）、[PhotosView 两个 div 弹窗](file:///c:/github/PicImpact/apps/web/src/views/PhotosView.tsx#L620)、[AlbumsView 原生 `<dialog>` 删除确认](file:///c:/github/PicImpact/apps/web/src/views/AlbumsView.tsx#L489)。
- 样式载体：[styles.css](file:///c:/github/PicImpact/apps/web/src/styles.css)（~2850 行：后台组件样式 + 前台样式混在一起）、[album-workspace.css](file:///c:/github/PicImpact/apps/web/src/views/album-workspace.css)（由 [AlbumsView.tsx:13](file:///c:/github/PicImpact/apps/web/src/views/AlbumsView.tsx#L13) 引入）。
- JS/CSS 联动点（转换时必须保留）：
  - [HomeView.tsx:155](file:///c:/github/PicImpact/apps/web/src/public/HomeView.tsx#L155) 读取 `.masonry-grid` 的 `--gallery-columns`（断点响应）→ 用 Tailwind 任意属性 `[--gallery-columns:2] sm:[--gallery-columns:3] lg:[--gallery-columns:4] xl:[--gallery-columns:5]` 保留；条目定位是内联 style（不动）。
  - Toast 堆叠依赖 ui-sdk 注入的 `--toast-*` 变量；SegmentedControl 指示器依赖 `--segmented-control-indicator-*` → 保留小段作用域 CSS。
  - `.public-shell` 有 `prefers-color-scheme: dark` 的画廊暗色 token → 保留为 token 块。
- [vite.config.ts](file:///c:/github/PicImpact/apps/web/vite.config.ts)：vite-plus（vite 8），`optimizeDeps.exclude: ["@ui-sdk/core"]` 已配置。
- 测试（apps/web/tests）只断言逻辑模块，无样式/class 断言。
- 全站固定浅色管理端；前台支持系统暗色偏好。

## Preset 规范依据（已核实，实施直接采用）

### Zinc light token（ui.shadcn.com/r/colors/zinc.json）

| token | 值 |
|---|---|
| background / card / popover | `oklch(1 0 0)` |
| foreground / card-foreground / popover-foreground | `oklch(0.141 0.005 285.823)` |
| primary | `oklch(0.21 0.006 285.885)` |
| primary-foreground | `oklch(0.985 0 0)` |
| secondary / muted / accent | `oklch(0.967 0.001 286.375)` |
| secondary-foreground / accent-foreground | 同 primary |
| muted-foreground | `oklch(0.552 0.016 285.938)` |
| destructive | `oklch(0.577 0.245 27.325)` |
| border / input | `oklch(0.92 0.004 286.32)` |
| ring | `oklch(0.705 0.015 286.067)` |
| chart-1..5 | `oklch(0.871 0.006 286.286)` / `oklch(0.552 0.016 285.938)` / `oklch(0.442 0.017 285.786)` / `oklch(0.37 0.013 285.805)` / `oklch(0.274 0.006 286.033)` |
| sidebar | `oklch(0.985 0 0)`；sidebar-foreground=foreground；sidebar-primary=primary；sidebar-accent=`oklch(0.967 0.001 286.375)`；sidebar-border/border=`oklch(0.92 0.004 286.32)`；sidebar-ring=ring |
| radius | `0.625rem` → sm 6px / md 8px / lg 10px / xl 14px |

### Nova 风格规格（shadcn-ui/ui `apps/v4/registry/styles/style-nova.css`，已抓取）

- **Button**：`rounded-lg`、default `h-8 px-2.5 text-sm font-medium`；default `bg-primary text-primary-foreground hover:bg-primary/80`；outline `border-border bg-background hover:bg-muted hover:text-foreground`；ghost `hover:bg-muted`；destructive `bg-destructive/10 text-destructive hover:bg-destructive/20`；`active:translate-y-px`；聚焦 `border-ring ring-3 ring-ring/50`。
- **Card**：`rounded-xl bg-card ring-1 ring-foreground/10`，内边距 16px；footer `bg-muted/50 border-t rounded-b-xl`。
- **Dialog / AlertDialog**：内容 `rounded-xl bg-popover ring-1 ring-foreground/10 p-4`；overlay `bg-black/10 backdrop-blur-[4px]`；footer `bg-muted/50 border-t`。
- **Input / Select 触发器**：`h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm`，聚焦 `border-ring ring-3 ring-ring/50`。
- **Switch**：`h-[18px] w-[32px] rounded-full`，checked `bg-primary`，unchecked `bg-input`，thumb 白 16px。
- **Badge**：`h-5 px-2 rounded-full text-xs font-medium`；secondary `bg-secondary text-secondary-foreground`；destructive `bg-destructive/10 text-destructive`。
- **Progress**：轨道 `h-1 rounded-full bg-muted`，指示 `bg-primary`。
- **Toast**：`rounded-2xl` + popover 底 + shadow-lg。
- **Label**：`text-sm font-medium`（去大写/字距）；元信息 `text-xs text-muted-foreground`。
- **Sidebar（menu accent subtle）**：底 `bg-sidebar`、边框 sidebar-border；激活项 `bg-sidebar-accent text-foreground font-medium`。
- **空状态**：`rounded-xl border-dashed`。

## Proposed Changes

### 阶段 1：Tailwind v4 基础设施

- `apps/web/package.json`：devDependencies 新增 `tailwindcss`、`@tailwindcss/vite`；dependencies 新增 `@fontsource-variable/inter`。
- [vite.config.ts](file:///c:/github/PicImpact/apps/web/vite.config.ts)：plugins 增加 `tailwindcss()`（置于 solid() 之前或之后均可）。
  - 兼容性预案：若与 vite-plus（vite 8）peer 冲突/运行异常 → 回退 `@tailwindcss/postcss` + `postcss.config.js`。
- [styles.css](file:///c:/github/PicImpact/apps/web/src/styles.css) 头部重构（最终形态骨架）：

```css
@layer ui-sdk, theme, base, components, utilities;
@import "tailwindcss";                                   /* theme + preflight(base) + utilities */
@import "@ui-sdk/core/web.css" layer(components);
@import "@fontsource-variable/inter";

@theme {
  --font-sans: "Inter Variable", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

/* ===== 后台 token（shadcn preset bcivVKXQ，仅浅色） ===== */
.app-shell { /* Zinc oklch token 全表 + radius 派生，见上表 */ }

/* ===== 前台画廊 token（视觉现状不变，含暗色偏好） ===== */
.public-shell { /* --gallery-* 六色保留现值 */ }
@media (prefers-color-scheme: dark) { .public-shell { /* 暗色值保留 */ } }

@theme inline {
  /* 后台语义映射：--color-background/-foreground/-card/-popover/-primary/-secondary/
     -muted/-accent/-destructive/-border/-input/-ring/-chart-1..5/-sidebar-* + --radius-sm/md/lg/xl */
  /* 前台语义映射：--color-gallery-bg/-ink/-muted/-accent/-primary/-border（var(--gallery-*)） */
}

@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

/* ===== 机制段（依赖 ui-sdk 注入变量，无法 utilities 化） ===== */
/* 1) [data-slot="toast-region"]/toast 堆叠定位（--toast-* 逻辑保留，视觉改 Nova：rounded-2xl bg-popover shadow-lg ring-foreground/10） */
/* 2) SegmentedControl 指示器定位（--segmented-control-indicator-*，视觉改 bg-card rounded-md shadow-sm） */

/* ===== 全局小规则 ===== */
/* html 滚动条隐藏、body min-width/min-height、prefers-reduced-motion 全局降级 */
```

要点：
- 引入完整 Tailwind（含 preflight）——全站 markup 都 utilities 化后这是标准形态；preflight 提供的 reset（margin/box-sizing/button font/img block 等）替代原手写 reset。
- 后台 token 只定义在 `.app-shell`，前台 gallery token 只在 `.public-shell`——两个作用域天然隔离。
- ui-sdk 状态属性（`data-pressed/checked/open/selected/disabled/invalid/highlighted/starting-style/ending-style`）Tailwind v4 原生 `data-*:` 变体直接可用。

### 阶段 2：后台 utilities 化 + Nova 设计语言（8 个 TSX 文件）

共享类常量集中到 [admin/shared.tsx](file:///c:/github/PicImpact/apps/web/src/admin/shared.tsx)：

```ts
export const btnPrimary = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
export const btnOutline = "…同结构 border-border bg-background hover:bg-muted hover:text-foreground…";
export const btnGhost   = "…hover:bg-muted hover:text-foreground…";
export const btnDanger  = "…bg-destructive/10 text-destructive hover:bg-destructive/20…";
export const cardCls    = "rounded-xl bg-card ring-1 ring-foreground/10";
export const inputCls   = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
export const labelCls   = "text-sm font-medium text-foreground";       // 去大写/字距
export const metaCls    = "text-xs text-muted-foreground";
export const badgeCls   = "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium";
```

逐文件（class 替换 + 删除对应旧 CSS）：

| 文件 | 改动 |
|---|---|
| [App.tsx](file:///c:/github/PicImpact/apps/web/src/App.tsx) | 布局 utilities 化（`grid h-dvh grid-cols-[auto_minmax(0,1fr)] overflow-hidden` 等）；侧栏 `bg-sidebar border-r border-sidebar-border w-[232px]`，rail 折叠由 `sidebarOpen` signal 切换宽/隐藏类；`.module-link` `rounded-md` + 激活 `bg-sidebar-accent text-foreground font-medium`（subtle）；brand 标记去 Georgia；工具栏按钮用共享常量 |
| [LoginScreen.tsx](file:///c:/github/PicImpact/apps/web/src/LoginScreen.tsx) | 登录卡 `cardCls p-8 w-[min(440px,100%)]`；h1 `text-2xl font-semibold tracking-tight`；kicker `metaCls`；输入框 `inputCls` |
| [admin/shared.tsx](file:///c:/github/PicImpact/apps/web/src/admin/shared.tsx) | 共享常量；`SwitchRow` 重写为 **@ui-sdk `Switch`+`SwitchThumb`**（Nova 规格，props 不变）；`LoadingState`/骨架 `bg-secondary` + `animate-pulse`；`NavIcon/ToolbarIcon` 不变 |
| [DashboardView.tsx](file:///c:/github/PicImpact/apps/web/src/views/DashboardView.tsx) | 指标卡/面板 `cardCls`；数字 `text-3xl font-semibold tracking-tight tabular-nums`（去 Georgia）；覆盖率/构成条 `h-1 rounded-full bg-muted` + `bg-primary` 指示（内联宽度保留）；eyebrow → `metaCls` |
| [UploadView.tsx](file:///c:/github/PicImpact/apps/web/src/views/UploadView.tsx) | 左右分栏（保持现有 grid 布局值）；拖放区 `rounded-xl border border-dashed border-input bg-transparent hover:bg-muted/50`；进度 `h-1 bg-muted rounded-full` + `bg-primary`（内联宽度保留）；队列项/缩略图/状态徽章 Nova 化（error → destructive tinted） |
| [PhotosView.tsx](file:///c:/github/PicImpact/apps/web/src/views/PhotosView.tsx) | 过滤器/表格/卡片 utilities 化；两个 div 弹窗迁移为 **@ui-sdk `Dialog`/`DialogContent`/`DialogTitle`/`DialogClose`**（受控 `open`/`onOpenChange`，内容组件平移）：`cardCls p-4` + footer `bg-muted/50 border-t rounded-b-xl`；TagInput chips / 批量项 Nova badge 化 |
| [AlbumsView.tsx](file:///c:/github/PicImpact/apps/web/src/views/AlbumsView.tsx) | 删除 `import "./album-workspace.css"` 并删除该文件；样式全部内联 utilities（含 `@container` + `@max-[680px]:` 容器查询替代原 @container 块）；原生 `<dialog>` 删除确认迁移为 **@ui-sdk `Alert Dialog`**（保留删除流程逻辑）；sticky 表头 `bg-muted/50 text-xs font-medium text-muted-foreground`、行 hover `bg-muted/50`、选中行 `bg-sidebar-accent shadow-[inset_2px_0_0_var(--primary)]`；主题 chip → badge |
| [ConfigView.tsx](file:///c:/github/PicImpact/apps/web/src/views/ConfigView.tsx) | Tabs 触发器：未选 ghost（`hover:bg-muted`）、选中 `bg-primary text-primary-foreground`（rounded-lg h-8）；备份面板/表单/指标 utilities 化 |

后台旧 CSS 删除清单（styles.css）：`.primary-button/.secondary-button/.file-button`、`.workspace*/.sidebar*/.module-*/.brand-*/.user-*`、`.admin-toolbar/.admin-content/.toolbar-*`、`.auth-*`、`.notice/.error-banner`（后台部分）、`.table-shell/.table-heading`、`.photo-*/.row-*/.config-*/.album-*(非相册视图)/.backup-*/.storage-*`、`.dialog-*`、`.switch*/.field-row`、`.batch-*`、`.pager`、`.tag-*`、`.card-badge`、`.filter-*`、`.empty-*/.loading-*`、`.upload-*`、`.dashboard-*/.coverage-*/.recent-*/.breakdown-*`、`.eyebrow`、`.delete-confirm`、`.preview-*` 之外的全部后台段。

### 阶段 3：前台 utilities 化（视觉零变化，换载体）

逐段对照现 styles.css 的值改写为 utilities 后删除旧规则：

| 区块 | 现有类 → utilities 要点 |
|---|---|
| [HomeView.tsx](file:///c:/github/PicImpact/apps/web/src/public/HomeView.tsx) | `.public-shell`：`bg-gallery-bg text-gallery-ink` + 字体栈（token 块保留）+ `min-h-dvh leading-normal`；`.public-nav`：`fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-gallery-border/50 bg-gallery-bg/80 backdrop-blur-2xl px-3`；`.public-albums` 药丸（`no-scrollbar`、`aria-current` 激活 `bg-gallery-primary/10 text-gallery-ink font-medium`）；`.public-nav-tool` `size-11 grid place-items-center rounded-lg hover:bg-gallery-accent`；`.masonry-grid`：`relative [--gallery-columns:2] sm:[--gallery-columns:3] lg:[--gallery-columns:4] xl:[--gallery-columns:5]`（JS 联动保留）；`.masonry-item`：`absolute overflow-hidden rounded-md`；hover 放大 `group` + `transition-transform duration-500 group-hover:scale-105`；overlay 渐变 `bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100`（focus-visible 同理）；EXIF chips `bg-white/15 text-white/90 backdrop-blur-xl rounded-lg`；live 徽章、加载更多药丸、skeleton（`columns-*` 与断点同步 + `bg-gallery-accent/80 rounded-md`）|
| [PreviewView.tsx](file:///c:/github/PicImpact/apps/web/src/public/PreviewView.tsx) | 顶栏/主图舞台/左右箭头（`size-11 rounded-full border bg-white/80 backdrop-blur-md`）/右侧检查器/EXIF facts/标签药丸/copy-link/错误态全部按现值 utilities 化；`.public-admin-link` 移动端隐藏 `max-[760px]:hidden`；预览页 `preview-*` 引用的 `--bg/--line/--muted/--accent` 为 `:root` 公共值 → 直接以 utilities 固化现值（`bg-[--bg 同色]` 等，保持像素一致） |
| [styles.css](file:///c:/github/PicImpact/apps/web/src/styles.css) 前台段 | `.public-shell/.public-nav/.public-albums/.masonry-*/.live-badge/.load-more-button/.skeleton-grid/.gallery-skeleton/.public-empty/.preview-*` 全部删除；保留：`.public-shell`/暗色 token 块、`@theme inline` gallery 映射、机制段、全局小规则 |
| 共享 | 前台也用的 `.error-banner`（HomeView 错误提示）→ 前台专属 utilities（保持现观感） |

### 阶段 4：字体与收尾

- `@theme { --font-sans: "Inter Variable", … }` 全局默认（preflight 应用到 body）；`.public-shell` token 块内保留其现有字体栈（前台不换字体）。
- 删除 [album-workspace.css](file:///c:/github/PicImpact/apps/web/src/views/album-workspace.css) 文件及其 import。
- `index.html` theme-color 不动。

### 保留 CSS 的明确边界（「尽量」的例外）

1. ui-sdk 变量联动的机制段：Toast 堆叠、SegmentedControl 指示器（各 ~30 行）。
2. Token 定义块（`.app-shell` Zinc、`.public-shell` gallery + 暗色 media query）与 `@theme` 映射——这是 Tailwind 的标准配置形态，不算手写样式。
3. 全局小规则：html 滚动条隐藏、body 尺寸、prefers-reduced-motion 降级。
4. 动态内联样式（瀑布流定位、进度条宽度、`aspect-ratio` 骨架）保持内联。

## Assumptions & Decisions

1. **忠实 Zinc 单色**：theme=Zinc ⇒ 后台取消钴蓝 accent，主按钮近黑、强调文字墨色、灰阶图表——preset 设计语言本身。
2. **密度跟随 Nova**：按钮/输入 h-8、rounded-lg；卡片/弹窗 rounded-xl；后台整体紧凑化。
3. **preflight 开启**：全站 utilities 化后使用标准 `@import "tailwindcss"`；前台视觉靠逐段保值转换保证。
4. **交互组件迁移到 @ui-sdk**：SwitchRow→Switch、PhotosView 弹窗→Dialog、相册删除→Alert Dialog；原生 `<select>/<input>/<textarea>` 保留原生元素只换样式（不引入 @ui-sdk Select/Input/Field，避免表单数据流行为变更）。
5. **Inter 仅后台**（@fontsource-variable/inter，npm 自托管）；前台字体栈不变。
6. 后台不引入暗黑模式（与项目 2026-11-26 决策一致）；前台暗色偏好原样保留。

## Verification

1. `pnpm install`；`pnpm run web:typecheck`；`pnpm run web:test`。
2. `pnpm run web:dev` 浏览器核对后台（对照 ui.shadcn.com/create?preset=bcivVKXQ 的 Nova 预览）：登录页、概览、上传（拖放/队列/进度）、图片管理（过滤/卡片/TagInput/两个 Dialog/Switch）、相册（表格/SegmentedControl/Alert Dialog/编辑表单 + 容器查询窄列）、存储配置（Tabs）、配置；侧栏 rail 折叠；Toast 堆叠动画；聚焦 ring。
3. 前台回归：首页瀑布流（列数断点 2/3/4/5、hover 放大、EXIF 悬浮、Live 徽章、加载更多）、加载骨架、`/preview/:id`（舞台/箭头/检查器/EXIF/标签）、系统暗色偏好下的画廊配色、移动端断点。
4. 弹窗行为手测：Esc 关闭、焦点圈定、遮罩点击关闭（Dialog/AlertDialog 迁移差异点）。
5. 构建产物检查：`pnpm run web:build` 成功，CSS 体积合理（无全量 palette 泄漏担忧，v4 自动 tree-shake）。
