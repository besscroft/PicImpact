import type { Metadata } from 'next/types'
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'

import '~/style/globals.css'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ConfigStoreProvider } from '~/app/providers/config-store-providers'
import Script from 'next/script'

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
})

type ConfigItem = {
  id: string;
  config_key: string;
  config_value: string | null;
  detail: string | null;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchConfigsByKeys([
    'custom_title',
    'custom_favicon_url',
    'custom_author',
  ])

  const title = data?.find((item: ConfigItem) => item.config_key === 'custom_title')?.config_value || 'PicImpact'
  const author = data?.find((item: ConfigItem) => item.config_key === 'custom_author')?.config_value || ''
  const description = author
    ? `${author}'s photography portfolio — powered by PicImpact`
    : 'A photography portfolio powered by PicImpact'

  return {
    metadataBase: process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL) : null,
    title,
    description,
    icons: { icon: data?.find((item: ConfigItem) => item.config_key === 'custom_favicon_url')?.config_value || './favicon.ico' },
    manifest: '/manifest.json',
    openGraph: {
      title,
      description,
      siteName: title,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'PicImpact',
    }
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2d2518',
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {

  const locale = await getLocale()

  const messages = await getMessages()

  const data = await fetchConfigsByKeys([
    'umami_analytics',
    'umami_host'
  ])

  const umamiHost = data?.find((item: ConfigItem) => item.config_key === 'umami_host')?.config_value || 'https://cloud.umami.is/script.js'
  const umamiAnalytics = data?.find((item: ConfigItem) => item.config_key === 'umami_analytics')?.config_value

  return (
    <html className={`overflow-y-auto scrollbar-hide ${sourceSerif4.variable} ${sourceSans3.variable}`} lang={locale} suppressHydrationWarning>
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#2d2518" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="PicImpact" />
    </head>
    <body>
    <NextIntlClientProvider messages={messages}>
      <ConfigStoreProvider>
        <ButtonStoreProvider>
          <ThemeProvider>
            <ToasterProviders/>
            <ProgressBarProviders>
              {children}
              {modal}
            </ProgressBarProviders>
          </ThemeProvider>
        </ButtonStoreProvider>
      </ConfigStoreProvider>
    </NextIntlClientProvider>
    <div id="modal-root" />
    <Script
      id="umami-analytics"
      strategy="afterInteractive"
      async
      src={umamiHost}
      data-website-id={umamiAnalytics}
    />
    </body>
    </html>
  )
}