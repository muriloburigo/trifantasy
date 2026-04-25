'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'

export async function updateAthletePrice(
  athleteId: string,
  currentPrice: number,
  priceChange: number
) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('athletes')
    .update({ current_price: currentPrice, price_change: priceChange })
    .eq('id', athleteId)
  if (error) return { error: error.message }
  revalidatePath('/admin/mercado')
  revalidatePath('/')
  return { success: true }
}
