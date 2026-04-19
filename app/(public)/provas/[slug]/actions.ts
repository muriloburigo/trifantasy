'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '~/lib/supabase/server'
import { TEAM_SIZE } from '~/lib/types'

export async function saveTeam(athleteIds: string[]) {
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

  // Upsert team (one per user, no race context)
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .upsert({ user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('id')
    .single()

  if (teamError || !team) return { error: 'Erro ao salvar time.' }

  // Replace team athletes
  await supabase.from('team_athletes').delete().eq('team_id', team.id)

  const { error: athleteError } = await supabase.from('team_athletes').insert(
    athleteIds.map(id => ({ team_id: team.id, athlete_id: id }))
  )

  if (athleteError) return { error: 'Erro ao salvar atletas.' }

  revalidatePath('/elenco')
  return { success: true }
}
