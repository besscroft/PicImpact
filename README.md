<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
PicImpact
</h1>

<p align="center">
  <a href="https://github.com/besscroft/PicImpact/blob/main/LICENSE"><img src="https://img.shields.io/github/license/besscroft/PicImpact?style=flat-square" alt="许可证"></a>
  <img src="https://img.shields.io/github/repo-size/besscroft/PicImpact?style=flat-square&color=328657" alt="存储库大小">
</p>

<p align="center">
    <img src=picimpact.png width=384 />
</p>

PicImpact 是一个摄影师专用的摄影作品展示网站，基于 Next.js 开发。

### 功能特性

- 瀑布流相册展示图片，支持常见的格式。
- 点击图片查看原图，浏览图片信息和 EXIF 信息。
- 响应式设计，在 PC 和移动端都有不错的体验，支持暗黑模式。
- 图片存储兼容 S3 API、Cloudflare R2、AList API。
- 图片支持绑定标签，并且可通过标签进行交互，筛选标签下所有图片。
- 上传图片时会生成 0.3 倍率的压缩图片，以提供加载优化。
- 后台有图片数据统计、图片上传、图片维护、相册管理、系统设置和存储配置功能。
- 基于 SSR 的混合渲染，采用状态机制，提供良好的使用体验。
- 基于 prisma 的自动初始化数据库和数据迁移，简化部署流程。
- 支持 Vercel 部署、Node.js 部署、Docker 等容器化部署，当然 k8s 也支持。

### 如何部署

你可以点击下面的按钮来一键部署到 Vercel，然后将 `Build Command` 设置为 `pnpm run build:vercel`，也可以 Fork 项目后手动部署到任何支持的平台。

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,AUTH_SECRET"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key          | 备注                                                                                       |
|--------------|------------------------------------------------------------------------------------------|
| DATABASE_URL | Postgre 数据库 url，如：postgres://账号:密码@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres |
| AUTH_SECRET  | 权限机密，你可以执行 npx auth secret 生成一个，反正是随机的字符串就行                                              |

默认账号：`admin@qq.com`，默认密码：`666666`，**登录后请先去设置里面修改密码！**

> 部署就是这么简单，只需要您准备一个干净的数据库就行！
> 除了容器化部署方式外，其它的部署方式都需要执行 `pnpm run prisma:deploy` 来完成 prisma 迁移。
> 如果是 Vercel 部署，直接将 `Build Command` 设置为 `pnpm run build:vercel` 即可。

### 容器化部署

你可以使用 Docker 来部署 PicImpact，当然 containerd 和 k8s 也是可以的。

```shell
docker run -d --name picimpact \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://账号:密码@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" \
  -e AUTH_SECRET="自己运行npx auth secret或一串随机的字符串都行" \
  besscroft/picimpact:latest
```

> 注意：如果您使用 `Docker Compose`，存在无法访问数据库的问题，请尝试将环境变量的双引号去掉。即 `DATABASE_URL="连接信息"` -> `DATABASE_URL=连接信息`。

### 存储配置

暂时提供了 AWS S3 API、Cloudflare R2、AList API 支持，您在部署成功后，可以去 `设置` -> `存储` 进行管理。

我比较推荐 Cloudflare R2，算是很良心的了，流量免费。

- AWS S3 配置

| Key              | 备注                                                          |
|------------------|-------------------------------------------------------------|
| accesskey_id     | 阿里 OSS / AWS S3 AccessKey_ID                                |
| accesskey_secret | 阿里 OSS / AWS S3 AccessKey_Secret                            |
| region           | 阿里 OSS / AWS S3 Region 地域，如：`oss-cn-hongkong  `              |
| endpoint         | 阿里 OSS / AWS S3 Endpoint 地域节点，如：`oss-cn-hongkong.aliyuncs.com` |
| bucket           | 阿里 OSS / AWS S3 Bucket 存储桶名称，如：`picimpact`                    |
| storage_folder   | 存储文件夹(S3)，严格格式，如：`picimpact` 或 `picimpact/images` ，填 `/` 或者不填表示根路径 |
| force_path_style   | 是否强制客户端对桶使用路径式寻址，默认 `false`，如您使用 minio 作为 s3 存储，需要设置为 `true`   |

- Cloudflare R2 配置

| Key                 | 备注                                                                       |
|---------------------|--------------------------------------------------------------------------|
| r2_accesskey_id     | Cloudflare AccessKey_ID                                                  |
| r2_accesskey_secret | Cloudflare AccessKey_Secret                                              |
| r2_endpoint         | Cloudflare Endpoint 地域节点，如：`https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| r2_bucket           | Cloudflare Bucket 存储桶名称，如：`picimpact`                                      |
| r2_storage_folder   | 存储文件夹(Cloudflare R2)，严格格式，如：`picimpact` 或 `picimpact/images` ，填 `/` 或者不填表示根路径  |
| r2_public_domain    | Cloudflare R2 自定义域（公开访问）                                                 |

- AList API 配置

| Key         | 备注                                   |
|-------------|--------------------------------------|
| alist_token | alist 令牌                             |
| alist_url   | AList 地址，如：https://alist.example.com |

### 本地开发

克隆到本地开发:

```shell
git clone https://github.com/besscroft/PicImpact.git

pnpm i

pnpm run dev
```

如果您有任何建议，欢迎反馈！

### 代码贡献

[提出新想法 & 提交 Bug](https://github.com/besscroft/PicImpact/issues/new) | [Fork & Pull Request](https://github.com/besscroft/PicImpact/fork)

PicImpact 欢迎各种贡献，包括但不限于改进，新功能，文档和代码改进，问题和错误报告。`dev` 分支接受 `PR`！

> 有需求和建议都可以提，有空的话我会处理，但受限于 Next / SSR 的⌈局限性⌋，很多功能的设计上可能会有取舍。

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
  - [Next](https://github.com/vercel/next.js)
- UI 框架：
  - [Next UI](https://github.com/nextui-org/nextui)
  - [Radix](https://www.radix-ui.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
- 更多组件参见 package.json

### 感谢

本项目使用 JetBrains 的开源许可证，基于 IntelliJ IDEA 开发，感谢！

![JetBrains 徽标（主要） logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)

![IntelliJ IDEA logo](https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg)

### License

PicImpact is open source software licensed as [MIT](https://github.com/besscroft/PicImpact/blob/main/LICENSE).

