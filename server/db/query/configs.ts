// 配置表

'use server'

import { db } from '~/server/lib/db'

/**
 * 根据 key 获取配置
 * @param keys key 列表
 * @returns 配置列表
 */
export async function fetchConfigsByKeys(keys: string[]) {
  return await db.configs.findMany({
    where: {
      config_key: {
        in: keys
      }
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  });
}

/**
 * 获取密钥
 * @returns 密钥
 */
export async function fetchSecretKey() {
  return await db.configs.findFirst({
    where: {
      config_key: 'secret_key'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  })
}

/**
 * 获取 auth 状态
 * @returns auth 状态
 */
export async function queryAuthStatus() {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_enable'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  });
}

/**
 * 获取 auth 临时密钥
 * @returns auth 临时密钥
 */
export async function queryAuthTemplateSecret() {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_temp_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  });
}

/**
 * 获取 auth 密钥
 * @returns auth 密钥
 */
export async function queryAuthSecret() {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true
    }
  });
}
