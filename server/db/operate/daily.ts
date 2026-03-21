// 每日精选配置操作

'use server'

import { db } from '~/server/lib/db'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

/**
 * 检查并刷新每日精选图片
 * 根据配置的刷新间隔，判断是否需要刷新物化视图
 */
export async function checkAndRefreshDailyImages() {
  const configs = await fetchConfigsByKeys([
    'daily_enabled',
    'daily_refresh_interval',
    'daily_last_refresh',
  ])

  const enabledConfig = configs.find(c => c.config_key === 'daily_enabled')
  const intervalConfig = configs.find(c => c.config_key === 'daily_refresh_interval')
  const lastRefreshConfig = configs.find(c => c.config_key === 'daily_last_refresh')

  if (!enabledConfig || enabledConfig.config_value !== 'true') {
    return
  }

  const intervalHours = parseInt(intervalConfig?.config_value || '24', 10)
  const lastRefresh = lastRefreshConfig?.config_value
    ? new Date(lastRefreshConfig.config_value).getTime()
    : 0

  const now = Date.now()
  const intervalMs = intervalHours * 60 * 60 * 1000

  if (now > lastRefresh + intervalMs) {
    const lockResult = await db.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>`SELECT pg_try_advisory_lock(42)`
    if (!lockResult[0]?.pg_try_advisory_lock) return
    try {
      await refreshDailyImages()
    } finally {
      await db.$executeRaw`SELECT pg_advisory_unlock(42)`
    }
  }
}

/**
 * 刷新每日精选物化视图
 * 并发刷新物化视图，更新最后刷新时间
 */
export async function refreshDailyImages() {
  await db.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY "daily_images"`
  await db.configs.update({
    where: { config_key: 'daily_last_refresh' },
    data: {
      config_value: new Date().toISOString(),
      updatedAt: new Date(),
    },
  })
}

/**
 * 更新 daily 配置
 */
export async function updateDailyConfig(payload: {
  dailyEnabled: boolean
  dailyRefreshInterval: string
  dailyTotalCount: number
}) {
  const { dailyEnabled, dailyRefreshInterval, dailyTotalCount } = payload
  const updates = [
    db.configs.update({
      where: { config_key: 'daily_enabled' },
      data: { config_value: dailyEnabled ? 'true' : 'false', updatedAt: new Date() }
    }),
    db.configs.update({
      where: { config_key: 'daily_refresh_interval' },
      data: { config_value: dailyRefreshInterval, updatedAt: new Date() }
    }),
    db.configs.update({
      where: { config_key: 'daily_total_count' },
      data: { config_value: dailyTotalCount.toString(), updatedAt: new Date() }
    }),
  ]
  return await db.$transaction(updates)
}

/**
 * 批量更新相册 daily 权重
 */
export async function updateAlbumsDailyWeight(
  albums: Array<{ id: string, dailyWeight: number }>
) {
  const updates = albums.map(album =>
    db.albums.update({
      where: { id: album.id },
      data: { daily_weight: album.dailyWeight, updatedAt: new Date() }
    })
  )
  return await db.$transaction(updates)
}
