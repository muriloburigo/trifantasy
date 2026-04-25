'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '~/lib/supabase/server'
import { getMarketStatus } from '~/lib/market'
import { TEAM_SIZE } from '~/lib/types'

export async function buyAthlete(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para comprar atletas.' }

  const market = await getMarketStatus(supabase)
  if (market.locked) return { error: 'Mercado fechado.' }

  const [athleteRes, profileRes] = await Promise.all([
    supabase.from('athletes').select('current_price, name').eq('id', athleteId).single(),
    supabase.from('profiles').select('wallet').eq('id', user.id).single(),
  ])

  const { count: rosterCount } = await supabase
    .from('portfolio')
    .select('athlete_id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (!athleteRes.data) return { error: 'Atleta não encontrado.' }
  if (!profileRes.data) return { error: 'Perfil não encontrado.' }
  if ((rosterCount ?? 0) >= TEAM_SIZE) {
    return { error: `Seu elenco já está completo com ${TEAM_SIZE} atletas. Venda um atleta antes de comprar outro.` }
  }

  const price = Number(athleteRes.data.current_price)
  const wallet = Number(profileRes.data.wallet)

  if (wallet < price) {
    return { error: `Saldo insuficiente. Você tem T$${wallet.toFixed(0)}, atleta custa T$${price}.` }
  }

  const { data: existing } = await supabase
    .from('portfolio')
    .select('id')
    .eq('user_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()
  if (existing) return { error: 'Atleta já está no seu elenco.' }

  const walletAfter = wallet - price
  const [p1, p2] = await Promise.all([
    supabase.from('portfolio').insert({ user_id: user.id, athlete_id: athleteId, bought_price: price }),
    supabase.from('profiles').update({ wallet: walletAfter }).eq('id', user.id),
  ])

  if (p1.error || p2.error) return { error: 'Erro ao comprar atleta. Tente novamente.' }

  await supabase.from('market_transactions').insert({
    user_id: user.id,
    athlete_id: athleteId,
    type: 'buy',
    price,
    wallet_before: wallet,
    wallet_after: walletAfter,
  })

  revalidatePath('/', 'layout')
  return { success: true, price, name: athleteRes.data.name }
}

export async function sellAthlete(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login.' }

  const market = await getMarketStatus(supabase)
  if (market.locked) return { error: 'Mercado fechado.' }

  const [ownedRes, athleteRes, profileRes] = await Promise.all([
    supabase.from('portfolio').select('id').eq('user_id', user.id).eq('athlete_id', athleteId).maybeSingle(),
    supabase.from('athletes').select('current_price, name').eq('id', athleteId).single(),
    supabase.from('profiles').select('wallet').eq('id', user.id).single(),
  ])

  if (!ownedRes.data) return { error: 'Você não possui este atleta.' }
  if (!athleteRes.data || !profileRes.data) return { error: 'Erro ao buscar dados.' }

  const price = Number(athleteRes.data.current_price)
  const wallet = Number(profileRes.data.wallet)

  const walletAfter = wallet + price
  const [p1, p2] = await Promise.all([
    supabase.from('portfolio').delete().eq('user_id', user.id).eq('athlete_id', athleteId),
    supabase.from('profiles').update({ wallet: walletAfter }).eq('id', user.id),
  ])

  if (p1.error || p2.error) return { error: 'Erro ao vender atleta. Tente novamente.' }

  await supabase.from('market_transactions').insert({
    user_id: user.id,
    athlete_id: athleteId,
    type: 'sell',
    price,
    wallet_before: wallet,
    wallet_after: walletAfter,
  })

  revalidatePath('/', 'layout')
  return { success: true, price, name: athleteRes.data.name }
}
