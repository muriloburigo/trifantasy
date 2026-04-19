import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trixer.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Trixer — Endurance Fantasy Game',
    template: '%s | Trixer',
  },
  description: 'Build your roster with real athletes from the triathlon circuit — PROs — and score based on their race performance.',
  openGraph: {
    type: 'website',
    siteName: 'Trixer',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
