import Link from 'next/link'
import { createPublicClient, createAdminClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'
import {
  TrendingUp, TrendingDown, Trophy, MapPin, Calendar,
  Users, ChevronRight, Zap, ArrowRight, Star, Lock,
} from 'lucide-react'
import PublicShell from './(public)/PublicShell'

export const revalidate = 600

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
  const isPro = a.type === 'pro'
  const price = Number(a.current_price ?? 0)

  return (
    <div className="relative flex-shrink-0 w-[130px] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-[var(--color-orange)]/50 transition-all cursor-default select-none">
      {/* Type badge */}
      <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
        isPro
          ? 'bg-[var(--color-orange)]/15 text-[var(--color-orange)]'
          : 'bg-[var(--color-purple)]/15 text-[var(--color-purple)]'
      }`}>
        {isPro ? 'PRO' : a.age_group ?? 'AG'}
      </span>

      {/* Rank badge */}
      {rank && (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-black text-[var(--color-muted)]">
          #{rank}
        </span>
      )}

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-base font-black text-white mt-2 shrink-0 ${
        !a.photo_url
          ? isPro
            ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]'
            : 'bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C]'
          : ''
      }`}>
        {a.photo_url
          ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
          : initials(a.name)
        }
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-center leading-tight line-clamp-2 w-full">
        {a.name}
      </p>

      {/* Country */}
      <p className="text-[11px] text-[var(--color-muted)]">{flag(a.country)} {a.country?.split(' ')[0]}</p>

      {/* Price + trend */}
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
    </div>
  )
}

// ─── race card (sidebar) ──────────────────────────────────────────────────────

function RaceCard({ race, athleteCount }: { race: Race; athleteCount?: number }) {
  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'
  return (
    <Link
      href={`/provas/${race.slug}`}
      className="group block bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/60 rounded-2xl p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isOpen ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}`}>
            {race.distance === 'full' ? 'Full · ' : '70.3 · '}{isOpen ? '● Aberto' : 'Em breve'}
          </span>
          <h3 className="font-bold text-sm mt-0.5 leading-tight group-hover:text-[var(--color-orange)] transition-colors line-clamp-2">
            {race.name}
          </h3>
        </div>
      </div>
      <div className="space-y-1 text-xs text-[var(--color-muted)] mb-3">
        <div className="flex items-center gap-1.5"><MapPin size={11} />{race.location}, {race.country}</div>
        <div className="flex items-center gap-1.5">
          <Calendar size={11} />{formatDate(race.date)}
          {days > 0 && days <= 30 && <span className="text-[var(--color-orange)] font-semibold ml-1">{days}d</span>}
        </div>
        {athleteCount && <div className="flex items-center gap-1.5"><Users size={11} />{athleteCount} atletas disponíveis</div>}
      </div>
      <div className={`w-full text-center text-xs font-semibold py-2 rounded-lg transition-colors ${
        isOpen
          ? 'bg-[var(--color-orange)]/10 text-[var(--color-orange)] group-hover:bg-[var(--color-orange)]/20'
          : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
      }`}>
        {isOpen ? 'Monte seu time →' : 'Ver detalhes →'}
      </div>
    </Link>
  )
}

// ─── rank row ─────────────────────────────────────────────────────────────────

function RankRow({ entry, pos }: { entry: any; pos: number }) {
  const name: string = entry.teams?.profiles?.name ?? 'Trixter'
  const race: string = entry.teams?.races?.name ?? '—'
  const pts = Number(entry.total_points ?? 0)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0 ${pos <= 3 ? 'bg-[var(--color-navy-elevated)]/30' : ''}`}>
      <span className="w-7 text-center shrink-0 text-base">
        {pos <= 3 ? medals[pos - 1] : <span className="text-sm text-[var(--color-muted)] font-bold">{pos}</span>}
      </span>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
        pos <= 3
          ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] text-white'
          : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
      }`}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-[11px] text-[var(--color-muted)] truncate">{race}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-black tabular-nums ${pos <= 3 ? 'text-[var(--color-orange)]' : ''}`}>{pts}</p>
        <p className="text-[10px] text-[var(--color-muted)]">pts</p>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const pub   = createPublicClient()
  const admin = createAdminClient()

  const [
    { data: risingRaw },
    { data: fallingRaw },
    { data: topAthletesRaw },
    { data: topScores },
    { data: races },
    { count: leagueCount },
    { count: trixerCount },
    { count: athleteCount },
  ] = await Promise.all([
    // Market: rising
    pub.from('athletes')
      .select('id, name, type, gender, age_group, country, current_price, price_change, photo_url')
      .gt('price_change', 0)
      .order('price_change', { ascending: false })
      .limit(12),

    // Market: falling
    pub.from('athletes')
      .select('id, name, type, gender, age_group, country, current_price, price_change, photo_url')
      .lt('price_change', 0)
      .order('price_change', { ascending: true })
      .limit(12),

    // Top athletes by price (all, for featured section)
    pub.from('athletes')
      .select('id, name, type, gender, age_group, country, current_price, price_change, photo_url')
      .eq('type', 'pro')
      .order('current_price', { ascending: false })
      .limit(16),

    // Trix Rank
    admin.from('scores')
      .select('total_points, teams(user_id, races(name), profiles(name, country))')
      .order('total_points', { ascending: false })
      .limit(10),

    // Races (enough to count beyond 7-day window)
    pub.from('races')
      .select('*')
      .in('status', ['open', 'upcoming'])
      .order('date', { ascending: true })
      .limit(30),

    admin.from('leagues').select('*', { count: 'exact', head: true }),
    pub.from('profiles').select('*', { count: 'exact', head: true }),
    pub.from('athletes').select('*', { count: 'exact', head: true }),
  ])

  const rising  = risingRaw ?? []
  const falling = fallingRaw ?? []

  const today = new Date()
  const in7   = new Date(today); in7.setDate(today.getDate() + 7)

  const allActive = (races ?? []).filter(r => r.status === 'open' || r.status === 'upcoming') as Race[]
  const openRaces     = allActive.filter(r => r.status === 'open')
  const next7Races    = allActive.filter(r => new Date(r.date) <= in7)
  const remainingCount = allActive.length - next7Races.length

  const featuredAthletes = (topAthletesRaw ?? []).slice(0, 12)

  const hasMarket = rising.length > 0 || falling.length > 0

  return (
    <PublicShell>

      {/* ── Hero ── */}
      <div className="border-b border-[var(--color-navy-border)] bg-gradient-to-b from-[var(--color-navy-card)] to-[var(--color-navy)]">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-8">
          {/* Left */}
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-orange)] mb-3">
              Jogo de escalação do endurance
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              Três modalidades.<br />
              Cinco escolhas.<br />
              <span className="bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)] bg-clip-text text-transparent">
                Uma Trix League.
              </span>
            </h1>
            <p className="text-[var(--color-muted)] text-sm max-w-md leading-relaxed mb-6">
              Escale atletas PRO e age-groupers reais. Pontue pelo desempenho na prova. Dispute a Trix League.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/register" className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Entrar no jogo — grátis
              </Link>
              <Link href="/regras" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors flex items-center gap-1">
                Como funciona <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Right: stats */}
          <div className="grid grid-cols-3 gap-3 md:w-64 w-full">
            {[
              { label: 'Atletas', value: athleteCount ?? 0, icon: Zap,    color: 'text-[var(--color-orange)]', href: '/atletas' },
              { label: 'Trixers', value: trixerCount ?? 0,  icon: Users,  color: 'text-[var(--color-purple)]', href: '/rank' },
              { label: 'Ligas',   value: leagueCount ?? 0,  icon: Trophy, color: 'text-yellow-400',            href: '/ligas' },
            ].map(({ label, value, icon: Icon, color, href }) => (
              <Link key={label} href={href}
                className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-xl p-3 text-center transition-all hover:bg-[var(--color-navy-card)] group">
                <Icon size={14} className={`mx-auto mb-1 ${color}`} />
                <p className="text-xl font-black group-hover:text-[var(--color-orange)] transition-colors">{value}</p>
                <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* ── Provas abertas (banner) ── */}
        {next7Races.length > 0 && (
          <div className="bg-[var(--color-success)]/5 border border-[var(--color-success)]/25 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-sm font-bold text-[var(--color-success)]">
                {openRaces.length > 0
                  ? `${openRaces.length} ${openRaces.length === 1 ? 'prova aberta' : 'provas abertas'} para escalação`
                  : `${next7Races.length} ${next7Races.length === 1 ? 'prova' : 'provas'} nos próximos 7 dias`
                }
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {next7Races.map(r => (
                <Link key={r.id} href={`/provas/${r.slug}`}
                  className="text-xs bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  {r.name}
                </Link>
              ))}
            </div>
            {remainingCount > 0 && (
              <Link href="/provas" className="text-xs text-[var(--color-muted)] hover:text-white ml-auto shrink-0 flex items-center gap-1">
                +{remainingCount} mais <ChevronRight size={12} />
              </Link>
            )}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left + center (2/3) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Mercado: rising */}
            {rising.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2 text-base">
                    <TrendingUp size={16} className="text-[var(--color-success)]" />
                    Em alta no mercado
                  </h2>
                  <span className="text-xs text-[var(--color-muted)]">Trix Coin (T$)</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {rising.map(a => <AthleteCard key={a.id} a={a} />)}
                </div>
              </section>
            )}

            {/* Mercado: falling */}
            {falling.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2 text-base">
                    <TrendingDown size={16} className="text-[var(--color-danger)]" />
                    Em queda no mercado
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {falling.map(a => <AthleteCard key={a.id} a={a} />)}
                </div>
              </section>
            )}

            {/* Atletas em destaque (open races) */}
            {featuredAthletes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2 text-base">
                    <Star size={16} className="text-yellow-400" />
                    Atletas disponíveis
                    <span className="text-xs text-[var(--color-muted)] font-normal">provas abertas</span>
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {featuredAthletes.map((a: any, i: number) => <AthleteCard key={a.id} a={a} rank={i + 1} />)}
                </div>
              </section>
            )}

            {/* Se não há mercado nem atletas ainda */}
            {!hasMarket && featuredAthletes.length === 0 && (
              <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-10 text-center text-[var(--color-muted)]">
                <Zap size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Mercado sendo montado...</p>
                <p className="text-sm mt-1">Atletas aparecerão aqui assim que as provas forem configuradas.</p>
              </div>
            )}

            {/* Trix Rank Global */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2 text-base">
                  <Trophy size={16} className="text-yellow-400" />
                  Trix Rank Global
                </h2>
                <Link href="/ligas" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-orange)] flex items-center gap-1 transition-colors">
                  Ver ligas <ArrowRight size={11} />
                </Link>
              </div>
              <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
                {(topScores ?? []).length > 0 ? (
                  (topScores ?? []).map((e, i) => <RankRow key={i} entry={e} pos={i + 1} />)
                ) : (
                  <div className="py-14 text-center text-[var(--color-muted)]">
                    <Trophy size={28} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma pontuação ainda.</p>
                    <Link href="/register" className="text-xs text-[var(--color-orange)] mt-2 inline-block">Seja o primeiro →</Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="space-y-4">

            {/* Races: next 7 days */}
            {next7Races.length > 0 && (
              <section>
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Próximos 7 dias
                </h2>
                <div className="space-y-3">
                  {next7Races.map(r => <RaceCard key={r.id} race={r} />)}
                </div>
              </section>
            )}

            {/* Ver mais */}
            {remainingCount > 0 && (
              <Link
                href="/provas"
                className="flex items-center justify-between w-full bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/40 rounded-xl px-4 py-3 text-sm text-[var(--color-muted)] hover:text-white transition-all"
              >
                <span>Ver mais {remainingCount} {remainingCount === 1 ? 'prova' : 'provas'}</span>
                <ChevronRight size={14} />
              </Link>
            )}

            {/* Liga CTA */}
            <div className="bg-gradient-to-br from-[var(--color-orange)]/10 to-[var(--color-purple)]/10 border border-[var(--color-orange)]/20 rounded-2xl p-5 text-center">
              <Trophy size={24} className="mx-auto mb-2 text-yellow-400 opacity-80" />
              <h3 className="font-bold text-sm mb-1">Crie sua Trix League</h3>
              <p className="text-[11px] text-[var(--color-muted)] mb-4 leading-relaxed">
                Convide amigos, montem times e disputem quem conhece melhor o pelotão.
              </p>
              <Link href="/register"
                className="block w-full text-center bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-xs font-bold py-2.5 rounded-lg transition-colors mb-2">
                Criar conta grátis
              </Link>
              <Link href="/login" className="block w-full text-center text-xs text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] py-2.5 rounded-lg transition-colors">
                Já tenho conta
              </Link>
            </div>

            {/* Invite code */}
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={13} className="text-[var(--color-muted)]" />
                <h3 className="text-sm font-semibold">Tem um código de convite?</h3>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mb-3">Entre em uma liga privada com o código enviado por um amigo.</p>
              <Link href="/register" className="text-xs text-[var(--color-orange)] hover:underline">
                Criar conta para entrar →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
