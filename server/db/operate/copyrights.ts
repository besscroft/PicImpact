// 版权表

'use server'

import { db } from '~/server/lib/db'
import type { CopyrightType } from '~/types'

/**
 * 新增版权信息
 * @param copyright 版权信息
 */
export async function insertCopyright(copyright: CopyrightType) {
  return await db.copyright.create({
    data: {
      name: copyright.name,
      social_name: copyright.social_name,
      type: copyright.type,
      url: copyright.url,
      avatar_url: copyright.avatar_url,
      detail: copyright.detail,
      show: copyright.show,
      del: 0
    }
  })
}

/**
 * 逻辑删除版权信息
 * @param id 版权信息 ID
 */
export async function deleteCopyright(id: string) {
  return await db.copyright.update({
    where: {
      id: id
    },
    data: {
      del: 1,
      updatedAt: new Date(),
    }
  })
}

/**
 * 更新版权信息
 * @param copyright 版权信息
 */
export async function updateCopyright(copyright: CopyrightType) {
  await db.$transaction(async (tx) => {
    const copyrightOld = await tx.copyright.findFirst({
      where: {
        id: copyright.id
      }
    })
    if (!copyrightOld) {
      throw new Error('版权信息不存在！')
    }
    await tx.copyright.update({
      where: {
        id: copyright.id
      },
      data: {
        name: copyright.name,
        social_name: copyright.social_name,
        type: copyright.type,
        url: copyright.url,
        avatar_url: copyright.avatar_url,
        detail: copyright.detail,
        show: copyright.show,
        default: copyright.default,
        updatedAt: new Date(),
      }
    })
  })
}

/**
 * 更新版权信息的显示状态
 * @param id 版权信息 ID
 * @param show 显示状态：0=显示，1=隐藏
 */
export async function updateCopyrightShow(id: string, show: number) {
  return await db.copyright.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}
