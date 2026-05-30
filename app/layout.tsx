import type { Metadata } from 'next/types'
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'

import '~/style/globals.css'
import { cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'

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

export async function generateMetadata(): Promise<Metadata> {
  const rows = await cachedConfigsByKeys([
    'custom_title',
    'custom_favicon_url',
    'custom_author',
  ])
  const info = toCustomInfo(rows)

  const title = info.customTitle || 'PicImpact'
  const author = info.customAuthor
  const description = author
    ? `${author}'s photography portfolio — powered by PicImpact`
    : 'A photography portfolio powered by PicImpact'

  return {
    metadataBase: process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL) : null,
    title,
    description,
    icons: { icon: info.customFaviconUrl || './favicon.ico' },
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

  const rows = await cachedConfigsByKeys([
    'default_theme',
    'umami_analytics',
    'umami_host'
  ])
  const info = toCustomInfo(rows)

  // `toCustomInfo` runs `default_theme` through `normalizeDefaultTheme`, so the
  // value is already guaranteed to be one of 'light' | 'dark' | 'system'. Cast
  // here because the public-facing `CustomInfo` type keeps the field as `string`.
  const defaultTheme = info.defaultTheme as 'light' | 'dark' | 'system'
  const umamiHost = info.umamiHost || 'https://cloud.umami.is/script.js'
  const umamiAnalytics = info.umamiAnalytics

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
          <ThemeProvider defaultTheme={defaultTheme}>
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
