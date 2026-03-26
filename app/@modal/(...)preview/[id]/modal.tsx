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
        className="inset-0 top-0 left-0 h-dvh w-full max-h-none max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none p-0 ring-0 shadow-none sm:max-w-none sm:rounded-none"
      >
        {children}
      </DialogContent>
    </Dialog>,
    document.getElementById('modal-root')!
  )
}
