import { createAdminClient, createPublicClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import { getTranslations } from 'next-intl/server'

export const revalidate = 600

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}

function flag(country: string | null) {
  return COUNTRY_FLAGS[country ?? ''] ?? ''
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function TrixersPage() {
  const t = await getTranslations('trixers')
  const admin = createAdminClient()
  const pub   = createPublicClient()

  const [profilesCountRes, teamsRes, allProfilesRes, portfolioRes] = await Promise.all([
    pub.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('teams').select('user_id', { count: 'exact', head: true }),
    admin.from('profiles').select('id, name, country, wallet'),
    admin.from('portfolio').select('user_id, athlete:athletes(current_price)'),
  ])

  const totalTrixers = profilesCountRes.count ?? 0
  const totalTeams   = teamsRes.count ?? 0

  // Calculate net worth per user: wallet + sum of current portfolio value
  const portfolioByUser: Record<string, number> = {}
  for (const p of portfolioRes.data ?? []) {
    const price = Number((p.athlete as any)?.current_price ?? 0)
    portfolioByUser[p.user_id] = (portfolioByUser[p.user_id] ?? 0) + price
  }

  const ranked = (allProfilesRes.data ?? [])
    .map(p => ({
      id: p.id,
      name: p.name ?? 'Trixter',
      country: p.country ?? null,
      wallet: Number(p.wallet ?? 0),
      portfolioValue: portfolioByUser[p.id] ?? 0,
      netWorth: Number(p.wallet ?? 0) + (portfolioByUser[p.id] ?? 0),
    }))
    .filter(p => p.netWorth > 0)
    .sort((a, b) => b.netWorth - a.netWorth)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-orange)]">{totalTrixers}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('statTrixers')}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{ranked.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('statPlayed')}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black">{totalTeams}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('statTeams')}</p>
        </div>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_90px] gap-2 px-4 py-2.5 border-b border-[var(--color-navy-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          <span>{t('colRank')}</span>
          <span>{t('colTrixter')}</span>
          <span className="text-right">Patrimônio</span>
        </div>

        {ranked.length === 0 && (
          <div className="py-16 text-center text-[var(--color-muted)]">
            <p className="text-4xl mb-3">🏊</p>
            <p className="font-medium">{t('empty')}</p>
            <p className="text-sm mt-1">{t('emptySubtitle')}</p>
          </div>
        )}

        {ranked.map((trixter, i) => {
          const top3 = i < 3
          return (
            <div
              key={trixter.id}
              className={`grid grid-cols-[40px_1fr_90px] gap-2 items-center px-4 py-3.5 border-b border-[var(--color-navy-border)] last:border-0 ${top3 ? 'bg-[var(--color-navy-elevated)]/40' : ''}`}
            >
              {/* Position */}
              <div className="text-center shrink-0">
                {top3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="text-sm font-bold text-[var(--color-muted)]">{i + 1}</span>
                }
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                  top3
                    ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]'
                    : 'bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C]'
                }`}>
                  {initials(trixter.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {trixter.name}
                    {trixter.country && <span className="ml-1 text-xs">{flag(trixter.country)}</span>}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    T${trixter.wallet.toFixed(0)} carteira · T${trixter.portfolioValue.toFixed(0)} atletas
                  </p>
                </div>
              </div>

              {/* Net worth */}
              <div className="text-right">
                <p className={`text-base font-black tabular-nums ${top3 ? 'text-[var(--color-orange)]' : ''}`}>
                  T${trixter.netWorth.toFixed(0)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
