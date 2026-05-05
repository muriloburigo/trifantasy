'use server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteLeague(id: string) {
  await requireAdmin()
  const sb = createAdminClient()
  const { error } = await sb.from('leagues').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/ligas')
}

export async function updateLeague(id: string, formData: FormData) {
  await requireAdmin()
  const sb = createAdminClient()
  const { error } = await sb
    .from('leagues')
    .update({
      name: formData.get('name') as string,
      invite_code: (formData.get('invite_code') as string).toUpperCase(),
      is_public: formData.get('is_public') === 'on',
      is_global: formData.get('is_global') === 'on',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/ligas')
  revalidatePath(`/admin/ligas/${id}`)
}

export async function addMember(leagueId: string, userId: string) {
  await requireAdmin()
  const sb = createAdminClient()
  const { error } = await sb
    .from('league_members')
    .upsert(
      { league_id: leagueId, user_id: userId, joined_at: new Date().toISOString() },
      { onConflict: 'league_id,user_id' }
    )
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/ligas/${leagueId}`)
}

export async function removeMember(leagueId: string, userId: string) {
  await requireAdmin()
  const sb = createAdminClient()
  const { error } = await sb
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/ligas/${leagueId}`)
}

export async function createLeague(formData: FormData) {
  await requireAdmin()
  const sb = createAdminClient()
  const { error } = await sb.from('leagues').insert({
    name: formData.get('name') as string,
    invite_code: (formData.get('invite_code') as string).toUpperCase(),
    is_public: formData.get('is_public') === 'on',
    is_global: formData.get('is_global') === 'on',
    owner_id: formData.get('owner_id') as string,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/ligas')
  redirect('/admin/ligas')
}
