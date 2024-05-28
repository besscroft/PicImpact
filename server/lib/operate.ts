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
        preview_url: image.preview_url,
        exif: image.exif,
        labels: image.labels,
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
      preview_url: image.preview_url,
      exif: image.exif,
      labels: image.labels,
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
       WHEN config_key = 'force_path_style' THEN ${configs.forcePathStyle}
       ELSE 'N&A'
    END,
        update_time = NOW()
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder', 'force_path_style');
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
    END,
        update_time = NOW()
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
    END,
        update_time = NOW()
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
      show: show,
      update_time: new Date()
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
      show: show,
      update_time: new Date()
    }
  })
  return resultRow
}

export async function updateCustomTitle(title: string) {
  const resultRow = await db.configs.update({
    where: {
      config_key: 'custom_title'
    },
    data: {
      config_value: title,
      update_time: new Date()
    }
  })
  return resultRow
}