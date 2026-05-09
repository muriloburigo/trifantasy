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

// override: true = force open, false = force closed, null = auto (schedule-based)
export async function setMarketOverride(override: boolean | null) {
  const user = await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('settings')
    .update({ value: override, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('key', 'market_override')
  if (error) return { error: error.message }
  revalidatePath('/admin/mercado')
  revalidatePath('/')
  revalidatePath('/elenco')
  return { success: true }
}
