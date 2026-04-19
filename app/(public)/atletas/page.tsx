import Link from 'next/link'
import { createPublicClient, createClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import AthleteRow from './AthleteRow'
import MarketBanner from '~/app/components/MarketBanner'
import { getMarketStatus } from '~/lib/market'
import { timeAgo } from '~/lib/utils'
import { Wallet, Activity } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const revalidate = 0

export default async function AtletasPage() {
  const t = await getTranslations('market')
  const pub = createPublicClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const market = await getMarketStatus(supabase)

  const [athletesRes, portfolioRes, profileRes, feedRes] = await Promise.all([
    pub.from('athletes')
      .select('id, name, type, gender, age_group, country, current_price, price_change, photo_url, pto_rank')
      .order('current_price', { ascending: false }),
    user
      ? supabase.from('portfolio').select('athlete_id, bought_price').eq('user_id', user.id)
      : { data: [] },
    user
      ? supabase.from('profiles').select('wallet').eq('id', user.id).single()
      : { data: null },
    pub.from('athlete_price_history')
      .select('id, change, reason, recorded_at, athlete:athletes(id, name), race:races(name)')
      .order('recorded_at', { ascending: false })
      .limit(14),
  ])

  const athletes = athletesRes.data ?? []
  const portfolio = portfolioRes.data ?? []
  const wallet: number | null = user ? Number(profileRes.data?.wallet ?? 0) : null
  const feed = feedRes.data ?? []

  const ownedMap = new Map(portfolio.map((p: any) => [p.athlete_id, Number(p.bought_price)]))

  const rising  = athletes.filter(a => Number(a.price_change) > 0)
  const falling = athletes.filter(a => Number(a.price_change) < 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t('subtitle', { n: athletes.length })}
          </p>
        </div>
        {user && wallet !== null && (
          <Link href="/elenco" className="flex items-center gap-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Wallet size={14} className="text-[var(--color-orange)]" />
            <span>T${wallet.toFixed(0)}</span>
            <span className="text-[var(--color-muted)] text-xs">· {ownedMap.size} atletas</span>
          </Link>
        )}
      </div>

      <MarketBanner locked={market.locked} reason={market.reason} lockRace={market.lockRace} />

      {/* Price movement feed */}
      {feed.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <Activity size={11} />
            {t('feedTitle')}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {feed.map((entry: any) => {
              const change = Number(entry.change)
              const isUp = change > 0
              const reason = entry.reason === 'race_result'
                ? (entry.race?.name ?? t('feedRace')).replace('IRONMAN ', '').replace('70.3 ', '')
                : t('feedPto')
              return (
                <Link
                  key={entry.id}
                  href={`/atletas/${entry.athlete?.id}`}
                  className="flex-shrink-0 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-xl px-3 py-2 text-xs transition-colors min-w-[160px]"
                >
                  <p className="font-semibold truncate text-white">{entry.athlete?.name}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className={`font-bold ${isUp ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {isUp ? '↑' : '↓'}{isUp ? '+' : ''}{change.toFixed(0)}
                    </span>
                    <span className="text-[var(--color-muted)] truncate">{reason}</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{timeAgo(entry.recorded_at)}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Market summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{rising.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('rising')}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-danger)]">{falling.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('falling')}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black">{athletes.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">{t('total')}</p>
        </div>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center justify-between">
          <span className="text-sm font-bold">{t('tableTitle')}</span>
          <span className="text-xs text-[var(--color-muted)]">{athletes.length}</span>
        </div>
        <div className="max-h-[700px] overflow-y-auto">
          {athletes.map(a => (
            <AthleteRow
              key={a.id}
              a={a}
              owned={ownedMap.has(a.id)}
              boughtPrice={ownedMap.get(a.id) ?? null}
              wallet={wallet}
              marketLocked={market.locked}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
