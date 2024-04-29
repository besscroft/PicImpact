import DashHeader from '~/components/layout/DashHeader'
import { BaseSide } from '~/components/layout/BaseSide'

import { AntdRegistry } from '@ant-design/nextjs-registry'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex flex-col h-screen">
        <DashHeader/>
        <div className="grid flex-1 sm:grid-cols-[200px_1fr] h-full w-full">
          <aside className="hidden w-[200px] flex-col sm:flex">
            <BaseSide/>
          </aside>
          <main className="flex w-full h-full flex-1 flex-col p-2">
            <AntdRegistry>{children}</AntdRegistry>
          </main>
        </div>
      </div>
    </>
  );
}
