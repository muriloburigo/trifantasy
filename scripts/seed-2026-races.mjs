/**
 * Seed all 2026 Ironman and Ironman 70.3 races.
 * Sources: ironman.com, gowod.app, triathlete.com, tri-today.com
 * Run: node scripts/seed-2026-races.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()

const supabase = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

function slug(name) {
  return name.toLowerCase()
    .replace(/70\.3/g, '703')
    .replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óòôõ]/g, 'o').replace(/[úù]/g, 'u').replace(/[ç]/g, 'c')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-2026'
}

// Today is 2026-04-17
function status(dateStr) {
  const d = new Date(dateStr)
  const today = new Date('2026-04-17')
  const in30 = new Date('2026-05-17')
  if (d < today) return 'finished'
  if (d <= in30) return 'open'
  return 'upcoming'
}

const races = [
  // ── FULL IRONMAN ─────────────────────────────────────────────────────────
  // Finished (before April 17)
  { name: 'IRONMAN New Zealand',            location: 'Taupō',              country: 'New Zealand',      date: '2026-03-07', distance: 'full' },

  // Open (April 17 – May 17)
  { name: 'IRONMAN Texas',                  location: 'The Woodlands',      country: 'United States',    date: '2026-04-18', distance: 'full' },
  { name: 'IRONMAN South Africa',           location: 'Nelson Mandela Bay', country: 'South Africa',     date: '2026-04-19', distance: 'full' },
  { name: 'IRONMAN Vietnam',                location: 'Da Nang',            country: 'Vietnam',          date: '2026-05-10', distance: 'full' },

  // Upcoming
  { name: 'IRONMAN Jacksonville',           location: 'Jacksonville',       country: 'United States',    date: '2026-05-16', distance: 'full' },
  { name: 'IRONMAN Lanzarote',              location: 'Lanzarote',          country: 'Spain',            date: '2026-05-23', distance: 'full' },
  { name: 'IRONMAN Brasil',                 location: 'Florianópolis',      country: 'Brazil',           date: '2026-05-31', distance: 'full' },
  { name: 'IRONMAN Hamburg',                location: 'Hamburg',            country: 'Germany',          date: '2026-06-07', distance: 'full' },
  { name: 'IRONMAN Subic Bay',              location: 'Subic Bay',          country: 'Philippines',      date: '2026-06-07', distance: 'full' },
  { name: 'IRONMAN Cairns',                 location: 'Cairns',             country: 'Australia',        date: '2026-06-14', distance: 'full' },
  { name: 'IRONMAN Kärnten-Klagenfurt',     location: 'Klagenfurt',         country: 'Austria',          date: '2026-06-14', distance: 'full' },
  { name: 'IRONMAN Tours Loire Valley',     location: 'Tours',              country: 'France',           date: '2026-06-14', distance: 'full' },
  { name: 'IRONMAN France',                 location: 'Nice',               country: 'France',           date: '2026-06-28', distance: 'full' },
  { name: 'IRONMAN Frankfurt',              location: 'Frankfurt',          country: 'Germany',          date: '2026-06-28', distance: 'full' },
  { name: 'IRONMAN Switzerland',            location: 'Thun',               country: 'Switzerland',      date: '2026-07-05', distance: 'full' },
  { name: 'IRONMAN Vitoria-Gasteiz',        location: 'Vitoria-Gasteiz',    country: 'Spain',            date: '2026-07-12', distance: 'full' },
  { name: 'IRONMAN Lake Placid',            location: 'Lake Placid',        country: 'United States',    date: '2026-07-19', distance: 'full' },
  { name: 'IRONMAN Canada',                 location: 'Ottawa',             country: 'Canada',           date: '2026-08-02', distance: 'full' },
  { name: 'IRONMAN Kalmar',                 location: 'Kalmar',             country: 'Sweden',           date: '2026-08-15', distance: 'full' },
  { name: 'IRONMAN Leeds',                  location: 'Leeds',              country: 'United Kingdom',   date: '2026-08-16', distance: 'full' },
  { name: 'IRONMAN Copenhagen',             location: 'Copenhagen',         country: 'Denmark',          date: '2026-08-16', distance: 'full' },
  { name: 'IRONMAN Tallinn',                location: 'Tallinn',            country: 'Estonia',          date: '2026-08-22', distance: 'full' },
  { name: 'IRONMAN Vichy',                  location: 'Vichy',              country: 'France',           date: '2026-08-23', distance: 'full' },
  { name: 'IRONMAN Wales',                  location: 'Tenby',              country: 'United Kingdom',   date: '2026-09-13', distance: 'full' },
  { name: 'IRONMAN Wisconsin',              location: 'Madison',            country: 'United States',    date: '2026-09-13', distance: 'full' },
  { name: 'IRONMAN Japan',                  location: 'Hokkaido',           country: 'Japan',            date: '2026-09-13', distance: 'full' },
  { name: 'IRONMAN Italy',                  location: 'Cervia',             country: 'Italy',            date: '2026-09-19', distance: 'full' },
  { name: 'IRONMAN Maryland',               location: 'Cambridge',          country: 'United States',    date: '2026-09-19', distance: 'full' },
  { name: 'IRONMAN Chattanooga',            location: 'Chattanooga',        country: 'United States',    date: '2026-09-27', distance: 'full' },
  { name: 'IRONMAN Barcelona',              location: 'Calella',            country: 'Spain',            date: '2026-10-04', distance: 'full' },
  { name: 'IRONMAN Korea',                  location: 'Gurye',              country: 'South Korea',      date: '2026-10-04', distance: 'full' },
  { name: 'IRONMAN World Championship',     location: 'Kailua-Kona',        country: 'United States',    date: '2026-10-10', distance: 'full' },
  { name: 'IRONMAN Portugal',               location: 'Cascais',            country: 'Portugal',         date: '2026-10-17', distance: 'full' },
  { name: 'IRONMAN California',             location: 'Sacramento',         country: 'United States',    date: '2026-10-18', distance: 'full' },
  { name: 'IRONMAN Australia',              location: 'Port Macquarie',     country: 'Australia',        date: '2026-10-18', distance: 'full' },
  { name: 'IRONMAN Argentina',              location: 'San Juan',           country: 'Argentina',        date: '2026-11-01', distance: 'full' },
  { name: 'IRONMAN Florida',                location: 'Panama City Beach',  country: 'United States',    date: '2026-11-07', distance: 'full' },
  { name: 'IRONMAN Malaysia',               location: 'Langkawi',           country: 'Malaysia',         date: '2026-11-21', distance: 'full' },
  { name: 'IRONMAN Cozumel',                location: 'Cozumel',            country: 'Mexico',           date: '2026-11-22', distance: 'full' },
  { name: 'IRONMAN Chile',                  location: 'Valdivia',           country: 'Chile',            date: '2026-11-29', distance: 'full' },
  { name: 'IRONMAN Oman',                   location: 'Muscat',             country: 'Oman',             date: '2026-12-05', distance: 'full' },
  { name: 'IRONMAN Western Australia',      location: 'Busselton',          country: 'Australia',        date: '2026-12-06', distance: 'full' },

  // ── IRONMAN 70.3 ─────────────────────────────────────────────────────────
  // Finished
  { name: 'IRONMAN 70.3 Dallas-Little Elm',     location: 'Little Elm',         country: 'United States',  date: '2026-03-15', distance: '70.3' },
  { name: 'IRONMAN 70.3 Geelong',               location: 'Geelong',             country: 'Australia',      date: '2026-03-22', distance: '70.3' },
  { name: 'IRONMAN 70.3 Oceanside',             location: 'Oceanside',           country: 'United States',  date: '2026-03-28', distance: '70.3' },
  { name: 'IRONMAN 70.3 Texas',                 location: 'Galveston',           country: 'United States',  date: '2026-03-29', distance: '70.3' },
  { name: 'IRONMAN 70.3 Puerto Varas',          location: 'Puerto Varas',        country: 'Chile',          date: '2026-04-12', distance: '70.3' },
  { name: 'IRONMAN 70.3 Florianópolis',         location: 'Florianópolis',       country: 'Brazil',         date: '2026-10-18', distance: '70.3' },

  // Open
  { name: 'IRONMAN 70.3 Peru',                  location: 'Lima',                country: 'Peru',           date: '2026-04-26', distance: '70.3' },
  { name: 'IRONMAN 70.3 Gulf Coast',            location: 'Panama City Beach',   country: 'United States',  date: '2026-05-09', distance: '70.3' },

  // Upcoming
  { name: 'IRONMAN 70.3 Aix-en-Provence',       location: 'Aix-en-Provence',     country: 'France',         date: '2026-05-17', distance: '70.3' },
  { name: 'IRONMAN 70.3 Chattanooga',           location: 'Chattanooga',         country: 'United States',  date: '2026-05-17', distance: '70.3' },
  { name: 'IRONMAN 70.3 Victoria',              location: 'Victoria',            country: 'Canada',         date: '2026-05-24', distance: '70.3' },
  { name: 'IRONMAN 70.3 Hawai\'i',              location: 'Kohala Coast',        country: 'United States',  date: '2026-05-31', distance: '70.3' },
  { name: 'IRONMAN 70.3 Western Massachusetts', location: 'Springfield',         country: 'United States',  date: '2026-06-07', distance: '70.3' },
  { name: 'IRONMAN 70.3 Boulder',               location: 'Boulder',             country: 'United States',  date: '2026-06-13', distance: '70.3' },
  { name: 'IRONMAN 70.3 Eagleman',              location: 'Cambridge',           country: 'United States',  date: '2026-06-14', distance: '70.3' },
  { name: 'IRONMAN 70.3 Pennsylvania',          location: 'State College',       country: 'United States',  date: '2026-06-14', distance: '70.3' },
  { name: 'IRONMAN 70.3 Coeur d\'Alene',        location: 'Coeur d\'Alene',      country: 'United States',  date: '2026-06-21', distance: '70.3' },
  { name: 'IRONMAN 70.3 Elsinore',              location: 'Elsinore',            country: 'Denmark',        date: '2026-06-21', distance: '70.3' },
  { name: 'IRONMAN 70.3 Illinois-Rockford',     location: 'Rockford',            country: 'United States',  date: '2026-06-21', distance: '70.3' },
  { name: 'IRONMAN 70.3 Mont-Tremblant',        location: 'Mont-Tremblant',      country: 'Canada',         date: '2026-06-21', distance: '70.3' },
  { name: 'IRONMAN 70.3 Omaha',                 location: 'Omaha',               country: 'United States',  date: '2026-06-27', distance: '70.3' },
  { name: 'IRONMAN 70.3 Muskoka',               location: 'Muskoka',             country: 'Canada',         date: '2026-07-05', distance: '70.3' },
  { name: 'IRONMAN 70.3 Muncie',                location: 'Muncie',              country: 'United States',  date: '2026-07-11', distance: '70.3' },
  { name: 'IRONMAN 70.3 Musselman',             location: 'Geneva',              country: 'United States',  date: '2026-07-12', distance: '70.3' },
  { name: 'IRONMAN 70.3 New Mexico-Ruidoso',    location: 'Ruidoso',             country: 'United States',  date: '2026-07-12', distance: '70.3' },
  { name: 'IRONMAN 70.3 Swansea',               location: 'Swansea',             country: 'United Kingdom', date: '2026-07-12', distance: '70.3' },
  { name: 'IRONMAN 70.3 Versailles',            location: 'Versailles',          country: 'France',         date: '2026-07-12', distance: '70.3' },
  { name: 'IRONMAN 70.3 Oregon',                location: 'Salem',               country: 'United States',  date: '2026-07-19', distance: '70.3' },
  { name: 'IRONMAN 70.3 Ohio',                  location: 'Sandusky',            country: 'United States',  date: '2026-07-19', distance: '70.3' },
  { name: 'IRONMAN 70.3 Boise',                 location: 'Boise',               country: 'United States',  date: '2026-07-25', distance: '70.3' },
  { name: 'IRONMAN 70.3 Calgary',               location: 'Calgary',             country: 'Canada',         date: '2026-07-26', distance: '70.3' },
  { name: 'IRONMAN 70.3 Maine',                 location: 'Augusta',             country: 'United States',  date: '2026-07-26', distance: '70.3' },
  { name: 'IRONMAN 70.3 Rio de Janeiro',        location: 'Rio de Janeiro',      country: 'Brazil',         date: '2026-08-09', distance: '70.3' },
  { name: 'IRONMAN 70.3 Zell am See',           location: 'Zell am See',         country: 'Austria',        date: '2026-08-30', distance: '70.3' },
  { name: 'IRONMAN 70.3 Northern California',   location: 'Redding',             country: 'United States',  date: '2026-08-16', distance: '70.3' },
  { name: 'IRONMAN 70.3 Santa Cruz',            location: 'Santa Cruz',          country: 'United States',  date: '2026-09-06', distance: '70.3' },
  { name: 'IRONMAN 70.3 Michigan',              location: 'Frankfort',           country: 'United States',  date: '2026-09-13', distance: '70.3' },
  { name: 'IRONMAN 70.3 World Championship',    location: 'Nice',                country: 'France',         date: '2026-09-13', distance: '70.3' },
  { name: 'IRONMAN 70.3 New York',              location: 'Jones Beach',         country: 'United States',  date: '2026-09-19', distance: '70.3' },
  { name: 'IRONMAN 70.3 Washington',            location: 'Richland',            country: 'United States',  date: '2026-09-20', distance: '70.3' },
  { name: 'IRONMAN 70.3 Augusta',               location: 'Augusta',             country: 'United States',  date: '2026-09-27', distance: '70.3' },
  { name: 'IRONMAN 70.3 Waco',                  location: 'Waco',                country: 'United States',  date: '2026-10-04', distance: '70.3' },
  { name: 'IRONMAN 70.3 North Carolina',        location: 'Wilmington',          country: 'United States',  date: '2026-10-24', distance: '70.3' },
  { name: 'IRONMAN 70.3 La Quinta',             location: 'La Quinta',           country: 'United States',  date: '2026-12-06', distance: '70.3' },
  { name: 'IRONMAN 70.3 Florida',               location: 'Haines City',         country: 'United States',  date: '2026-12-13', distance: '70.3' },
]

const rows = races.map(r => ({
  slug: slug(r.name),
  name: r.name,
  location: r.location,
  country: r.country,
  date: r.date,
  distance: r.distance === '70.3' ? '70.3' : 'full',
  status: status(r.date),
  has_pro_field: r.distance === 'full',
}))

const { error } = await supabase.from('races').upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
if (error) { console.error('Erro:', error); process.exit(1) }

console.log(`✓ ${rows.length} provas inseridas/atualizadas`)
console.log(`  Full IM:    ${rows.filter(r => r.distance === 'full').length}`)
console.log(`  70.3:       ${rows.filter(r => r.distance === 'half').length}`)
console.log(`  Finished:   ${rows.filter(r => r.status === 'finished').length}`)
console.log(`  Open:       ${rows.filter(r => r.status === 'open').length}`)
console.log(`  Upcoming:   ${rows.filter(r => r.status === 'upcoming').length}`)
