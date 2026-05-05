'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '~/lib/supabase/server'

async function assertOwner(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: league } = await admin
    .from('leagues')
    .select('owner_id')
    .eq('id', leagueId)
    .single()

  if (!league || league.owner_id !== user.id) {
    throw new Error('Sem permissão')
  }
}

export async function updateLeagueAsOwner(leagueId: string, formData: FormData) {
  await assertOwner(leagueId)
  const admin = createAdminClient()
  const { error } = await admin
    .from('leagues')
    .update({
      name: formData.get('name') as string,
      invite_code: (formData.get('invite_code') as string).toUpperCase(),
      is_public: formData.get('is_public') === 'on',
    })
    .eq('id', leagueId)
  if (error) throw new Error(error.message)
  revalidatePath(`/ligas/${leagueId}`)
  revalidatePath('/ligas')
  redirect(`/ligas/${leagueId}`)
}

export async function deleteLeagueAsOwner(leagueId: string) {
  await assertOwner(leagueId)
  const admin = createAdminClient()
  const { error } = await admin.from('leagues').delete().eq('id', leagueId)
  if (error) throw new Error(error.message)
  revalidatePath('/ligas')
  redirect('/ligas')
}
