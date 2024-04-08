import DashHeader from '~/components/DashHeader'
import { BaseSide } from '~/components/BaseSide'
import Transitions, { Animate } from '~/components/Transitions'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex flex-col h-screen">
        <Transitions className="h-full flex flex-col">
          <DashHeader/>
          <div className="grid flex-1 sm:grid-cols-[200px_1fr] h-full w-full bg-gray-100 dark:bg-zinc-900">
            <aside className="hidden w-[200px] flex-col sm:flex">
              <BaseSide/>
            </aside>
            <main className="flex w-full h-full flex-1 flex-col overflow-hidden p-2">
              <Animate className="flex-1">
                {children}
              </Animate>
            </main>
          </div>
        </Transitions>
      </div>
    </>
  );
}
