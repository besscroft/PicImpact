'use server'

import { db } from '~/server/lib/db'
import { TagType, ImageType } from '~/types'

export async function insertTag(tag: TagType) {
  if (!tag.sort || tag.sort < 0) {
    tag.sort = 0
  }
  const resultRow = await db.tags.create({
    data: {
      name: tag.name,
      tag_value: tag.tag_value,
      detail: tag.detail,
      sort: tag.sort,
      show: tag.show,
      del: 0
    }
  })
  return resultRow
}

export async function deleteTag(id: number) {
  const resultRow = await db.tags.update({
    where: {
      id: Number(id)
    },
    data: {
      del: 1,
      update_time: new Date(),
    }
  })
  return resultRow
}

export async function updateTag(tag: TagType) {
  if (!tag.sort || tag.sort < 0) {
    tag.sort = 0
  }
  await db.$transaction(async (tx) => {
    const tagOld = await tx.tags.findFirst({
      where: {
        id: Number(tag.id)
      }
    })
    if (!tagOld) {
      throw new Error('标签不存在！')
    }
    await tx.tags.update({
      where: {
        id: Number(tag.id)
      },
      data: {
        name: tag.name,
        tag_value: tag.tag_value,
        detail: tag.detail,
        sort: tag.sort,
        show: tag.show,
        update_time: new Date(),
      }
    })
    await tx.imageTagRelation.updateMany({
      where: {
        tag_value: tagOld.tag_value
      },
      data: {
        tag_value: tag.tag_value
      }
    })
  })
}

export async function insertImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  await db.$transaction(async (tx) => {
    const resultRow = await tx.images.create({
      data: {
        url: image.url,
        exif: image.exif,
        width: image.width,
        height: image.height,
        detail: image.detail,
        lat: String(image.lat),
        lon: String(image.lon),
        show: 1,
        sort: image.sort,
        del: 0
      }
    })

    if (resultRow) {
      await tx.imageTagRelation.create({
        data: {
          imageId: resultRow.id,
          tag_value: image.tag
        }
      })
    } else {
      throw new Error('事务处理失败！')
    }
  })
}

export async function deleteImage(id: number) {
  await db.$transaction(async (tx) => {
    await tx.imageTagRelation.deleteMany({
      where: {
        imageId: Number(id)
      }
    })

    await tx.images.update({
      where: {
        id: Number(id)
      },
      data: {
        del: 1,
        update_time: new Date(),
      }
    })
  })
}

export async function updateImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  const resultRow = await db.images.update({
    where: {
      id: Number(image.id)
    },
    data: {
      url: image.url,
      exif: image.exif,
      detail: image.detail,
      sort: image.sort,
      show: image.show,
      width: image.width,
      height: image.height,
      lat: image.lat,
      lon: image.lon,
      update_time: new Date(),
    }
  }
  )
  return resultRow
}

export async function insertImages(json: any[]) {
  await db.$transaction(async (tx) => {
    for (const image of json) {
      const res = await tx.images.create({
        data: {
          url: image.url,
          exif: image.exif,
          width: image.width,
          height: image.height,
          detail: image.detail,
          lat: image.lat,
          lon: image.lon,
          show: 1,
          sort: image.sort,
          create_time: image.create_time,
          update_time: image.update_time,
        }
      })
      if (image.tag_values.includes(',')) {
        for (const tag of image.tag_values.split(',')) {
          if (tag) {
            await tx.imageTagRelation.create({
              data: {
                imageId: res.id,
                tag_value: tag
              }
            })
          }
        }
      } else {
        await tx.imageTagRelation.create({
          data: {
            imageId: res.id,
            tag_value: image.tag_values
          }
        })
      }
    }
  })
}

export async function updatePassword(userId: string, newPassword: string) {
  const resultRow = await db.user.update({
    where: {
      id: userId
    },
    data: {
      password: newPassword
    }
  })
  return resultRow
}

export async function updateS3Config(configs: any) {
  const resultRow = await db.$executeRaw`
    UPDATE "public"."Configs"
    SET config_value = CASE
       WHEN config_key = 'accesskey_id' THEN ${configs.accesskeyId}
       WHEN config_key = 'accesskey_secret' THEN ${configs.accesskeySecret}
       WHEN config_key = 'region' THEN ${configs.region}
       WHEN config_key = 'endpoint' THEN ${configs.endpoint}
       WHEN config_key = 'bucket' THEN ${configs.bucket}
       WHEN config_key = 'storage_folder' THEN ${configs.storageFolder}
       ELSE 'N&A'
    END
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder');
  `
  return resultRow
}

export async function updateR2Config(configs: any) {
  const resultRow = await db.$executeRaw`
    UPDATE "public"."Configs"
    SET config_value = CASE
       WHEN config_key = 'r2_accesskey_id' THEN ${configs.r2AccesskeyId}
       WHEN config_key = 'r2_accesskey_secret' THEN ${configs.r2AccesskeySecret}
       WHEN config_key = 'r2_endpoint' THEN ${configs.r2Endpoint}
       WHEN config_key = 'r2_bucket' THEN ${configs.r2Bucket}
       WHEN config_key = 'r2_storage_folder' THEN ${configs.r2StorageFolder}
       WHEN config_key = 'r2_public_domain' THEN ${configs.r2PublicDomain}
       ELSE 'N&A'
    END
    WHERE config_key IN ('r2_accesskey_id', 'r2_accesskey_secret', 'r2_endpoint', 'r2_bucket', 'r2_storage_folder', 'r2_public_domain');
  `
  return resultRow
}

export async function updateAListConfig(configs: any) {
  const resultRow = await db.$executeRaw`
    UPDATE "public"."Configs"
    SET config_value = CASE
       WHEN config_key = 'alist_url' THEN ${configs.alistUrl}
       WHEN config_key = 'alist_token' THEN ${configs.alistToken}
       ELSE 'N&A'
    END
    WHERE config_key IN ('alist_url', 'alist_token');
  `
  return resultRow
}

export async function updateImageShow(id: number, show: number) {
  const resultRow = await db.images.update({
    where: {
      id: Number(id)
    },
    data: {
      show: show
    }
  })
  return resultRow
}

export async function updateTagShow(id: number, show: number) {
  const resultRow = await db.tags.update({
    where: {
      id: Number(id)
    },
    data: {
      show: show
    }
  })
  return resultRow
}

export async function initConfig() {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('accesskey_id', '', '阿里 OSS / AWS S3 AccessKey_ID', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('accesskey_secret', '', '阿里 OSS / AWS S3 AccessKey_Secret', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('region', '', '阿里 OSS / AWS S3 Region 地域，如：oss-cn-hongkong', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('endpoint', '', '阿里 OSS / AWS S3 Endpoint 地域节点，如：oss-cn-hongkong.aliyuncs.com', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('bucket', '', '阿里 OSS / AWS S3 Bucket 存储桶名称，如：picimpact', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('storage_folder', '', '存储文件夹(S3)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('alist_token', '', 'alist 令牌 ', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('alist_url', '', 'AList 地址，如：https://alist.example.com', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('secret_key', '', 'SECRET_KEY', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_accesskey_id', '', 'Cloudflare AccessKey_ID', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_accesskey_secret', '', 'Cloudflare AccessKey_Secret', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_endpoint', '', 'Cloudflare Endpoint 地域节点，如：https://<ACCOUNT_ID>.r2.cloudflarestorage.com', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_bucket', '', 'Cloudflare Bucket 存储桶名称，如：picimpact', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_storage_folder', '', '存储文件夹(Cloudflare R2)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径', NOW())
          ON CONFLICT (config_key) DO NOTHING;
      INSERT INTO "public"."Configs" (config_key, config_value, detail, create_time)
      VALUES ('r2_public_domain', '', 'Cloudflare R2 自定义域（公开访问）', NOW())
          ON CONFLICT (config_key) DO NOTHING;
    `
  })
}