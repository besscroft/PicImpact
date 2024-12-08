'use client'

import favicon from '~/public/favicon.svg'
import Image from 'next/image'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'

export default function About() {
  const contributors = [
    {
      name: 'Bess Croft',
      url: 'https://github.com/besscroft',
      avatar: 'https://avatars.githubusercontent.com/u/33775809?v=4'
    },
    {
      name: 'Nadeshiko Manju',
      url: 'https://github.com/Zheaoli',
      avatar: 'https://avatars.githubusercontent.com/u/7054676?v=4'
    },
    {
      name: '仙姑本咕',
      url: 'https://github.com/hexgu',
      avatar: 'https://avatars.githubusercontent.com/u/85490069?v=4'
    },
    {
      name: 'xcsoft',
      url: 'https://github.com/soxft',
      avatar: 'https://avatars.githubusercontent.com/u/42080379?v=4'
    },
    {
      name: 'Cheng Gu',
      url: 'https://github.com/gucheen',
      avatar: 'https://avatars.githubusercontent.com/u/1382472?v=4'
    },
  ]
  return (
    <div className="flex flex-col space-y-2 h-full flex-1 w-full mx-auto items-center p-2">
      <Image
        className="my-4"
        src={favicon}
        alt="Logo"
        width={64}
        height={64}
      />
      <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="-ms-1 me-1.5 size-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <p className="whitespace-nowrap text-sm">v2.0.6</p>
      </span>
      <span>PicImpact 是一个摄影师专用的摄影作品展示网站，基于 Next.js + Hono.js 开发。</span>
      <div className="flex flex-col w-full">
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100 dark:hover:text-black"
          href="https://github.com/besscroft/PicImpact"
          target="_blank"
        >
          <Github/>
          <span className="flex-1 px-2">GitHub</span>
          <ExternalLink/>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        <span>Contributors</span>
        {
          contributors.map((item: any) => {
            return (
              <Link
                key={item.name}
                className="flex items-center w-full p-2 hover:bg-slate-100 dark:hover:text-black"
                href={item.url}
                target="_blank"
              >
                <Avatar>
                  <AvatarImage src={item.avatar} alt="avatar"/>
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span className="flex-1 px-2">{item.name}</span>
                <ExternalLink/>
              </Link>
            )
          })
        }
      </div>
      <div className="flex flex-col w-full">
        <span>支持项目</span>
        <Link
          className="flex items-center w-full p-2 hover:bg-slate-100 dark:hover:text-black"
          href="https://afdian.com/a/besscroft"
          target="_blank"
        >
          <Avatar>
            <AvatarImage src="https://pic1.afdiancdn.com/default/avatar/avatar-purple.png" alt="afdian"/>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="flex-1 px-2">爱发电</span>
          <ExternalLink/>
        </Link>
      </div>
    </div>
  )
}