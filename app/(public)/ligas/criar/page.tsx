import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createPublicClient } from '~/lib/supabase/server'
import { formatDate } from '~/lib/utils'
import CreateLeagueForm from './CreateLeagueForm'
import JoinForm from './JoinForm'

export default async function CriarLigaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pub = createPublicClient()
  const { data: races } = await pub
    .from('races')
    .select('id, name, date, status')
    .in('status', ['upcoming', 'open'])
    .order('date', { ascending: true })

  const raceOptions = (races ?? []).map((r: any) => ({
    id: r.id,
    name: `${r.name} — ${formatDate(r.date)}`,
    date: r.date,
  }))

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/ligas" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">← Ligas</Link>
      </div>

      {/* Create league */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-bold mb-5">Criar Liga Privada</h1>
        <CreateLeagueForm races={raceOptions} />
      </div>

      {/* Join league */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Entrar com Código</h2>
        <JoinForm />
      </div>
    </div>
  )
}
