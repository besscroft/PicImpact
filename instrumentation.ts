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
          INSERT INTO "public"."User" (id, name, email, password, image)
            VALUES (${cuid()}, 'admin', 'admin@qq.com', '51630b15b0cec2da9926af7015db33b7809f9d24959a0d48665b83e9d19216cd5601d08a622a8b2c48709d5bbb62eef6ae76addce5d18703b28965eef62d491b', 'https://bbs-static.miyoushe.com/communityweb/upload/97734c89374997c7c87d5af5f7442171.png')
          ON CONFLICT (name) DO NOTHING;
        `
        await tx.configs.createMany({
          data: [
            { config_key: 'accesskey_id', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_ID' },
            { config_key: 'accesskey_secret', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_Secret' },
            { config_key: 'region', config_value: '', detail: '阿里 OSS / AWS S3 Region 地域，如：oss-cn-hongkong' },
            { config_key: 'endpoint', config_value: '', detail: '阿里 OSS / AWS S3 Endpoint 地域节点，如：oss-cn-hongkong.aliyuncs.com' },
            { config_key: 'bucket', config_value: '', detail: '阿里 OSS / AWS S3 Bucket 存储桶名称，如：picimpact' },
            { config_key: 'storage_folder', config_value: '', detail: '存储文件夹(S3)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径' },
            { config_key: 'force_path_style', config_value: 'false', detail: '是否强制客户端对桶使用路径式寻址' },
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
          ],
          skipDuplicates: true,
        })
        await tx.tags.createMany({
          data: [
            { name: '首页', tag_value: '/', detail: '首页，勿删', show: 0, sort: 0 },
          ],
          skipDuplicates: true,
        })
      })
      console.log('初始化完毕！')
      await prisma.$disconnect()
    } else {
      console.error('数据库初始化失败，请检查您的连接信息！')
    }
  } catch (e) {
    console.error('初始化数据失败，您可能需要准备干净的数据表，请联系管理员！', e)
  }
}