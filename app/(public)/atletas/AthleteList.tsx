'use client'
import { useState, useMemo } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import AthleteRow from './AthleteRow'

type SortKey = 'price' | 'name' | 'pto' | 'trend'

export default function AthleteList({
  athletes,
  ownedMap,
  wallet,
  marketLocked,
}: {
  athletes: any[]
  ownedMap: Record<string, number>
  wallet: number | null
  marketLocked: boolean
}) {
  const t = useTranslations('market')
  const owned = useMemo(() => new Map(Object.entries(ownedMap)), [ownedMap])
  const rosterCount = owned.size

  const [search, setSearch]   = useState('')
  const [gender, setGender]   = useState<'all' | 'M' | 'F'>('all')
  const [trend, setTrend]     = useState<'all' | 'up' | 'down'>('all')
  const [ownership, setOwn]   = useState<'all' | 'owned' | 'available'>('all')
  const [sort, setSort]       = useState<SortKey>('price')

  const hasFilters = search || gender !== 'all' || trend !== 'all' || ownership !== 'all'

  const filtered = useMemo(() => {
    let r = [...athletes]

    if (search) {
      const q = search.toLowerCase()
      r = r.filter(a => a.name.toLowerCase().includes(q) || (a.country ?? '').toLowerCase().includes(q))
    }
    if (gender !== 'all')    r = r.filter(a => a.gender === gender)
    if (trend === 'up')      r = r.filter(a => Number(a.price_change) > 0)
    if (trend === 'down')    r = r.filter(a => Number(a.price_change) < 0)
    if (ownership === 'owned')     r = r.filter(a => owned.has(a.id))
    if (ownership === 'available') r = r.filter(a => !owned.has(a.id))

    switch (sort) {
      case 'name':  r.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'pto':   r.sort((a, b) => (a.pto_rank ?? 9999) - (b.pto_rank ?? 9999)); break
      case 'trend': r.sort((a, b) => Number(b.price_change) - Number(a.price_change)); break
      default:      r.sort((a, b) => Number(b.current_price) - Number(a.current_price))
    }

    return r
  }, [athletes, search, gender, trend, ownership, sort, owned])

  function clear() {
    setSearch(''); setGender('all'); setTrend('all'); setOwn('all')
  }

  const chip = (active: boolean, danger?: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active
        ? danger
          ? 'bg-red-900/50 border-red-700 text-red-400'
          : 'bg-[var(--color-orange)] border-[var(--color-orange)] text-white'
        : 'border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-navy-elevated)]'
    }`

  const successChip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active
        ? 'bg-green-900/50 border-green-700 text-green-400'
        : 'border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-navy-elevated)]'
    }`

  return (
    <div>
      {/* Search row */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-orange)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="px-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg text-xs text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-orange)]"
        >
          <option value="price">{t('sortPrice')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="pto">{t('sortPto')}</option>
          <option value="trend">{t('sortTrend')}</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
        {/* Gender */}
        <button onClick={() => setGender('all')} className={chip(gender === 'all')}>{t('filterAll')}</button>
        <button onClick={() => setGender('M')}   className={chip(gender === 'M')}>{t('filterMen')}</button>
        <button onClick={() => setGender('F')}   className={chip(gender === 'F')}>{t('filterWomen')}</button>

        <div className="w-px h-4 bg-[var(--color-navy-border)]" />

        {/* Trend */}
        <button onClick={() => setTrend('up')}   className={successChip(trend === 'up')}>{t('filterRising')} ↑</button>
        <button onClick={() => setTrend('down')} className={chip(trend === 'down', true)}>{t('filterFalling')} ↓</button>
        {trend !== 'all' && (
          <button onClick={() => setTrend('all')} className={chip(false)}>
            <X size={10} className="inline mr-1" />
          </button>
        )}

        {/* Owned — only if logged in */}
        {wallet !== null && (
          <>
            <div className="w-px h-4 bg-[var(--color-navy-border)]" />
            <button onClick={() => setOwn('owned')}     className={chip(ownership === 'owned')}>{t('filterOwned')}</button>
            <button onClick={() => setOwn('available')} className={chip(ownership === 'available')}>{t('filterAvailable')}</button>
            {ownership !== 'all' && (
              <button onClick={() => setOwn('all')} className={chip(false)}>
                <X size={10} className="inline mr-1" />
              </button>
            )}
          </>
        )}

        {hasFilters && (
          <button onClick={clear} className="ml-auto flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-white transition-colors">
            <X size={11} />{t('filterClear')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center justify-between">
          <span className="text-sm font-bold flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-[var(--color-muted)]" />
            {t('tableTitle')}
          </span>
          <span className="text-xs text-[var(--color-muted)]">{filtered.length}</span>
        </div>
        <div className="max-h-[700px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-14 text-[var(--color-muted)] text-sm">
              {t('filterEmpty')}
            </div>
          ) : (
            filtered.map(a => (
              <AthleteRow
                key={a.id}
                a={a}
                owned={owned.has(a.id)}
                boughtPrice={owned.get(a.id) ?? null}
                wallet={wallet}
                rosterCount={rosterCount}
                marketLocked={marketLocked}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
