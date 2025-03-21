'use server'

import { db } from '~/server/lib/db'

/**
 * 获取用户信息
 * @param userId 用户 ID
 * @returns 用户信息
 */
export async function fetchUserById(userId: string) {
  return await db.user.findUnique({
    where: {
      id: userId
    }
  })
}
