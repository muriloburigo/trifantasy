'use client'
import { useState } from 'react'
import { User, Mail, Tag, Clock } from 'lucide-react'

type StatusMap = Record<string, { label: string; color: string; icon: any }>

export default function TicketDetail({
  ticket,
  updateTicket,
  statusLabel,
}: {
  ticket: any
  updateTicket: (formData: FormData) => Promise<void>
  statusLabel: StatusMap
}) {
  const [note, setNote] = useState(ticket.admin_note ?? '')
  const [status, setStatus] = useState(ticket.status)

  return (
    <div className="w-96 shrink-0 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Assunto</p>
        <p className="font-bold text-base leading-snug">{ticket.subject}</p>
      </div>

      {/* Meta */}
      <div className="space-y-2 text-xs text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <User size={12} />
          <span>{ticket.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={12} />
          <a href={`mailto:${ticket.email}`} className="hover:text-[var(--color-orange)] transition-colors">{ticket.email}</a>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>{new Date(ticket.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Message */}
      <div>
        <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Mensagem</p>
        <div className="bg-[var(--color-navy-elevated)] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {ticket.message}
        </div>
      </div>

      {/* Update form */}
      <form action={updateTicket} className="space-y-4">
        <input type="hidden" name="id" value={ticket.id} />

        <div>
          <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Status</label>
          <select
            name="status"
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          >
            <option value="open">Aberto</option>
            <option value="in_progress">Em andamento</option>
            <option value="closed">Resolvido</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Nota interna</label>
          <textarea
            name="admin_note"
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Anotações internas sobre este ticket..."
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold rounded-lg py-2 text-sm transition-colors"
        >
          Salvar
        </button>
      </form>
    </div>
  )
}
