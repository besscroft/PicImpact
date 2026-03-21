'use server'

import { Prisma } from '@prisma/client'

/**
 * 构建相机/镜头 EXIF 过滤条件
 */
export function buildExifFilters(camera?: string, lens?: string, alias = 'image') {
  return Prisma.sql`
    ${camera ? Prisma.sql`AND COALESCE(${Prisma.raw(alias)}.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(${Prisma.raw(alias)}.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
  `
}

/**
 * 构建分页条件
 */
export function buildPagination(pageNum: number, pageSize: number) {
  const validPage = Math.max(1, pageNum)
  return Prisma.sql`LIMIT ${pageSize} OFFSET ${(validPage - 1) * pageSize}`
}

/**
 * 构建公开状态过滤条件
 */
export function buildShowFilter(showStatus: number, alias = 'image') {
  return showStatus !== -1
    ? Prisma.sql`AND ${Prisma.raw(alias)}.show = ${showStatus}`
    : Prisma.empty
}

/**
 * 从分页计数结果中提取页数
 */
export function calcPageTotal(total: number | bigint, pageSize: number): number {
  const count = Number(total)
  return count > 0 ? Math.ceil(count / pageSize) : 0
}
