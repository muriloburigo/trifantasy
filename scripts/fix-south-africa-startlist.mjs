/**
 * Fix script for South Africa startlist prices.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ntkomfskafuwucuzsgto.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
    process.exit(1)
  }
  // Find both races
  const { data: races } = await supabase
    .from('races')
    .select('id, name')
    .ilike('name', '%South Africa%')

  console.log('Found races:', races)
  // ... rest of logic
}
run()
