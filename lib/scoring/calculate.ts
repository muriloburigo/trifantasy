import type { Result, AthleteType, ScoreBreakdown } from '~/lib/types'

// PRO position points
const PRO_POINTS: Record<number, number> = {
  1: 50, 2: 40, 3: 33, 4: 27, 5: 22,
  6: 15, 7: 15, 8: 15, 9: 15, 10: 15,
}

function getProPositionPoints(pos: number): number {
  if (pos in PRO_POINTS) return PRO_POINTS[pos]
  if (pos <= 20) return 8
  return 3
}

// AG position points (pos = 1-indexed, total = total finishers in AG)
function getAgPositionPoints(pos: number, total: number): number {
  if (pos === 1) return 30
  if (pos === 2) return 24
  if (pos === 3) return 19
  if (pos <= 10) return 13
  const pct = pos / total
  if (pct <= 0.25) return 8
  if (pct <= 0.50) return 5
  if (pct <= 0.75) return 2
  return 1
}

export interface AthleteForScoring {
  athlete_id: string
  athlete_name: string
  type: AthleteType
  result: Result
  // For AG bonus calculations we need context
  fastest_swim_overall?: number  // seconds, best in pro/ag field
  fastest_bike_overall?: number
  fastest_run_overall?: number
  fastest_swim_ag?: number       // best in same AG
  fastest_bike_ag?: number
  fastest_run_ag?: number
  ag_total_finishers?: number    // total finishers in this AG
}

export function scoreAthlete(a: AthleteForScoring): ScoreBreakdown {
  const r = a.result
  const detail: string[] = []
  let base = 0
  let bonus = 0

  if (r.dns || r.dnf) {
    detail.push(r.dns ? 'DNS — 0 pts' : 'DNF — 0 pts')
    return { athlete_id: a.athlete_id, athlete_name: a.athlete_name, type: a.type, base_points: 0, bonus_points: 0, total: 0, detail }
  }

  if (a.type === 'pro') {
    const pos = r.pro_pos ?? 0
    base = getProPositionPoints(pos)
    detail.push(`${pos}º no campo PRO → ${base} pts`)

    // Segment bonuses (best overall)
    if (a.fastest_swim_overall !== undefined && r.swim_time === a.fastest_swim_overall) {
      bonus += 6; detail.push('Melhor natação geral +6')
    }
    if (a.fastest_bike_overall !== undefined && r.bike_time === a.fastest_bike_overall) {
      bonus += 6; detail.push('Melhor ciclismo geral +6')
    }
    if (a.fastest_run_overall !== undefined && r.run_time === a.fastest_run_overall) {
      bonus += 6; detail.push('Melhor corrida geral +6')
    }
    if (r.kona_slot) {
      bonus += 10; detail.push('Course record +10')
    }
  } else {
    // Age grouper
    const total = a.ag_total_finishers ?? 1
    const pos = r.ag_pos ?? 0
    base = getAgPositionPoints(pos, total)
    detail.push(`${pos}º no AG (${total} finishers) → ${base} pts`)

    if (a.fastest_swim_ag !== undefined && r.swim_time === a.fastest_swim_ag) {
      bonus += 4; detail.push('Melhor natação no AG +4')
    }
    if (a.fastest_bike_ag !== undefined && r.bike_time === a.fastest_bike_ag) {
      bonus += 4; detail.push('Melhor ciclismo no AG +4')
    }
    if (a.fastest_run_ag !== undefined && r.run_time === a.fastest_run_ag) {
      bonus += 4; detail.push('Melhor corrida no AG +4')
    }
    if (r.kona_slot) {
      bonus += 8; detail.push('Classificado para Worlds +8')
    }
  }

  return {
    athlete_id: a.athlete_id,
    athlete_name: a.athlete_name,
    type: a.type,
    base_points: base,
    bonus_points: bonus,
    total: base + bonus,
    detail,
  }
}
