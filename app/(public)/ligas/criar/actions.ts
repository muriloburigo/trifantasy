'use server'
import { redirect } from 'next/navigation'
import { createClient } from '~/lib/supabase/server'
import { generateInviteCode } from '~/lib/utils'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para criar uma liga.' }

  const name = (formData.get('name') as string)?.trim()
  const isPublic = formData.get('is_public') === 'true'
  if (!name) return { error: 'Dê um nome à liga.' }

  const inviteCode = generateInviteCode()

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({ name, invite_code: inviteCode, owner_id: user.id, is_public: isPublic })
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

export async function joinPublicLeague(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para entrar.' }

  const { data: league } = await supabase
    .from('leagues')
    .select('id, is_public')
    .eq('id', leagueId)
    .single()

  if (!league?.is_public) return { error: 'Esta liga não é pública.' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: leagueId, user_id: user.id })

  if (error?.code === '23505') return { error: 'Você já participa desta liga.' }
  if (error) return { error: 'Erro ao entrar na liga.' }

  redirect(`/ligas/${leagueId}`)
}

export async function addMemberByUsername(leagueId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  // Only owner can add members
  const { data: league } = await supabase
    .from('leagues')
    .select('owner_id')
    .eq('id', leagueId)
    .single()

  if (league?.owner_id !== user.id) return { error: 'Apenas o criador pode adicionar membros.' }

  // Find user by name (case-insensitive)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .ilike('name', username.trim())
    .single()

  if (!profile) return { error: 'Usuário não encontrado.' }
  if (profile.id === user.id) return { error: 'Você já está na liga.' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: leagueId, user_id: profile.id })

  if (error?.code === '23505') return { error: `${profile.name} já está na liga.` }
  if (error) return { error: 'Erro ao adicionar membro.' }

  return { success: `${profile.name} adicionado à liga!`, error: undefined }
}
