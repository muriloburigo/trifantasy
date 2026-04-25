'use client'
import { useState } from 'react'
import { createClient } from '~/lib/supabase/client'
import { MessageCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

const SUBJECTS = [
  'Dúvida sobre as regras',
  'Problema com meu elenco',
  'Problema com pontuação',
  'Sugestão de melhoria',
  'Erro ou bug no site',
  'Outro',
]

export default function SuportePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill if logged in
  useState(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      if (user.user_metadata?.name) setName(user.user_metadata.name)
      if (user.email) setEmail(user.email)
    })
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject) { setError('Selecione um assunto.'); return }
    if (message.trim().length < 20) { setError('Descreva sua dúvida com ao menos 20 caracteres.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('support_tickets').insert({
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
    })

    if (err) {
      setError('Erro ao enviar. Tente novamente.')
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[var(--color-success)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Mensagem enviada!</h1>
        <p className="text-[var(--color-muted)] text-sm mb-8 leading-relaxed">
          Recebemos sua mensagem e retornaremos em breve no e-mail <strong>{email}</strong>.
        </p>
        <Link href="/" className="text-[var(--color-orange)] font-semibold hover:underline">
          Voltar para a home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle size={22} className="text-[var(--color-orange)]" />
          <h1 className="text-2xl font-bold">Suporte</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Tem alguma dúvida ou problema? Preencha o formulário e entraremos em contato.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-5">
        {error && (
          <p className="text-[var(--color-danger)] text-xs bg-red-950/20 border border-red-900/30 rounded-lg p-3">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Nome</label>
            <input
              type="text" required
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">E-mail</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Assunto</label>
          <select
            required
            value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          >
            <option value="">Selecione um assunto...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Mensagem</label>
          <textarea
            required rows={5}
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors resize-none"
          />
          <p className="text-[10px] text-[var(--color-muted)] mt-1 text-right">{message.length} caracteres</p>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
          {loading ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>
    </div>
  )
}
