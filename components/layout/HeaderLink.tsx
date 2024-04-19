import { fetchTagsShow } from '~/server/lib/query'
import { NavbarItem } from '@nextui-org/react'
import Link from 'next/link'
import { TagType } from '~/types'

export default async function HeaderLink() {
  const getData = async () => {
    'use server'
    return await fetchTagsShow()
  }

  const data = await getData() as Array<TagType>

  return (
    <>
      <NavbarItem className="cursor-pointer">
        <Link href="/">首页</Link>
      </NavbarItem>
      {data?.map((tag: TagType) => (
        <NavbarItem className="cursor-pointer" key={tag.id}>
          <Link href={tag.tag_value}>{tag.name}</Link>
        </NavbarItem>
      ))}
    </>
  )
}