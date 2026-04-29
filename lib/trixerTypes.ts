/**
 * Shared types for Trixer card templates.
 * Field names are normalised to the real Trixer DB schema.
 */

export type Athlete = {
  id: string
  name: string
  /** ISO 3166-1 alpha-2 country code, lowercase */
  country: string
  countryFlag: string // e.g. "🇧🇷"
  photoUrl?: string
  /** current_price in T$ */
  currentT: number
  /** price_change over the period (positive or negative) */
  deltaT: number
  /** pto_rank (optional) */
  rank?: number
}

export type Race = {
  id: string
  name: string
  /** ISO date */
  date: string
  location: string
  distance: string // e.g. "full", "T100", "70.3"
  series?: string
}

export type PodiumEntry = {
  athlete: Athlete
  /** finish time as displayed string, e.g. "3:31:42" */
  time: string
  /** delta vs winner, e.g. "+02:14" or "—" */
  gap: string
}

export type Roster = {
  trixerName: string
  leagueName: string
  athletes: Athlete[] // up to 5
  totalT: number
}

export type LeagueStanding = {
  position: number
  name: string
  walletT: number
  athletesT: number
  totalT: number
  initials: string
  avatarUrl?: string
}

export type CardFormat = 'feed' | 'story'

export type TemplateId =
  | 'power-ranking'
  | 'race-preview'
  | 'race-recap'
  | 'my-roster'
  | 'league-standings'

export const FORMAT_DIMENSIONS: Record<CardFormat, { w: number; h: number; label: string }> = {
  feed:  { w: 1080, h: 1350, label: 'Feed (4:5)' },
  story: { w: 1080, h: 1920, label: 'Story (9:16)' },
}
