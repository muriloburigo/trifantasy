'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

const PAGE_SIZE = 10

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function GlobalRankWidget({
  entries,
  currentUserId,
}: {
  entries: { name: string; total: number; wallet?: number; portfolioValue?: number; userId: string; photoUrl: string | null }[]
  currentUserId?: string | null
}) {
  const t = useTranslations('home')
  const tL = useTranslations('leagues')
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const slice = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (entries.length === 0) {
    return (
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl py-14 text-center text-[var(--color-muted)]">
        <Trophy size={28} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">{t('rankingEmpty')}</p>
        <Link href="/register" className="text-xs text-[var(--color-orange)] mt-2 inline-block">{t('rankingEmptyCta')}</Link>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
      {slice.map((e, i) => {
        const globalPos = page * PAGE_SIZE + i
        const isMe = e.userId === currentUserId
        return (
          <div
            key={e.userId}
            className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0 ${
              isMe ? 'bg-[var(--color-orange-dim)]' : globalPos < 3 ? 'bg-[var(--color-navy-elevated)]/30' : ''
            }`}
          >
            <span className="w-7 text-center shrink-0">
              {globalPos === 0 ? '🥇' : globalPos === 1 ? '🥈' : globalPos === 2 ? '🥉'
                : <span className="text-sm text-[var(--color-muted)] font-bold">{globalPos + 1}</span>}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 overflow-hidden border border-white/5 ${
              globalPos < 3
                ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] text-white'
                : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
            }`}>
              {e.photoUrl ? (
                <img src={e.photoUrl} alt={e.name} className="w-full h-full object-cover" />
              ) : (
                initials(e.name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {e.name}
                {isMe && <span className="text-[var(--color-orange)] ml-1 text-[10px]">{tL('youLabel')}</span>}
              </p>
              {(e.wallet !== undefined && e.portfolioValue !== undefined) && (
                <p className="text-[10px] text-[var(--color-muted)]">
                  T${e.wallet.toFixed(0)} {tL('walletUnit')} · T${e.portfolioValue.toFixed(0)} {tL('portfolioUnit')}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-black tabular-nums ${globalPos < 3 ? 'text-[var(--color-orange)]' : ''}`}>
                T${Number(e.total).toFixed(0)}
              </p>
            </div>
          </div>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-navy-border)] bg-[var(--color-navy-elevated)]/40">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded text-[var(--color-muted)] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-[var(--color-muted)]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, entries.length)} {tL('paginationOf')} {entries.length}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1 rounded text-[var(--color-muted)] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
