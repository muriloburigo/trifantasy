'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'

export async function addAthleteToRace(raceId: string, athleteId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  // The database trigger will automatically set the correct price
  const { error } = await supabase.from('race_athletes').insert({
    race_id: raceId,
    athlete_id: athleteId
  })

  if (error) return { error: error.message }
  revalidatePath(`/admin/provas/${raceId}/startlist`)
  return { success: true }
}

export async function removeAthleteFromRace(raceId: string, athleteId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from('race_athletes')
    .delete()
    .eq('race_id', raceId)
    .eq('athlete_id', athleteId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/provas/${raceId}/startlist`)
  return { success: true }
}

export async function updateBib(raceId: string, athleteId: string, bib: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from('race_athletes')
    .update({ bib: bib ? parseInt(bib) : null })
    .eq('race_id', raceId)
    .eq('athlete_id', athleteId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/provas/${raceId}/startlist`)
  return { success: true }
}
