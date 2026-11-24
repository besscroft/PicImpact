'use client'

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

export function Modal({ children }: { children: React.ReactNode }) {
  const t = useTranslations()

  return createPortal(
    <Dialog
      defaultOpen={true}
      modal={false}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>{t('Button.viewDetails')}</DialogTitle>
      </DialogHeader>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event: any) => event.preventDefault()}
        className="h-full w-full rounded-none max-w-full sm:rounded-md sm:shadow-xl"
      >
        {children}
      </DialogContent>
    </Dialog>,
    document.getElementById('modal-root')!
  )
}
