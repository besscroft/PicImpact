'use client'

import * as React from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Archive, Milestone, Image, Server, ImageUp, MonitorDot, Copyright, Info, SquareAsterisk, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export default function Command() {
  const router = useRouter()
  const { searchOpen, setSearchOpen } = useButtonStore(
    (state) => state,
  )

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>没有任何结果.</CommandEmpty>
        <CommandGroup heading="主菜单">
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin')
            setSearchOpen(false)
          }}>
            <MonitorDot className="mr-2 h-4 w-4" />
            <span>控制台</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/upload')
            setSearchOpen(false)
          }}>
            <ImageUp className="mr-2 h-4 w-4" />
            <span>上传</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/list')
            setSearchOpen(false)
          }}>
            <Image className="mr-2 h-4 w-4" />
            <span>图片维护</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/album')
            setSearchOpen(false)
          }}>
            <Milestone className="mr-2 h-4 w-4" />
            <span>相册管理</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/copyright')
            setSearchOpen(false)
          }}>
            <Copyright className="mr-2 h-4 w-4" />
            <span>版权管理</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/about')
            setSearchOpen(false)
          }}>
            <Info className="mr-2 h-4 w-4" />
            <span>关于</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="二级菜单">
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/settings/preferences')
            setSearchOpen(false)
          }}>
            <Archive className="mr-2 h-4 w-4" />
            <span>首选项</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/settings/password')
            setSearchOpen(false)
          }}>
            <SquareAsterisk className="mr-2 h-4 w-4" />
            <span>密码修改</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/settings/storages')
            setSearchOpen(false)
          }}>
            <Server className="mr-2 h-4 w-4" />
            <span>存储</span>
          </CommandItem>
          <CommandItem className="cursor-pointer" onSelect={() => {
            router.push('/admin/settings/authenticator')
            setSearchOpen(false)
          }}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>双因素验证</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}