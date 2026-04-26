const CONFIG: Record<string, { label: string; className: string }> = {
  upcoming:    { label: 'Prevista',     className: 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]' },
  open:        { label: 'Aberta',       className: 'bg-green-900/40 text-green-400' },
  locked:      { label: 'Fechada',      className: 'bg-yellow-900/40 text-yellow-400' },
  finished:    { label: 'Finalizada',   className: 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]' },
  admin:       { label: 'Admin',        className: 'bg-[var(--color-orange)]/15 text-[var(--color-orange)]' },
  user:        { label: 'Jogador',      className: 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]' },
  open_ticket: { label: 'Aberto',       className: 'bg-red-900/30 text-red-400' },
  in_progress: { label: 'Em andamento', className: 'bg-yellow-900/30 text-yellow-400' },
  closed:      { label: 'Resolvido',    className: 'bg-green-900/30 text-green-400' },
}

export default function AdminBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, className: 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
