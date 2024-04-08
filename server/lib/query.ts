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
