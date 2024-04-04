import type { Metadata } from 'next'
import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import Header from '~/components/Header'
import { UserStoreProvider } from '~/app/providers/userStoreProvider'
import { Toaster } from 'sonner'

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
    <UserStoreProvider>
      <Providers>
        <Toaster position="top-right" />
        <Header />
        {children}
      </Providers>
    </UserStoreProvider>
    </body>
    </html>
  );
}
