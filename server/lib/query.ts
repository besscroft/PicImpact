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

export async function fetchServerImagesListByTag(pageNum: number, tag: string) {
  if (tag === 'all') {
    tag = ''
  }
  if (pageNum < 1) {
    pageNum = 1
  }
  const findAll = await db.images.findMany({
    skip: (pageNum - 1) * 8,
    take: 8,
    where: {
      del: 0,
      tag: tag && tag !== '' ? tag : {
        not: ''
      }
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        create_time: 'desc',
      },
      {
        update_time: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchServerImagesPageTotalByTag(tag: string) {
  if (tag === 'all') {
    tag = ''
  }
  const pageTotal = await db.images.count({
    where: {
      del: 0,
      tag: tag && tag !== '' ? tag : {
        not: ''
      }
    }
  })
  return pageTotal > 0 ? Math.ceil(pageTotal / 8) : 0
}

export async function fetchTags() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0
    }
  })

  return findAll;
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
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        create_time: 'desc',
      },
      {
        update_time: 'desc'
      }
    ]
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

export async function fetchTagsShow() {
  const findAll = await db.tags.findMany({
    where: {
      del: 0,
      show: 0
    },
    orderBy: [
      {
        sort: 'desc'
      }
    ]
  })

  return findAll;
}

export async function fetchImagesAnalysis() {
  const total = await db.images.count({
    where: {
      del: 0
    },
  });

  const showTotal = await db.images.count({
    where: {
      del: 0,
      show: 0
    },
  })

  const result = await db.images.groupBy({
    by: ['tag'],
    _count: {
      tag: true
    },
    where: {
      del: 0
    }
  });

  return {
    total,
    showTotal,
    result
  }
}

export async function fetchAllImages() {
  const findAll = await db.images.findMany({
    where: {
      del: 0
    }
  })

  return findAll
}

export async function fetchUserById(userId: string) {
  const findUser = await db.user.findUnique({
    where: {
      id: userId
    }
  })
  return findUser
}

export async function fetchSecretKey() {
  const find = await db.configs.findFirst({
    where: {
      config_key: 'secret_key'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })

  return find
}
