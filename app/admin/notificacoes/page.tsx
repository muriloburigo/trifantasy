import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import { Bell, Users, Clock, Send, CheckCircle, AlertCircle, TrendingUp, Calendar, ShieldAlert, Trophy } from 'lucide-react'
import SendTestNotification from './SendTestNotification'

export const revalidate = 0

export default async function AdminNotificacoesPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const [subsRes, logRes, logStatsRes] = await Promise.all([
    // Total subscriptions & per user
    admin.from('push_subscriptions').select('user_id, created_at').order('created_at', { ascending: false }),
    // Recent log entries
    admin
      .from('push_notification_log')
      .select('type, ref_id, sent_at, user_id')
      .order('sent_at', { ascending: false })
      .limit(50),
    // Count by type
    admin
      .from('push_notification_log')
      .select('type'),
  ])

  const subs = subsRes.data ?? []
  const log = logRes.data ?? []
  const allLog = logStatsRes.data ?? []

  const uniqueUsers = new Set(subs.map((s: any) => s.user_id)).size
  const totalSubs = subs.length

  // Count by type
  const byType: Record<string, number> = {}
  for (const entry of allLog) {
    byType[entry.type] = (byType[entry.type] ?? 0) + 1
  }

  const rules = [
    {
      icon: Calendar,
      type: 'race_7d',
      title: 'Prova em 7 dias',
      desc: 'Disparada quando uma prova com startlist cadastrado está a 7 dias ou menos. Enviada uma única vez por usuário/prova.',
      color: 'text-blue-400',
      bg: 'bg-blue-900/20 border-blue-800/30',
    },
    {
      icon: Clock,
      type: 'race_1d',
      title: 'Prova amanhã',
      desc: 'Disparada quando uma prova com startlist está a 1 dia. Alerta final para ajuste do elenco antes do mercado fechar.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20 border-yellow-800/30',
    },
    {
      icon: TrendingUp,
      type: 'market_open',
      title: 'Mercado aberto',
      desc: 'Enviada quando uma prova muda para status "open" e já tem atletas no startlist. Indica que a lista oficial está disponível.',
      color: 'text-green-400',
      bg: 'bg-green-900/20 border-green-800/30',
    },
    {
      icon: ShieldAlert,
      type: 'missing_startlist',
      title: 'Atleta fora do startlist',
      desc: 'Avisa o usuário se algum atleta do seu elenco não consta na startlist da próxima prova. Gerado por combinação atleta+prova.',
      color: 'text-red-400',
      bg: 'bg-red-900/20 border-red-800/30',
    },
    {
      icon: TrendingUp,
      type: 'price_change',
      title: 'Variação de preço ≥ 10%',
      desc: 'Enviada ao dono do atleta quando há variação de ±10% ou mais no preço nas últimas 24h. Baseado na tabela athlete_price_history.',
      color: 'text-orange-400',
      bg: 'bg-orange-900/20 border-orange-800/30',
    },
    {
      icon: Trophy,
      type: 'top10',
      title: 'Entrada no Top 10 global',
      desc: 'Notifica o usuário ao entrar no Top 10 da Liga Global. Deduplicado por posição e data — não reenvia no mesmo dia.',
      color: 'text-purple-400',
      bg: 'bg-purple-900/20 border-purple-800/30',
    },
  ]

  return (
    <div className="p-8 max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Push Notifications</h1>
        <p className="text-[var(--color-muted)] text-sm">
          Regras de disparo, estatísticas e teste manual de notificações.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Usuários inscritos', value: uniqueUsers, icon: Users, color: 'text-[var(--color-orange)]' },
          { label: 'Dispositivos', value: totalSubs, icon: Bell, color: 'text-blue-400' },
          { label: 'Notif. enviadas', value: allLog.length, icon: Send, color: 'text-green-400' },
          { label: 'Tipos ativos', value: rules.length, icon: CheckCircle, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Trigger rules */}
      <section>
        <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-4">
          Regras de Disparo
        </h2>
        <div className="space-y-3">
          {rules.map(({ icon: Icon, type, title, desc, color, bg }) => (
            <div key={type} className={`border rounded-xl p-4 flex items-start gap-4 ${bg}`}>
              <Icon size={18} className={`${color} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{title}</span>
                  <code className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-[var(--color-muted)] font-mono">{type}</code>
                  <span className="ml-auto text-xs text-[var(--color-muted)] shrink-0">
                    {byType[type] ?? 0} envios
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section>
        <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-4">
          Agendamento
        </h2>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">
          {[
            { label: 'Cron Vercel', value: '0 8 * * * — 08:00 UTC diariamente', note: 'Plano Hobby: 1x/dia' },
            { label: 'Deduplicação', value: 'Tabela push_notification_log com UNIQUE(user_id, type, ref_id)', note: 'Sem reenvios' },
            { label: 'Expiração', value: 'Subscriptions inválidas (404/410) são removidas automaticamente', note: 'Auto-limpeza' },
            { label: 'TTL da mensagem', value: '86400 segundos (24h)', note: 'Web Push API' },
          ].map(({ label, value, note }) => (
            <div key={label} className="flex items-start justify-between px-4 py-3 gap-4">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{value}</p>
              </div>
              <span className="text-[10px] bg-[var(--color-navy-elevated)] text-[var(--color-muted)] px-2 py-0.5 rounded-full shrink-0">{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Test send */}
      <section>
        <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-4">
          Teste Manual
        </h2>
        <SendTestNotification />
      </section>

      {/* Recent log */}
      <section>
        <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-4">
          Últimos 50 Envios
        </h2>
        {log.length === 0 ? (
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-8 text-center text-[var(--color-muted)] text-sm">
            Nenhuma notificação enviada ainda.
          </div>
        ) : (
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 px-4 py-2 border-b border-[var(--color-navy-border)] text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              <span>Tipo</span>
              <span>Ref</span>
              <span className="text-right">Enviado</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-navy-border)]">
              {log.map((entry: any) => (
                <div key={`${entry.user_id}-${entry.type}-${entry.ref_id}`} className="grid grid-cols-3 px-4 py-2.5 text-xs">
                  <code className="text-[var(--color-orange)] font-mono">{entry.type}</code>
                  <span className="text-[var(--color-muted)] truncate pr-2">{entry.ref_id}</span>
                  <span className="text-[var(--color-muted)] text-right">
                    {new Date(entry.sent_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
