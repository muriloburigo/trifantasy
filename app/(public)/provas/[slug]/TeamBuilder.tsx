'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Wallet, ShoppingBag, AlertCircle, Info, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Race, RaceAthlete } from '~/lib/types'
import { TEAM_SIZE } from '~/lib/types'
import { useTranslations } from 'next-intl'
import { BuyButton, SellButton } from '../../elenco/TradeButton'

type Filter = { search: string }

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}
function flag(c: string | null) { return COUNTRY_FLAGS[c ?? ''] ?? '' }
function initials(name: string) { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() }

function Trend({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-[var(--color-success)] text-[10px] font-bold"><TrendingUp size={10} />+{change.toFixed(1)}</span>
  if (change < 0) return <span className="flex items-center gap-0.5 text-[var(--color-danger)] text-[10px] font-bold"><TrendingDown size={10} />{change.toFixed(1)}</span>
  return <span className="flex items-center gap-0.5 text-[var(--color-muted)] text-[10px]"><Minus size={10} />0</span>
}

function AthleteCard({
  ra, owned, boughtPrice, wallet, rosterCount,
}: {
  ra: RaceAthlete
  owned: boolean
  boughtPrice: number | null
  wallet: number
  rosterCount: number
}) {
  const t = useTranslations('teamBuilder')
  const a = ra.athlete!
  const price = Number(ra.price)

  return (
    <div className={`w-full p-3 rounded-xl border transition-all ${
      owned
        ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40 shadow-[0_0_15px_rgba(var(--color-orange-rgb),0.05)]'
        : 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)]'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <Link href={`/atletas/${a.id}`} className="shrink-0 group">
          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-black text-white border-2 transition-transform group-hover:scale-105 ${
            owned ? 'border-[var(--color-orange)]/40' : 'border-[var(--color-navy-border)]'
          } ${!a.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''}`}>
            {a.photo_url
              ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />
              : initials(a.name)
            }
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link href={`/atletas/${a.id}`} className="block group">
            <p className="font-bold text-sm truncate group-hover:text-[var(--color-orange)] transition-colors">
              {a.name} <span className="text-xs font-normal">{flag(a.country)}</span>
            </p>
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[var(--color-navy-elevated)] text-[var(--color-muted)] uppercase tracking-tighter">
              PTO {a.pto_rank ? `#${a.pto_rank}` : '—'}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-900/20 text-blue-400 uppercase tracking-tighter">
              WTCS {a.wtcs_rank ? `#${a.wtcs_rank}` : '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="font-black text-sm text-[var(--color-orange)]">T${price}</span>
          <Trend change={Number(a.price_change ?? 0)} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-navy-border)]/50">
        <div className="flex items-center gap-1.5">
          {owned && <CheckCircle2 size={12} className="text-[var(--color-success)]" />}
          <span className={`text-[10px] font-bold ${owned ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}`}>
            {owned ? t('inRoster') : t('available')}
          </span>
        </div>
        
        <div className="shrink-0">
          {owned ? (
            <SellButton 
              athleteId={a.id} 
              price={price} 
              boughtPrice={boughtPrice!} 
            />
          ) : (
            <BuyButton 
              athleteId={a.id} 
              price={price} 
              wallet={wallet} 
              rosterCount={rosterCount}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamBuilder({
  race, raceAthletes, userId, isOpen, ownedMap, wallet,
}: {
  race: Race
  raceAthletes: RaceAthlete[]
  userId: string | null
  isOpen: boolean
  ownedMap: Record<string, number>
  wallet: number
}) {
  const t = useTranslations('teamBuilder')
  const ownedAthleteIds = useMemo(() => Object.keys(ownedMap), [ownedMap])
  const ownedSet = useMemo(() => new Set(ownedAthleteIds), [ownedAthleteIds])
  const [filter, setFilter] = useState<Filter>({ search: '' })

  const ownedRoster = useMemo(() => raceAthletes.filter(ra => ownedSet.has(ra.athlete_id)), [raceAthletes, ownedSet])
  const marketField = useMemo(() => raceAthletes.filter(ra => !ownedSet.has(ra.athlete_id)), [raceAthletes, ownedSet])
  
  const filtered = useMemo(() => {
    const list = [...ownedRoster, ...marketField]
    return list.filter(ra => !filter.search || ra.athlete!.name.toLowerCase().includes(filter.search.toLowerCase()))
  }, [filter.search, ownedRoster, marketField])

  const missingFromRace = Math.max(ownedAthleteIds.length - ownedRoster.length, 0)

  if (!isOpen) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-lg font-medium">{t('lockedTitle')}</p>
        <p className="text-sm mt-1">{t('lockedDesc')}</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🔑</p>
        <p className="text-lg font-medium">{t('loginTitle')}</p>
        <Link href="/login" className="inline-block mt-4 bg-[var(--color-orange)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[var(--color-orange-light)] transition-colors">
          {t('loginCta')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4 text-sm text-[var(--color-muted)]">
          <Wallet size={13} />
          <span>{t('walletInfo', { wallet })}</span>
          <span>·</span>
          <span>{t('rosterCount', { current: ownedAthleteIds.length, total: TEAM_SIZE })}</span>
          <span>·</span>
          <span>{ownedRoster.length !== 1 ? t('athletesInRacePlural', { n: ownedRoster.length }) : t('athletesInRace', { n: ownedRoster.length })}</span>
          <Link href="/atletas" className="ml-auto text-[var(--color-orange)] hover:underline text-xs">{t('manageRoster')}</Link>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            placeholder={t('searchPlaceholder')}
            value={filter.search}
            onChange={e => setFilter({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-orange)]"
          />
        </div>

        {ownedAthleteIds.length === 0 && (
          <div className="text-center py-12 mb-6 bg-[var(--color-navy-card)] border border-dashed border-[var(--color-navy-border)] rounded-2xl">
            <p className="text-sm text-[var(--color-muted)] mb-2">{t('noAthletesTitle')}</p>
            <p className="text-xs text-[var(--color-muted)]/60">{t('noAthletesDesc', { wallet, size: TEAM_SIZE })}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[800px] overflow-y-auto pr-1">
          {filtered.map(ra => (
            <AthleteCard
              key={ra.id}
              ra={ra}
              owned={ownedSet.has(ra.athlete_id)}
              boughtPrice={ownedMap[ra.athlete_id] ?? null}
              wallet={wallet}
              rosterCount={ownedAthleteIds.length}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-[var(--color-muted)] text-sm">
              {t('noResults')}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-72 shrink-0">
        <div className="sticky top-20 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-3 sm:p-4">
          <h2 className="font-bold text-sm sm:text-base mb-3">{t('rosterTitle')}</h2>

          <div className="space-y-1.5 mb-4 min-h-[100px]">
            {ownedAthleteIds.length === 0 && (
              <p className="text-[10px] sm:text-xs text-[var(--color-muted)] text-center py-4">
                {t('teamHint')}
              </p>
            )}
            {ownedRoster.map(ra => (
              <div key={ra.athlete_id} className="flex items-center gap-2 bg-[var(--color-navy-elevated)] rounded-lg px-2 py-1.5 border border-[var(--color-navy-border)]">
                {/* Small Avatar */}
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white shrink-0 ${
                  !ra.athlete?.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''
                }`}>
                  {ra.athlete?.photo_url
                    ? <img src={ra.athlete.photo_url} alt={ra.athlete.name} className="w-full h-full object-cover" />
                    : initials(ra.athlete?.name ?? '?')
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold truncate leading-tight">{ra.athlete?.name}</p>
                  <p className="text-[8px] sm:text-[9px] text-[var(--color-success)] font-medium">{t('inRace', { price: ra.price })}</p>
                </div>
              </div>
            ))}
            {ownedRoster.length === 0 && ownedAthleteIds.length > 0 && (
              <div className="py-3 text-center border border-dashed border-[var(--color-navy-border)] rounded-lg">
                 <p className="text-[10px] text-[var(--color-muted)]">Nenhum atleta do elenco nesta prova.</p>
              </div>
            )}
          </div>

          {missingFromRace > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-yellow-500 bg-yellow-950/30 rounded-lg p-2 mb-3">
              <AlertCircle size={11} className="mt-0.5 shrink-0" />
              <span>{missingFromRace !== 1 ? t('alertNotInRacePlural', { n: missingFromRace }) : t('alertNotInRace', { n: missingFromRace })}</span>
            </div>
          )}

          <div className="flex items-start gap-1.5 text-xs text-[var(--color-muted)] mb-3">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>{t('autoRosterHint', { size: TEAM_SIZE })}</span>
          </div>

          <Link
            href="/elenco"
            className="w-full inline-flex items-center justify-center bg-[var(--color-navy-elevated)] hover:bg-[var(--color-navy-border)] text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {t('manageRosterButton')}
          </Link>

          <p className="text-[11px] text-[var(--color-muted)] text-center mt-3">
            {t('raceStatusNote', { race: race.name })}
          </p>
        </div>
      </div>
    </div>
  )
}
