/**
 * Remove from IM South Africa 2026 all athletes who also appear in IM Texas 2026.
 * These athletes raced Texas on April 18 and cannot race South Africa on April 19.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ntkomfskafuwucuzsgto.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50a29tZnNrYWZ1d3VjdXpzZ3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NzA2NywiZXhwIjoyMDkyMDIzMDY3fQ.Id3ztXpDPdesJLq3nFHkR14PVbSZ3Geu_ixhS0UgCbU'
)

// Find both races
const { data: races } = await supabase
  .from('races')
  .select('id, name, slug')
  .in('slug', ['ironman-texas-2026', 'ironman-south-africa-2026'])

console.log('Races found:', races?.map(r => `${r.slug} (${r.id})`))

const texasRace = races?.find(r => r.slug === 'ironman-texas-2026')
const saRace    = races?.find(r => r.slug === 'ironman-south-africa-2026')

if (!texasRace || !saRace) {
  console.error('Could not find races. Slugs in DB:')
  const { data: allRaces } = await supabase.from('races').select('id, name, slug').order('date')
  console.log(allRaces?.map(r => r.slug))
  process.exit(1)
}

// Get athletes in Texas
const { data: texasAthletes } = await supabase
  .from('race_athletes')
  .select('athlete_id, athletes(name)')
  .eq('race_id', texasRace.id)

const texasIds = new Set(texasAthletes?.map(ra => ra.athlete_id))
console.log(`\nTexas field: ${texasIds.size} athletes`)

// Get athletes in South Africa
const { data: saAthletes } = await supabase
  .from('race_athletes')
  .select('athlete_id, athletes(name)')
  .eq('race_id', saRace.id)

console.log(`South Africa field: ${saAthletes?.length} athletes`)

// Find overlap
const overlap = saAthletes?.filter(ra => texasIds.has(ra.athlete_id)) ?? []
console.log(`\nAthletes to remove from South Africa (raced Texas): ${overlap.length}`)
for (const ra of overlap) {
  console.log(`  - ${ra.athletes?.name}`)
}

if (overlap.length === 0) {
  console.log('Nothing to remove.')
  process.exit(0)
}

// Remove overlapping athletes from South Africa
const overlapIds = overlap.map(ra => ra.athlete_id)
const { error } = await supabase
  .from('race_athletes')
  .delete()
  .eq('race_id', saRace.id)
  .in('athlete_id', overlapIds)

if (error) {
  console.error('Delete error:', error)
  process.exit(1)
}

console.log(`\n✅ Removed ${overlap.length} athletes from IM South Africa 2026.`)

// Confirm new count
const { count } = await supabase
  .from('race_athletes')
  .select('*', { count: 'exact', head: true })
  .eq('race_id', saRace.id)

console.log(`South Africa field now has ${count} athletes.`)
