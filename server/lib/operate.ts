'use server'

import { db } from '~/server/lib/db'
import { TagType } from '~/types'

export async function insertTag(tag: TagType) {
  if (!tag.sort || tag.sort < 0) {
    tag.sort = 0
  }
  const resultRow = await db.tags.create({
    data: {
      name: tag.name,
      tag_value: tag.tag_value,
      detail: tag.detail,
      sort: tag.sort,
      show: tag.show,
      del: 0
    }
  })
  return resultRow
}

export async function deleteTag(id: number) {
  const resultRow = await db.tags.update({
    where: {
      id: Number(id)
    },
    data: {
      del: 1,
      update_time: new Date(),
    }
  })
  return resultRow
}

export async function updateTag(tag: TagType) {
  if (!tag.sort || tag.sort < 0) {
    tag.sort = 0
  }
  const resultRow = await db.tags.update({
    where: {
      id: Number(tag.id)
    },
    data: {
      name: tag.name,
      tag_value: tag.tag_value,
      detail: tag.detail,
      sort: tag.sort,
      show: tag.show,
      update_time: new Date(),
    }
  })
  return resultRow
}