import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Script from 'next/script'
import './globals.css'
import GoogleAnalytics from '~/app/components/GoogleAnalytics'

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
    default: 'Trixer — O Game do Triathlon',
    template: '%s | Trixer',
  },
  description: 'O fantasy game do triathlon mundial. Monte seu elenco com atletas PRO reais do circuito Ironman e 70.3, gerencie sua carteira e suba no ranking global.',
  keywords: ['triathlon', 'fantasy game', 'ironman', '70.3', 'atleta pro', 'trixer', 'endurance', 'esporte', 'ranking'],
  authors: [{ name: 'Trixer Team' }],
  openGraph: {
    type: 'website',
    siteName: 'Trixer',
    url: SITE_URL,
    title: 'Trixer — O Game do Triathlon',
    description: 'Monte seu elenco com atletas PRO reais e pontue pelo desempenho nas provas.',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trixer — O Game do Triathlon',
    description: 'O fantasy game do triathlon mundial.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${sora.variable}`}>
      <head>
        <GoogleAnalytics GA_MEASUREMENT_ID="G-DJJ30H7DB9" />
      </head>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
