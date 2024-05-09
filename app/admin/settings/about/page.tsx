'use client'

import favicon from '~/public/favicon.svg'
import Image from 'next/image'
import { Divider, Avatar } from '@nextui-org/react'
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
      <span>摄影佬专用⌈相片集⌋，基于 Next.js 开发</span>
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
        <span>开发者</span>
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100"
          href="https://github.com/besscroft"
          target="_blank"
        >
          <Avatar src="https://besscroft.com/uploads/avatar.jpg" />
          <span className="flex-1 px-2">Bess Croft</span>
          <ExternalLink />
        </Link>
      </div>
    </div>
  )
}