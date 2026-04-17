import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
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
    default: 'Trixer — Jogo de escalação do endurance',
    template: '%s | Trixer',
  },
  description:
    'Monte seu time com atletas reais do circuito de triathlon — PROs e age-groupers — e pontue pelo desempenho deles nas provas. Onde inteligência vence.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Trixer',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
