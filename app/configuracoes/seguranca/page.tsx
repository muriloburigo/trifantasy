import { createClient } from '~/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import BackLink from '~/app/components/BackLink'
import MfaManager from './MfaManager'
import { ShieldCheck, KeyRound } from 'lucide-react'

export const revalidate = 0

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('auth')

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('securityTitle')}</h1>
      </div>

      <div className="space-y-8">
        {/* Password section */}
        <section className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound size={18} className="text-[var(--color-orange)]" />
            <h2 className="font-bold">{t('passwordSection')}</h2>
          </div>
          <p className="text-sm text-[var(--color-muted)]">{t('passwordSectionDesc')}</p>
        </section>

        {/* 2FA section */}
        <section className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={18} className="text-[var(--color-orange)]" />
            <h2 className="font-bold">{t('mfaEnrollTitle')}</h2>
          </div>
          <MfaManager />
        </section>
      </div>
    </div>
  )
}
