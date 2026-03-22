<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
PicImpact
</h1>

<p align="center">
  <a href="https://github.com/besscroft/PicImpact/blob/main/LICENSE"><img src="https://img.shields.io/github/license/besscroft/PicImpact?style=flat-square" alt="License"></a>
  <a href="https://github.com/besscroft/PicImpact/actions/workflows/eslint.yaml"><img src="https://github.com/besscroft/PicImpact/actions/workflows/eslint.yaml/badge.svg" alt="ESLint"></a>
  <a href="https://github.com/besscroft/PicImpact/actions/workflows/build-main.yaml"><img src="https://github.com/besscroft/PicImpact/actions/workflows/build-main.yaml/badge.svg" alt="Docker Build"></a>
  <img src="https://img.shields.io/github/repo-size/besscroft/PicImpact?style=flat-square&color=328657" alt="Repo Size">
</p>

<p align="center">
  <a href="#简体中文">简体中文</a> | <a href="#english">English</a> | <a href="#日本語">日本語</a>
</p>

---

## 简体中文

PicImpact 是一个支持自部署的摄影作品展示网站，基于 Next.js + Hono.js 开发。

### 功能特性

- 瀑布流相册展示图片，支持[实况照片(Live Photos)](https://support.apple.com/zh-cn/104966)，基于 [LivePhotosKit JS](https://developer.apple.com/documentation/livephotoskitjs) 开发。
- 基于 WebGL 的高性能图片查看器，支持流畅的缩放和平移，采用图片分块（Tiling）和 LOD 技术优化大图加载性能。
- 支持地图模组标记图片，根据图片经纬度标记在地图上。
- 点击图片查看原图，浏览图片信息和 EXIF 信息，支持直链访问。
- 响应式设计，在 PC 和移动端都有不错的体验，支持暗黑模式。
- 图片存储兼容 S3 API、Cloudflare R2、Open List API。
- 图片支持绑定标签，并且可通过标签进行交互，筛选标签下所有图片。
- 支持输出 RSS，可以使用 [Follow](https://github.com/RSSNext/Follow) 订阅，并支持订阅源所有权验证。
- 支持批量自动化上传，上传图片时会生成 0.3 倍率的压缩图片，以提供加载优化。
- 后台有图片数据统计、图片上传、图片维护、相册管理、系统设置和存储配置功能。
- 双因素认证功能，基于 TOTP 算法 [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)，支持 Google Authenticator、Microsoft Authenticator 和 1Password 等。
- Passkey 无密码登录功能，基于 WebAuthn 标准，支持生物识别（指纹、面容等）和硬件安全密钥登录。
- 基于 SSR 的混合渲染，采用状态机制，提供良好的使用体验。
- 基于 Prisma 的自动初始化数据库和数据迁移，简化部署流程。
- 支持 Vercel 部署、Node.js 部署、Docker 等容器化部署，当然 k8s 也支持。

### 如何部署

你可以点击下面的按钮来一键部署到 Vercel，**然后将 `Build Command` 设置为 `pnpm run build:vercel`**，也可以 Fork 项目后手动部署到任何支持的平台。

> 我们推荐当新版本发布时您再进行版本更新！

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,BETTER_AUTH_SECRET,BETTER_AUTH_PASSKEY_RP_ID,BETTER_AUTH_PASSKEY_RP_NAME"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key | 备注 |
|-----|------|
| DATABASE_URL | PostgreSQL 连接字符串，如使用 Supabase：`postgres://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| DIRECT_URL | 用于 `prisma migrate` 的直连地址，非 serverless 数据库与 `DATABASE_URL` 保持一致即可 |
| BETTER_AUTH_SECRET | 权限机密，执行 `npx auth secret` 生成随机字符串 |
| BETTER_AUTH_URL | 访问地址，如：`https://example.com` |
| BETTER_AUTH_PASSKEY_RP_ID | Passkey 依赖方标识符，填写您的域名，如：`example.com` |
| BETTER_AUTH_PASSKEY_RP_NAME | Passkey 依赖方名称，如：`PicImpact` |

> Vercel 部署将 `Build Command` 设置为 `pnpm run build:vercel`，Node.js 自行部署使用 `pnpm run build:node`。
>
> Passkey 功能依赖 HTTPS 环境（本地开发可使用 localhost）。

更多详细配置请查阅[文档](https://pic-docs.ziyume.com)。

### 本地开发

```shell
git clone https://github.com/besscroft/PicImpact.git
pnpm i
pnpm run dev
```

### 技术栈

| 类别 | 技术 |
|------|------|
| Web 框架 | [Next.js](https://github.com/vercel/next.js) + [Hono.js](https://github.com/honojs/hono) |
| UI | [Radix](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| 数据库 | PostgreSQL + [Prisma](https://www.prisma.io/) |
| 认证 | [better-auth](https://www.better-auth.com/) (Email/Password, TOTP, WebAuthn) |
| 图片渲染 | WebGL 查看器（基于 [Afilmory](https://github.com/Afilmory/afilmory)） |

---

## English

PicImpact is a self-deployable photography portfolio website built with Next.js + Hono.js.

### Features

- Masonry gallery layout with [Live Photos](https://support.apple.com/en-us/104966) support via [LivePhotosKit JS](https://developer.apple.com/documentation/livephotoskitjs).
- High-performance WebGL image viewer with smooth zoom/pan, tiling, and LOD optimization.
- Map module for geotagging photos based on EXIF coordinates.
- Full-resolution image preview with EXIF metadata and direct link access.
- Responsive design with dark mode support for both desktop and mobile.
- Storage compatible with S3 API, Cloudflare R2, and Open List API.
- Tag-based image organization with interactive tag filtering.
- RSS feed output with [Follow](https://github.com/RSSNext/Follow) subscription and ownership verification.
- Batch upload with automatic 0.3x compressed preview generation.
- Admin dashboard: statistics, upload, image management, album management, settings, and storage config.
- Two-factor authentication via TOTP ([RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)), supporting Google Authenticator, Microsoft Authenticator, 1Password, etc.
- Passkey passwordless login via WebAuthn standard (biometrics, hardware keys).
- SSR-based hybrid rendering with state management for optimal UX.
- Automatic database initialization and migration via Prisma.
- Deployable on Vercel, Node.js, Docker, and Kubernetes.

### Deployment

Click the button below to deploy to Vercel. **Set `Build Command` to `pnpm run build:vercel`**.

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,BETTER_AUTH_SECRET,BETTER_AUTH_PASSKEY_RP_ID,BETTER_AUTH_PASSKEY_RP_NAME"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key | Description |
|-----|-------------|
| DATABASE_URL | PostgreSQL connection string |
| DIRECT_URL | Direct connection for `prisma migrate` (same as DATABASE_URL for non-serverless) |
| BETTER_AUTH_SECRET | Auth secret, generate with `npx auth secret` |
| BETTER_AUTH_URL | App URL, e.g., `https://example.com` |
| BETTER_AUTH_PASSKEY_RP_ID | Passkey relying party ID (your domain, e.g., `example.com`) |
| BETTER_AUTH_PASSKEY_RP_NAME | Passkey relying party name (e.g., `PicImpact`) |

For more details, see the [documentation](https://pic-docs.ziyume.com).

### Local Development

```shell
git clone https://github.com/besscroft/PicImpact.git
pnpm i
pnpm run dev
```

### Tech Stack

| Category | Technology |
|----------|------------|
| Web Framework | [Next.js](https://github.com/vercel/next.js) + [Hono.js](https://github.com/honojs/hono) |
| UI | [Radix](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | PostgreSQL + [Prisma](https://www.prisma.io/) |
| Auth | [better-auth](https://www.better-auth.com/) (Email/Password, TOTP, WebAuthn) |
| Image Rendering | WebGL Viewer (based on [Afilmory](https://github.com/Afilmory/afilmory)) |

---

## 日本語

PicImpact は、Next.js + Hono.js で構築されたセルフデプロイ可能な写真ポートフォリオサイトです。

### 機能

- マソンリーレイアウトのギャラリー。[ライブフォト(Live Photos)](https://support.apple.com/ja-jp/104966) に対応（[LivePhotosKit JS](https://developer.apple.com/documentation/livephotoskitjs) ベース）。
- WebGL ベースの高性能画像ビューア。スムーズなズーム・パン操作、タイリングと LOD による大画像の最適化。
- 地図モジュールで EXIF の座標情報に基づいて写真をマッピング。
- 画像クリックで原寸表示、EXIF メタデータの閲覧、ダイレクトリンクに対応。
- レスポンシブデザイン、ダークモード対応（PC・モバイル両対応）。
- S3 API、Cloudflare R2、Open List API に対応したストレージ。
- タグベースの画像整理とインタラクティブなタグフィルタリング。
- RSS フィード出力、[Follow](https://github.com/RSSNext/Follow) による購読と所有権検証に対応。
- バッチアップロード、0.3 倍率の圧縮プレビュー自動生成。
- 管理画面：統計、アップロード、画像管理、アルバム管理、設定、ストレージ設定。
- TOTP 二要素認証（[RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)）、Google Authenticator / Microsoft Authenticator / 1Password 等に対応。
- WebAuthn 標準による Passkey パスワードレスログイン（生体認証、ハードウェアキー）。
- SSR ベースのハイブリッドレンダリング。
- Prisma によるデータベースの自動初期化とマイグレーション。
- Vercel、Node.js、Docker、Kubernetes でのデプロイに対応。

### デプロイ

以下のボタンで Vercel にデプロイできます。**`Build Command` を `pnpm run build:vercel` に設定してください。**

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,BETTER_AUTH_SECRET,BETTER_AUTH_PASSKEY_RP_ID,BETTER_AUTH_PASSKEY_RP_NAME"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key | 説明 |
|-----|------|
| DATABASE_URL | PostgreSQL 接続文字列 |
| DIRECT_URL | `prisma migrate` 用の直接接続（サーバーレスでなければ DATABASE_URL と同じ） |
| BETTER_AUTH_SECRET | 認証シークレット、`npx auth secret` で生成 |
| BETTER_AUTH_URL | アプリの URL、例：`https://example.com` |
| BETTER_AUTH_PASSKEY_RP_ID | Passkey の RP ID（ドメイン名、例：`example.com`） |
| BETTER_AUTH_PASSKEY_RP_NAME | Passkey の RP 名（例：`PicImpact`） |

詳細は[ドキュメント](https://pic-docs.ziyume.com)をご覧ください。

### ローカル開発

```shell
git clone https://github.com/besscroft/PicImpact.git
pnpm i
pnpm run dev
```

### 技術スタック

| カテゴリ | 技術 |
|----------|------|
| Web フレームワーク | [Next.js](https://github.com/vercel/next.js) + [Hono.js](https://github.com/honojs/hono) |
| UI | [Radix](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| データベース | PostgreSQL + [Prisma](https://www.prisma.io/) |
| 認証 | [better-auth](https://www.better-auth.com/) (Email/Password, TOTP, WebAuthn) |
| 画像レンダリング | WebGL ビューア（[Afilmory](https://github.com/Afilmory/afilmory) ベース） |

---

## Contributing

[New Ideas & Bug Reports](https://github.com/besscroft/PicImpact/issues/new) | [Fork & Pull Request](https://github.com/besscroft/PicImpact/fork)

PicImpact welcomes all contributions including improvements, new features, documentation, and bug reports.

## Browser Support

- Last 2 versions of Chrome, Firefox, Safari and Edge
- Firefox ESR

## Accessibility

Based on [WAI-ARIA](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/WAI-ARIA_basics) standards.

## Acknowledgements

This project uses JetBrains open source license, developed with IntelliJ IDEA.

![JetBrains logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)

WebGL image viewer based on [Afilmory](https://github.com/Afilmory/afilmory) `webgl-viewer` module (MIT License).

## License

PicImpact is open source software licensed as [MIT](https://github.com/besscroft/PicImpact/blob/main/LICENSE).
