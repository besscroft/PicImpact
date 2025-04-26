'use server'

import { cookies } from 'next/headers'
import { defaultLocale } from '~/i18n'
import { Language } from '~/types/language'

const COOKIE_NAME = 'NEXT_LOCALE'

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale
}

export async function setUserLocale(locale: Language) {
  (await cookies()).set(COOKIE_NAME, locale)
}
