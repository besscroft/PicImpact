'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu.tsx'
import { setUserLocale } from '~/lib/utils/locale'
import { useTranslations } from 'next-intl'
import { Languages } from 'lucide-react'

export default function Language() {
  const t = useTranslations()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Languages size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('Button.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh')}>简体中文</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh-TW')}>繁體中文</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('en')}>English</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('ja')}>日本語</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}