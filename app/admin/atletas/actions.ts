'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'

function normalizeName(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .split(/\s+/)
    .join(' ') // Normaliza espaços extras
}

/** Upsert a single athlete and link to a race */
export async function upsertAthlete(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const raceId = formData.get('race_id') as string
  const rawName = (formData.get('name') as string)
  const name = normalizeName(rawName)
  const gender = formData.get('gender') as string
  const type = formData.get('type') as string
  const age_group = (formData.get('age_group') as string)?.trim() || null
  const club = (formData.get('club') as string)?.trim() || null
  const country = (formData.get('country') as string)?.trim() || null
  const country_code = (formData.get('country_code') as string)?.trim().toUpperCase() || null
  const pto_rank = formData.get('pto_rank') ? Number(formData.get('pto_rank')) : null
  const price = Number(formData.get('price')) || 10
  const bib = formData.get('bib') ? Number(formData.get('bib')) : null

  // Upsert athlete (match by name + gender + type)
  const { data: athlete, error: aErr } = await supabase
    .from('athletes')
    .upsert({ name, gender, type, age_group, club, country, country_code, pto_rank },
      { onConflict: 'name,gender,type' })
    .select('id')
    .single()

  if (aErr || !athlete) return { error: `Erro ao salvar atleta: ${aErr?.message}` }

  // Link to race
  const { error: raErr } = await supabase
    .from('race_athletes')
    .upsert({ race_id: raceId, athlete_id: athlete.id, price, bib },
      { onConflict: 'race_id,athlete_id' })

  if (raErr) return { error: `Erro ao vincular atleta à prova: ${raErr.message}` }

  revalidatePath('/admin/atletas')
  return { success: true }
}

/** Bulk import athletes from JSON */
export async function bulkImportAthletes(raceId: string, json: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  let rows: any[]
  try { rows = JSON.parse(json) } catch { return { error: 'JSON inválido.' } }

  let inserted = 0
  const errors: string[] = []

  for (const row of rows) {
    const name = normalizeName(row.name)
    const { data: athlete, error: aErr } = await supabase
      .from('athletes')
      .upsert({
        name,
        gender: row.gender,
        type: row.type ?? 'age_grouper',
        age_group: row.age_group ?? null,
        club: row.club ?? null,
        country: row.country ?? null,
        country_code: row.country_code ?? null,
        pto_rank: row.pto_rank ?? null,
      }, { onConflict: 'name,gender,type' })
      .select('id')
      .single()

    if (aErr || !athlete) { errors.push(`${row.name}: ${aErr?.message}`); continue }

    await supabase.from('race_athletes').upsert(
      { race_id: raceId, athlete_id: athlete.id, price: row.price ?? 10, bib: row.bib ?? null },
      { onConflict: 'race_id,athlete_id' }
    )
    inserted++
  }

  revalidatePath('/admin/atletas')
  return { success: true, inserted, errors }
}

export async function removeRaceAthlete(raceAthleteId: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('race_athletes').delete().eq('id', raceAthleteId)
  revalidatePath('/admin/atletas')
}
