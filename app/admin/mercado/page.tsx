import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default async function MercadoPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, type, gender, age_group, club, country, current_price, price_change')
    .order('current_price', { ascending: false })

  const pros = (athletes ?? []).filter(a => a.type === 'pro')
  const ags  = (athletes ?? []).filter(a => a.type === 'age_grouper')

  function Trend({ change }: { change: number | null }) {
    const c = Number(change ?? 0)
    if (c > 0) return (
      <span className="flex items-center gap-0.5 text-[var(--color-success)] text-xs font-bold">
        <TrendingUp size={11} />+{c.toFixed(1)}
      </span>
    )
    if (c < 0) return (
      <span className="flex items-center gap-0.5 text-[var(--color-danger)] text-xs font-bold">
        <TrendingDown size={11} />{c.toFixed(1)}
      </span>
    )
    return <span className="flex items-center gap-0.5 text-[var(--color-muted)] text-xs"><Minus size={11} />0</span>
  }

  function AthleteRow({ a }: { a: any }) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-navy-elevated)]/30 border-b border-[var(--color-navy-border)] last:border-0">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
          a.type === 'pro'
            ? 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]'
            : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
        }`}>
          {a.type === 'pro' ? 'PRO' : a.age_group ?? 'AG'}
        </span>
        <span className="text-sm flex-1 truncate">{a.name}</span>
        <span className="text-xs text-[var(--color-muted)] shrink-0">{a.gender} · {a.country}</span>
        <Trend change={a.price_change} />
        <span className="text-sm font-bold text-[var(--color-orange)] w-14 text-right shrink-0">
          T${Number(a.current_price).toFixed(1)}
        </span>
      </div>
    )
  }

  const rising  = (athletes ?? []).filter(a => Number(a.price_change) > 0).length
  const falling = (athletes ?? []).filter(a => Number(a.price_change) < 0).length
  const stable  = (athletes ?? []).filter(a => Number(a.price_change) === 0).length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Mercado Dinâmico</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        Preços atualizados automaticamente após cada prova finalizada.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{rising}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em alta ↑</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-danger)]">{falling}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em queda ↓</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-muted)]">{stable}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Estável —</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRO */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-navy-border)] text-sm font-semibold">
            Atletas PRO ({pros.length})
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {pros.map(a => <AthleteRow key={a.id} a={a} />)}
            {pros.length === 0 && (
              <p className="text-center py-8 text-sm text-[var(--color-muted)]">Nenhum atleta PRO cadastrado.</p>
            )}
          </div>
        </div>

        {/* AG */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-navy-border)] text-sm font-semibold">
            Age Groupers ({ags.length})
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {ags.map(a => <AthleteRow key={a.id} a={a} />)}
            {ags.length === 0 && (
              <p className="text-center py-8 text-sm text-[var(--color-muted)]">Nenhum age grouper cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-5 text-sm text-[var(--color-muted)] space-y-2">
        <p className="font-semibold text-[var(--color-text)]">Como funciona o Mercado Dinâmico</p>
        <p><span className="text-[var(--color-text)]">PRO:</span> 1º +4 · 2º-3º +3 · 4º-5º +2 · 6º-10º +1 · 11º-20º 0 · 21º+ −1 · DNF −2 · Segmento líder +1 · CR +2</p>
        <p><span className="text-[var(--color-text)]">AG:</span> 1º +3 · 2º-3º +2 · Top 25% +1 · Top 50% 0 · Abaixo 50% −1 · DNF −2 · Segmento AG +1 · Kona slot +2</p>
        <p>Preços entre T$1 e T$35. Propagados automaticamente para todas as provas abertas ou futuras.</p>
      </div>
    </div>
  )
}
