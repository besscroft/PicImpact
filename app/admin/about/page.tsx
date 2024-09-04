'use client'

import favicon from '~/public/favicon.svg'
import Image from 'next/image'
import { Chip, Divider, Avatar } from '@nextui-org/react'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'

export default function About() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1 w-full mx-auto items-center p-2">
      <Image
        className="my-4"
        src={favicon}
        alt="Logo"
        width={64}
        height={64}
      />
      <Chip color="success" variant="bordered">v0.11.0</Chip>
      <span>PicImpact 是一个摄影师专用的摄影作品展示网站，基于 Next.js 开发。</span>
      <Divider className="my-4" />
      <div className="flex flex-col w-full">
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100"
          href="https://github.com/besscroft/PicImpact"
          target="_blank"
        >
          <Github />
          <span className="flex-1 px-2">GitHub</span>
          <ExternalLink />
        </Link>
      </div>
      <Divider className="my-4" />
      <div className="flex flex-col w-full">
        <span>Contributors</span>
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100"
          href="https://github.com/besscroft"
          target="_blank"
        >
          <Avatar src="https://avatars.githubusercontent.com/u/33775809?v=4" />
          <span className="flex-1 px-2">Bess Croft</span>
          <ExternalLink />
        </Link>
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100"
          href="https://github.com/Zheaoli"
          target="_blank"
        >
          <Avatar src="https://avatars.githubusercontent.com/u/7054676?v=4" />
          <span className="flex-1 px-2">Nadeshiko Manju</span>
          <ExternalLink />
        </Link>
      </div>
      <Divider className="my-4" />
      <div className="flex flex-col w-full">
        <span>支持项目</span>
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100"
          href="https://afdian.com/a/besscroft"
          target="_blank"
        >
          <Avatar src="https://pic1.afdiancdn.com/default/avatar/avatar-purple.png" />
          <span className="flex-1 px-2">爱发电</span>
          <ExternalLink />
        </Link>
      </div>
    </div>
  )
}