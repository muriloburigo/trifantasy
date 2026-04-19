'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '~/lib/supabase/server'
import { TEAM_SIZE } from '~/lib/types'

export async function saveTeam(raceId: string, athleteIds: string[]) {
  if (athleteIds.length !== TEAM_SIZE) {
    return { error: `Selecione exatamente ${TEAM_SIZE} atletas.` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para salvar seu time.' }

  // Validate that user owns all selected athletes
  const { data: owned } = await supabase
    .from('portfolio')
    .select('athlete_id')
    .eq('user_id', user.id)
    .in('athlete_id', athleteIds)

  if (!owned || owned.length !== TEAM_SIZE) {
    return { error: 'Você precisa possuir todos os atletas selecionados. Compre-os no mercado primeiro.' }
  }

  // Validate athletes are in the race
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('athlete_id')
    .eq('race_id', raceId)
    .in('athlete_id', athleteIds)

  if (!raceAthletes || raceAthletes.length !== TEAM_SIZE) {
    return { error: 'Alguns atletas não estão inscritos nesta prova.' }
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
