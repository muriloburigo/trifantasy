'use client'
import { useState } from 'react'
import { Download, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react'
import { bulkImportAthletes } from '~/app/admin/atletas/actions'
import type { ScrapedAthlete } from '~/lib/scrapers'

function priceFromPtoRank(rank: number | null): number {
  if (!rank) return 10
  if (rank <= 7)   return 35
  if (rank <= 15)  return 28
  if (rank <= 25)  return 22
  if (rank <= 40)  return 18
  if (rank <= 60)  return 15
  if (rank <= 80)  return 12
  if (rank <= 120) return 11
  return 10
}

function isPro(a: ScrapedAthlete): boolean {
  if (!a.division) return true // assume PRO if no division info
  const d = a.division.toUpperCase()
  return d.includes('PRO') || d === 'MPRO' || d === 'FPRO'
}

interface Race { id: string; name: string; date: string; status: string }

export default function ImportarStartlist({ races }: { races: Race[] }) {
  const [url, setUrl]           = useState('')
  const [raceId, setRaceId]     = useState(races[0]?.id ?? '')
  const [loading, setLoading]   = useState(false)
  const [scraped, setScraped]   = useState<ScrapedAthlete[] | null>(null)
  const [source, setSource]     = useState('')
  const [fetchError, setFetchError] = useState('')
  const [onlyPro, setOnlyPro]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted?: number; errors?: string[] } | null>(null)

  async function handleFetch() {
    if (!url.trim()) return
    setLoading(true)
    setScraped(null)
    setFetchError('')
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'startlist' }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchError(data.error)
      } else {
        setScraped(data.athletes ?? [])
        setSource(data.source ?? '')
      }
    } catch (e: any) {
      setFetchError(e.message ?? 'Erro ao buscar')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!scraped || !raceId) return
    const filtered = onlyPro ? scraped.filter(isPro) : scraped
    if (filtered.length === 0) return

    const json = JSON.stringify(
      filtered.map(a => ({
        name: a.name,
        gender: a.gender ?? 'M',
        type: isPro(a) ? 'pro' : 'age_grouper',
        country: a.country,
        country_code: a.country_code,
        pto_rank: a.pto_rank,
        price: priceFromPtoRank(a.pto_rank),
        bib: a.bib,
      }))
    )

    setImporting(true)
    setImportResult(null)
    const res = await bulkImportAthletes(raceId, json)
    setImportResult(res)
    setImporting(false)
    if (!res.errors?.length) setScraped(null)
  }

  const filtered = scraped ? (onlyPro ? scraped.filter(isPro) : scraped) : []
  const hasDivisions = scraped?.some(a => a.division) ?? false

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-[var(--color-orange)]" />
        <h2 className="text-lg font-bold">Importar Startlist</h2>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--color-muted)] mb-1 block">URL da página de startlist</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              placeholder="https://protriathletes.org/events/2026-pTO-european-open/startlist"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Vincular à prova</label>
            <select
              value={raceId}
              onChange={e => setRaceId(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            >
              {races.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)] px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {loading ? 'Buscando...' : 'Buscar Startlist'}
        </button>

        {fetchError && (
          <div className="flex items-start gap-2 text-sm text-[var(--color-danger)] bg-red-950/30 rounded-lg p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {fetchError}
          </div>
        )}

        {scraped !== null && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm">
                <span className="font-bold text-white">{scraped.length}</span>
                <span className="text-[var(--color-muted)]"> atletas encontrados · fonte: </span>
                <span className="text-[var(--color-orange)]">{source}</span>
              </p>
              {hasDivisions && (
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyPro}
                    onChange={e => setOnlyPro(e.target.checked)}
                  />
                  <span className="text-[var(--color-muted)]">Apenas PRO</span>
                </label>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="rounded-xl border border-[var(--color-navy-border)] overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)] bg-[var(--color-navy-elevated)]">
                        <th className="text-left px-3 py-2 font-medium">Nome</th>
                        <th className="px-2 py-2 font-medium">Gênero</th>
                        <th className="px-2 py-2 font-medium">País</th>
                        {hasDivisions && <th className="px-2 py-2 font-medium">Divisão</th>}
                        <th className="px-2 py-2 font-medium">Rank PTO</th>
                        <th className="px-2 py-2 font-medium">Preço est.</th>
                        <th className="px-2 py-2 font-medium">Bib</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-navy-border)]">
                      {filtered.map((a, i) => (
                        <tr key={i} className="hover:bg-[var(--color-navy-elevated)]/20">
                          <td className="px-3 py-1.5 font-medium">{a.name}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={a.gender === 'F' ? 'text-pink-400' : 'text-blue-400'}>
                              {a.gender ?? '?'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center text-[var(--color-muted)]">
                            {a.country_code ?? a.country ?? '—'}
                          </td>
                          {hasDivisions && (
                            <td className="px-2 py-1.5 text-center text-[var(--color-muted)]">
                              {a.division ?? '—'}
                            </td>
                          )}
                          <td className="px-2 py-1.5 text-center text-[var(--color-muted)]">
                            {a.pto_rank ? `#${a.pto_rank}` : '—'}
                          </td>
                          <td className="px-2 py-1.5 text-center font-bold text-[var(--color-orange)]">
                            T${priceFromPtoRank(a.pto_rank)}
                          </td>
                          <td className="px-2 py-1.5 text-center text-[var(--color-muted)]">
                            {a.bib ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-sm text-[var(--color-muted)] text-center py-4">
                Nenhum atleta {onlyPro ? 'PRO ' : ''}encontrado. {hasDivisions && 'Desmarque "Apenas PRO" para ver todos.'}
              </p>
            )}

            {importResult && (
              <div className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
                importResult.errors?.length ? 'bg-yellow-950/30 text-yellow-400' : 'bg-green-950/30 text-[var(--color-success)]'
              }`}>
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p>{importResult.inserted} atleta(s) importado(s) com sucesso.</p>
                  {importResult.errors?.map((e, i) => (
                    <p key={i} className="text-[var(--color-danger)] text-xs mt-1">{e}</p>
                  ))}
                </div>
              </div>
            )}

            {filtered.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing || !raceId}
                className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {importing ? 'Importando...' : `Importar ${filtered.length} atleta${filtered.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
