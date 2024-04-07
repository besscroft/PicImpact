import type { Metadata } from 'next'
import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import Header from '~/components/Header'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'

export const metadata: Metadata = {
  title: "PicImpact",
  description: "开发中...",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviders>
          <Providers>
            <ToasterProviders/>
            <Header/>
            {children}
          </Providers>
        </SessionProviders>
      </body>
    </html>
  );
}
