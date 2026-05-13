export type RaceDistance = 'full' | '70.3' | 'T100' | 'olympic' | 'ows' | 'other'
export type RaceStatus = 'upcoming' | 'open' | 'locked' | 'finished'
export type AthleteType = 'pro' | 'age_grouper'
export type Gender = 'M' | 'F'

export interface Race {
  id: string
  name: string
  slug: string
  date: string
  location: string
  country: string
  country_code: string | null
  distance: RaceDistance
  has_pro_field: boolean
  status: RaceStatus
  image_url: string | null
  created_at: string
}

export interface Athlete {
  id: string
  name: string
  country: string | null
  country_code: string | null
  club: string | null
  gender: Gender
  type: AthleteType
  age_group: string | null
  pto_rank: number | null
  wtcs_rank?: number | null
  photo_url?: string | null
  current_price?: number
  price_change?: number
  created_at: string
}

export interface RaceAthlete {
  id: string
  race_id: string
  athlete_id: string
  bib: number | null
  price: number
  athlete?: Athlete
}

export interface Result {
  id: string
  race_id: string
  athlete_id: string
  overall_pos: number | null
  ag_pos: number | null
  pro_pos: number | null
  swim_time: number | null   // seconds
  t1_time: number | null
  bike_time: number | null
  t2_time: number | null
  run_time: number | null
  finish_time: number | null
  dnf: boolean
  dns: boolean
  kona_slot?: boolean
}

export interface Profile {
  id: string
  name: string | null
  country: string | null
  is_admin: boolean
  created_at: string
}

export interface Team {
  id: string
  user_id: string
  created_at: string
  updated_at?: string
  athletes?: TeamAthleteRow[]
  score?: Score
  profile?: Profile
}

export interface TeamAthleteRow {
  team_id: string
  athlete_id: string
  athlete?: Athlete
  race_athlete?: RaceAthlete
}

export interface Score {
  id: string
  team_id: string
  total_points: number
  breakdown: ScoreBreakdown[] | null
  calculated_at: string
}

export interface ScoreBreakdown {
  athlete_id: string
  athlete_name: string
  type: AthleteType
  base_points: number
  bonus_points: number
  total: number
  detail: string[]
}

export interface League {
  id: string
  name: string
  invite_code: string
  owner_id: string
  is_public: boolean
  created_at: string
  member_count?: number
}

export interface LeagueMember {
  league_id: string
  user_id: string
  joined_at: string
  profile?: Profile
  team?: Team
  score?: Score
}

// Budget constant
export const INITIAL_WALLET = 100
export const TEAM_BUDGET = 100
export const TEAM_SIZE = 5
export const MAX_SAME_CLUB = 2
