'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '~/lib/supabase/server'
import { TEAM_SIZE, TEAM_BUDGET } from '~/lib/types'

export async function saveTeam(raceId: string, athleteIds: string[]) {
  if (athleteIds.length !== TEAM_SIZE) {
    return { error: `Selecione exatamente ${TEAM_SIZE} atletas.` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para salvar seu time.' }

  // Validate budget
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('athlete_id, price')
    .eq('race_id', raceId)
    .in('athlete_id', athleteIds)

  if (!raceAthletes || raceAthletes.length !== TEAM_SIZE) {
    return { error: 'Atletas inválidos para esta prova.' }
  }

  const total = raceAthletes.reduce((sum, ra) => sum + Number(ra.price), 0)
  if (total > TEAM_BUDGET) {
    return { error: `Orçamento excedido. Total: T$${total.toFixed(2)} (limite: T$${TEAM_BUDGET}).` }
  }

  // Upsert team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .upsert({ user_id: user.id, race_id: raceId }, { onConflict: 'user_id,race_id' })
    .select('id')
    .single()

  if (teamError || !team) return { error: 'Erro ao salvar time.' }

  // Replace team athletes
  await supabase.from('team_athletes').delete().eq('team_id', team.id)

  const { error: athleteError } = await supabase.from('team_athletes').insert(
    athleteIds.map(id => ({ team_id: team.id, athlete_id: id }))
  )

  if (athleteError) return { error: 'Erro ao salvar atletas.' }

  revalidatePath(`/provas/${raceId}`)
  return { success: true }
}
