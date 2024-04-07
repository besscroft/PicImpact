import type { Metadata } from 'next'
import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import Header from '~/components/Header'
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
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
