import type { Metadata, ResolvingMetadata } from 'next'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'

import '~/style/globals.css'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ConfigStoreProvider } from '~/app/providers/config-store-providers'
import Script from 'next/script'

type Params = Promise<{
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}>

export async function generateMetadata(_: { params: Params }): Promise<Metadata> {
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

  const data = await fetchConfigsByKeys([
    'umami_analytics',
    'umami_host'
  ])

  const umamiHost = data?.find((item: any) => item.config_key === 'umami_host')?.config_value || 'https://cloud.umami.is/script.js'
  const umamiAnalytics = data?.find((item: any) => item.config_key === 'umami_analytics')?.config_value

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
    <Script
      id="umami-analytics"
      strategy="afterInteractive"
      async
      src={umamiHost}
      data-website-id={umamiAnalytics}
    ></Script>
    </body>
    </html>
  )
}