'use server'

import { db } from '~/server/lib/db'

export async function fetchS3Info() {
  const findConfig = await db.configs.findMany({
    where: {
      config_key: {
        in: [
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'cdn_url'
        ]
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return findConfig;
}

export async function fetchAListInfo() {
  const findConfig = await db.configs.findMany({
    where: {
      config_key: {
        in: [
          'alist_url',
          'alist_token'
        ]
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return findConfig;
}

export async function fetchTagsList() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0
    }
  })

  return findAll;
}

export async function fetchImagesList(pageNum: number) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.images.findMany({
    skip: (pageNum - 1) * 8,
    take: 8,
    where: {
      del: 0
    }
  })

  return findAll;
}

export async function fetchTags() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0
    }
  })

  return findAll;
}

export async function fetchImagesTotal() {
  const total = await db.images.count({
    where: {
      del: 0
    }
  })

  return total > 0 ? Math.ceil(total / 8) : 0;
}

export async function fetchClientImagesListByTag(pageNum: number, tag: string) {
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.images.findMany({
    skip: (pageNum - 1) * 12,
    take: 12,
    where: {
      del: 0,
      tag: tag,
      show: 0
    }
  })

  return findAll;
}

export async function fetchClientImagesPageTotalByTag(tag: string) {
  const pageTotal = await db.images.count({
    where: {
      del: 0,
      tag: tag,
      show: 0
    }
  })
  return pageTotal > 0 ? Math.ceil(pageTotal / 12) : 0
}
