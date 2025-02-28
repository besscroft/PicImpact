'use client'

import { AlbumType, AlbumDataProps } from '~/types'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '~/components/ui/navigation-menu'
import { cn } from '~/lib/utils'
import React from 'react'
import { Button } from '~/components/ui/button'

export default function HeaderLink(props: Readonly<AlbumDataProps>) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()
  
  return (
    <NavigationMenu>
      <NavigationMenuList className="space-x-2">
        <NavigationMenuItem>
          <Button
            variant="link"
            className={
              cn(
                pathname === '/' ? 'border-b-2 border-green-400 rounded-none' : 'rounded-none',
                'text-base'
              )
            }
            onClick={() => router.push('/')}
            aria-label={t('Link.home')}
          >
            {t('Link.home')}
          </Button>
        </NavigationMenuItem>
        {Array.isArray(props.data) && (props.customFoldAlbumEnable && props.data.length > props.customFoldAlbumCount) ? (
          <NavigationMenuItem className={pathname !== '/' ? 'border-b-2 border-green-400' : ''}>
            <NavigationMenuTrigger>相册</NavigationMenuTrigger>
            <NavigationMenuContent>
              {props.data.map((album: AlbumType) => (
                <NavigationMenuLink
                  className={cn(
                    'min-w-80 cursor-pointer block select-none space-y-1 m-1 p-1 hover:bg-accent',
                    pathname === album.album_value ? 'border-b-2 border-green-400' : ''
                  )}
                  key={album.id}
                  onClick={() => router.push(album.album_value)}
                >{album.name}</NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
        ) : (
          props.data.map((album: AlbumType) => (
            <NavigationMenuItem key={album.id} className="text-lg">
              <Button
                variant="link"
                className={
                  cn(
                    pathname === album.album_value ? 'border-b-2 border-green-400 rounded-none' : 'rounded-none',
                    'text-base'
                  )
                }
                onClick={() => router.push(album.album_value)}
                aria-label={album.name}
              >
                {album.album_value === '/' ? t('Link.home') : album.name}
              </Button>
            </NavigationMenuItem>
          ))
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
