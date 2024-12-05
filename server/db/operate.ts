'use server'

import { db } from '~/server/lib/db'
import { AlbumType, CopyrightType, ImageType } from '~/types'

export async function insertAlbums(album: AlbumType) {
  if (!album.sort || album.sort < 0) {
    album.sort = 0
  }
  return await db.albums.create({
    data: {
      name: album.name,
      album_value: album.album_value,
      detail: album.detail,
      sort: album.sort,
      show: album.show,
      allow_download: album.allow_download,
      license: album.license,
      del: 0
    }
  })
}

export async function deleteAlbum(id: string) {
  return await db.albums.update({
    where: {
      id: id
    },
    data: {
      del: 1,
      updatedAt: new Date(),
    }
  })
}

export async function updateAlbum(album: AlbumType) {
  if (!album.sort || album.sort < 0) {
    album.sort = 0
  }
  await db.$transaction(async (tx) => {
    const tagOld = await tx.albums.findFirst({
      where: {
        id: album.id
      }
    })
    if (!tagOld) {
      throw new Error('标签不存在！')
    }
    await tx.albums.update({
      where: {
        id: album.id
      },
      data: {
        name: album.name,
        album_value: album.album_value,
        detail: album.detail,
        sort: album.sort,
        show: album.show,
        allow_download: album.allow_download,
        license: album.license,
        updatedAt: new Date(),
      }
    })
    await tx.imagesAlbumsRelation.updateMany({
      where: {
        album_value: tagOld.album_value
      },
      data: {
        album_value: album.album_value
      }
    })
  })
}

export async function insertCopyright(copyright: CopyrightType) {
  return await db.copyright.create({
    data: {
      name: copyright.name,
      social_name: copyright.social_name,
      type: copyright.type,
      url: copyright.url,
      avatar_url: copyright.avatar_url,
      detail: copyright.detail,
      show: copyright.show,
      del: 0
    }
  })
}

export async function deleteCopyright(id: string) {
  return await db.copyright.update({
    where: {
      id: id
    },
    data: {
      del: 1,
      updatedAt: new Date(),
    }
  })
}

export async function updateCopyright(copyright: CopyrightType) {
  await db.$transaction(async (tx) => {
    const copyrightOld = await tx.copyright.findFirst({
      where: {
        id: copyright.id
      }
    })
    if (!copyrightOld) {
      throw new Error('版权信息不存在！')
    }
    await tx.copyright.update({
      where: {
        id: copyright.id
      },
      data: {
        name: copyright.name,
        social_name: copyright.social_name,
        type: copyright.type,
        url: copyright.url,
        avatar_url: copyright.avatar_url,
        detail: copyright.detail,
        show: copyright.show,
        default: copyright.default,
        updatedAt: new Date(),
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
        title: image.title,
        preview_url: image.preview_url,
        video_url: image.video_url,
        exif: image.exif,
        labels: image.labels,
        width: image.width,
        height: image.height,
        detail: image.detail,
        lat: String(image.lat),
        lon: String(image.lon),
        type: image.type,
        show: 1,
        sort: image.sort,
        del: 0
      }
    })

    if (resultRow) {
      await tx.imagesAlbumsRelation.create({
        data: {
          imageId: resultRow.id,
          album_value: image.album
        }
      })
    } else {
      throw new Error('事务处理失败！')
    }
  })
}

export async function deleteImage(id: string) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: id
      }
    })

    await tx.images.update({
      where: {
        id: id
      },
      data: {
        del: 1,
        updatedAt: new Date(),
      }
    })
  })
}

export async function deleteBatchImage(ids: string[]) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: {
          in: ids
        }
      }
    })
    await tx.images.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        del: 1,
        updatedAt: new Date(),
      },
    })
  })
}

export async function updateImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  await db.$transaction(async (tx) => {
    await tx.images.update({
      where: {
        id: image.id
      },
      data: {
        url: image.url,
        title: image.title,
        preview_url: image.preview_url,
        video_url: image.video_url,
        exif: image.exif,
        labels: image.labels,
        detail: image.detail,
        sort: image.sort,
        show: image.show,
        width: image.width,
        height: image.height,
        lat: image.lat,
        lon: image.lon,
        updatedAt: new Date(),
      }
    })
    await tx.imagesCopyrightRelation.deleteMany({
      where: {
        imageId: image.id
      }
    })
    if (Array.isArray(image.copyrights) && image.copyrights.length > 0) {
      await tx.imagesCopyrightRelation.createMany({
        data: image.copyrights.map((item: string) => {
          return {
            imageId: image.id,
            copyrightId: item
          }
        })
      })
    }
  })
}

export async function updatePassword(userId: string, newPassword: string) {
  return await db.user.update({
    where: {
      id: userId
    },
    data: {
      password: newPassword
    }
  })
}

export async function updateS3Config(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'accesskey_id' THEN ${configs.accesskeyId}
       WHEN config_key = 'accesskey_secret' THEN ${configs.accesskeySecret}
       WHEN config_key = 'region' THEN ${configs.region}
       WHEN config_key = 'endpoint' THEN ${configs.endpoint}
       WHEN config_key = 'bucket' THEN ${configs.bucket}
       WHEN config_key = 'storage_folder' THEN ${configs.storageFolder}
       WHEN config_key = 'force_path_style' THEN ${configs.forcePathStyle}
       WHEN config_key = 's3_cdn' THEN ${configs.s3Cdn}
       WHEN config_key = 's3_cdn_url' THEN ${configs.s3CdnUrl}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder', 'force_path_style', 's3_cdn', 's3_cdn_url');
  `
}

export async function updateR2Config(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'r2_accesskey_id' THEN ${configs.r2AccesskeyId}
       WHEN config_key = 'r2_accesskey_secret' THEN ${configs.r2AccesskeySecret}
       WHEN config_key = 'r2_endpoint' THEN ${configs.r2Endpoint}
       WHEN config_key = 'r2_bucket' THEN ${configs.r2Bucket}
       WHEN config_key = 'r2_storage_folder' THEN ${configs.r2StorageFolder}
       WHEN config_key = 'r2_public_domain' THEN ${configs.r2PublicDomain}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('r2_accesskey_id', 'r2_accesskey_secret', 'r2_endpoint', 'r2_bucket', 'r2_storage_folder', 'r2_public_domain');
  `
}

export async function updateAListConfig(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'alist_url' THEN ${configs.alistUrl}
       WHEN config_key = 'alist_token' THEN ${configs.alistToken}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('alist_url', 'alist_token');
  `
}

export async function updateImageShow(id: string, show: number) {
  return await db.images.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}

export async function updateImageAlbum(imageId: string, albumId: string) {
  await db.$transaction(async (tx) => {
    const resultRow = await tx.albums.findUnique({
      where: {
        id: albumId
      }
    })
    if (!resultRow) {
      throw new Error('相册不存在！')
    }
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: imageId,
      }
    })
    await tx.imagesAlbumsRelation.create({
      data: {
        imageId: imageId,
        album_value: resultRow.album_value
      }
    })
  })
}

export async function updateAlbumShow(id: string, show: number) {
  return await db.albums.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}

export async function updateCopyrightShow(id: string, show: number) {
  return await db.copyright.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}

export async function updateCustomInfo(payload: {
  title: string
  customFaviconUrl: string
  customAuthor: string
  feedId: string
  userId: string
  enablePreviewImageMaxWidthLimit?: boolean
  previewImageMaxWidth?: number
  previewQuality?: number
}) {
  const {
    title,
    customFaviconUrl,
    customAuthor,
    feedId,
    userId,
    enablePreviewImageMaxWidthLimit,
    previewImageMaxWidth,
    previewQuality,
  } = payload
  await db.$transaction(async (tx) => {
    await tx.configs.update({
      where: {
        config_key: 'custom_title'
      },
      data: {
        config_value: title,
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'custom_favicon_url'
      },
      data: {
        config_value: customFaviconUrl,
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'custom_author'
      },
      data: {
        config_value: customAuthor,
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'rss_feed_id'
      },
      data: {
        config_value: feedId,
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'rss_user_id'
      },
      data: {
        config_value: userId,
        updatedAt: new Date()
      }
    })
    if (typeof enablePreviewImageMaxWidthLimit === 'boolean') {
      await tx.configs.update({
        where: {
          config_key: 'preview_max_width_limit_switch'
        },
        data: {
          config_value: enablePreviewImageMaxWidthLimit ? '1' : '0',
          updatedAt: new Date(),
        }
      })
    }
    if (typeof previewImageMaxWidth === 'number' && previewImageMaxWidth > 0) {
      await tx.configs.update({
        where: {
          config_key: 'preview_max_width_limit'
        },
        data: {
          config_value: previewImageMaxWidth.toString(),
          updatedAt: new Date(),
        }
      })
    }
    if (typeof previewQuality === 'number' && previewQuality > 0) {
      await tx.configs.update({
        where: {
          config_key: 'preview_quality'
        },
        data: {
          config_value: previewQuality.toString(),
          updatedAt: new Date(),
        }
      })
    }
  })
}

export async function saveAuthTemplateSecret(token: string) {
  await db.configs.update({
    where: {
      config_key: 'auth_temp_secret'
    },
    data: {
      config_value: token,
      updatedAt: new Date()
    }
  })
}

export async function saveAuthSecret(enable: string, secret: string) {
  await db.$transaction(async (tx) => {
    await tx.configs.update({
      where: {
        config_key: 'auth_enable'
      },
      data: {
        config_value: enable,
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'auth_secret'
      },
      data: {
        config_value: secret,
        updatedAt: new Date()
      }
    })
  })
}

export async function deleteAuthSecret() {
  await db.$transaction(async (tx) => {
    await tx.configs.update({
      where: {
        config_key: 'auth_enable'
      },
      data: {
        config_value: 'false',
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'auth_secret'
      },
      data: {
        config_value: '',
        updatedAt: new Date()
      }
    })
    await tx.configs.update({
      where: {
        config_key: 'auth_temp_secret'
      },
      data: {
        config_value: '',
        updatedAt: new Date()
      }
    })
  })
}
