import Link from 'next/link'

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-[var(--color-orange)]',
  href,
  delta,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color?: string
  href?: string
  delta?: string
  sub?: string
}) {
  const inner = (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-5 hover:border-[var(--color-orange)]/40 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--color-muted)] font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-[var(--color-navy-elevated)] flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <p className="text-2xl font-black">{value}</p>
      {(delta || sub) && (
        <p className="text-[11px] text-[var(--color-muted)] mt-1">{delta ?? sub}</p>
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
