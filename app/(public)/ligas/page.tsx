import Link from 'next/link'
import { createClient, createPublicClient, createAdminClient } from '~/lib/supabase/server'
import { Plus, Trophy } from 'lucide-react'
import BackLink from '~/app/components/BackLink'
import { getTranslations } from 'next-intl/server'
import LeagueSearch from './LeagueSearch'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LigasPage() {
  const t = await getTranslations('leagues')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  let myLeagues: any[] = []

  // 1. Fetch Global League using Admin (bypass RLS)
  const { data: globalLeague } = await admin
    .from('leagues')
    .select('id, name, invite_code, owner_id, is_public, is_global')
    .eq('is_global', true)
    .single()

  if (user) {
    // 2. Fetch user memberships
    const { data: memberships } = await admin
      .from('league_members')
      .select('league:leagues(id, name, invite_code, owner_id, is_public, is_global)')
      .eq('user_id', user.id)

    myLeagues = (memberships ?? []).map((m: any) => m.league).filter(Boolean)
  }

  // 3. Ensure Global is in myLeagues if it exists
  if (globalLeague) {
    const isAlreadyListed = myLeagues.some(l => l.id === globalLeague.id)
    if (!isAlreadyListed) {
      myLeagues.unshift(globalLeague)
    }
  }

  // 4. Public leagues (limit 20)
  const myLeagueIds = myLeagues.map((l: any) => l.id)
  const { data: publicLeaguesRaw } = await admin
    .from('leagues')
    .select('id, name, invite_code, is_public, is_global')
    .eq('is_public', true)
    .limit(20)

  const publicLeagues = (publicLeaguesRaw ?? []).filter((l: any) => !myLeagueIds.includes(l.id))


  const { count: totalLeagues } = await pub.from('leagues').select('*', { count: 'exact', head: true })
  const { count: totalTeams } = await pub.from('teams').select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t('subtitle', { leagues: totalLeagues ?? 0, teams: totalTeams ?? 0 })}
          </p>
        </div>
        {user && (
          <Link
            href="/ligas/criar"
            className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            {t('createButton')}
          </Link>
        )}
      </div>

      {/* Not logged in CTA */}
      {!user && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 rounded-2xl p-8 mb-8 text-center">
          <Trophy size={36} className="mx-auto mb-3 text-[var(--color-orange)] opacity-80" />
          <h2 className="text-lg font-bold mb-2">{t('notLoggedTitle')}</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto mb-6">
            {t('notLoggedDesc')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              {t('notLoggedCta')}
            </Link>
            <Link href="/login" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">
              {t('notLoggedLogin')}
            </Link>
          </div>
        </div>
      )}

      {/* My leagues + Public leagues with search/filter */}
      {(user || publicLeagues.length > 0) && (
        <LeagueSearch
          myLeagues={myLeagues}
          publicLeagues={publicLeagues}
          isLoggedIn={!!user}
        />
      )}

      {/* Empty state for logged-in users with no leagues and no public leagues */}
      {user && myLeagues.length === 0 && publicLeagues.length === 0 && (
        <div className="text-center py-14 text-[var(--color-muted)] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl mb-8">
          <Trophy size={36} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">{t('myLeaguesEmpty')}</p>
          <p className="text-sm mt-1 mb-5">{t('myLeaguesEmptyDesc')}</p>
          <Link href="/ligas/criar" className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            <Plus size={15} />{t('myLeaguesEmptyCta')}
          </Link>
        </div>
      )}

      {/* Join by invite code */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-1">{t('inviteTitle')}</h2>
        <p className="text-sm text-[var(--color-muted)] mb-3">{t('inviteDesc')}</p>
        {user ? (
          <Link href="/ligas/criar" className="text-sm text-[var(--color-orange)] hover:underline">
            {t('inviteLoggedCta')}
          </Link>
        ) : (
          <Link href="/register" className="text-sm text-[var(--color-orange)] hover:underline">
            {t('inviteNotLoggedCta')}
          </Link>
        )}
      </div>
    </div>
  )
}
