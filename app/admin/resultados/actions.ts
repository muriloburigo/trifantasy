'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'

/** Upsert a single result */
export async function upsertResult(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const n = (field: string) => {
    const v = formData.get(field)
    return v && String(v).trim() !== '' ? Number(v) : null
  }

  const raceId    = formData.get('race_id') as string
  const athleteId = formData.get('athlete_id') as string

  const payload = {
    race_id:     raceId,
    athlete_id:  athleteId,
    overall_pos: n('overall_pos'),
    ag_pos:      n('ag_pos'),
    pro_pos:     n('pro_pos'),
    swim_time:   n('swim_time'),
    t1_time:     n('t1_time'),
    bike_time:   n('bike_time'),
    t2_time:     n('t2_time'),
    run_time:    n('run_time'),
    finish_time: n('finish_time'),
    dnf:         formData.get('dnf') === 'on',
    dns:         formData.get('dns') === 'on',
    kona_slot:   false,
  }

  const { error } = await supabase
    .from('results')
    .upsert(payload, { onConflict: 'race_id,athlete_id' })

  if (error) return { error: error.message }
  revalidatePath('/admin/resultados')
  return { success: true }
}

/**
 * Bulk import results from JSON.
 * Each row: { bib?, athlete_name?, overall_pos, ag_pos, pro_pos,
 *             swim_time, t1_time, bike_time, t2_time, run_time, finish_time,
 *             dnf, dns }
 * Times in seconds.
 */
export async function bulkImportResults(raceId: string, json: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  let rows: any[]
  try { rows = JSON.parse(json) } catch { return { error: 'JSON inválido.' } }

  let inserted = 0
  const errors: string[] = []

  for (const row of rows) {
    // Resolve athlete by bib or name
    let athleteId: string | null = null

    if (row.bib) {
      const { data: ra } = await supabase
        .from('race_athletes')
        .select('athlete_id')
        .eq('race_id', raceId)
        .eq('bib', row.bib)
        .maybeSingle()
      athleteId = ra?.athlete_id ?? null
    }

    if (!athleteId && row.athlete_name) {
      const { data: ra } = await supabase
        .from('race_athletes')
        .select('athlete_id, athlete:athletes(name)')
        .eq('race_id', raceId)
        .ilike('athlete.name', `%${row.athlete_name}%`)
        .maybeSingle()
      athleteId = (ra as any)?.athlete_id ?? null
    }

    if (!athleteId) { errors.push(`Atleta não encontrado: bib=${row.bib} nome=${row.athlete_name}`); continue }

    const { error } = await supabase.from('results').upsert({
      race_id: raceId, athlete_id: athleteId,
      overall_pos: row.overall_pos ?? null,
      ag_pos:      row.ag_pos ?? null,
      pro_pos:     row.pro_pos ?? null,
      swim_time:   row.swim_time ?? null,
      t1_time:     row.t1_time ?? null,
      bike_time:   row.bike_time ?? null,
      t2_time:     row.t2_time ?? null,
      run_time:    row.run_time ?? null,
      finish_time: row.finish_time ?? null,
      dnf:         row.dnf ?? false,
      dns:         row.dns ?? false,
      kona_slot:   false,
    }, { onConflict: 'race_id,athlete_id' })

    if (error) { errors.push(`${row.athlete_name ?? row.bib}: ${error.message}`); continue }
    inserted++
  }

  revalidatePath('/admin/resultados')
  return { success: true, inserted, errors }
}
