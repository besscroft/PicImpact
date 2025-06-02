'use client'

import { LoaderPinwheelIcon } from '~/components/icons/loader-pinwheel'
import { GalleryThumbnailsIcon } from '~/components/icons/gallery-thumbnails'
import { CompassIcon } from '~/components/icons/compass'
import { useRouter } from 'next-nprogress-bar'
import { useButtonStore } from '~/app/providers/button-store-providers'
import Command from '~/components/layout/command'
import type { AlbumDataProps } from '~/types/props'
import { useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslations } from 'next-intl'

export default function HeaderIconGroup(props: Readonly<AlbumDataProps>) {
  const router = useRouter()
  const t = useTranslations()
  const { setCommand } = useButtonStore(
    (state) => state,
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommand(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setCommand])

  return (
    <>
      <div className="flex items-center space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <LoaderPinwheelIcon 
                size={18} 
                onClick={() => router.push('/')}
                aria-label={t('Link.home')}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Link.home')}</p>
          </TooltipContent>
        </Tooltip>
        
        {Array.isArray(props.data) && props.data.length > 0 &&
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <GalleryThumbnailsIcon 
                  onClick={() => router.push(props.data[0].album_value ?? '/')} 
                  size={18}
                  aria-label={t('Words.album')}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Words.album')}</p>
            </TooltipContent>
          </Tooltip>
        }
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CompassIcon 
                onClick={() => setCommand(true)} 
                size={18}
                aria-label={t('Link.settings')}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Link.settings')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Command {...props} />
    </>
  )
}