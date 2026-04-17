'use server'
import { redirect } from 'next/navigation'
import { createClient } from '~/lib/supabase/server'
import { generateInviteCode } from '~/lib/utils'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para criar uma liga.' }

  const name = (formData.get('name') as string)?.trim()
  const raceId = formData.get('race_id') as string
  if (!name || !raceId) return { error: 'Preencha todos os campos.' }

  const inviteCode = generateInviteCode()

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({ name, race_id: raceId, invite_code: inviteCode, owner_id: user.id })
    .select('id')
    .single()

  if (error || !league) return { error: 'Erro ao criar liga.' }

  // Creator auto-joins
  await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

  redirect(`/ligas/${league.id}`)
}

export async function joinLeague(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para entrar em uma liga.' }

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (!league) return { error: 'Código inválido. Verifique e tente novamente.' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (error?.code === '23505') return { error: 'Você já participa desta liga.' }
  if (error) return { error: 'Erro ao entrar na liga.' }

  redirect(`/ligas/${league.id}`)
}
