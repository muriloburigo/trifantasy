import { redirect } from 'next/navigation'
import { createClient } from '~/lib/supabase/server'
import CreateLeagueForm from './CreateLeagueForm'
import JoinForm from './JoinForm'
import BackLink from '~/app/components/BackLink'
import { getTranslations } from 'next-intl/server'

export default async function CriarLigaPage() {
  const t = await getTranslations('leagues')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackLink href="/ligas" />

      {/* Create league */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-bold mb-1">{t('createTitle')}</h1>
        <p className="text-sm text-[var(--color-muted)] mb-5">{t('createSubtitle')}</p>
        <CreateLeagueForm />
      </div>

      {/* Join league by code */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-1">{t('joinTitle')}</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">{t('inviteDesc')}</p>
        <JoinForm />
      </div>
    </div>
  )
}
