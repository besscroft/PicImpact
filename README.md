<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
PicImpact
</h1>

<p align="center">
  <a href="https://github.com/besscroft/PicImpact/blob/main/LICENSE"><img src="https://img.shields.io/github/license/besscroft/PicImpact?style=flat-square" alt="许可证"></a>
  <img src="https://img.shields.io/github/repo-size/besscroft/PicImpact?style=flat-square&color=328657" alt="存储库大小">
</p>

### 无障碍支持

已经在尽力支持了，主要基于 [WAI-ARIA 规范](https://developer.mozilla.org/zh-CN/docs/Learn/Accessibility/WAI-ARIA_basics)，有爱，无障碍！

### 如何部署

> 当前为预览版本，会逐步稳定下来，在设计阶段已经尽可能保证后续开发的扩展和兼容性。

你可以 Fork 后点击下面的按钮来一键部署到 Vercel（自定义配置及容器部署请往下看）

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbesscroft%2FPicImpact&env=DATABASE_URL,AUTH_SECRET"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

> 记得修改 Build Command 为 `pnpm run prisma:deploy && pnpm run build`。
> 
> 当然，如果你想部署到其它平台或者自部署也是可以的。但是由于生态兼容性，暂不支持 All Edge。

#### 数据库

数据库请选择兼容 PostgreSQL 的数据库，我推荐 [SupaBase](https://supabase.com/)，它的每月免费额度足够个人使用了！
创建数据库后，等待程序构建/部署成功，程序会自动初始化和更新表结构，待表结构同步完成后，将 `doc/sql/data.sql` 导入到数据库执行。在 `Dashboard` 的 `Settings` 找到 `Database` 部分，你就能查看连接信息了。
当然，只要是兼容 pg 的数据库都是可以选择的，不必局限于某个平台。

> 注：从 2024-01-26 起，将[删除通过 IPv4 和 pgBouncer 的数据库访问方式](https://github.com/orgs/supabase/discussions/17817)。
> 在这之前部署且数据库使用 SupaBase 的用户，请更新数据库连接信息。
> 在 `Connection parameters` 里勾选 `Use connection pooling` 选项即可。

> 请确保您的数据库用户配置了正确的 Row Level Security（行级别安全性）权限，否则将无法正常访问。
>
> 如果您是第一次部署，仅需要执行 `data.sql` 即可，如果您是升级到涉及数据库变更的版本，请在执行对应版本编号的 sql 后再升级部署！
> 
> 系统默认账号密码为：admin@qq.com / 666666

#### 图片存储

存储你可以选择 AWS S3、阿里云 OSS 或者自建 MinIO（理论上来说兼容 S3 的都行），也可以交由你正在用的 AList 来维护。

> 注：当前版本为 MVP（最小可行性产品版本）版本，S3 存储还在开发中。

#### 环境变量

请在部署前设置您的环境变量，程序会去读这些值，用以更改构建步骤或函数执行期间的行为。

所有值都经过静态加密，并且对有权访问该项目的任何用户都可见。使用非敏感数据和敏感数据都是安全的。**但请注意您自己不要泄露环境变量的值！**

如果您更改了环境变量，它不会影响当前的部署，您需要重新构建部署后才会生效！

当然，如果您是容器化部署的，更改环境变量后只需要重启容器就行了，无需重新构建！

受限于 Nuxt3 的局限性，某些设计可能不是特别人性化（主要还是懒），望理解！

> 请注意，平台部署请在平台控制台填写环境变量，会自动覆盖 `.env.production` 的值，以免发生机密信息泄露！
> 
> 项目内默认的 key 都是用作演示用途！

| Key              | 备注                                                                                        |
|------------------|-------------------------------------------------------------------------------------------|
| DATABASE_URL     | Postgre 数据库 url，如：postgres://账号:密码@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres |
| AUTH_SECRET     | 权限机密，你可以执行 npx auth secret 生成一个，反正是随机的字符串就行                                               |

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

