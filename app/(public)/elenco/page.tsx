import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import MarketBanner from '~/app/components/MarketBanner'
import { SellButton } from './TradeButton'
import { getMarketStatus } from '~/lib/market'
import { TrendingUp, TrendingDown, Minus, Wallet, ShoppingBag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const revalidate = 0

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}
function flag(country: string | null) { return COUNTRY_FLAGS[country ?? ''] ?? '' }

export default async function ElencoPage() {
  const t = await getTranslations('team')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [market, profileRes, portfolioRes, nextRaceRes] = await Promise.all([
    getMarketStatus(supabase),
    supabase.from('profiles').select('name, wallet').eq('id', user.id).single(),
    supabase
      .from('portfolio')
      .select('athlete_id, bought_price, created_at, athlete:athletes(id, name, country, gender, type, pto_rank, current_price, price_change, photo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('races')
      .select('name, slug, date')
      .in('status', ['open', 'upcoming'])
      .order('date', { ascending: true })
      .limit(1)
      .single(),
  ])

  const wallet = Number(profileRes.data?.wallet ?? 0)
  const portfolio = portfolioRes.data ?? []
  const nextRace = nextRaceRes.data

  const totalBought = portfolio.reduce((s, p) => s + Number(p.bought_price), 0)
  const totalNow    = portfolio.reduce((s, p) => s + Number((p.athlete as any)?.current_price ?? 0), 0)
  const totalPL     = totalNow - totalBought
  const netWorth    = wallet + totalNow

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t('subtitle')}</p>
        </div>
        <Link
          href="/atletas"
          className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <ShoppingBag size={15} />
          {t('marketButton')}
        </Link>
      </div>

      <MarketBanner locked={market.locked} reasonKey={market.reasonKey} lockRace={market.lockRace} />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] text-xs mb-1">
            <Wallet size={12} />{t('walletStat')}
          </div>
          <p className="text-xl font-black text-[var(--color-orange)]">T${wallet.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-muted)] mb-1">{t('athletesStat')}</p>
          <p className="text-xl font-black">{portfolio.length}<span className="text-sm font-normal text-[var(--color-muted)]">/5</span></p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-muted)] mb-1">{t('teamValueStat')}</p>
          <p className="text-xl font-black">T${totalNow.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-muted)] mb-1">{t('plStat')}</p>
          <p className={`text-xl font-black ${totalPL > 0 ? 'text-[var(--color-success)]' : totalPL < 0 ? 'text-[var(--color-danger)]' : ''}`}>
            {totalPL > 0 ? '+' : ''}{totalPL.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Next race CTA */}
      {nextRace && portfolio.length > 0 && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="text-[var(--color-muted)]">{t('nextRace')}</span>
            <span className="font-semibold">{nextRace.name}</span>
          </p>
          <Link
            href={`/provas/${nextRace.slug}`}
            className="text-xs font-semibold text-[var(--color-orange)] hover:underline shrink-0"
          >
            {t('selectTeam')}
          </Link>
        </div>
      )}

      {/* Portfolio list */}
      {portfolio.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
          <p className="text-4xl mb-4">🏊</p>
          <p className="font-medium text-white">{t('emptyTitle')}</p>
          <p className="text-sm mt-1 mb-6">{t('emptyDesc', { wallet: wallet.toFixed(0) })}</p>
          <Link
            href="/atletas"
            className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <ShoppingBag size={15} />
            {t('emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_70px_70px_120px] gap-2 px-4 py-2.5 border-b border-[var(--color-navy-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <span>{t('colAthlete')}</span>
            <span className="text-right">{t('colBought')}</span>
            <span className="text-right">{t('colCurrent')}</span>
            <span className="text-right">{t('colPL')}</span>
            <span className="text-right">{t('colAction')}</span>
          </div>

          {portfolio.map((p) => {
            const ath = p.athlete as any
            const boughtPrice = Number(p.bought_price)
            const currentPrice = Number(ath?.current_price ?? 0)
            const pl = currentPrice - boughtPrice
            const priceChange = Number(ath?.price_change ?? 0)

            return (
              <div key={p.athlete_id} className="grid grid-cols-[1fr_70px_70px_70px_120px] gap-2 items-center px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0">
                {/* Athlete info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {ath?.photo_url ? (
                    <img src={ath.photo_url} alt={ath.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C] flex items-center justify-center text-xs font-black text-white shrink-0">
                      {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/atletas/${p.athlete_id}`} className="text-sm font-semibold truncate hover:text-[var(--color-orange)] transition-colors block">
                      {ath?.name}
                      {ath?.country && <span className="ml-1 text-xs">{flag(ath.country)}</span>}
                    </Link>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      PRO{ath?.pto_rank ? ` · PTO #${ath.pto_rank}` : ''}
                    </p>
                  </div>
                </div>

                {/* Bought price */}
                <div className="text-right">
                  <span className="text-sm tabular-nums text-[var(--color-muted)]">T${boughtPrice}</span>
                </div>

                {/* Current price */}
                <div className="text-right">
                  <span className="text-sm font-semibold tabular-nums">T${currentPrice}</span>
                  {priceChange !== 0 && (
                    <div className={`text-[10px] font-bold ${priceChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {priceChange > 0 ? '+' : ''}{priceChange}
                    </div>
                  )}
                </div>

                {/* P&L */}
                <div className="text-right flex items-center justify-end gap-1">
                  {pl > 0
                    ? <><TrendingUp size={12} className="text-[var(--color-success)]" /><span className="text-sm font-bold text-[var(--color-success)] tabular-nums">+{pl.toFixed(0)}</span></>
                    : pl < 0
                    ? <><TrendingDown size={12} className="text-[var(--color-danger)]" /><span className="text-sm font-bold text-[var(--color-danger)] tabular-nums">{pl.toFixed(0)}</span></>
                    : <><Minus size={12} className="text-[var(--color-muted)]" /><span className="text-sm text-[var(--color-muted)] tabular-nums">0</span></>
                  }
                </div>

                {/* Sell action */}
                <div className="flex justify-end">
                  <SellButton athleteId={p.athlete_id} price={currentPrice} boughtPrice={boughtPrice} marketLocked={market.locked} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Net worth footer */}
      {portfolio.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-1 text-sm text-[var(--color-muted)]">
          <span>{t('netWorth')}</span>
          <span className="font-bold text-white">T${netWorth.toFixed(0)}</span>
        </div>
      )}
    </div>
  )
}
