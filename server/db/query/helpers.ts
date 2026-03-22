import { Prisma } from '@prisma/client'

/**
 * 构建相机/镜头 EXIF 过滤条件
 */
export function buildExifFilters(camera?: string, lens?: string) {
  return Prisma.sql`
    ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
  `
}

/**
 * 构建分页条件
 */
export function buildPagination(pageNum: number, pageSize: number) {
  const validPage = Math.max(1, Number.isFinite(pageNum) ? Math.floor(pageNum) : 1)
  const validSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 24
  return Prisma.sql`LIMIT ${validSize} OFFSET ${(validPage - 1) * validSize}`
}

/**
 * 构建公开状态过滤条件
 */
export function buildShowFilter(showStatus: number) {
  return showStatus !== -1
    ? Prisma.sql`AND image.show = ${showStatus}`
    : Prisma.empty
}

/**
 * 从分页计数结果中提取页数
 */
export function calcPageTotal(total: number | bigint, pageSize: number): number {
  const count = Number(total)
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 0
  return count > 0 ? Math.ceil(count / pageSize) : 0
}
