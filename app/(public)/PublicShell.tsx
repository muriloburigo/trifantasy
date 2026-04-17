import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import UserMenu from './UserMenu'

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-navy-border)] bg-[var(--color-navy-card)]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
            <Link href="/" className="hover:text-white transition-colors">Provas</Link>
            <Link href="/ligas" className="hover:text-white transition-colors">Trix Leagues</Link>
            <Link href="/regras" className="hover:text-white transition-colors">Regras</Link>
          </nav>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-navy-border)] py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
          <span style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)] font-bold">TRIX</span><span className="text-white font-bold">ER</span>
            <span className="ml-2">— Jogo de escalação do endurance</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/regras" className="hover:text-white transition-colors">Regras</Link>
            <span>Não afiliado ao Ironman/WTC. Apenas para fins recreativos.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
