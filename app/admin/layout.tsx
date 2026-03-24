import { AdminToolbar } from '~/components/layout/admin/admin-toolbar'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset
        id="main-content"
        className="min-h-0 min-w-0 overflow-hidden"
      >
        <AdminToolbar />
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <div className="flex min-h-full min-w-0 flex-col p-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
