import { redirect } from 'next/navigation'
import { createClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import PublicShell from '../PublicShell'
import ProfileForm from './ProfileForm'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const t = await getTranslations('profile')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <PublicShell>
      <div className="max-w-xl mx-auto px-4 py-10">
        <BackLink href="/" />
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 sm:p-8">
          <ProfileForm profile={{ ...profile, email: user.email }} />
        </div>
      </div>
    </PublicShell>
  )
}
