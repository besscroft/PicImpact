import { PrismaClient } from '@prisma/client'

export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === 'edge') {
      return
    }
    const prisma = new PrismaClient()
    if (prisma) {
      const cuidModule = await import('cuid')
      const cuid = cuidModule.default
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          INSERT INTO "public"."users" (id, name, username, email, password, image)
            VALUES (${cuid()}, 'admin', 'admin', 'admin@qq.com', '51630b15b0cec2da9926af7015db33b7809f9d24959a0d48665b83e9d19216cd5601d08a622a8b2c48709d5bbb62eef6ae76addce5d18703b28965eef62d491b', 'https://bbs-static.miyoushe.com/communityweb/upload/97734c89374997c7c87d5af5f7442171.png')
          ON CONFLICT (username) DO NOTHING;
        `
        await tx.configs.createMany({
          data: [
            { config_key: 'accesskey_id', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_ID' },
            { config_key: 'accesskey_secret', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_Secret' },
            { config_key: 'region', config_value: '', detail: '阿里 OSS / AWS S3 Region 地域，如：oss-cn-hongkong' },
            { config_key: 'endpoint', config_value: '', detail: '阿里 OSS / AWS S3 Endpoint 地域节点，如：oss-cn-hongkong.aliyuncs.com' },
            { config_key: 'bucket', config_value: '', detail: '阿里 OSS / AWS S3 Bucket 存储桶名称，如：picimpact' },
            { config_key: 'storage_folder', config_value: '', detail: '存储文件夹(S3)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径' },
            { config_key: 'force_path_style', config_value: 'false', detail: '是否强制客户端对桶使用路径式寻址，默认 false。' },
            { config_key: 's3_cdn', config_value: 'false', detail: '是否启用 S3 CDN 模式，路径将返回 cdn 地址，默认 false。' },
            { config_key: 's3_cdn_url', config_value: '', detail: 'cdn 地址，如：https://cdn.example.com' },
            { config_key: 'alist_token', config_value: '', detail: 'alist 令牌' },
            { config_key: 'alist_url', config_value: '', detail: 'AList 地址，如：https://alist.besscroft.com' },
            { config_key: 'secret_key', config_value: 'pic-impact', detail: 'SECRET_KEY' },
            { config_key: 'r2_accesskey_id', config_value: '', detail: 'Cloudflare AccessKey_ID' },
            { config_key: 'r2_accesskey_secret', config_value: '', detail: 'Cloudflare AccessKey_Secret' },
            { config_key: 'r2_endpoint', config_value: '', detail: 'Cloudflare Endpoint 地域节点，如：https://<ACCOUNT_ID>.r2.cloudflarestorage.com' },
            { config_key: 'r2_bucket', config_value: '', detail: 'Cloudflare Bucket 存储桶名称，如：picimpact' },
            { config_key: 'r2_storage_folder', config_value: '', detail: '存储文件夹(Cloudflare R2)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径' },
            { config_key: 'r2_public_domain', config_value: '', detail: 'Cloudflare R2 自定义域（公开访问）' },
            { config_key: 'custom_title', config_value: 'PicImpact', detail: '网站标题' },
            { config_key: 'auth_enable', config_value: 'false', detail: '是否启用双因素验证' },
            { config_key: 'auth_temp_secret', config_value: '', detail: '双因素验证临时种子密钥' },
            { config_key: 'auth_secret', config_value: '', detail: '双因素验证种子密钥' },
            { config_key: 'custom_favicon_url', config_value: '', detail: '用户自定义的 favicon 地址' },
            { config_key: 'custom_author', config_value: '', detail: '网站归属者名称' },
            { config_key: 'rss_feed_id', config_value: '', detail: 'Follow feedId' },
            { config_key: 'rss_user_id', config_value: '', detail: 'Follow userId' },
            { config_key: 'preview_max_width_limit', config_value: '0', detail: '预览图最大宽度限制' },
            { config_key: 'preview_max_width_limit_switch', config_value: '0', detail: '预览图最大宽度限制开关' },
            { config_key: 'preview_quality', config_value: '0.2', detail: '预览图压缩质量' },
          ],
          skipDuplicates: true,
        })
        await tx.$executeRaw`
          INSERT INTO "public"."albums" (id, name, album_value, detail, show, sort)
            VALUES (${cuid()}, '首页', '/', '请保留首页的路由，名字随意~', 0, 0)
          ON CONFLICT (album_value) DO NOTHING;
        `
      })
      console.log('初始化完毕！')
      await prisma.$disconnect()
    } else {
      console.error('数据库初始化失败，请检查您的连接信息！')
    }
  } catch (e) {
    console.error('初始化失败，请您先尝试排查问题，如无法解决请携带日志去提交反馈：https://github.com/besscroft/PicImpact/issues', e)
  }
}
