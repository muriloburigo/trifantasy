import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trifantasy.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TriFantasy — Fantasy Game de Triathlon',
    template: '%s | TriFantasy',
  },
  description:
    'Monte seu time com atletas reais do circuito Ironman — PROs e age-groupers — e pontue pelo desempenho deles nas provas.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'TriFantasy',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
