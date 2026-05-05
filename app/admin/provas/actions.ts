'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { processNotifications } from '~/lib/notifications-engine'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function upsertRace(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const id = formData.get('id') as string | null
  const name = (formData.get('name') as string).trim()
  const date = formData.get('date') as string
  const location = (formData.get('location') as string).trim()
  const country = (formData.get('country') as string).trim()
  const country_code = (formData.get('country_code') as string).trim().toUpperCase() || null
  const distance = formData.get('distance') as string
  const has_pro_field = formData.get('has_pro_field') === 'on'
  const status = formData.get('status') as string
  const slug = id ? (formData.get('slug') as string) : toSlug(name)

  const payload = { name, slug, date, location, country, country_code, distance, has_pro_field, status }

  if (id) {
    // Check previous status to detect open/locked transitions
    const { data: prev } = await supabase.from('races').select('status').eq('id', id).single()
    await supabase.from('races').update(payload).eq('id', id)
    // Fire notifications when race becomes open or locked
    if (prev?.status !== status && (status === 'open' || status === 'locked')) {
      processNotifications().catch(err => console.error('[Notifications] Error on status change:', err))
    }
    // Snapshot team compositions when race is locked so scoring uses race-day rosters
    if (prev?.status !== 'locked' && status === 'locked') {
      const { data: allTeamAthletes } = await supabase
        .from('team_athletes')
        .select('team_id, athlete_id')
      if (allTeamAthletes?.length) {
        await supabase
          .from('race_rosters')
          .upsert(
            allTeamAthletes.map(ta => ({ race_id: id, team_id: ta.team_id, athlete_id: ta.athlete_id })),
            { onConflict: 'race_id,team_id,athlete_id' }
          )
      }
    }
  } else {
    await supabase.from('races').insert(payload)
  }

  revalidatePath('/admin/provas')
  revalidatePath('/')
  redirect('/admin/provas')
}

export async function deleteRace(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('races').delete().eq('id', id)
  revalidatePath('/admin/provas')
  revalidatePath('/')
}
