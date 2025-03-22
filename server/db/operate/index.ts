'use server'

import { db } from '~/server/lib/db'

/**
 * 更新用户密码
 * @param userId 用户 ID
 * @param newPassword 新密码
 */
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

/**
 * 更新用户信息
 * @param userId 用户 ID
 * @param updates 更新的用户信息
 */
export async function updateUserInfo(userId: string, updates: {
  name?: string,
  email?: string,
  image?: string,
}) {
  const updateQuery = Object.entries(updates)
    .filter(([_, value]) => value !== undefined)
    .reduce((acc, [key, value]) => ({
      ...acc,
      [key]: value
    }), {});
    
  return await db.user.update({
    where: { id: userId },
    data: updateQuery
  });
}
