import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BuyButton, SellButton } from '~/app/(public)/elenco/TradeButton'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}
function flag(c: string | null) { return COUNTRY_FLAGS[c ?? ''] ?? '' }
function initials(name: string) { return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() }

function Trend({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-[var(--color-success)] text-xs font-bold"><TrendingUp size={11} />+{change.toFixed(1)}</span>
  if (change < 0) return <span className="flex items-center gap-0.5 text-[var(--color-danger)] text-xs font-bold"><TrendingDown size={11} />{change.toFixed(1)}</span>
  return <span className="flex items-center gap-0.5 text-[var(--color-muted)] text-xs"><Minus size={11} />0</span>
}

export default function AthleteRow({
  a, owned, boughtPrice, wallet, rosterCount, marketLocked,
}: {
  a: any
  owned: boolean
  boughtPrice: number | null
  wallet: number | null
  rosterCount: number
  marketLocked?: boolean
}) {
  const price = Number(a.current_price)

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0 hover:bg-[var(--color-navy-elevated)]/20 transition-colors">
      {/* Avatar — clickable */}
      <Link href={`/atletas/${a.id}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-black text-white ${
          !a.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''
        }`}>
          {a.photo_url
            ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
            : initials(a.name)
          }
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
             <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0 bg-[var(--color-orange)]/15 text-[var(--color-orange)] uppercase">
              PRO
            </span>
            <p className="text-xs sm:text-sm font-semibold truncate">{a.name}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
            <span>{flag(a.country)} {a.country?.split(' ')[0]}</span>
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
              <span className="bg-white/5 px-1 rounded uppercase tracking-tighter">
                PTO {a.pto_rank ? `#${a.pto_rank}` : '—'}
              </span>
              <span className="bg-blue-900/20 text-blue-400 px-1 rounded uppercase tracking-tighter">
                WTCS {a.wtcs_rank ? `#${a.wtcs_rank}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Trend + price */}
      <div className="flex flex-col items-end shrink-0 w-12 sm:w-14">
        <span className="text-xs sm:text-sm font-black text-[var(--color-orange)]">T${price}</span>
        <Trend change={Number(a.price_change ?? 0)} />
      </div>

      {/* Buy / Sell / Owned badge */}
      <div className="shrink-0 w-[100px] sm:w-[130px] flex justify-end">
        {owned ? (
          <SellButton athleteId={a.id} price={price} boughtPrice={boughtPrice!} marketLocked={marketLocked} />
        ) : (
          <BuyButton athleteId={a.id} price={price} wallet={wallet} rosterCount={rosterCount} marketLocked={marketLocked} />
        )}
      </div>
    </div>
  )
}
