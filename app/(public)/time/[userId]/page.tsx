import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '~/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trixer.app'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name').eq('id', userId).single()
  const name = profile?.name ?? 'Trixter'
  return {
    title: `Elenco de ${name} | Trixer`,
    description: `Veja o elenco de ${name} no Trixer — o fantasy game do triathlon mundial com atletas PRO reais.`,
    openGraph: {
      title: `Elenco de ${name} — Trixer Fantasy`,
      description: `${name} está jogando Trixer! Veja o elenco e monte o seu.`,
      url: `${SITE_URL}/time/${userId}`,
    },
  }
}

export default async function TeamSharePage({ params }: { params: Promise<{ userId: string }> }) {
  // Public page just for OG preview — redirect to app
  redirect('/')
}
