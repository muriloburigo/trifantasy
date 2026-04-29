import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import { Trophy, Users, Medal, Globe, Lock } from 'lucide-react'
import CopyButton from './CopyButton'
import AddMemberForm from './AddMemberForm'
import BackLink from '~/app/components/BackLink'
import WhatsAppShare from '~/app/components/WhatsAppShare'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trixer.app'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: league } = await admin.from('leagues').select('name, invite_code').eq('id', id).single()
  if (!league) return { title: 'Liga | Trixer' }
  return {
    title: `${league.name} | Liga Trixer`,
    description: `Entre na liga "${league.name}" no Trixer — o fantasy game do triathlon mundial. Código de convite: ${league.invite_code}`,
    openGraph: {
      title: `${league.name} — Liga no Trixer`,
      description: `Entre na liga "${league.name}" no Trixer — o fantasy game do triathlon mundial.`,
      url: `${SITE_URL}/ligas/${id}`,
    },
  }
}

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('leagues')
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await admin
    .from('leagues')
    .select('id, name, invite_code, owner_id, is_public, is_global')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Check membership
  const { data: membership } = await admin
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isMember = !!membership
  const isOwner = league.owner_id === user.id

  if (!isMember && !league.is_public) redirect('/ligas')

  // Fetch all members
  const { data: membersRaw } = await admin
    .from('league_members')
    .select('user_id, joined_at')
    .eq('league_id', id)

  const memberUserIds = (membersRaw ?? []).map((m: any) => m.user_id)

  if (memberUserIds.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <BackLink href="/ligas" />
        <h1 className="text-2xl font-bold mt-3 mb-8">{league.is_global ? t('globalLeagueName') : league.name}</h1>
        <div className="text-center py-12 text-[var(--color-muted)] text-sm">{t('rankingEmpty')}</div>
      </div>
    )
  }

  // Fetch profiles + wallets + portfolio values for all members in parallel
  const [profilesRes, portfolioRes] = await Promise.all([
    admin.from('profiles').select('id, name, photo_url, wallet').in('id', memberUserIds),
    admin.from('portfolio').select('user_id, athlete:athletes(current_price)').in('user_id', memberUserIds),
  ])

  const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]))

  // Portfolio value per user
  const portfolioByUser: Record<string, number> = {}
  for (const p of portfolioRes.data ?? []) {
    const price = Number((p.athlete as any)?.current_price ?? 0)
    portfolioByUser[p.user_id] = (portfolioByUser[p.user_id] ?? 0) + price
  }

  const ranked = (membersRaw ?? [])
    .map((m: any) => {
      const p = profileMap.get(m.user_id) as any
      const wallet = Number(p?.wallet ?? 0)
      const portfolioValue = portfolioByUser[m.user_id] ?? 0
      const netWorth = wallet + portfolioValue
      return { user_id: m.user_id, joined_at: m.joined_at, profile: p ?? null, wallet, portfolioValue, netWorth }
    })
    .sort((a: any, b: any) => b.netWorth - a.netWorth)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <BackLink href="/ligas" />
      <div className="flex flex-col sm:flex-row items-start justify-between mt-3 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {league.is_public
              ? <Globe size={13} className="text-[var(--color-muted)]" />
              : <Lock size={13} className="text-[var(--color-muted)]" />}
            <span className="text-xs text-[var(--color-muted)]">{league.is_public ? t('public') : t('private')}</span>
          </div>
          <h1 className="text-2xl font-bold">{league.is_global ? t('globalLeagueName') : league.name}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
            <Users size={12} />{ranked.length !== 1 ? t('participantsPlural', { n: ranked.length }) : t('participants', { n: ranked.length })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-[var(--color-muted)] text-right">
            <p className="mb-0.5">{t('inviteCode')}</p>
            <span className="font-mono text-sm text-white font-semibold">{league.invite_code}</span>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton code={league.invite_code} />
            <WhatsAppShare
              text={`Entre na minha liga "${league.name}" no Trixer! Use o código de convite: ${league.invite_code}`}
              label=""
              variant="ghost"
            />
          </div>
        </div>
      </div>

      {/* Join button for non-members of public league */}
      {!isMember && league.is_public && (
        <div className="mb-6">
          <Link
            href={`/ligas/${id}/entrar`}
            className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {t('joinButton')}
          </Link>
        </div>
      )}

      {/* Ranking */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[var(--color-navy-border)] flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-orange)]" />
          <h2 className="font-bold">{t('rankingTitle')}</h2>
          <span className="text-xs text-[var(--color-muted)] ml-auto">{t('netWorthLabel')}</span>
        </div>

        {ranked.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-sm">{t('rankingEmpty')}</div>
        ) : (
          <div className="divide-y divide-[var(--color-navy-border)]">
            {ranked.map((member: any, i: number) => {
              const isMe = member.user_id === user.id
              const p = member.profile
              return (
                <div
                  key={member.user_id}
                  className={`px-4 py-3 flex items-center gap-4 ${isMe ? 'bg-[var(--color-orange-dim)]' : ''}`}
                >
                  {/* Position */}
                  <div className="w-7 text-center shrink-0">
                    {i === 0 ? <Medal size={17} className="text-yellow-400 mx-auto" />
                      : i === 1 ? <Medal size={17} className="text-gray-400 mx-auto" />
                      : i === 2 ? <Medal size={17} className="text-amber-600 mx-auto" />
                      : <span className="text-sm text-[var(--color-muted)] font-bold">{i + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/5 ${
                    !p?.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''
                  }`}>
                    {p?.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate leading-tight">
                      {p?.name ?? 'Usuário'}
                      {isMe && <span className="text-[var(--color-orange)] ml-1 text-[10px]">{t('youLabel')}</span>}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                      T${member.wallet.toFixed(0)} {t('walletUnit')} · T${member.portfolioValue.toFixed(0)} {t('portfolioUnit')}
                    </p>
                  </div>

                  {/* Net worth */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm sm:text-base text-[var(--color-orange)]">
                      T${member.netWorth.toFixed(0)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Owner: add member by name */}
      {isOwner && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-1">{t('addMemberTitle')}</h3>
          <p className="text-xs text-[var(--color-muted)] mb-3">{t('addMemberDesc')}</p>
          <AddMemberForm leagueId={id} />
        </div>
      )}
    </div>
  )
}
