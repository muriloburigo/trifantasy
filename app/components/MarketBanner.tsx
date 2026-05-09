import { Lock, Unlock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function MarketBanner({
  locked, reasonKey, lockRace,
}: {
  locked: boolean
  reasonKey?: 'ongoing' | 'closingSoon' | 'admin'
  lockRace?: { name: string; date: string }
}) {
  const t = await getTranslations('marketBanner')

  if (!locked) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-success)] bg-green-950/20 border border-green-900/40 rounded-lg px-3 py-2 mb-6">
        <Unlock size={12} />
        <span>{t('openFull')}</span>
      </div>
    )
  }

  const reasonText = reasonKey === 'ongoing'
    ? t('ongoingRace', { race: lockRace?.name ?? '' })
    : reasonKey === 'admin'
      ? t('adminClosed')
      : t('closingSoonDesc', { race: lockRace?.name ?? '' })

  return (
    <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-950/20 border border-yellow-900/40 rounded-lg px-3 py-2 mb-6">
      <Lock size={12} className="shrink-0" />
      <span>
        <strong>{t('locked')}.</strong>{' '}
        {reasonText}
        {lockRace && reasonKey !== 'admin' && (
          <span className="text-[var(--color-muted)] ml-1">— {t('reopens')}</span>
        )}
      </span>
    </div>
  )
}
