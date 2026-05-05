'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { Check, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { addMemberById } from '../criar/actions'

type Profile = { id: string; name: string; photo_url: string | null }

export default function AddMemberForm({ leagueId }: { leagueId: string }) {
  const t = useTranslations('leagues')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&league_id=${leagueId}`)
      if (res.ok) {
        const data: Profile[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, leagueId])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleSelect(profile: Profile) {
    setOpen(false)
    setQuery('')
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await addMemberById(leagueId, profile.id)
      if (result?.error) setError(result.error)
      else setSuccess(`${profile.name} adicionado à liga!`)
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-2 bg-[var(--color-navy-elevated)] border rounded-lg px-3 py-2 transition-colors ${open ? 'border-[var(--color-orange)]' : 'border-[var(--color-navy-border)]'}`}>
        <Search size={14} className="text-[var(--color-muted)] shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setError(''); setSuccess('') }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('addMemberPlaceholder')}
          disabled={isPending}
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
        />
        {isPending && <span className="text-[10px] text-[var(--color-muted)]">...</span>}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden shadow-xl">
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div className={`w-7 h-7 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white ${!p.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''}`}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  : p.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      {success && (
        <p className="mt-1.5 text-xs text-[var(--color-success)] flex items-center gap-1">
          <Check size={11} />{success}
        </p>
      )}
    </div>
  )
}
