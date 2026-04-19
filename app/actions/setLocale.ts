'use server'
import { cookies } from 'next/headers'
import { createClient } from '~/lib/supabase/server'

const LOCALES = ['pt', 'en', 'es'] as const
type Locale = typeof LOCALES[number]

export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return

  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  // Also save to profile if logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ locale }).eq('id', user.id)
  }
}
