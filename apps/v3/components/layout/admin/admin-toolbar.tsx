import { SidebarTrigger } from '~/components/ui/sidebar'

export function AdminToolbar() {
  return (
    <header className="shrink-0 bg-background px-4 pb-2 pt-4">
      <div role="toolbar" aria-label="Admin toolbar" className="flex min-h-7 items-center gap-2">
        <SidebarTrigger className="cursor-pointer" />
        <div className="min-w-0 flex-1" />
        <div className="hidden min-w-0 md:block" aria-hidden="true" />
      </div>
    </header>
  )
}
