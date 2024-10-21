import { AntdRegistry } from '@ant-design/nextjs-registry'
import Command from '~/components/admin/Command'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex w-full h-full flex-1 flex-col p-2">
        <SidebarTrigger/>
        <Command/>
        <AntdRegistry>{children}</AntdRegistry>
      </main>
    </SidebarProvider>
  );
}
