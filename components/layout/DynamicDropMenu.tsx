'use client'

import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { Aperture } from 'lucide-react'
import { DataProps, TagType } from '~/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'

export default function DynamicDropMenu(props: Readonly<DataProps>) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:!outline-none"><Aperture size={20} /></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          key="/"
          onClick={() => router.push('/')}
          className={pathname === '/' ? 'bg-gray-100 dark:text-black' : ''}
        >首页</DropdownMenuItem>
        <DropdownMenuSeparator />
        {Array.isArray(props.data) && props.data?.map((tag: TagType, index: any, array: TagType[]) => (
          <DropdownMenuItem
            key={tag.id}
            onClick={() => router.push(tag.tag_value)}
            className={pathname === tag.tag_value ? 'bg-gray-100 dark:text-black' : ''}
          >{tag.name}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}