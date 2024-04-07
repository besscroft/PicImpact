import type { Metadata } from 'next'
import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import DashHeader from '~/components/DashHeader'
import { ToasterProviders } from '~/app/providers/toaster-providers'

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
      <Providers>
        <ToasterProviders />
        <DashHeader/>
        <div className="container grid flex-1 gap-12 sm:grid-cols-[200px_1fr]">
          <aside className="hidden w-[200px] flex-col sm:flex">
            侧边栏
          </aside>
          <main className="flex w-full flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </Providers>
    </body>
    </html>
  );
}
