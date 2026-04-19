'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, TrendingDown, Loader, Lock } from 'lucide-react'
import { buyAthlete, sellAthlete } from './actions'

export function BuyButton({
  athleteId, price, wallet, marketLocked,
}: {
  athleteId: string
  price: number
  wallet: number | null
  marketLocked?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  if (wallet === null) {
    return (
      <a href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-orange)]/10 text-[var(--color-orange)] hover:bg-[var(--color-orange)]/20 transition-colors">
        <ShoppingCart size={13} />Entrar para comprar
      </a>
    )
  }

  if (marketLocked) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-navy-elevated)] text-[var(--color-muted)] border border-[var(--color-navy-border)] opacity-50">
          <Lock size={11} />T${price}
        </span>
        <span className="text-[10px] text-yellow-500">Mercado fechado</span>
      </div>
    )
  }

  const canAfford = wallet >= price

  function handleBuy() {
    setMsg('')
    startTransition(async () => {
      const res = await buyAthlete(athleteId)
      if (res.error) { setMsg(res.error) }
      else { setMsg(`Comprado por T$${res.price}!`); router.refresh() }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleBuy}
        disabled={isPending || !canAfford}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
      >
        {isPending ? <Loader size={12} className="animate-spin" /> : <ShoppingCart size={12} />}
        Comprar T${price}
      </button>
      {msg && <span className={`text-[10px] ${msg.startsWith('Comprado') ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{msg}</span>}
      {!canAfford && !msg && <span className="text-[10px] text-[var(--color-muted)]">Saldo insuficiente</span>}
    </div>
  )
}

export function SellButton({
  athleteId, price, boughtPrice, marketLocked,
}: {
  athleteId: string
  price: number
  boughtPrice: number
  marketLocked?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  const pl = price - boughtPrice
  const isProfit = pl > 0

  function handleSell() {
    setMsg('')
    startTransition(async () => {
      const res = await sellAthlete(athleteId)
      if (res.error) { setMsg(res.error) }
      else { setMsg(`Vendido por T$${res.price}!`); router.refresh() }
    })
  }

  if (marketLocked) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-navy-elevated)] text-[var(--color-muted)] border border-[var(--color-navy-border)] opacity-50">
          <Lock size={11} />T${price}
        </span>
        <span className={`text-[10px] font-semibold ${isProfit ? 'text-[var(--color-success)]' : pl < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}`}>
          {isProfit ? '+' : ''}{pl.toFixed(0)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSell}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-navy-elevated)] hover:bg-[var(--color-danger)]/20 hover:text-[var(--color-danger)] border border-[var(--color-navy-border)] text-[var(--color-muted)] transition-colors disabled:opacity-40"
      >
        {isPending ? <Loader size={12} className="animate-spin" /> : <TrendingDown size={12} />}
        Vender T${price}
      </button>
      {msg
        ? <span className={`text-[10px] ${msg.startsWith('Vendido') ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{msg}</span>
        : <span className={`text-[10px] font-semibold ${isProfit ? 'text-[var(--color-success)]' : pl < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}`}>
            {isProfit ? '+' : ''}{pl.toFixed(0)} vs compra T${boughtPrice}
          </span>
      }
    </div>
  )
}
