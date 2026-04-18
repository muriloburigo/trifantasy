import Link from 'next/link'
import { createClient, createPublicClient } from '~/lib/supabase/server'
import { formatDate } from '~/lib/utils'
import { Plus, Trophy, Users, Lock } from 'lucide-react'
import BackLink from '~/app/components/BackLink'

export default async function LigasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const pub = createPublicClient()

  // Ligas do usuário logado
  let myLeagues: any[] = []
  if (user) {
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league:leagues(*, race:races(name, date, slug))')
      .eq('user_id', user.id)
    myLeagues = (memberships ?? []).map((m: any) => m.league).filter(Boolean)
  }

  // Estatísticas públicas
  const { count: totalLeagues } = await pub.from('leagues').select('*', { count: 'exact', head: true })
  const { count: totalTeams } = await pub.from('teams').select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Trix Leagues</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {totalLeagues ?? 0} ligas criadas · {totalTeams ?? 0} times montados
          </p>
        </div>
        {user && (
          <Link
            href="/ligas/criar"
            className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Criar liga
          </Link>
        )}
      </div>

      {/* Usuário não logado — CTA */}
      {!user && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 rounded-2xl p-8 mb-8 text-center">
          <Trophy size={36} className="mx-auto mb-3 text-[var(--color-orange)] opacity-80" />
          <h2 className="text-lg font-bold mb-2">Crie sua Trix League</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto mb-6">
            Crie uma liga privada, convide seus amigos e disputem quem monta o melhor time.
            Onde inteligência vence — só entra com código de convite.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--color-muted)] hover:text-white transition-colors"
            >
              Já tenho conta →
            </Link>
          </div>
        </div>
      )}

      {/* Usuário logado — Minhas ligas */}
      {user && (
        <>
          {myLeagues.length === 0 ? (
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
              {myLeagues.map((league: any) => (
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
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className="flex items-center gap-1"><Lock size={10} />Privada</span>
                    <span className="flex items-center gap-1.5">
                      <Users size={10} />Código: <span className="font-mono text-[var(--color-text)]">{league.invite_code}</span>
                    </span>
                  </div>
                  {league.race && (
                    <p className="text-xs text-[var(--color-muted)] mt-1">{formatDate(league.race.date)}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Entrar em liga existente */}
      <div className="mt-10 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-1">Tem um código de convite?</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">Entre em uma liga privada com o código enviado por um amigo.</p>
        {user ? (
          <Link href="/ligas/criar" className="text-sm text-[var(--color-orange)] hover:underline">
            Ir para entrar com código →
          </Link>
        ) : (
          <Link href="/register" className="text-sm text-[var(--color-orange)] hover:underline">
            Crie uma conta para entrar →
          </Link>
        )}
      </div>
    </div>
  )
}
