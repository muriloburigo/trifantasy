'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'

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
    await supabase.from('races').update(payload).eq('id', id)
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
