import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { notFound } from 'next/navigation'
import ManageStartlist from './ManageStartlist'
import BackLink from '~/app/components/BackLink'

export default async function AdminStartlistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  // 1. Fetch race
  const { data: race } = await supabase.from('races').select('*').eq('id', id).single()
  if (!race) notFound()

  // 2. Fetch current startlist
  const { data: startlist } = await supabase
    .from('race_athletes')
    .select('id, athlete_id, price, bib, athlete:athletes(name)')
    .eq('race_id', id)
    .order('bib', { ascending: true })

  // 3. Fetch all athletes for search (limit 500 for admin performance)
  const { data: allAthletes } = await supabase
    .from('athletes')
    .select('id, name, current_price')
    .order('name', { ascending: true })
    .limit(500)

  return (
    <div className="p-8 space-y-6">
      <BackLink href="/admin/provas" />
      <div>
        <h1 className="text-2xl font-bold">Startlist: {race.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">{race.location} · {new Date(race.date).toLocaleDateString()}</p>
      </div>

      <ManageStartlist 
        race={race} 
        initialStartlist={startlist ?? []} 
        allAthletes={allAthletes ?? []} 
      />
    </div>
  )
}
