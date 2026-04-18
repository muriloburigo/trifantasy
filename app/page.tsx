import Link from 'next/link'
import { createPublicClient, createAdminClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'
import {
  TrendingUp, TrendingDown, Trophy, MapPin, Calendar,
  ChevronRight, Zap, Users, ArrowRight,
} from 'lucide-react'
import PublicShell from './(public)/PublicShell'

export const revalidate = 900 // 15 min

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function fmtPrice(n: number | null) {
  return `T$${Number(n ?? 0).toFixed(1)}`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MarketCard({ athlete, dir }: { athlete: any; dir: 'up' | 'down' }) {
  const change = Number(athlete.price_change ?? 0)
  const isUp = dir === 'up'
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-navy-border)] last:border-0">
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
        athlete.type === 'pro'
          ? 'bg-[var(--color-orange)]/15 text-[var(--color-orange)]'
          : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
      }`}>
        {athlete.type === 'pro' ? 'PRO' : athlete.age_group ?? 'AG'}
      </span>
      <span className="text-sm flex-1 truncate font-medium">{athlete.name}</span>
      <span className={`text-xs font-bold shrink-0 flex items-center gap-0.5 ${
        isUp ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
      }`}>
        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {isUp ? '+' : ''}{change.toFixed(1)}
      </span>
      <span className="text-sm font-bold text-[var(--color-orange)] w-12 text-right shrink-0">
        {fmtPrice(athlete.current_price)}
      </span>
    </div>
  )
}

function RankRow({ entry, pos }: { entry: any; pos: number }) {
  const name = entry.teams?.profiles?.name ?? 'Trixter'
  const race  = entry.teams?.races?.name ?? ''
  const pts   = Number(entry.total_points ?? 0)
  const top3  = pos <= 3
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-navy-border)] last:border-0 ${
      top3 ? 'bg-[var(--color-navy-elevated)]/40' : ''
    }`}>
      <span className={`text-sm font-black w-6 text-center shrink-0 ${
        pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-slate-300' : pos === 3 ? 'text-amber-600' : 'text-[var(--color-muted)]'
      }`}>
        {pos}
      </span>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        top3
          ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] text-white'
          : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
      }`}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-[var(--color-muted)] truncate">{race}</p>
      </div>
      <span className={`text-sm font-black shrink-0 tabular-nums ${top3 ? 'text-[var(--color-orange)]' : ''}`}>
        {pts} <span className="text-xs font-normal text-[var(--color-muted)]">pts</span>
      </span>
    </div>
  )
}

function RaceChip({ race }: { race: Race }) {
  const days = daysUntil(race.date)
  return (
    <Link
      href={`/provas/${race.slug}`}
      className="group bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 hover:border-[var(--color-orange)] rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-[var(--color-orange)]/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
            {race.distance === 'full' ? 'Full Triathlon' : 'Middle Distance'}
          </span>
          <h3 className="font-bold text-base mt-0.5 leading-tight group-hover:text-[var(--color-orange)] transition-colors">
            {race.name}
          </h3>
        </div>
        <span className="text-xs border rounded-full px-2 py-0.5 shrink-0 text-[var(--color-success)] border-[var(--color-success)]/40">
          Aberto
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
        <span className="flex items-center gap-1"><MapPin size={12} />{race.location}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(race.date)}</span>
        {days > 0 && <span className="text-[var(--color-orange)] text-xs font-semibold">{days}d restantes</span>}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-navy-border)]">
        <span className="text-xs font-semibold text-[var(--color-orange)]">Monte seu time →</span>
        <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-orange)] transition-colors" />
      </div>
    </Link>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const pub   = createPublicClient()
  const admin = createAdminClient()

  const [
    { data: athletesRaw },
    { count: athleteCount },
    { data: topScores },
    { data: races },
    { count: leagueCount },
    { count: teamCount },
  ] = await Promise.all([
    pub
      .from('athletes')
      .select('id, name, type, gender, age_group, country, current_price, price_change')
      .not('price_change', 'eq', 0),

    pub.from('athletes').select('*', { count: 'exact', head: true }),

    admin
      .from('scores')
      .select('total_points, teams(user_id, races(name), profiles(name, country))')
      .order('total_points', { ascending: false })
      .limit(10),

    pub
      .from('races')
      .select('*')
      .in('status', ['open', 'upcoming'])
      .order('date', { ascending: true })
      .limit(20),

    admin.from('leagues').select('*', { count: 'exact', head: true }),
    admin.from('teams').select('*', { count: 'exact', head: true }),
  ])

  const athletes = athletesRaw ?? []
  const rising  = [...athletes].filter(a => Number(a.price_change) > 0)
    .sort((a, b) => Number(b.price_change) - Number(a.price_change)).slice(0, 6)
  const falling = [...athletes].filter(a => Number(a.price_change) < 0)
    .sort((a, b) => Number(a.price_change) - Number(b.price_change)).slice(0, 6)

  const openRaces  = (races ?? []).filter(r => r.status === 'open') as Race[]
  const nextRaces  = (races ?? []).filter(r => r.status === 'upcoming').slice(0, 3) as Race[]

  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-orange)] mb-3">
            Jogo de escalação do endurance
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Três modalidades.<br />
            Cinco escolhas.<br />
            <span className="bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)] bg-clip-text text-transparent">
              Uma Trix League.
            </span>
          </h1>
          <p className="text-[var(--color-muted)] text-base max-w-md mx-auto leading-relaxed mb-7">
            Escale atletas PRO e age-groupers reais. Pontue pelo desempenho deles nas provas. Dispute o Trix Rank com seus amigos.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Entrar no jogo — grátis
            </Link>
            <Link href="/regras" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">
              Como funciona →
            </Link>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Trix Leagues', value: leagueCount ?? 0, icon: Trophy },
            { label: 'Times montados', value: teamCount ?? 0, icon: Users },
            { label: 'Atletas no mercado', value: athleteCount ?? 0, icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
              <Icon size={16} className="mx-auto mb-1.5 text-[var(--color-orange)] opacity-70" />
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Mercado + Trix Rank ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">

          {/* Mercado — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Zap size={15} className="text-[var(--color-orange)]" />
                Mercado de Atletas
              </h2>
              <span className="text-xs text-[var(--color-muted)]">Trix Coin (T$)</span>
            </div>

            {/* Maiores altas */}
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--color-navy-border)] flex items-center gap-2">
                <TrendingUp size={13} className="text-[var(--color-success)]" />
                <span className="text-xs font-semibold text-[var(--color-success)]">Maiores altas</span>
              </div>
              {rising.length > 0
                ? rising.map(a => <MarketCard key={a.id} athlete={a} dir="up" />)
                : <p className="text-xs text-[var(--color-muted)] text-center py-6">Nenhuma variação ainda</p>
              }
            </div>

            {/* Maiores baixas */}
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--color-navy-border)] flex items-center gap-2">
                <TrendingDown size={13} className="text-[var(--color-danger)]" />
                <span className="text-xs font-semibold text-[var(--color-danger)]">Maiores baixas</span>
              </div>
              {falling.length > 0
                ? falling.map(a => <MarketCard key={a.id} athlete={a} dir="down" />)
                : <p className="text-xs text-[var(--color-muted)] text-center py-6">Nenhuma variação ainda</p>
              }
            </div>
          </div>

          {/* Trix Rank Global — 3/5 */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Trophy size={15} className="text-[var(--color-orange)]" />
                Trix Rank Global
              </h2>
              <Link href="/ligas" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orange)] transition-colors flex items-center gap-1">
                Ver ligas <ArrowRight size={11} />
              </Link>
            </div>
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
              {(topScores ?? []).length > 0
                ? (topScores ?? []).map((entry, i) => (
                    <RankRow key={i} entry={entry} pos={i + 1} />
                  ))
                : (
                  <div className="text-center py-12 text-[var(--color-muted)]">
                    <Trophy size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Ainda sem pontuações. Seja o primeiro!</p>
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {/* ── Provas abertas ── */}
        {openRaces.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse inline-block" />
                Provas abertas para escalação
              </h2>
              <Link href="/provas" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orange)] transition-colors flex items-center gap-1">
                Ver calendário <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openRaces.map(race => <RaceChip key={race.id} race={race} />)}
            </div>
          </section>
        )}

        {/* ── Próximas provas (se não há abertas) ── */}
        {openRaces.length === 0 && nextRaces.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Próximas provas</h2>
              <Link href="/provas" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orange)] transition-colors flex items-center gap-1">
                Ver todas <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nextRaces.map(race => (
                <Link
                  key={race.id}
                  href={`/provas/${race.slug}`}
                  className="group bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-2xl p-4 transition-all"
                >
                  <p className="text-xs text-[var(--color-orange)] font-semibold uppercase tracking-wider mb-1">
                    {race.distance === 'full' ? 'Full' : '70.3'}
                  </p>
                  <p className="font-bold text-sm leading-tight mb-2 group-hover:text-[var(--color-orange)] transition-colors">
                    {race.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{formatDate(race.date)} · {race.location}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA Trix League ── */}
        <div className="bg-gradient-to-r from-[var(--color-orange)]/10 to-[var(--color-purple)]/10 border border-[var(--color-orange)]/20 rounded-2xl p-8 text-center">
          <Trophy size={32} className="mx-auto mb-3 text-[var(--color-orange)] opacity-80" />
          <h2 className="text-xl font-bold mb-2">Crie sua Trix League</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto mb-6">
            Convide seus amigos, montem times e disputem quem conhece melhor o pelotão do triathlon.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] px-6 py-2.5 rounded-xl transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

      </div>
    </PublicShell>
  )
}
