'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Senha deve ter ao menos 6 caracteres.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          </Link>
          <p className="text-[var(--color-muted)] mt-2 text-sm">Criar conta — é grátis</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)]">
          {error && (
            <p className="text-[var(--color-danger)] text-sm text-center bg-red-950/30 rounded-lg p-3">{error}</p>
          )}

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Nome</label>
            <input
              type="text" required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Email</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Senha</label>
            <input
              type="password" required minLength={6}
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="text-xs text-[var(--color-muted)] text-center">
            Ao criar sua conta, você concorda com nossa{' '}
            <Link href="/privacidade" className="text-[var(--color-orange)] hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-[var(--color-orange)] hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
