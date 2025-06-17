<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
PicImpact
</h1>

<p align="center">
  <a href="https://github.com/besscroft/PicImpact/blob/main/LICENSE"><img src="https://img.shields.io/github/license/besscroft/PicImpact?style=flat-square" alt="许可证"></a>
  <img src="https://img.shields.io/github/repo-size/besscroft/PicImpact?style=flat-square&color=328657" alt="存储库大小">
</p>

PicImpact 是一个支持自部署的摄影作品展示网站，基于 Next.js + Hono.js 开发。

### 功能特性

- 瀑布流相册展示图片，支持[实况照片(Live Photos)](https://support.apple.com/zh-cn/104966)，基于 [LivePhotosKit JS](https://developer.apple.com/documentation/livephotoskitjs) 开发。
- 点击图片查看原图，浏览图片信息和 EXIF 信息，支持直链访问。
- 响应式设计，在 PC 和移动端都有不错的体验，支持暗黑模式。
- 图片存储兼容 S3 API、Cloudflare R2、AList API。
- 图片支持绑定标签，并且可通过标签进行交互，筛选标签下所有图片。
- 支持输出 RSS，可以使用 [Follow](https://github.com/RSSNext/Follow) 订阅，并支持订阅源所有权验证。
- 支持批量自动化上传，上传图片时会生成 0.3 倍率的压缩图片，以提供加载优化。
- 后台有图片数据统计、图片上传、图片维护、相册管理、系统设置和存储配置功能。
- 双因素认证功能，基于 TOTP 算法 [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)，支持 Google Authenticator、Microsoft Authenticator 和 1Password 等。
- 基于 SSR 的混合渲染，采用状态机制，提供良好的使用体验。
- 基于 prisma 的自动初始化数据库和数据迁移，简化部署流程。
- 支持 Vercel 部署、Node.js 部署、Docker 等容器化部署，当然 k8s 也支持。

### 如何部署

你可以点击下面的按钮来一键部署到 Vercel，**然后将 `Build Command` 设置为 `pnpm run build:vercel`**，也可以 Fork 项目后手动部署到任何支持的平台。

> 我们推荐当新版本发布时您再进行版本更新！

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,AUTH_SECRET"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key          | 备注                                                                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| DATABASE_URL | Postgre 数据库 url，`postgresql://[用户名]:[密码]@[地址和端口]/[数据库]`，如：`postgresql://postgres:666666@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` |
| BETTER_AUTH_SECRET  | 权限机密，你可以执行 npx auth secret 生成一个，反正是随机的字符串就行                                                                                                        |

> 升级至 v2.6.0，以及新部署的用户，在部署完毕后，自行注册用户即可！

> 请根据您的数据库供应商来填写正确的数据库 `connect url`。
>
> 如果是 Vercel 部署，直接将 `Build Command` 设置为 `pnpm run build:vercel` 即可。
>
> 如果您自行使用 node 部署，请使用 `pnpm run build:node` 命令来构建。

更多详细配置请查阅[文档](https://pic-docs.ziyume.com)

### 本地开发

克隆到本地开发:

```shell
git clone https://github.com/besscroft/PicImpact.git

pnpm i

pnpm run dev
```

如果您有任何建议，欢迎反馈！

### TODO

- [ ] Map 地图展示

...

### 代码贡献

[提出新想法 & 提交 Bug](https://github.com/besscroft/PicImpact/issues/new) | [Fork & Pull Request](https://github.com/besscroft/PicImpact/fork)

PicImpact 欢迎各种贡献，包括但不限于改进，新功能，文档和代码改进，问题和错误报告。

`v1` 版本目前停止维护，代码归档在 `v1` 分支。

目前正在开发 v2 版本，同时接受 `PR`！

> 有需求和建议都可以提，有空的话我会处理，但受限于 Next / SSR 的⌈局限性⌋，以及照顾移动端使用体验，很多功能的设计上可能会有取舍。

### 隐私安全

您使用本程序时，需要自己去维护各个平台的配置信息（毕竟跟咱没关系，需要在对应的平台配置），以及对象存储的读写权限、访问控制、防盗链、跨域设置、缓存策略和 CDN 等配置，以最大程度的避免天价账单。

如您有更多疑问，可以提交 [Issue](https://github.com/besscroft/PicImpact/issues/new)。

### 浏览器支持

- Last 2 versions of Chrome, Firefox, Safari and Edge
- Firefox ESR

> 事实上不是过于老旧的浏览器，一般都是能用的。

### 无障碍支持

已经在尽力支持了，主要基于 [WAI-ARIA 规范](https://developer.mozilla.org/zh-CN/docs/Learn/Accessibility/WAI-ARIA_basics)，有爱，无障碍！

### 技术栈

- Web框架：
  - [Next.js](https://github.com/vercel/next.js)
  - [Hono.js](https://github.com/honojs/hono)
- UI 框架：
  - [Radix](https://www.radix-ui.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
- 更多组件参见 package.json

### 感谢

本项目使用 JetBrains 的开源许可证，基于 IntelliJ IDEA 开发，感谢！

![JetBrains 徽标（主要） logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)

![IntelliJ IDEA logo](https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg)

### License

PicImpact is open source software licensed as [MIT](https://github.com/besscroft/PicImpact/blob/main/LICENSE).

