import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import UserMenu from './UserMenu'

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-navy-border)] bg-[var(--color-navy-card)]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight">
            <span className="text-[var(--color-orange)]">Tri</span>Fantasy
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
            <Link href="/" className="hover:text-white transition-colors">Provas</Link>
            {user && (
              <Link href="/ligas" className="hover:text-white transition-colors">Minhas Ligas</Link>
            )}
          </nav>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-navy-border)] py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
          <span><span className="text-[var(--color-orange)] font-bold">Tri</span>Fantasy — Fantasy Game de Triathlon</span>
          <span>Não afiliado ao Ironman/WTC. Apenas para fins recreativos.</span>
        </div>
      </footer>
    </div>
  )
}
