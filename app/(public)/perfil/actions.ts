'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '~/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const photo_url = formData.get('photo_url') as string

  const { error } = await supabase
    .from('profiles')
    .update({ 
      name: name.trim(),
      photo_url
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
  return { success: true }
}
