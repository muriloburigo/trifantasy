import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { notFound } from 'next/navigation'
import EditRaceForm from './EditRaceForm'
import BackLink from '~/app/components/BackLink'

export default async function AdminEditRacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .single()

  if (!race) notFound()

  return (
    <div className="max-w-2xl p-8">
      <BackLink href="/admin/provas" />
      <h1 className="text-2xl font-bold mb-6">Editar Prova</h1>
      <EditRaceForm race={race} />
    </div>
  )
}
