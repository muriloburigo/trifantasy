'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Wallet, ShoppingBag, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import type { Race, RaceAthlete } from '~/lib/types'
import { TEAM_SIZE } from '~/lib/types'
import { useTranslations } from 'next-intl'

type Filter = { search: string }

function PriceTrend({ change }: { change: number | null }) {
  if (!change || change === 0) return <span className="text-[var(--color-muted)] text-xs">—</span>
  if (change > 0) return <span className="text-[var(--color-success)] text-xs font-semibold">↑{change.toFixed(1)}</span>
  return <span className="text-[var(--color-danger)] text-xs font-semibold">↓{Math.abs(change).toFixed(1)}</span>
}

function AthleteCard({
  ra, owned,
}: {
  ra: RaceAthlete
  owned: boolean
}) {
  const t = useTranslations('teamBuilder')
  const a = ra.athlete!

  return (
    <div className={`w-full text-left p-3 rounded-xl border transition-all ${
      owned
        ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/50'
        : 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)] opacity-45'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mt-0.5 truncate">{a.name}</p>
          {a.pto_rank && <p className="text-xs text-[var(--color-muted)]">PTO #{a.pto_rank}</p>}
          {a.club && <p className="text-xs text-[var(--color-muted)] truncate">{a.club}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-bold text-sm text-[var(--color-orange)]">T${ra.price}</span>
          <PriceTrend change={(a as any).price_change ?? null} />
          {owned && <CheckCircle2 size={14} className="text-[var(--color-success)]" />}
          {!owned && <span className="text-[10px] text-[var(--color-muted)]">{t('notOwned')}</span>}
        </div>
      </div>
    </div>
  )
}

export default function TeamBuilder({
  race, raceAthletes, userId, isOpen, ownedAthleteIds, wallet,
}: {
  race: Race
  raceAthletes: RaceAthlete[]
  userId: string | null
  isOpen: boolean
  ownedAthleteIds: string[]
  wallet: number
}) {
  const t = useTranslations('teamBuilder')
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

  if (ownedAthleteIds.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-lg font-medium text-white">{t('noAthletesTitle')}</p>
        <p className="text-sm mt-1 mb-6">{t('noAthletesDesc', { wallet, size: TEAM_SIZE })}</p>
        <Link
          href="/atletas"
          className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <ShoppingBag size={15} />
          {t('noAthletesCta')}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(ra => (
            <AthleteCard
              key={ra.id}
              ra={ra}
              owned={ownedSet.has(ra.athlete_id)}
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
        <div className="sticky top-20 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-4">
          <h2 className="font-bold mb-3">{t('rosterTitle')}</h2>

          <div className="space-y-1.5 mb-4 min-h-[120px]">
            {ownedAthleteIds.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] text-center py-4">
                {t('teamHint')}
              </p>
            )}
            {ownedRoster.map(ra => (
              <div key={ra.athlete_id} className="flex items-center justify-between bg-[var(--color-navy-elevated)] rounded-lg px-2.5 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ra.athlete?.name}</p>
                  <p className="text-xs text-[var(--color-success)]">{t('inRace', { price: ra.price })}</p>
                </div>
              </div>
            ))}
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
            className="w-full inline-flex items-center justify-center bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
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
