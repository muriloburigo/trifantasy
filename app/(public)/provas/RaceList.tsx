'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, MapPin, Calendar, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'

type StatusFilter = 'all' | 'open' | 'upcoming' | 'finished'
type DistanceFilter = 'all' | 'full' | 'middle'

function RaceCard({ race, t }: { race: Race; t: ReturnType<typeof useTranslations<'races'>> }) {
  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'

  const statusMap: Record<string, { label: string; color: string }> = {
    open:     { label: t('statusOpen'),     color: 'text-[var(--color-success)]' },
    upcoming: { label: t('statusUpcoming'), color: 'text-[var(--color-muted)]' },
    locked:   { label: t('statusLocked'),   color: 'text-yellow-400' },
    finished: { label: t('statusFinished'), color: 'text-[var(--color-muted)]' },
  }
  const st = statusMap[race.status] ?? statusMap.upcoming

  return (
    <Link
      href={`/provas/${race.slug}`}
      className="group bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-2xl p-5 flex flex-col gap-3 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
            {race.distance === 'full' ? t('full') : t('middle')}
          </span>
          <h3 className="font-bold text-base mt-0.5 leading-tight group-hover:text-[var(--color-orange)] transition-colors">
            {race.name}
          </h3>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${st.color}`}>{st.label}</span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5"><MapPin size={12} />{race.location}, {race.country}</div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />{formatDate(race.date)}
          {days > 0 && days <= 60 && <span className="text-[var(--color-orange)] text-xs font-semibold ml-1">{days}d</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-navy-border)]">
        <span className={`text-xs font-semibold ${isOpen ? 'text-[var(--color-orange)]' : 'text-[var(--color-muted)]'}`}>
          {t('cta')}
        </span>
        <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-orange)] transition-colors" />
      </div>
    </Link>
  )
}

export default function RaceList({ races }: { races: Race[] }) {
  const t = useTranslations('races')

  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState<StatusFilter>('all')
  const [distance, setDistance] = useState<DistanceFilter>('all')

  const hasFilters = search || status !== 'all' || distance !== 'all'

  const filtered = useMemo(() => {
    let r = [...races]

    if (search) {
      const q = search.toLowerCase()
      r = r.filter(race =>
        race.name.toLowerCase().includes(q) ||
        race.location.toLowerCase().includes(q) ||
        race.country.toLowerCase().includes(q)
      )
    }
    if (status !== 'all')   r = r.filter(race => race.status === status)
    if (distance === 'full')   r = r.filter(race => race.distance === 'full')
    if (distance === 'middle') r = r.filter(race => race.distance !== 'full')

    return r
  }, [races, search, status, distance])

  const open     = useMemo(() => filtered.filter(r => r.status === 'open'),     [filtered])
  const upcoming = useMemo(() => filtered.filter(r => r.status === 'upcoming'), [filtered])
  const finished = useMemo(() => filtered.filter(r => r.status === 'finished'), [filtered])

  function clear() { setSearch(''); setStatus('all'); setDistance('all') }

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active
        ? 'bg-[var(--color-orange)] border-[var(--color-orange)] text-white'
        : 'border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-navy-elevated)]'
    }`

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
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
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Status */}
        <button onClick={() => setStatus('all')}      className={chip(status === 'all')}>{t('filterAll')}</button>
        <button onClick={() => setStatus('open')}     className={chip(status === 'open')}>{t('filterOpen')}</button>
        <button onClick={() => setStatus('upcoming')} className={chip(status === 'upcoming')}>{t('filterUpcoming')}</button>
        <button onClick={() => setStatus('finished')} className={chip(status === 'finished')}>{t('filterFinished')}</button>

        <div className="w-px h-4 bg-[var(--color-navy-border)]" />

        {/* Distance */}
        <button onClick={() => setDistance(distance === 'full' ? 'all' : 'full')}   className={chip(distance === 'full')}>{t('filterFull')}</button>
        <button onClick={() => setDistance(distance === 'middle' ? 'all' : 'middle')} className={chip(distance === 'middle')}>{t('filterMiddle')}</button>

        {hasFilters && (
          <button onClick={clear} className="ml-auto flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-white transition-colors">
            <X size={11} />{t('filterClear')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)] text-sm bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
          {t('filterEmpty')}
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-success)] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse inline-block" />
                {t('sectionOpen')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {open.map(r => <RaceCard key={r.id} race={r} t={t} />)}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">{t('sectionUpcoming')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(r => <RaceCard key={r.id} race={r} t={t} />)}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">{t('sectionFinished')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {finished.map(r => <RaceCard key={r.id} race={r} t={t} />)}
              </div>
            </section>
          )}

          {/* Locked races (no separate section, included in upcoming filter visually) */}
          {filtered.filter(r => r.status === 'locked' && status === 'all').length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-4">{t('statusLocked')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                {filtered.filter(r => r.status === 'locked').map(r => <RaceCard key={r.id} race={r} t={t} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
