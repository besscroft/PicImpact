import type { Metadata } from 'next'

import { NextUIProviders } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'

import '~/style/globals.css'

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
          <NextUIProviders>
            <ToasterProviders />
            <ProgressBarProviders>
              {children}
            </ProgressBarProviders>
          </NextUIProviders>
        </SessionProviders>
      </body>
    </html>
  );
}