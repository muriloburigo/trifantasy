import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import UserMenu from './UserMenu'
import MobileMenu from './MobileMenu'
import { getTranslations } from 'next-intl/server'
import OnboardingTour from '../components/OnboardingTour'
import PushNotificationManager from '../components/PushNotificationManager'

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('nav')
  const tHome = await getTranslations('home')
  const tFooter = await getTranslations('footer')

  let profileData = null
  if (user) {
    const { data } = await supabase.from('profiles').select('wallet, has_seen_tour, name').eq('id', user.id).single()
    profileData = data
  }

  const wallet = profileData?.wallet != null ? Number(profileData.wallet) : null
  const showTour = user && !profileData?.has_seen_tour

  return (
    <div className="min-h-screen flex flex-col">
      {showTour && <OnboardingTour userName={profileData?.name || ''} />}
      <header className="border-b border-[var(--color-navy-border)] bg-[var(--color-navy-card)]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
            <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
            <Link href="/provas" className="hover:text-white transition-colors">{t('races')}</Link>
            <Link href="/atletas" className="hover:text-white transition-colors">{t('athletes')}</Link>
            <Link href="/ligas" className="hover:text-white transition-colors">Trix Leagues</Link>
            <Link href="/regras" className="hover:text-white transition-colors">{t('rules')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user && <PushNotificationManager />}
            <MobileMenu />
            <UserMenu user={user} wallet={wallet} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-navy-border)] py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
          <span style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)] font-bold">TRIX</span><span className="text-white font-bold">ER</span>
            <span className="ml-2">— {tHome('tagline')}</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/regras" className="hover:text-white transition-colors">{tFooter('rules')}</Link>
            <Link href="/suporte" className="hover:text-white transition-colors">{tFooter('support')}</Link>
            <span>{tFooter('disclaimer')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
