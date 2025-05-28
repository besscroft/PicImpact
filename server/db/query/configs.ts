// 配置表

'use server'

import { db } from '~/server/lib/db'
import type { Config } from '~/types'

/**
 * 根据 key 获取配置
 * @param keys key 列表
 * @return {Promise<Config[]>} 配置列表
 */
export async function fetchConfigsByKeys(keys: string[]): Promise<Config[]> {
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
  })
}

/**
 * 获取密钥
 * @returns {Promise<Config | null>} 密钥
 */
export async function fetchSecretKey(): Promise<Config | null> {
  return await db.configs.findFirst({
    where: {
      config_key: 'secret_key'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })
}

/**
 * 获取 auth 状态
 * @returns {Promise<Config | null>} auth 状态
 */
export async function queryAuthStatus(): Promise<Config | null> {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_enable'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })
}

/**
 * 获取 auth 临时密钥
 * @returns {Promise<Config | null>} auth 临时密钥
 */
export async function queryAuthTemplateSecret(): Promise<Config | null> {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_temp_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })
}

/**
 * 获取 auth 密钥
 * @returns {Promise<Config | null>} auth 密钥
 */
export async function queryAuthSecret(): Promise<Config | null> {
  return await db.configs.findFirst({
    where: {
      config_key: 'auth_secret'
    },
    select: {
      id: true,
      config_key: true,
      config_value: true,
      detail: true
    }
  })
}
