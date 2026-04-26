import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import PageHeader from './_components/PageHeader'
import Indicators from './dashboard/Indicators'

export default async function AdminInsightsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  // 1. Fetch current portfolio for popularity metrics
  const { data: portfolioData } = await supabase
    .from('portfolio')
    .select('athlete_id, athlete:athletes(name, current_price, pto_rank, wtcs_rank)')

  const athleteCounts: Record<string, { name: string; count: number; price: number; rank: number }> = {}
  portfolioData?.forEach(p => {
    const a = p.athlete as any
    if (!a) return
    if (!athleteCounts[p.athlete_id]) {
      const bestRank = Math.min(a.pto_rank ?? 1000, a.wtcs_rank ?? 1000)
      athleteCounts[p.athlete_id] = { name: a.name, count: 0, price: Number(a.current_price), rank: bestRank }
    }
    athleteCounts[p.athlete_id].count++
  })
  
  const topPicked = Object.values(athleteCounts).sort((a, b) => b.count - a.count).slice(0, 10)

  // 2. Fetch all Pros for Sleepers
  const { data: allPros } = await supabase
    .from('athletes')
    .select('id, name, current_price, pto_rank, wtcs_rank')
    .eq('type', 'pro')
    .or('pto_rank.lte.40,wtcs_rank.lte.40')

  // 3. Economy & User counts
  const [profilesRes, usersRes, lastRaceRes, leaguesRes] = await Promise.all([
    supabase.from('profiles').select('wallet'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('races').select('id, name').eq('status', 'finished').order('date', { ascending: false }).limit(1).single(),
    supabase.from('leagues').select('id, member_count').eq('is_public', false)
  ])

  const userCount = usersRes.count ?? 1
  const inWallets = (profilesRes.data ?? []).reduce((acc, p) => acc + Number(p.wallet), 0)
  const inAthletes = (portfolioData ?? []).reduce((acc, p) => acc + Number((p.athlete as any)?.current_price ?? 0), 0)

  const sleepers = (allPros ?? [])
    .map(a => {
      const ownership = athleteCounts[a.id]?.count ?? 0
      const bestRank = Math.min(a.pto_rank ?? 1000, a.wtcs_rank ?? 1000)
      return { ...a, ownership, bestRank }
    })
    .filter(a => a.ownership < userCount * 0.15)
    .sort((a, b) => a.bestRank - b.bestRank)
    .slice(0, 5)

  // Top performers
  let topPerformers: any[] = []
  if (lastRaceRes.data) {
    const { data: lastScores } = await supabase
      .from('scores')
      .select('total_points, teams!inner(race_id, profile:profiles(name))')
      .eq('teams.race_id', lastRaceRes.data.id)
      .order('total_points', { ascending: false })
      .limit(5)
    
    topPerformers = lastScores?.map(s => ({
      name: (s.teams as any).profile.name,
      points: s.total_points
    })) ?? []
  }

  // Leagues
  const privateLeagues = leaguesRes.data ?? []
  const leagueStats = {
    count: privateLeagues.length,
    avgMembers: privateLeagues.length > 0 
      ? privateLeagues.reduce((acc, l) => acc + (l.member_count ?? 0), 0) / privateLeagues.length 
      : 0
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Insights de Conteúdo"
        description="Dados e tendências para gerar conteúdo e gerenciar a comunidade"
      />

      <div className="mt-6 sm:mt-8">
        <Indicators 
          topPicked={topPicked} 
          sleepers={sleepers}
          topPerformers={topPerformers}
          marketInsights={{
            totalCoins: inWallets + inAthletes,
            inWallets,
            inAthletes,
            userCount,
            leagueStats
          }}
        />
      </div>
    </div>
  )
}
