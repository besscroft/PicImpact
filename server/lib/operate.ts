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
  const resultRow = await db.tags.update({
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
  return resultRow
}

export async function insertImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  if (!image.rating || image.rating < 0) {
    image.rating = 0
  }
  const resultRow = await db.images.create({
    data: {
      url: image.url,
      exif: image.exif,
      width: image.width,
      height: image.height,
      tag: image.tag,
      detail: image.detail,
      show: 1,
      sort: image.sort,
      rating: image.rating,
      del: 0
    }
  })
  return resultRow
}

export async function deleteImage(id: number) {
  const resultRow = await db.images.update({
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

export async function updateImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  if (!image.rating || image.rating < 0) {
    image.rating = 0
  }
  const resultRow = await db.images.update({
    where: {
      id: Number(image.id)
    },
    data: {
      url: image.url,
      exif: image.exif,
      tag: image.tag,
      detail: image.detail,
      sort: image.sort,
      show: image.show,
      rating: image.rating,
      update_time: new Date(),
    }
  }
  )
  return resultRow
}

export async function insertImages(images: ImageType[]) {
  const resultRow = await db.images.createMany({
    data: images,
    skipDuplicates: true,
  })
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
       ELSE 'N&A'
    END
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder');
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