'use client'

import { Card, CardFooter } from '~/components/ui/card'
import React from 'react'
import { ArrowDown10 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

export default function DefaultAlbum() {
  return (
    <Card className="flex flex-col h-64 show-up-motion items-center">
      <div className="flex justify-start w-full p-2 space-x-2">
        <p>首页</p>
        <Popover>
          <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
            <p className="whitespace-nowrap text-sm" aria-label="路由">/</p>
          </PopoverTrigger>
          <PopoverContent>
            <div className="px-1 py-2 select-none">
            <div className="text-small font-bold">路由</div>
              <div className="text-tiny">可以访问的一级路径</div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-start w-full p-2 flex-1">
        首页为默认路由，无法调整
      </div>
      <CardFooter className="flex p-2 mb-1 space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
        <p className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700 whitespace-nowrap text-sm">显示</p>
        <Popover>
          <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
            <div className="flex space-x-2 items-center justify-center text-sm"><ArrowDown10 size={20} />-1</div>
          </PopoverTrigger>
          <PopoverContent>
            <div className="px-1 py-2 select-none">
              <div className="text-small font-bold">排序</div>
              <div className="text-tiny">首页优先级最高</div>
            </div>
          </PopoverContent>
        </Popover>
      </CardFooter>
    </Card>
  )
}