import Link from 'next/link'
import { createPublicClient, createAdminClient, createClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'
import {
  TrendingUp, TrendingDown, Trophy, MapPin, Calendar,
  Users, ChevronRight, Zap, ArrowRight, Star, Lock, ShoppingBag, Plus, Globe,
  Unlock,
} from 'lucide-react'
import PublicShell from './(public)/PublicShell'
import GlobalRankWidget from './components/GlobalRankWidget'
import ShareRoster from './(public)/elenco/ShareRoster'
import { getTranslations } from 'next-intl/server'
import { getMarketStatus } from '~/lib/market'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── utils ────────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
  'Israel': '🇮🇱', 'Serbia': '🇷🇸', 'Romania': '🇷🇴', 'Hungary': '🇭🇺',
  'Finland': '🇫🇮', 'UAE': '🇦🇪', 'Turkey': '🇹🇷',
}

function flag(country: string | null) {
  return COUNTRY_FLAGS[country ?? ''] ?? '🌍'
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── athlete card (market) ────────────────────────────────────────────────────

function AthleteCard({ a, rank }: { a: any; rank?: number }) {
  const change = Number(a.price_change ?? 0)
  const price = Number(a.current_price ?? 0)

  return (
    <Link href={`/atletas/${a.id}`} className="relative flex-shrink-0 w-[130px] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-[var(--color-orange)]/50 transition-all">
      {rank && (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-black text-[var(--color-muted)]">
          #{rank}
        </span>
      )}
      <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-base font-black text-white mt-2 shrink-0 ${
        !a.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''
      }`}>
        {a.photo_url
          ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
          : initials(a.name)
        }
      </div>
      <p className="text-xs font-semibold text-center leading-tight line-clamp-2 w-full">{a.name}</p>
      <p className="text-[11px] text-[var(--color-muted)]">{flag(a.country)} {a.country?.split(' ')[0]}</p>
      <div className="w-full flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-navy-border)]">
        {change !== 0 ? (
          <span className={`text-[11px] font-bold flex items-center gap-0.5 ${change > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}
          </span>
        ) : (
          <span className="text-[11px] text-[var(--color-muted)]">—</span>
        )}
        <span className="text-sm font-black text-[var(--color-orange)]">T${price.toFixed(0)}</span>
      </div>
    </Link>
  )
}

// ─── race card (sidebar) ──────────────────────────────────────────────────────

function RaceCard({ race, athleteCount, t }: { race: Race; athleteCount?: number; t: any }) {
  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'
  return (
    <Link href={`/provas/${race.slug}`} className="group block bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/60 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isOpen ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}`}>
            {race.distance === 'full' ? 'Full · ' : race.distance === 'T100' ? 'T100 · ' : '70.3 · '}{isOpen ? t('raceOpen') : t('raceUpcoming')}
          </span>
          <h3 className="font-bold text-sm mt-0.5 leading-tight group-hover:text-[var(--color-orange)] transition-colors line-clamp-2">{race.name}</h3>
        </div>
      </div>
      <div className="space-y-1 text-xs text-[var(--color-muted)] mb-3">
        <div className="flex items-center gap-1.5"><MapPin size={11} />{race.location}, {race.country}</div>
        <div className="flex items-center gap-1.5">
          <Calendar size={11} />{formatDate(race.date)}
          {days > 0 && days <= 30 && <span className="text-[var(--color-orange)] font-semibold ml-1">{days}d</span>}
        </div>
      </div>
      <div className={`w-full text-center text-xs font-semibold py-2 rounded-lg transition-colors ${
        isOpen ? 'bg-[var(--color-orange)]/10 text-[var(--color-orange)]' : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
      }`}>
        {t('raceCta')}
      </div>
    </Link>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const t = await getTranslations('home')
  const tLeagues = await getTranslations('leagues')
  const pub   = createPublicClient()
  const admin = createAdminClient()
  const auth = await createClient()

  const authRes = await auth.auth.getUser()
  const loggedUser = authRes.data.user

  const [
    { data: rising },
    { data: falling },
    { data: topAthletes },
    { data: races },
    { count: trixerCount },
    { count: athleteCount },
    { count: teamCount },
  ] = await Promise.all([
    pub.from('athletes').select('id, name, type, country, current_price, price_change, photo_url').gt('price_change', 0).order('price_change', { ascending: false }).limit(12),
    pub.from('athletes').select('id, name, type, country, current_price, price_change, photo_url').lt('price_change', 0).order('price_change', { ascending: true }).limit(12),
    pub.from('athletes').select('id, name, type, country, current_price, price_change, photo_url').eq('type', 'pro').order('current_price', { ascending: false }).limit(12),
    pub.from('races').select('*, race_athletes(athlete_id)').in('status', ['open', 'upcoming']).order('date', { ascending: true }).limit(30),
    pub.from('profiles').select('*', { count: 'exact', head: true }),
    pub.from('athletes').select('*', { count: 'exact', head: true }),
    admin.from('teams').select('*', { count: 'exact', head: true }),
  ])

  // Fetch Global League Ranking by net worth (wallet + portfolio value)
  let globalRank: any[] = []
  const { data: globalLeague } = await admin.from('leagues').select('id').eq('is_global', true).single()

  if (globalLeague) {
    const { data: members } = await admin.from('league_members').select('user_id').eq('league_id', globalLeague.id)
    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id)
      const [{ data: profiles }, { data: portfolioRows }] = await Promise.all([
        admin.from('profiles').select('id, name, photo_url, wallet').in('id', userIds),
        admin.from('portfolio').select('user_id, athlete:athletes(current_price)').in('user_id', userIds),
      ])

      const portfolioByUser: Record<string, number> = {}
      for (const p of portfolioRows ?? []) {
        const price = Number((p.athlete as any)?.current_price ?? 0)
        portfolioByUser[p.user_id] = (portfolioByUser[p.user_id] ?? 0) + price
      }

      const profileMap = new Map(profiles?.map(p => [p.id, p]))
      globalRank = members.map(m => {
        const p = profileMap.get(m.user_id) as any
        const wallet = Number(p?.wallet ?? 0)
        const portfolioValue = portfolioByUser[m.user_id] ?? 0
        return {
          userId: m.user_id,
          name: p?.name ?? 'Trixer',
          photoUrl: p?.photo_url ?? null,
          total: wallet + portfolioValue,
          wallet,
          portfolioValue,
        }
      }).sort((a, b) => b.total - a.total)
    }
  }

  // Portfolio details + my leagues
  let myPortfolio: any[] = []
  let myNetWorth = 0
  let myLeagues: { id: string; name: string; is_public: boolean; memberCount: number }[] = []
  if (loggedUser) {
    const [{ data: portfolioRes }, { data: profileRes }, { data: leagueMemberships }] = await Promise.all([
      auth.from('portfolio').select('bought_price, athlete:athletes(id, name, current_price, photo_url)').eq('user_id', loggedUser.id),
      auth.from('profiles').select('wallet').eq('id', loggedUser.id).single(),
      admin.from('league_members').select('league:leagues(id, name, is_public, is_global)').eq('user_id', loggedUser.id),
    ])
    myPortfolio = (portfolioRes ?? []).map(p => ({ ...p, athlete: p.athlete as any }))
    const wallet = Number((profileRes as any)?.wallet ?? 0)
    myNetWorth = wallet + myPortfolio.reduce((s, p) => s + Number(p.athlete?.current_price ?? 0), 0)

    // Filter out global league, keep up to 3 non-global leagues
    const nonGlobal = (leagueMemberships ?? [])
      .map((m: any) => m.league)
      .filter((l: any) => l && !l.is_global)
      .slice(0, 3)

    if (nonGlobal.length > 0) {
      const leagueIds = nonGlobal.map((l: any) => l.id)
      const { data: memberCounts } = await admin
        .from('league_members')
        .select('league_id')
        .in('league_id', leagueIds)
      const countByLeague: Record<string, number> = {}
      for (const row of memberCounts ?? []) {
        countByLeague[row.league_id] = (countByLeague[row.league_id] ?? 0) + 1
      }
      myLeagues = nonGlobal.map((l: any) => ({
        id: l.id,
        name: l.name,
        is_public: l.is_public,
        memberCount: countByLeague[l.id] ?? 0,
      }))
    }
  }

  const today = new Date()
  const in7   = new Date(today); in7.setDate(today.getDate() + 7)
  const allActive = (races ?? []) as Race[]
  const withStartlist = allActive.filter(r => ((r as any).race_athletes?.length ?? 0) > 0)
  const next7Races = withStartlist.filter(r => new Date(r.date) <= in7)

  const nextRace = withStartlist[0] ?? allActive[0] ?? null
  const nextRaceDays = nextRace ? daysUntil(nextRace.date) : null

  const market = await getMarketStatus(pub)
  const openRaces = allActive.filter(r => r.status === 'open')

  return (
    <PublicShell>
      <div className="border-b border-[var(--color-navy-border)] bg-gradient-to-b from-[var(--color-navy-card)] to-[var(--color-navy)]">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-orange)] mb-3">{t('tagline')}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              {t('title1')}<br />{t('title2')}<br />
              <span className="bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)] bg-clip-text text-transparent">{t('titleHighlight')}</span>
            </h1>
            <p className="text-[var(--color-muted)] text-sm max-w-md leading-relaxed mb-6">{t('description')}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={loggedUser ? "/atletas" : "/register"} className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                {loggedUser ? t('ctaLogged') : t('ctaPrimary')}
              </Link>
              <Link href="/regras" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors flex items-center gap-1">{t('ctaSecondary')} <ArrowRight size={12} /></Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
            <Link href="/atletas" className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-2xl p-2.5 sm:p-4 text-center transition-all hover:bg-[var(--color-navy-card)] group">
              <Zap size={14} className="mx-auto mb-1.5 text-[var(--color-orange)]" />
              <p className="text-lg sm:text-2xl font-black group-hover:text-[var(--color-orange)] transition-colors leading-none">{athleteCount ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest mt-1.5">{t('statsAthletes')}</p>
            </Link>
            <Link href="/trixers" className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-2xl p-2.5 sm:p-4 text-center transition-all hover:bg-[var(--color-navy-card)] group">
              <Users size={14} className="mx-auto mb-1.5 text-[var(--color-purple)]" />
              <p className="text-lg sm:text-2xl font-black group-hover:text-[var(--color-orange)] transition-colors leading-none">{trixerCount ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest mt-1.5">{t('statsTrixers')}</p>
            </Link>
            {nextRace ? (
              <Link href={`/provas/${nextRace.slug}`} className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-2xl p-2.5 sm:p-4 text-center transition-all hover:bg-[var(--color-navy-card)] group">
                <Calendar size={14} className="mx-auto mb-1.5 text-[var(--color-success)]" />
                <p className="text-lg sm:text-2xl font-black group-hover:text-[var(--color-orange)] transition-colors leading-none">{nextRaceDays !== null && nextRaceDays <= 0 ? t('statsNextRaceToday') : nextRaceDays}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest mt-1.5">{nextRaceDays !== null && nextRaceDays <= 0 ? t('statsNextRaceLive') : t('statsNextRaceDays')}</p>
              </Link>
            ) : (
              <Link href="/ligas" className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-2xl p-2.5 sm:p-4 text-center transition-all hover:bg-[var(--color-navy-card)] group">
                <Trophy size={14} className="mx-auto mb-1.5 text-yellow-400" />
                <p className="text-lg sm:text-2xl font-black group-hover:text-[var(--color-orange)] transition-colors leading-none">{teamCount ?? 0}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest mt-1.5">{t('statsTeams')}</p>
              </Link>
            )}
          </div>
        </div>

        {/* Market Status Banner */}
        {openRaces.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-10">
            <Link 
              href={openRaces.length === 1 ? `/provas/${openRaces[0].slug}` : "/atletas"}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                market.locked 
                  ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40' 
                  : 'bg-[var(--color-success)]/5 border-[var(--color-success)]/20 hover:border-[var(--color-success)]/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  market.locked ? 'bg-yellow-500/10 text-yellow-500' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                }`}>
                  {market.locked ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    {market.locked ? (await getTranslations('marketBanner'))('locked') : (await getTranslations('marketBanner'))('open')}
                    <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                    <span className="text-[var(--color-muted)] font-medium text-xs sm:text-sm">
                      {openRaces.length === 1 ? t('openRaceSingular', { n: 1 }) : t('openRacePlural', { n: openRaces.length })}
                    </span>
                  </h3>
                  <p className="text-[var(--color-muted)] text-[10px] sm:text-xs mt-0.5 line-clamp-1">
                    {market.locked 
                      ? (await getTranslations('marketBanner'))('ongoingRace', { race: market.lockRace?.name ?? '' })
                      : t('availableSubtitle') + ': ' + openRaces.map(r => r.name).join(', ')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-orange)] font-bold text-xs sm:text-sm pl-4 shrink-0">
                <span className="hidden sm:inline">{t('ctaLogged')}</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            {rising && rising.length > 0 && (
              <section>
                <h2 className="font-bold flex items-center gap-2 text-base mb-4"><TrendingUp size={16} className="text-[var(--color-success)]" />{t('risingMarket')}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">{rising.map(a => <AthleteCard key={a.id} a={a} />)}</div>
              </section>
            )}

            {falling && falling.length > 0 && (
              <section>
                <h2 className="font-bold flex items-center gap-2 text-base mb-4"><TrendingDown size={16} className="text-[var(--color-danger)]" />{t('fallingMarket')}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">{falling.map(a => <AthleteCard key={a.id} a={a} />)}</div>
              </section>
            )}

            {topAthletes && topAthletes.length > 0 && (
              <section>
                <h2 className="font-bold flex items-center gap-2 text-base mb-4"><Star size={16} className="text-yellow-400" />{t('availableAthletes')}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">{topAthletes.map((a, i) => <AthleteCard key={a.id} a={a} rank={i + 1} />)}</div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2 text-base"><Trophy size={16} className="text-yellow-400" />{t('rankingTitle')}</h2>
                <Link href="/ligas" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orange)] flex items-center gap-1 transition-colors">{t('rankingViewAll')} <ArrowRight size={11} /></Link>
              </div>
              <GlobalRankWidget entries={globalRank} currentUserId={loggedUser?.id ?? null} />
            </section>
          </div>

          <div className="space-y-4">
            {/* Próximas Provas */}
            <section>
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${next7Races.length > 0 ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-muted)]'}`} />
                {t('next7Days')}
              </h2>
              
              {next7Races.length > 0 ? (
                <div className="space-y-3">
                  {next7Races.map(r => <RaceCard key={r.id} race={r} t={t} />)}
                </div>
              ) : (
                <Link
                  href="/provas"
                  className="flex items-center justify-between w-full bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-xl px-4 py-3 text-sm text-[var(--color-muted)] hover:text-white transition-all"
                >
                  <span>{t('viewAllRaces') || 'Ver calendário de provas'}</span>
                  <ChevronRight size={14} />
                </Link>
              )}
            </section>

            {loggedUser && (
              <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-navy-border)]">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <ShoppingBag size={14} className="text-[var(--color-orange)]" />
                    {t('myRosterTitle')}
                  </span>
                  <div className="flex items-center gap-2">
                    <ShareRoster 
                      userName={globalRank.find(u => u.userId === loggedUser.id)?.name || 'Trixer'} 
                      portfolio={myPortfolio} 
                      netWorth={myNetWorth}
                      variant="compact"
                    />
                    <Link href="/elenco" className="text-xs text-[var(--color-muted)] hover:text-white transition-colors flex items-center gap-1 ml-1">
                      {t('myRosterViewAll')} <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
                {myPortfolio.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-[var(--color-muted)] mb-3">{t('myRosterEmpty')}</p>
                    <Link href="/atletas" className="text-xs font-bold text-[var(--color-orange)] hover:underline">{t('myRosterCta')}</Link>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-[var(--color-navy-border)]">
                      {myPortfolio.slice(0, 5).map((p, i) => {
                        const a = p.athlete
                        const change = Number(a?.current_price ?? 0) - Number(p.bought_price)
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--color-navy-elevated)] flex items-center justify-center text-[9px] font-black text-[var(--color-muted)] border border-white/5">
                              {a?.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" /> : (a?.name?.charAt(0) ?? '?')}
                            </div>
                            <p className="text-xs font-medium flex-1 truncate">{a?.name ?? '—'}</p>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold">T${Number(a?.current_price ?? 0)}</p>
                              <p className={`text-[9px] font-bold ${change > 0 ? 'text-[var(--color-success)]' : change < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}`}>
                                {change > 0 ? '+' : ''}{change.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="px-4 py-2.5 border-t border-[var(--color-navy-border)] flex items-center justify-between bg-[var(--color-navy-elevated)]/40">
                      <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">{t('myRosterNetWorth')}</span>
                      <span className="text-sm font-black text-[var(--color-orange)]">T${myNetWorth.toFixed(0)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-[var(--color-orange)]/10 to-[var(--color-purple)]/10 border border-[var(--color-orange)]/20 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-orange)]/10">
                <Trophy size={14} className="text-yellow-400" />
                <span className="font-bold text-sm flex-1">{t('leagueCta')}</span>
              </div>

              {/* League preview for logged-in users with leagues */}
              {loggedUser && myLeagues.length > 0 ? (
                <div className="divide-y divide-[var(--color-navy-border)]/60">
                  {myLeagues.map(l => (
                    <Link
                      key={l.id}
                      href={`/ligas/${l.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-navy-card)]/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{l.name}</p>
                        <p className="text-[10px] text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
                          {l.is_public
                            ? <><Globe size={9} /> {tLeagues('public')}</>
                            : <><Lock size={9} /> {tLeagues('private')}</>}
                          <span className="mx-1 opacity-40">·</span>
                          <Users size={9} /> {l.memberCount} {l.memberCount === 1 ? tLeagues('member') : tLeagues('memberPlural')}
                        </p>
                      </div>
                      <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : loggedUser ? (
                /* Logged in but no leagues yet */
                <div className="px-4 py-4 text-center">
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">{t('leagueCtaDesc')}</p>
                </div>
              ) : (
                /* Not logged in */
                <div className="px-4 py-4 text-center">
                  <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">{t('leagueCtaDesc')}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="px-4 py-3 border-t border-[var(--color-orange)]/10 space-y-2">
                {loggedUser ? (
                  <>
                    <Link href="/ligas" className="flex items-center justify-center gap-1.5 w-full text-center bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      <Trophy size={12} />{t('leagueCtaView')}
                    </Link>
                    <Link href="/ligas/criar" className="flex items-center justify-center gap-1.5 w-full text-center text-xs text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] py-2.5 rounded-lg transition-colors">
                      <Plus size={12} />{t('leagueCtaCreate')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="block w-full text-center bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-xs font-bold py-2.5 rounded-lg transition-colors">{t('leagueCtaButton')}</Link>
                    <Link href="/login" className="block w-full text-center text-xs text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] py-2.5 rounded-lg transition-colors">{t('leagueCtaLogin')}</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
