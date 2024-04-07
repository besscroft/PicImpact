import type { Metadata } from 'next'
import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import DashHeader from '~/components/DashHeader'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { BaseSide } from '~/components/BaseSide'

export const metadata: Metadata = {
  title: "PicImpact",
  description: "开发中...",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviders>
          <Providers>
            <ToasterProviders />
            <div className="flex flex-col h-screen">
              <DashHeader/>
              <div className="grid flex-1 sm:grid-cols-[200px_1fr] h-full w-full bg-gray-100 dark:bg-zinc-900">
                <aside className="hidden w-[200px] flex-col sm:flex">
                  <BaseSide />
                </aside>
                <main className="flex w-full flex-1 flex-col overflow-hidden p-2">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </SessionProviders>
      </body>
    </html>
  );
}
