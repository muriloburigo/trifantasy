import Link from 'next/link'
import { createPublicClient } from '~/lib/supabase/server'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import BackLink from '~/app/components/BackLink'

export const revalidate = 600

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}

function flag(country: string | null) {
  return COUNTRY_FLAGS[country ?? ''] ?? '🌍'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function Trend({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-[var(--color-success)] text-xs font-bold"><TrendingUp size={11} />+{change.toFixed(1)}</span>
  if (change < 0) return <span className="flex items-center gap-0.5 text-[var(--color-danger)] text-xs font-bold"><TrendingDown size={11} />{change.toFixed(1)}</span>
  return <span className="flex items-center gap-0.5 text-[var(--color-muted)] text-xs"><Minus size={11} />0</span>
}

function AthleteRow({ a }: { a: any }) {
  const isPro = a.type === 'pro'
  return (
    <Link href={`/atletas/${a.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0 hover:bg-[var(--color-navy-elevated)]/30 transition-colors">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-white ${
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

      {/* Badge */}
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
        isPro
          ? 'bg-[var(--color-orange)]/15 text-[var(--color-orange)]'
          : 'bg-[var(--color-purple)]/15 text-[var(--color-purple)]'
      }`}>
        {isPro ? 'PRO' : a.age_group ?? 'AG'}
      </span>

      {/* Name + country */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{a.name}</p>
        <p className="text-[11px] text-[var(--color-muted)]">{flag(a.country)} {a.country}</p>
      </div>

      {/* PTO rank */}
      {a.pto_rank && (
        <span className="text-[11px] text-[var(--color-muted)] shrink-0 hidden sm:block">#{a.pto_rank} PTO</span>
      )}

      {/* Trend */}
      <div className="shrink-0 w-14 flex justify-end">
        <Trend change={Number(a.price_change ?? 0)} />
      </div>

      {/* Price */}
      <span className="text-sm font-black text-[var(--color-orange)] w-14 text-right shrink-0">
        T${Number(a.current_price).toFixed(0)}
      </span>
    </Link>
  )
}

export default async function AtletasPage() {
  const pub = createPublicClient()

  const { data: athletes } = await pub
    .from('athletes')
    .select('id, name, type, gender, age_group, country, current_price, price_change, photo_url, pto_rank')
    .order('current_price', { ascending: false })

  const pros = (athletes ?? []).filter(a => a.type === 'pro')
  const ags  = (athletes ?? []).filter(a => a.type === 'age_grouper')

  const rising  = [...(athletes ?? [])].filter(a => Number(a.price_change) > 0).sort((a, b) => Number(b.price_change) - Number(a.price_change))
  const falling = [...(athletes ?? [])].filter(a => Number(a.price_change) < 0).sort((a, b) => Number(a.price_change) - Number(b.price_change))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <BackLink href="/" label="Home" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mercado de Atletas</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {pros.length} PROs · {ags.length} Age Groupers · preços em Trix Coin (T$)
        </p>
      </div>

      {/* Market summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{rising.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em alta ↑</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-danger)]">{falling.length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em queda ↓</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black">{(athletes ?? []).length}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PROs */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center justify-between">
            <span className="text-sm font-bold">Atletas PRO</span>
            <span className="text-xs text-[var(--color-muted)]">{pros.length} atletas</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {pros.map(a => <AthleteRow key={a.id} a={a} />)}
          </div>
        </div>

        {/* AGs */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center justify-between">
            <span className="text-sm font-bold">Age Groupers</span>
            <span className="text-xs text-[var(--color-muted)]">{ags.length} atletas</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {ags.length > 0
              ? ags.map(a => <AthleteRow key={a.id} a={a} />)
              : <p className="text-center py-10 text-sm text-[var(--color-muted)]">Nenhum age grouper cadastrado.</p>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
