import type { Metadata, ResolvingMetadata } from 'next'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-Providers'

import '~/style/globals.css'
import { fetchCustomTitle } from '~/server/db/query'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {

  const data = await fetchCustomTitle()

  return {
    title: data?.config_value || 'PicImpact',
    icons: { icon: './favicon.ico' },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-y-auto scrollbar-hide" suppressHydrationWarning>
      <body>
        <SessionProviders>
          <ButtonStoreProvider>
            <ThemeProvider>
              <ToasterProviders />
              <ProgressBarProviders>
                {children}
              </ProgressBarProviders>
            </ThemeProvider>
          </ButtonStoreProvider>
        </SessionProviders>
      </body>
    </html>
  );
}