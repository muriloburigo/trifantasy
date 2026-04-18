/**
 * Seed PRO athletes for three April 2026 races:
 *   - IRONMAN Texas        18/04/2026 (full)
 *   - IRONMAN South Africa 19/04/2026 (full)
 *   - IRONMAN 70.3 Brasília 26/04/2026 (70.3)
 *
 * Sources: TRI247, TriRating, k226.com, endurancesportswire, Unlimited Sports
 * Run: node scripts/seed-athletes-april-races.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ─── 1. Upsert races ──────────────────────────────────────────────────────────

const RACES = [
  { slug: 'ironman-texas-2026',         name: 'IRONMAN Texas',           location: 'The Woodlands', country: 'United States', country_code: 'US', date: '2026-04-18', distance: 'full', status: 'open',     has_pro_field: true },
  { slug: 'ironman-south-africa-2026',  name: 'IRONMAN South Africa',    location: 'Nelson Mandela Bay', country: 'South Africa',  country_code: 'ZA', date: '2026-04-19', distance: 'full', status: 'open',     has_pro_field: true },
  { slug: 'ironman-703-brasilia-2026',  name: 'IRONMAN 70.3 Brasília',   location: 'Brasília',      country: 'Brazil',        country_code: 'BR', date: '2026-04-26', distance: '70.3', status: 'open',     has_pro_field: true },
]

const { data: raceRows, error: raceErr } = await sb.from('races')
  .upsert(RACES, { onConflict: 'slug' })
  .select('id, slug, name')
if (raceErr) { console.error('races error:', raceErr); process.exit(1) }

const raceId = (slug) => raceRows.find(r => r.slug === slug)?.id
const TX  = raceId('ironman-texas-2026')
const SA  = raceId('ironman-south-africa-2026')
const BSB = raceId('ironman-703-brasilia-2026')

console.log('✓ Provas:')
raceRows.forEach(r => console.log(`  ${r.name} → ${r.id}`))

// ─── 2. Athlete definitions ───────────────────────────────────────────────────
// Each athlete: { name, gender, country, pto_rank? }
// races: array of slugs this athlete competes in
// price: Trix Coin base price (1-35)

const ATHLETES = [
  // ── IRONMAN TEXAS — PRO M ─────────────────────────────────────────────────
  { name: 'Kristian Blummenfelt',        gender: 'M', country: 'Norway',       pto_rank: 7,  price: 28, races: ['TX'] },
  { name: 'Casper Stornes',              gender: 'M', country: 'Norway',       pto_rank: 12, price: 24, races: ['TX'] },
  { name: 'Patrick Lange',               gender: 'M', country: 'Germany',      pto_rank: null, price: 22, races: ['TX'] },
  { name: 'Gustav Iden',                 gender: 'M', country: 'Norway',       pto_rank: null, price: 26, races: ['TX'] },
  { name: 'Marten Van Riel',             gender: 'M', country: 'Belgium',      pto_rank: 6,  price: 25, races: ['TX', 'SA'] },
  { name: 'Jonas Schomburg',             gender: 'M', country: 'Germany',      pto_rank: 9,  price: 20, races: ['TX', 'SA'] },
  { name: 'Antonio Benito López',        gender: 'M', country: 'Spain',        pto_rank: 15, price: 18, races: ['TX'] },
  { name: 'Rudy Von Berg',               gender: 'M', country: 'United States', pto_rank: null, price: 14, races: ['TX'] },
  { name: 'Nick Thompson',               gender: 'M', country: 'Australia',    pto_rank: 24, price: 14, races: ['TX'] },
  { name: 'Jelle Geens',                 gender: 'M', country: 'Belgium',      pto_rank: 2,  price: 26, races: ['TX'] },
  { name: 'Matt Hanson',                 gender: 'M', country: 'United States', pto_rank: null, price: 16, races: ['TX', 'SA'] },
  { name: 'Kristian Høgenhaug',          gender: 'M', country: 'Denmark',      pto_rank: 18, price: 16, races: ['TX'] },
  { name: 'Mike Phillips',               gender: 'M', country: 'New Zealand',  pto_rank: null, price: 13, races: ['TX', 'SA'] },
  { name: 'Magnus Ditlev',               gender: 'M', country: 'Denmark',      pto_rank: null, price: 20, races: ['TX', 'SA'] },
  { name: 'Sam Long',                    gender: 'M', country: 'United States', pto_rank: 20, price: 15, races: ['TX'] },
  { name: 'Matt Kerr',                   gender: 'M', country: 'New Zealand',  pto_rank: null, price: 11, races: ['TX'] },
  { name: 'Lionel Sanders',              gender: 'M', country: 'Canada',       pto_rank: null, price: 18, races: ['TX'] },
  { name: 'Mathias Lyngsø Petersen',     gender: 'M', country: 'Denmark',      pto_rank: null, price: 12, races: ['TX', 'SA'] },
  { name: 'Leon Chevalier',              gender: 'M', country: 'France',       pto_rank: null, price: 17, races: ['TX', 'SA'] },
  { name: 'Leonard Arnold',             gender: 'M', country: 'Germany',      pto_rank: null, price: 10, races: ['TX'] },
  { name: 'Jonas Hoffmann',              gender: 'M', country: 'Germany',      pto_rank: null, price: 12, races: ['TX', 'SA'] },
  { name: 'Paul Schuster',               gender: 'M', country: 'Germany',      pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Jason West',                  gender: 'M', country: 'United States', pto_rank: 16, price: 16, races: ['TX'] },
  { name: 'Vincent Luis',                gender: 'M', country: 'France',       pto_rank: 17, price: 16, races: ['TX'] },
  { name: 'Kacper Stepniak',             gender: 'M', country: 'Poland',       pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Andy Krueger',                gender: 'M', country: 'United States', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Jackson Laundry',             gender: 'M', country: 'Canada',       pto_rank: null, price: 10, races: ['TX'] },
  { name: 'Ben Kanute',                  gender: 'M', country: 'United States', pto_rank: null, price: 11, races: ['TX'] },
  { name: 'Jan Stratmann',               gender: 'M', country: 'Germany',      pto_rank: null, price: 10, races: ['TX'] },
  { name: 'Robert Kallin',               gender: 'M', country: 'Sweden',       pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Kieran Lindars',              gender: 'M', country: 'Great Britain', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Marius Bjerkeset',            gender: 'M', country: 'Norway',       pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Zack Cooper',                 gender: 'M', country: 'Great Britain', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Cameron Wurf',                gender: 'M', country: 'Australia',    pto_rank: null, price: 13, races: ['TX', 'SA'] },
  { name: 'Filipe Azevedo',              gender: 'M', country: 'Portugal',     pto_rank: null, price: 10, races: ['TX'] },
  { name: 'Matthew Collins',             gender: 'M', country: 'Great Britain', pto_rank: null, price: 9,  races: ['TX', 'SA'] },
  { name: 'Cameron Main',                gender: 'M', country: 'Great Britain', pto_rank: 25, price: 13, races: ['TX'] },
  { name: 'Andrea Salvisberg',           gender: 'M', country: 'Sweden',       pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Arnaud Guilloux',             gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Nicholas Chase',              gender: 'M', country: 'United States', pto_rank: null, price: 9,  races: ['TX', 'SA'] },
  { name: 'Luke Jones',                  gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Ognjen Stojanovic',           gender: 'M', country: 'Serbia',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Connor Weaver',               gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Tomasz Szala',                gender: 'M', country: 'Poland',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Tom Vaelen',                  gender: 'M', country: 'Belgium',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Emil Holm',                   gender: 'M', country: 'Denmark',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'John Killeen',                gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Federico Scarabino',          gender: 'M', country: 'Uruguay',      pto_rank: null, price: 9,  races: ['TX', 'BSB'] },
  { name: 'Brock Hoel',                  gender: 'M', country: 'Canada',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Mathieu Merland',             gender: 'M', country: 'France',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'David Reynolds',              gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Lukas Stahl',                 gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Elliot Bach',                 gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Samuel Böttinger',            gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Romain Rezsohazy',            gender: 'M', country: 'Belgium',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Jamie Hayes',                 gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Pamphiel Pareyn',             gender: 'M', country: 'Belgium',      pto_rank: null, price: 9,  races: ['TX', 'SA'] },
  { name: 'Simon Shi',                   gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Almog Elazary',               gender: 'M', country: 'Israel',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Brad Bischoff',               gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Dries Matthys',               gender: 'M', country: 'Belgium',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Mitch Wismans',               gender: 'M', country: 'Netherlands',  pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Adam Feigh',                  gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Ole-Bernard Fuskevåg',        gender: 'M', country: 'Norway',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Matt Jackson',                gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Michael Arishita',            gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Scott Steenberg',             gender: 'M', country: 'Denmark',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Albert Askengren',            gender: 'M', country: 'Sweden',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Jan Kepinski',                gender: 'M', country: 'Poland',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Robert Wilkowiecki',          gender: 'M', country: 'Poland',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Matthew Richard',             gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Connor Readman',              gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Jason Pohl',                  gender: 'M', country: 'Canada',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Strahinja Trakic',            gender: 'M', country: 'Serbia',       pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Alex Ion',                    gender: 'M', country: 'Romania',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Levente Lukacs',              gender: 'M', country: 'Hungary',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Cory Mayfield',               gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Mark Saroni',                 gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Jason Quinn',                 gender: 'M', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Julian Becker',               gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Fraser Minnican',             gender: 'M', country: 'Great Britain', pto_rank: null, price: 8,  races: ['TX'] },

  // ── IRONMAN TEXAS — PRO F ─────────────────────────────────────────────────
  { name: 'Kat Matthews',                gender: 'F', country: 'Great Britain', pto_rank: 5,  price: 24, races: ['TX'] },
  { name: 'Solveig Løvseth',             gender: 'F', country: 'Norway',       pto_rank: 8,  price: 20, races: ['TX'] },
  { name: 'Taylor Knibb',                gender: 'F', country: 'United States', pto_rank: 2,  price: 26, races: ['TX'] },
  { name: 'Hannah Berry',                gender: 'F', country: 'New Zealand',  pto_rank: 15, price: 16, races: ['TX'] },
  { name: 'Lisa Perterer',               gender: 'F', country: 'Austria',      pto_rank: 16, price: 15, races: ['TX'] },
  { name: 'Sara Svensk',                 gender: 'F', country: 'Sweden',       pto_rank: null, price: 11, races: ['TX'] },
  { name: 'Marta Sánchez',               gender: 'F', country: 'Spain',        pto_rank: 27, price: 14, races: ['TX', 'SA'] },
  { name: 'Jackie Hering',               gender: 'F', country: 'United States', pto_rank: 29, price: 13, races: ['TX'] },
  { name: 'Danielle Lewis',              gender: 'F', country: 'United States', pto_rank: null, price: 10, races: ['TX'] },
  { name: 'Grace Thek',                  gender: 'F', country: 'Australia',    pto_rank: 24, price: 13, races: ['TX'] },
  { name: 'India Lee',                   gender: 'F', country: 'Great Britain', pto_rank: 20, price: 14, races: ['TX'] },
  { name: 'Jana Uderstadt',              gender: 'F', country: 'Germany',      pto_rank: null, price: 10, races: ['TX', 'SA'] },
  { name: 'Lottie Lucas',                gender: 'F', country: 'UAE',          pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Kate Curran',                 gender: 'F', country: 'Great Britain', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Rachel Zilinskas',            gender: 'F', country: 'United States', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Gabrielle Lumkes',            gender: 'F', country: 'United States', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Johanna Ahrens',              gender: 'F', country: 'Germany',      pto_rank: null, price: 9,  races: ['TX', 'SA'] },
  { name: 'Annamarie Strehlow',          gender: 'F', country: 'United States', pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Joanna Ryter',                gender: 'F', country: 'Switzerland',  pto_rank: null, price: 9,  races: ['TX'] },
  { name: 'Olivia Dietzel',              gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX', 'SA'] },
  { name: 'Leslie Homol',                gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Sarah Karpinski',             gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Margarita Ryan',              gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Katie Remond',                gender: 'F', country: 'Australia',    pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Carolyn Olsen',               gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },
  { name: 'Rebecca Kawaoka',             gender: 'F', country: 'United States', pto_rank: null, price: 8,  races: ['TX'] },

  // ── IRONMAN SOUTH AFRICA — PRO M (exclusivos ou extras) ──────────────────
  { name: 'Rasmus Svenningsson',         gender: 'M', country: 'Sweden',       pto_rank: null, price: 20, races: ['SA'] },
  { name: 'Bradley Weiss',               gender: 'M', country: 'South Africa', pto_rank: null, price: 16, races: ['SA'] },
  { name: 'Stenn Goetstouwers',          gender: 'M', country: 'Belgium',      pto_rank: null, price: 11, races: ['SA'] },
  { name: 'Jamie Riddle',                gender: 'M', country: 'South Africa', pto_rank: 21, price: 15, races: ['SA'] },
  { name: 'James Teagle',                gender: 'M', country: 'Great Britain', pto_rank: null, price: 11, races: ['SA'] },
  { name: 'Mattia Ceccarelli',           gender: 'M', country: 'Italy',        pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Matt Burton',                 gender: 'M', country: 'Australia',    pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Joshua Lewis',                gender: 'M', country: 'Guernsey',     pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Michael Weiss',               gender: 'M', country: 'Austria',      pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Florian Angert',              gender: 'M', country: 'Germany',      pto_rank: null, price: 17, races: ['SA'] },
  { name: 'Jon Breivold',                gender: 'M', country: 'Norway',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Cody Beals',                  gender: 'M', country: 'Canada',       pto_rank: null, price: 11, races: ['SA'] },
  { name: 'Paulin Philippe',             gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Erwan Jacobi',                gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Maurice Clavel',              gender: 'M', country: 'Germany',      pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Vincent Clavel',              gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Timo Schaffeld',              gender: 'M', country: 'Germany',      pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Julien Hagen',                gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Denis Chevrot',               gender: 'M', country: 'France',       pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Sven Wies',                   gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Pello Osoro',                 gender: 'M', country: 'Spain',        pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Cameron MacNair',             gender: 'M', country: 'South Africa', pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Andrew Horsfall-Turner',      gender: 'M', country: 'Great Britain', pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'William Mennesson',           gender: 'M', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Milosz Sowinski',             gender: 'M', country: 'Poland',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Niek Heldoorn',               gender: 'M', country: 'Netherlands',  pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Juan Ignacio Villarruel Curra', gender: 'M', country: 'Spain',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Georg Enzenberger',           gender: 'M', country: 'Austria',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Kit Walker',                  gender: 'M', country: 'Great Britain', pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Lukas Schnödewind',           gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Keegan Cooke',                gender: 'M', country: 'South Africa', pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Per Van Vlerken',             gender: 'M', country: 'Germany',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Michael Hesse',               gender: 'M', country: 'South Africa', pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Thomas McManners',            gender: 'M', country: 'Finland',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Michiel Stockman',            gender: 'M', country: 'Belgium',      pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Matthew Marquardt',           gender: 'M', country: 'United States', pto_rank: null, price: 20, races: ['SA'] },
  { name: 'Gregory Barnaby',             gender: 'M', country: 'France',       pto_rank: 14, price: 17, races: ['SA'] },
  { name: 'Joe Skipper',                 gender: 'M', country: 'Great Britain', pto_rank: null, price: 16, races: ['SA'] },
  { name: 'Frederic Funk',               gender: 'M', country: 'Germany',      pto_rank: null, price: 14, races: ['SA'] },
  { name: 'Pieter Heemeryck',            gender: 'M', country: 'Belgium',      pto_rank: null, price: 13, races: ['SA'] },
  { name: 'Andreas Dreitz',              gender: 'M', country: 'Germany',      pto_rank: null, price: 13, races: ['SA'] },

  // ── IRONMAN SOUTH AFRICA — PRO F (exclusivas ou extras) ──────────────────
  { name: 'Maja Stage Nielsen',          gender: 'F', country: 'Denmark',      pto_rank: null, price: 16, races: ['SA'] },
  { name: 'Els Visser',                  gender: 'F', country: 'Netherlands',  pto_rank: null, price: 15, races: ['SA'] },
  { name: 'Anne Reischmann',             gender: 'F', country: 'Germany',      pto_rank: null, price: 13, races: ['SA'] },
  { name: 'Anna Bergsten',               gender: 'F', country: 'Sweden',       pto_rank: null, price: 11, races: ['SA'] },
  { name: 'Katrine Græsbøll Christensen', gender: 'F', country: 'Denmark',     pto_rank: 30, price: 18, races: ['SA'] },
  { name: 'Magda Nieuwoudt',             gender: 'F', country: 'South Africa', pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Henrike Güber',               gender: 'F', country: 'Germany',      pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Charlène Clavel',             gender: 'F', country: 'France',       pto_rank: null, price: 10, races: ['SA'] },
  { name: 'Ruth Astle',                  gender: 'F', country: 'Great Britain', pto_rank: null, price: 12, races: ['SA'] },
  { name: 'Laura Jansen',                gender: 'F', country: 'Germany',      pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Svenja Thoes',                gender: 'F', country: 'Germany',      pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Nikita Paskiewiez',           gender: 'F', country: 'France',       pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Laura Kessler',               gender: 'F', country: 'Switzerland',  pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Tina Christmann',             gender: 'F', country: 'Germany',      pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Laura Addie',                 gender: 'F', country: 'Great Britain', pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Chloe Lane',                  gender: 'F', country: 'Australia',    pto_rank: null, price: 9,  races: ['SA'] },
  { name: 'Jamie Besse',                 gender: 'F', country: 'Switzerland',  pto_rank: null, price: 8,  races: ['SA'] },
  { name: 'Daisy Davies',                gender: 'F', country: 'Great Britain', pto_rank: null, price: 14, races: ['SA'] },
  { name: 'Penny Slater',                gender: 'F', country: 'Australia',    pto_rank: null, price: 15, races: ['SA'] },
  { name: 'Daniela Bleymehl',            gender: 'F', country: 'Germany',      pto_rank: null, price: 16, races: ['SA'] },
  { name: 'Anna Pabinger',               gender: 'F', country: 'Austria',      pto_rank: null, price: 13, races: ['SA'] },
  { name: 'Merle Brunnée',               gender: 'F', country: 'Germany',      pto_rank: null, price: 11, races: ['SA'] },

  // ── IRONMAN 70.3 BRASÍLIA — PRO M ─────────────────────────────────────────
  { name: 'Reinaldo Colucci',            gender: 'M', country: 'Brazil',       pto_rank: null, price: 18, races: ['BSB'] },
  { name: 'Igor Amorelli',               gender: 'M', country: 'Brazil',       pto_rank: null, price: 18, races: ['BSB'] },
  { name: 'Luciano Taccone',             gender: 'M', country: 'Argentina',    pto_rank: null, price: 14, races: ['BSB'] },
  { name: 'Andre Lopes',                 gender: 'M', country: 'Brazil',       pto_rank: null, price: 15, races: ['BSB'] },
  { name: 'Fernando Toldi',              gender: 'M', country: 'Brazil',       pto_rank: null, price: 22, races: ['BSB'] },
  { name: 'Vicente Saraiva Junior',      gender: 'M', country: 'Brazil',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Casimir Moine',               gender: 'M', country: 'France',       pto_rank: null, price: 11, races: ['BSB'] },
  { name: 'Flávio da Silva Queiroga',    gender: 'M', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Cenzino Lebot',               gender: 'M', country: 'France',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Matheus Diniz',               gender: 'M', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Rafael Pires',                gender: 'M', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Enzo Krauss',                 gender: 'M', country: 'Brazil',       pto_rank: null, price: 16, races: ['BSB'] },
  { name: 'Brian Llamas',                gender: 'M', country: 'Mexico',       pto_rank: null, price: 11, races: ['BSB'] },
  { name: 'João Teixeira Álvares Neto',  gender: 'M', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Gabriel Klein',               gender: 'M', country: 'Brazil',       pto_rank: null, price: 13, races: ['BSB'] },
  { name: 'Vicente Hernández Cabrera',   gender: 'M', country: 'Spain',        pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Diego Moya',                  gender: 'M', country: 'Chile',        pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Miguel Hidalgo',              gender: 'M', country: 'Mexico',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Danilo Melo',                 gender: 'M', country: 'Brazil',       pto_rank: null, price: 8,  races: ['BSB'] },
  { name: 'Danilo Pimentel',             gender: 'M', country: 'Brazil',       pto_rank: null, price: 14, races: ['BSB'] },
  { name: 'Yago Rodrigues',              gender: 'M', country: 'Brazil',       pto_rank: null, price: 11, races: ['BSB'] },
  { name: 'Bruno Matheus',               gender: 'M', country: 'Brazil',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Paulo Roberto Maciel',        gender: 'M', country: 'Brazil',       pto_rank: null, price: 8,  races: ['BSB'] },

  // ── IRONMAN 70.3 BRASÍLIA — PRO F ─────────────────────────────────────────
  { name: 'Pamella Oliveira',            gender: 'F', country: 'Brazil',       pto_rank: null, price: 20, races: ['BSB'] },
  { name: 'Rachel Olson',                gender: 'F', country: 'United States', pto_rank: null, price: 12, races: ['BSB'] },
  { name: 'Mikelle Coelho',              gender: 'F', country: 'Brazil',       pto_rank: null, price: 13, races: ['BSB'] },
  { name: 'Sinem Francisca Tous Servera', gender: 'F', country: 'Turkey',      pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Fernanda Penkal',             gender: 'F', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Caitlin Alexander',           gender: 'F', country: 'United States', pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Rachel Faulds',               gender: 'F', country: 'Canada',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Luiza Pais',                  gender: 'F', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
  { name: 'Luma Guillen',                gender: 'F', country: 'Brazil',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Maryannie Ortega',            gender: 'F', country: 'Brazil',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Adriana Carreño Cruz',        gender: 'F', country: 'Mexico',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Pietra Picolo Meneghini',     gender: 'F', country: 'Brazil',       pto_rank: null, price: 15, races: ['BSB'] },
  { name: 'Bruna Stolf',                 gender: 'F', country: 'Brazil',       pto_rank: null, price: 9,  races: ['BSB'] },
  { name: 'Djenyfer Arnold',             gender: 'F', country: 'Brazil',       pto_rank: null, price: 10, races: ['BSB'] },
]

// Normalize race shorthand to IDs
const raceMap = { TX, SA, BSB }

// ─── 3. Upsert athletes ───────────────────────────────────────────────────────

const athleteRecords = ATHLETES.map(({ races, price, ...a }) => ({
  name: a.name,
  gender: a.gender,
  type: 'pro',
  country: a.country,
  pto_rank: a.pto_rank ?? null,
  age_group: null,
  club: null,
  current_price: price,
  price_change: 0,
}))

const { data: insertedAthletes, error: athErr } = await sb
  .from('athletes')
  .upsert(athleteRecords, { onConflict: 'name,gender,type' })
  .select('id, name, gender, current_price')

if (athErr) { console.error('athletes error:', athErr); process.exit(1) }
console.log(`\n✓ Atletas: ${insertedAthletes.length} (PROs)`)

// Build name → id map
const byNameGender = {}
for (const a of insertedAthletes) {
  byNameGender[`${a.name}|${a.gender}`] = a
}

// ─── 4. Upsert race_athletes ──────────────────────────────────────────────────

const raRows = []
for (const def of ATHLETES) {
  const athlete = byNameGender[`${def.name}|${def.gender}`]
  if (!athlete) { console.warn(`  ⚠ Atleta não encontrado: ${def.name}`); continue }
  for (const rShort of def.races) {
    const rid = raceMap[rShort]
    if (!rid) continue
    raRows.push({ race_id: rid, athlete_id: athlete.id, price: def.price })
  }
}

const { data: raInserted, error: raErr } = await sb
  .from('race_athletes')
  .upsert(raRows, { onConflict: 'race_id,athlete_id' })
  .select('id')

if (raErr) { console.error('race_athletes error:', raErr); process.exit(1) }
console.log(`✓ Race athletes: ${raInserted.length} entradas`)

// ─── 5. Summary ───────────────────────────────────────────────────────────────

const txCount  = raRows.filter(r => r.race_id === TX).length
const saCount  = raRows.filter(r => r.race_id === SA).length
const bsbCount = raRows.filter(r => r.race_id === BSB).length

console.log('\n📊 Atletas por prova:')
console.log(`  IRONMAN Texas:         ${txCount} PROs`)
console.log(`  IRONMAN South Africa:  ${saCount} PROs`)
console.log(`  IRONMAN 70.3 Brasília: ${bsbCount} PROs`)

// Athletes in multiple races
const multiRace = ATHLETES.filter(a => a.races.length > 1)
console.log(`\n🔄 Atletas em múltiplas provas: ${multiRace.length}`)
multiRace.forEach(a => console.log(`  ${a.name} (${a.races.join(', ')})`))

console.log('\n✅ Seed concluído!')
