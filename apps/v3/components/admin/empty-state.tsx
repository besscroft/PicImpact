import type { LucideIcon } from 'lucide-react'

import { cn } from '~/lib/utils'

type AdminEmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: Readonly<AdminEmptyStateProps>) {
  return (
    <div
      className={cn(
        'show-up-motion flex w-full items-center justify-center rounded-[1.35rem] border border-dashed border-border/80 bg-background/60 px-6 py-10 text-center',
        className
      )}
    >
      <div className='mx-auto flex max-w-md flex-col items-center'>
        <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary/80'>
          <Icon className='size-5' />
        </div>
        <h3 className='mt-4 font-display text-[1.35rem] leading-none text-foreground'>
          {title}
        </h3>
        <p className='mt-2 max-w-sm text-sm leading-6 text-muted-foreground line-clamp-2'>
          {description}
        </p>
      </div>
    </div>
  )
}
