<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
PicImpact
</h1>

<p align="center">
  <a href="https://github.com/besscroft/PicImpact/blob/main/LICENSE"><img src="https://img.shields.io/github/license/besscroft/PicImpact?style=flat-square" alt="许可证"></a>
  <img src="https://img.shields.io/github/repo-size/besscroft/PicImpact?style=flat-square&color=328657" alt="存储库大小">
</p>

一款专供摄影佬使用的记录网站，基于 Nuxt 3 开发，瀑布流展示图片，预览图片及 EXIF 信息，支持常见的图片格式。
可读取 EXIF 信息并上传、管理维护图片数据，首页精品照片展示，子页分类展示等功能。
图片存储兼容 S3 API、AList API、支持 CDN 配置。同时适配了 PC 和移动端的样式与交互。
今天又是想当二次元摄影高手的一天呢！

### 无障碍支持

已经在尽力支持了，主要基于 [WAI-ARIA 规范](https://developer.mozilla.org/zh-CN/docs/Learn/Accessibility/WAI-ARIA_basics)，有爱，无障碍！

### 如何部署

你可以 Fork 后点击下面的按钮来一键部署到 Vercel（自定义配置及容器部署请往下看）

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=POSTGRE_HOST,POSTGRE_PORT,POSTGRE_DATABASE,POSTGRE_USERNAME,POSTGRE_PASSWORD"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

当然，如果你想部署到其它平台或者自部署也是可以的，只需要改一下预设即可 `nuxt.config.ts`：

```ts
nitro: {
  preset: 'vercel' // 可选 vercel、netlify、node-server，或者删除这一行，构建时也会自适应的。
}
```

#### 数据库

数据库请选择兼容 PostgreSQL 的数据库，我推荐 [SupaBase](https://supabase.com/)，它的每月免费额度足够个人使用了！
创建数据库后，将 `doc/sql/schema.sql` 导入到数据库执行。在 `Dashboard` 的 `Settings` 找到 `Database` 部分，你就能查看连接信息了。
当然，只要是兼容 pg 的数据库都是可以选择的，不必局限于某个平台。

> 注：从 2024-01-26 起，将[删除通过 IPv4 和 pgBouncer 的数据库访问方式](https://github.com/orgs/supabase/discussions/17817)。
> 在这之前部署且数据库使用 SupaBase 的用户，请更新数据库连接信息。
> 在 `Connection parameters` 里勾选 `Use connection pooling` 选项即可。

> 请确保您的数据库用户配置了正确的 Row Level Security（行级别安全性）权限，否则将无法正常访问。
>
> 如果您是第一次部署，仅需要执行 `schema.sql` 即可，如果您是升级到涉及数据库变更的版本，请在执行对应版本编号的 sql 后再升级部署！
> 
> 系统默认账号密码为：admin / 666666

#### 图片存储

存储你可以选择 AWS S3、阿里云 OSS 或者自建 MinIO（理论上来说兼容 S3 的都行），也可以交由你正在用的 AList 来维护。

#### 环境变量

请在部署前设置您的环境变量，程序会去读这些值，用以更改构建步骤或函数执行期间的行为。

所有值都经过静态加密，并且对有权访问该项目的任何用户都可见。使用非敏感数据和敏感数据都是安全的。**但请注意您自己不要泄露环境变量的值！**

如果您更改了环境变量，它不会影响当前的部署，您需要重新构建部署后才会生效！

当然，如果您是容器化部署的，更改环境变量后只需要重启容器就行了，无需重新构建！

受限于 Nuxt3 的局限性，某些设计可能不是特别人性化（主要还是懒），望理解！

> 请注意，平台部署请在平台控制台填写环境变量，会自动覆盖 `.env.production` 的值，以免发生机密信息泄露！
> 
> 项目内默认的 key 都是用作演示用途！

| Key              | 备注                                    |
|------------------|---------------------------------------|
| POSTGRE_HOST     | Postgre 数据库主机，如：db.picimpact.supabase.co |
| POSTGRE_PORT     | Postgre 数据库端口，默认值：5432                |
| POSTGRE_DATABASE | Postgre 数据库名称，默认值：postgres            |
| POSTGRE_USERNAME | Postgre 数据库用户名，默认值：postgres           |
| POSTGRE_PASSWORD | Postgre 数据库密码，默认值：postgres            |

### 容器部署

我把容器部署往后放，是不希望前面的内容被跳过，这样你在构建/部署时才能得心应手！

#### 直接部署

如果你想用我的镜像（由 GitHub Actions 构建），就意味着你的某些配置与我相同，比如网站的几个目录。
但实际上你肯定得改一下网站标题，配置子页面啊之类的，改一下音乐播放器里面的歌之类的。

所以我的镜像只适合你快速体验预览之类的，还是建议你自己构建（反正也很方便），或者你直接部署到 Vercel 之类的平台。
如果你要运行我的镜像，你只需要执行下面的命令即可部署：

```shell
docker run -d --name PicImpact \
  -p 3000:3000 \
  -e POSTGRE_HOST="db.supabase.co" \
  -e POSTGRE_PORT="5432" \
  -e POSTGRE_DATABASE="postgres" \
  -e POSTGRE_USERNAME="postgres" \
  -e POSTGRE_PASSWORD="postgres" \
  besscroft/picimpact:latest
```

> 看到这里您应该明白，环境变量当然要换成自己的！

#### 自己构建镜像

无需多说，直接 fork 本项目，然后更改任意文件并 `commit` 后，会自动触发 GitHub Actions 构建。
当然在那之前，你需要先在你 fork 的仓库创建 2 个机密，具体看[为存储库创建机密](https://docs.github.com/zh/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)

> `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` 这两个，这样才能在构建后，上传到你自己的 docker 仓库去。

在构建好镜像之后，你可以用上面的命令执行（记得镜像换成你自己构建的哈），如果你要 Docker Compose 执行：

```yaml
version: '3'
services:
  picimpact:
    image: besscroft/picimpact:latest
    container_name: PicImpact
    ports:
      - 3000:3000
    environment:
      - POSTGRE_HOST="db.supabase.co"
      - POSTGRE_PORT=5432
      - POSTGRE_DATABASE="postgres"
      - POSTGRE_USERNAME="postgres"
      - POSTGRE_PASSWORD="postgres"
```

> 一样的，参考上面的环境变量表格，配置你自己的环境变量。

#### 构建镜像 Q&A

Q：我 fork 仓库后，网站设置也改了自己的之后，构建的镜像被人使用会有风险吗？

A：原则上没有，但如果你自己要往文件里面填写机密信息，那是你自己的问题！
别人并不知道你的环境变量的值，除非你自己泄露！

#### 服务器面板

对于使用宝塔面板、1Panel 之类的用户，包括使用 Nginx 来提供访问服务的用户，记得配置反向代理：

```shell
location ^~ / {
  proxy_pass http://localhost:3000;
}
```

> 端口和路径之类的，就看你自己部署时，设置的什么了。

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

> 有需求和建议都可以提，有空的话我会处理，但受限于 Nuxt3 / SSR 的⌈局限性⌋，很多功能的设计上可能会有取舍。

### 隐私安全

您使用本程序时，需要自己去维护各个平台的配置信息（毕竟跟咱没关系，需要在对应的平台配置），以及对象存储的读写权限、访问控制、防盗链、跨域设置、缓存策略和 CDN 等配置，以最大程度的避免天价账单。

如您有更多疑问，可以提交 [Issue](https://github.com/besscroft/PicImpact/issues/new)。

### 浏览器支持

- Last 2 versions of Chrome, Firefox, Safari and Edge
- Firefox ESR

> 事实上不是过于老旧的浏览器，一般都是能用的。

### 技术栈

- Web框架：
  - [Next](https://github.com/vercel/next.js)
- UI 框架：
  - [Next UI](https://github.com/nextui-org/nextui)
- 更多组件参见 package.json

### 感谢

本项目使用 JetBrains 的开源许可证，基于 IntelliJ IDEA 开发，感谢！

![JetBrains 徽标（主要） logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)

![IntelliJ IDEA logo](https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg)

### License

PicImpact is open source software licensed as [MIT](https://github.com/besscroft/PicImpact/blob/main/LICENSE).

