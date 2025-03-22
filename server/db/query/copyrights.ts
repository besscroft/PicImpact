// 版权表

'use server'

import { db } from '~/server/lib/db'

/**
 * 获取版权列表
 * @returns {Promise<CopyrightType[]>} 版权列表
 */
export async function fetchCopyrightList() {
  return await db.copyright.findMany({
    where: {
      del: 0,
    },
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        updatedAt: 'desc'
      }
    ]
  });
}
