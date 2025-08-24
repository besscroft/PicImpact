'use client'

import { createPortal } from 'react-dom'
import { Dialog, DialogContent } from '~/components/ui/dialog'

export function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <Dialog
      defaultOpen={true}
      modal={false}
    >
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