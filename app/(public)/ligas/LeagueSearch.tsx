'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Trophy, Globe, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

type TypeFilter = 'all' | 'public' | 'private'

function LeagueCard({ league, showJoin }: { league: any; showJoin?: boolean }) {
  const t = useTranslations('leagues')
  return (
    <Link
      href={`/ligas/${league.id}`}
      className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-2xl p-5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold leading-tight">{league.name}</h3>
        <Trophy size={16} className="text-[var(--color-orange)] opacity-60 shrink-0 ml-2" />
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
        {league.is_public
          ? <span className="flex items-center gap-1"><Globe size={10} />{t('public')}</span>
          : <span className="flex items-center gap-1"><Lock size={10} />{t('private')}</span>}
        {!league.is_public && (
          <span className="flex items-center gap-1.5">
            {t('code')} <span className="font-mono text-[var(--color-text)]">{league.invite_code}</span>
          </span>
        )}
        {showJoin && (
          <span className="ml-auto text-[var(--color-success)]">{t('publicJoin')}</span>
        )}
      </div>
    </Link>
  )
}

export default function LeagueSearch({
  myLeagues,
  publicLeagues,
  isLoggedIn,
}: {
  myLeagues: any[]
  publicLeagues: any[]
  isLoggedIn: boolean
}) {
  const t = useTranslations('leagues')

  const [search, setSearch]   = useState('')
  const [typeFilter, setType] = useState<TypeFilter>('all')

  const hasFilters = search || typeFilter !== 'all'

  const filteredMy = useMemo(() => {
    let r = [...myLeagues]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(l => l.name.toLowerCase().includes(q))
    }
    if (typeFilter === 'public')  r = r.filter(l => l.is_public)
    if (typeFilter === 'private') r = r.filter(l => !l.is_public)
    return r
  }, [myLeagues, search, typeFilter])

  const filteredPublic = useMemo(() => {
    let r = [...publicLeagues]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(l => l.name.toLowerCase().includes(q))
    }
    // Public leagues are always public, filter by type only when 'private' is selected
    if (typeFilter === 'private') return []
    return r
  }, [publicLeagues, search, typeFilter])

  function clear() { setSearch(''); setType('all') }

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active
        ? 'bg-[var(--color-orange)] border-[var(--color-orange)] text-white'
        : 'border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-navy-elevated)]'
    }`

  return (
    <div>
      {/* Search + type filter */}
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
        <button onClick={() => setType('all')}     className={chip(typeFilter === 'all')}>{t('filterAll')}</button>
        <button onClick={() => setType('public')}  className={chip(typeFilter === 'public')}><Globe size={10} className="inline mr-1" />{t('filterPublic')}</button>
        <button onClick={() => setType('private')} className={chip(typeFilter === 'private')}><Lock size={10} className="inline mr-1" />{t('filterPrivate')}</button>

        {hasFilters && (
          <button onClick={clear} className="ml-auto flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-white transition-colors">
            <X size={11} />{t('filterClear')}
          </button>
        )}
      </div>

      {/* My leagues */}
      {isLoggedIn && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">{t('myLeaguesTitle')}</h2>
          {filteredMy.length === 0 ? (
            <div className="text-center py-10 text-[var(--color-muted)] text-sm bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
              {hasFilters ? t('filterEmpty') : t('myLeaguesEmpty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMy.map(l => <LeagueCard key={l.id} league={l} />)}
            </div>
          )}
        </section>
      )}

      {/* Public leagues */}
      {filteredPublic.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">
            {t('publicTitle')}
            <span className="ml-2 font-normal text-[var(--color-muted)]/60">{filteredPublic.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPublic.map(l => <LeagueCard key={l.id} league={l} showJoin />)}
          </div>
        </section>
      )}

      {!isLoggedIn && filteredPublic.length === 0 && (
        <div className="text-center py-10 text-[var(--color-muted)] text-sm bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
          {t('filterEmpty')}
        </div>
      )}
    </div>
  )
}
