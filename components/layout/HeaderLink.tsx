'use client'

import { Button } from '@nextui-org/react'
import { TagType, LinkProps } from '~/types'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import useSWR from 'swr'

export default function HeaderLink(props: Readonly<LinkProps>) {
  const { data } = useSWR(props.args,
    () => {
      return props.handle
    }, { revalidateOnFocus: false, fallbackData: props.data })
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      <Button
        color="primary"
        radius="none"
        variant="light"
        className={pathname === '/' ? 'border-b-2 border-indigo-600' : ''}
        onClick={() => router.push('/')}
      >
        首页
      </Button>
      {data?.map((tag: TagType) => (
        <Button
          key={tag.id}
          color="primary"
          radius="none"
          variant="light"
          className={pathname === tag.tag_value ? 'border-b-2 border-indigo-600' : ''}
          onClick={() => router.push(tag.tag_value)}
        >
          {tag.name}
        </Button>
      ))}
    </>
  )
}