import type { Metadata, ResolvingMetadata } from 'next'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-Providers'

import '~/style/globals.css'
import { fetchConfigsByKeys } from '~/server/db/query'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ConfigStoreProvider } from '~/app/providers/config-store-Providers'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {

  const data = await fetchConfigsByKeys([
    'custom_title',
    'custom_favicon_url'
  ])

  return {
    title: data?.find((item: any) => item.config_key === 'custom_title')?.config_value || 'PicImpact',
    icons: { icon: data?.find((item: any) => item.config_key === 'custom_favicon_url')?.config_value || './favicon.ico' },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const locale = await getLocale()

  const messages = await getMessages()

  return (
    <html className="overflow-y-auto scrollbar-hide" lang={locale} suppressHydrationWarning>
    <body>
    <SessionProviders>
      <NextIntlClientProvider messages={messages}>
        <ConfigStoreProvider>
          <ButtonStoreProvider>
            <ThemeProvider>
              <ToasterProviders/>
              <ProgressBarProviders>
                {children}
              </ProgressBarProviders>
            </ThemeProvider>
          </ButtonStoreProvider>
        </ConfigStoreProvider>
      </NextIntlClientProvider>
    </SessionProviders>
    </body>
    </html>
  );
}