import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

const LOCALES = ['pt', 'en', 'es'] as const
type Locale = typeof LOCALES[number]

function detectLocale(acceptLanguage: string): Locale {
  const lang = acceptLanguage.toLowerCase()
  if (lang.includes('es')) return 'es'
  if (lang.includes('en')) return 'en'
  return 'pt'
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headersList = await headers()

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const acceptLang = headersList.get('accept-language') ?? ''

  let locale: Locale = cookieLocale && LOCALES.includes(cookieLocale as Locale)
    ? cookieLocale as Locale
    : detectLocale(acceptLang)

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
