'use server'

import { db } from '~/server/lib/db'

/**
 * 检查是否已存在用户
 * @returns {Promise<boolean>} 是否存在用户
 */
export async function checkUserExists(): Promise<boolean> {
  const count = await db.user.count()
  return count > 0
}
