import Link from 'next/link'
import { createPublicClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'
import { MapPin, Calendar, Timer, ChevronRight } from 'lucide-react'
import PublicShell from './(public)/PublicShell'

export const revalidate = 3600

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Em breve',   color: 'text-[var(--color-muted)] border-[var(--color-navy-border)]' },
  open:     { label: 'Aberto',     color: 'text-[var(--color-success)] border-[var(--color-success)]/40' },
  locked:   { label: 'Encerrado',  color: 'text-yellow-400 border-yellow-400/40' },
  finished: { label: 'Finalizado', color: 'text-[var(--color-muted)] border-[var(--color-navy-border)]' },
}

function RaceCard({ race }: { race: Race }) {
  const days = daysUntil(race.date)
  const status = STATUS_LABEL[race.status]

  return (
    <Link
      href={`/provas/${race.slug}`}
      className="group bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-[var(--color-orange)]/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
            {race.distance === 'full' ? 'Full Triathlon' : 'Middle Distance'}
          </span>
          <h3 className="font-bold text-base mt-0.5 group-hover:text-[var(--color-orange)] transition-colors leading-tight">
            {race.name}
          </h3>
        </div>
        <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} />
          <span>{race.location}, {race.country}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} />
          <span>{formatDate(race.date)}</span>
          {days > 0 && days <= 90 && (
            <span className="text-xs text-[var(--color-orange)]">({days}d)</span>
          )}
        </div>
        {race.has_pro_field && (
          <div className="flex items-center gap-1.5">
            <Timer size={13} />
            <span>Com campo PRO</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-navy-border)]">
        <span className="text-xs text-[var(--color-muted)]">
          {race.status === 'open' ? 'Monte seu time' : 'Ver detalhes'}
        </span>
        <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-orange)] transition-colors" />
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const supabase = createPublicClient()
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('date', { ascending: true })

  const upcoming = (races ?? []).filter(r => r.status !== 'finished') as Race[]
  const finished = (races ?? []).filter(r => r.status === 'finished') as Race[]

  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-orange)] mb-4">
            Jogo de escalação do endurance
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Três modalidades.<br />
            Cinco escolhas.<br />
            <span className="bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)] bg-clip-text text-transparent">
              Uma Trix League.
            </span>
          </h1>
          <p className="text-[var(--color-muted)] text-lg max-w-lg mx-auto leading-relaxed">
            Escale atletas PRO e age-groupers reais. Pontue pelo desempenho deles nas provas. Dispute o Trix Rank com seus amigos.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
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

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { num: '01', title: 'Escolha uma prova', desc: 'Selecione qualquer evento do calendário de triathlon com atletas cadastrados.' },
            { num: '02', title: 'Monte seu time', desc: 'Escale 5 atletas com T$100. Misture PROs e age-groupers para equilibrar risco e retorno.' },
            { num: '03', title: 'Trix Score', desc: 'Cada atleta pontua pelo desempenho real — posição no AG, segmentos, Kona slots.' },
          ].map(step => (
            <div key={step.num} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
              <span className="text-3xl font-black text-[var(--color-orange)]/20">{step.num}</span>
              <h3 className="font-bold mt-2 mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--color-muted)]">{step.desc}</p>
            </div>
          ))}
        </div>

        {upcoming.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">Próximas Provas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(race => <RaceCard key={race.id} race={race} />)}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-muted)]">Provas Encerradas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {finished.map(race => <RaceCard key={race.id} race={race} />)}
            </div>
          </section>
        )}

        {upcoming.length === 0 && finished.length === 0 && (
          <div className="text-center py-24 text-[var(--color-muted)]">
            <p className="text-5xl mb-4">🏊</p>
            <p className="text-lg font-medium">Calendário sendo montado...</p>
          </div>
        )}
      </div>
    </PublicShell>
  )
}
