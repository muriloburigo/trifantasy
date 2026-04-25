import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import { MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import TicketDetail from './TicketDetail'

export const revalidate = 0

async function updateTicket(formData: FormData) {
  'use server'
  await requireAdmin()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const admin_note = formData.get('admin_note') as string
  const admin = createAdminClient()
  await admin.from('support_tickets').update({ status, admin_note, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/suporte')
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open:        { label: 'Aberto',      color: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30', icon: AlertCircle },
  in_progress: { label: 'Em andamento', color: 'text-blue-400 bg-blue-900/20 border-blue-800/30',     icon: Clock },
  closed:      { label: 'Resolvido',   color: 'text-green-400 bg-green-900/20 border-green-800/30',   icon: CheckCircle2 },
}

export default async function AdminSuportePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin()
  const admin = createAdminClient()
  const { id: selectedId } = await searchParams

  const { data: tickets } = await admin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const all = tickets ?? []
  const openCount = all.filter(t => t.status === 'open').length
  const inProgressCount = all.filter(t => t.status === 'in_progress').length
  const closedCount = all.filter(t => t.status === 'closed').length

  const selected = selectedId ? all.find(t => t.id === selectedId) : null

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <MessageCircle size={22} className="text-[var(--color-orange)]" />
          Suporte
        </h1>
        <p className="text-[var(--color-muted)] text-sm">Mensagens enviadas pelos usuários.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Abertos',       value: openCount,       color: 'text-yellow-400' },
          { label: 'Em andamento',  value: inProgressCount, color: 'text-blue-400' },
          { label: 'Resolvidos',    value: closedCount,     color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        {/* Ticket list */}
        <div className="flex-1 min-w-0 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          {all.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-muted)]">
              <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma mensagem ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-navy-border)]">
              {all.map(ticket => {
                const s = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.open
                const Icon = s.icon
                const isSelected = ticket.id === selectedId
                return (
                  <a
                    key={ticket.id}
                    href={`/admin/suporte?id=${ticket.id}`}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-[var(--color-navy-elevated)] transition-colors ${isSelected ? 'bg-[var(--color-navy-elevated)]' : ''}`}
                  >
                    <div className={`mt-0.5 shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.color}`}>
                      <Icon size={10} />
                      {s.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{ticket.subject}</p>
                      <p className="text-xs text-[var(--color-muted)] truncate">{ticket.name} · {ticket.email}</p>
                    </div>
                    <p className="text-[10px] text-[var(--color-muted)] shrink-0 mt-1">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </p>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <TicketDetail ticket={selected} updateTicket={updateTicket} statusLabel={STATUS_LABEL} />
        )}
      </div>
    </div>
  )
}
