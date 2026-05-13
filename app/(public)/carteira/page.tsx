import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import { TrendingUp, TrendingDown, ShoppingCart, Tag, Wallet } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'

export const revalidate = 0

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}
function flag(country: string | null) { return COUNTRY_FLAGS[country ?? ''] ?? '' }

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function CarteiraPage() {
  const [t, locale] = await Promise.all([getTranslations('wallet'), getLocale()])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, txRes] = await Promise.all([
    supabase.from('profiles').select('wallet').eq('id', user.id).single(),
    supabase
      .from('market_transactions')
      .select('id, type, price, wallet_before, wallet_after, created_at, athlete:athletes(id, name, country, photo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const wallet = Number(profileRes.data?.wallet ?? 0)
  const transactions = txRes.data ?? []

  const totalBuys = transactions.filter(tx => tx.type === 'buy').reduce((s, tx) => s + Number(tx.price), 0)
  const totalSells = transactions.filter(tx => tx.type === 'sell').reduce((s, tx) => s + Number(tx.price), 0)
  const netTrades = totalSells - totalBuys

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <BackLink href="/elenco" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 text-[var(--color-muted)] text-[10px] sm:text-xs mb-1">
            <Wallet size={11} />{t('statWallet')}
          </div>
          <p className="text-lg sm:text-xl font-black text-[var(--color-orange)]">T${wallet.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 text-[var(--color-muted)] text-[10px] sm:text-xs mb-1">
            <ShoppingCart size={11} />{t('statBuys')}
          </div>
          <p className="text-lg sm:text-xl font-black text-[var(--color-danger)]">T${totalBuys.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 text-[var(--color-muted)] text-[10px] sm:text-xs mb-1">
            <Tag size={11} />{t('statSells')}
          </div>
          <p className="text-lg sm:text-xl font-black text-[var(--color-success)]">T${totalSells.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[var(--color-muted)] mb-1">{t('statNet')}</p>
          <p className={`text-lg sm:text-xl font-black ${netTrades > 0 ? 'text-[var(--color-success)]' : netTrades < 0 ? 'text-[var(--color-danger)]' : ''}`}>
            {netTrades > 0 ? '+' : ''}{netTrades.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
          <p className="text-4xl mb-4">💳</p>
          <p className="font-medium text-white">{t('emptyTitle')}</p>
          <p className="text-sm mt-1 mb-6">{t('emptyDesc')}</p>
          <Link
            href="/atletas"
            className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {t('emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[1fr_60px_70px_100px_110px] gap-2 px-4 py-2.5 border-b border-[var(--color-navy-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <span>{t('colAthlete')}</span>
                <span className="text-center">{t('colType')}</span>
                <span className="text-right">{t('colPrice')}</span>
                <span className="text-right">{t('colWallet')}</span>
                <span className="text-right">{t('colDate')}</span>
              </div>

              {transactions.map((tx) => {
                const ath = tx.athlete as any
                const isBuy = tx.type === 'buy'
                const walletAfter = Number(tx.wallet_after)
                const walletDelta = walletAfter - Number(tx.wallet_before)

                return (
                  <div key={tx.id} className="grid grid-cols-[1fr_60px_70px_100px_110px] gap-2 items-center px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0">
                    {/* Athlete */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ath?.photo_url ? (
                        <img src={ath.photo_url} alt={ath.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C] flex items-center justify-center text-[10px] font-black text-white shrink-0">
                          {ath?.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/atletas/${ath?.id}`} className="text-xs sm:text-sm font-semibold truncate hover:text-[var(--color-orange)] transition-colors block leading-tight">
                          {ath?.name}
                          {ath?.country && <span className="ml-1 text-[10px]">{flag(ath.country)}</span>}
                        </Link>
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="flex justify-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isBuy ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]' : 'bg-[var(--color-success)]/15 text-[var(--color-success)]'}`}>
                        {isBuy ? t('typeBuy') : t('typeSell')}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-semibold tabular-nums">T${Number(tx.price).toFixed(0)}</span>
                    </div>

                    {/* Wallet change */}
                    <div className="text-right flex items-center justify-end gap-1">
                      {isBuy
                        ? <TrendingDown size={11} className="text-[var(--color-danger)] shrink-0" />
                        : <TrendingUp size={11} className="text-[var(--color-success)] shrink-0" />
                      }
                      <div>
                        <span className={`text-xs font-bold tabular-nums ${isBuy ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                          {walletDelta > 0 ? '+' : ''}{walletDelta.toFixed(0)}
                        </span>
                        <span className="block text-[9px] text-[var(--color-muted)] tabular-nums">→ T${walletAfter.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--color-muted)] tabular-nums">{formatDate(tx.created_at, locale)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--color-muted)] text-center">{t('totalTransactions', { n: transactions.length })}</p>
    </div>
  )
}
