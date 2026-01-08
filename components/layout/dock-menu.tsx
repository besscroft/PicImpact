'use client'

import { Dock, DockIcon } from '~/components/ui/origin/dock'
import { LoaderPinwheelIcon } from '~/components/icons/loader-pinwheel'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { CompassIcon } from '~/components/icons/compass'
import { MapIcon } from 'lucide-react'
import Command from '~/components/layout/command'
import type { AlbumDataProps } from '~/types/props'
import { Label, ListBox, Modal } from '@heroui/react'
import { GalleryThumbnailsIcon } from '~/components/icons/gallery-thumbnails'
import type { AlbumType } from '~/types'

export default function DockMenu(props: Readonly<AlbumDataProps>) {
  const router = useRouter()
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <Dock direction="middle">
          <DockIcon>
            <LoaderPinwheelIcon
              size={18}
              onClick={() => router.push('/')}
              aria-label={t('Link.home')}
            />
          </DockIcon>
          <DockIcon>
            <GalleryThumbnailsIcon
              onClick={() => setIsOpen(true)}
              size={18}
              aria-label={t('Words.album')}
            />
          </DockIcon>
          <DockIcon>
            <MapIcon
              onClick={() => router.push('/map')}
              size={18}
              className="text-black dark:text-white"
              aria-label={t('Link.map')}
            />
          </DockIcon>
          <DockIcon>
            <CompassIcon
              onClick={() => setCommand(true)}
              size={18}
              aria-label={t('Link.settings')}
            />
          </DockIcon>
        </Dock>
      </div>
      <Command {...props} />
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container variant='blur' placement='center' isDismissable>
          <Modal.Dialog className="sm:max-w-lg sm:min-w-sm">
            {({}) => (
              <>
                <Modal.Header>
                  <Modal.Heading>
                    {t('Words.album')}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <ListBox aria-label="Albums" className="w-full sm:max-w-lg" selectionMode="single">
                    {Array.isArray(props.data) && props.data.length > 0 &&
                      props.data.map((album: AlbumType) => (
                        <ListBox.Item
                          id={album.id}
                          textValue={album.name}
                          onClick={() => {
                            setCommand(false)
                            router.push(album.album_value)
                          }}
                        >
                          <GalleryThumbnailsIcon
                            className='text-black dark:text-white'
                            size={18}
                            aria-label={album.name}
                          />
                          <div className="flex flex-col">
                            <Label>{album.name}</Label>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))
                    }
                  </ListBox>
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </>
  );
};