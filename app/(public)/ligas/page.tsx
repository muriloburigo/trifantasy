import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import { formatDate } from '~/lib/utils'
import { Plus, Trophy, Users } from 'lucide-react'

export default async function LigasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ligas que o usuário participa
  const { data: memberships } = await supabase
    .from('league_members')
    .select('league:leagues(*, race:races(name, date, slug))')
    .eq('user_id', user.id)

  const leagues = (memberships ?? []).map((m: any) => m.league).filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Minhas Ligas</h1>
        <Link
          href="/ligas/criar"
          className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Criar liga
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)]">
          <Trophy size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Você não participa de nenhuma liga ainda.</p>
          <p className="text-sm mt-1 mb-6">Crie uma liga e convide seus amigos.</p>
          <Link
            href="/ligas/criar"
            className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Criar primeira liga
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leagues.map((league: any) => (
            <Link
              key={league.id}
              href={`/ligas/${league.id}`}
              className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-2xl p-5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{league.name}</h3>
                  <p className="text-sm text-[var(--color-muted)] mt-0.5">{league.race?.name}</p>
                </div>
                <Trophy size={18} className="text-[var(--color-orange)] opacity-60" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <Users size={12} />
                <span>Código: <span className="font-mono text-[var(--color-text)]">{league.invite_code}</span></span>
              </div>
              {league.race && (
                <p className="text-xs text-[var(--color-muted)] mt-1">{formatDate(league.race.date)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
