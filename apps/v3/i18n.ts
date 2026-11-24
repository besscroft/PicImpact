import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from '~/lib/utils/locale'

export const defaultLocale = 'zh'

export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale: locale ?? defaultLocale,
    messages: (await import(`~/messages/${locale ?? defaultLocale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  }
})