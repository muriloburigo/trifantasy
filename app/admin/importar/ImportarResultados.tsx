'use client'
import { useState } from 'react'
import { Download, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'
import { bulkImportResults } from '~/app/admin/resultados/actions'
import type { ScrapedResult } from '~/lib/scrapers'
import { formatTime } from '~/lib/utils'

interface Race { id: string; name: string; date: string; status: string }

export default function ImportarResultados({ races }: { races: Race[] }) {
  const [url, setUrl]           = useState('')
  const [raceId, setRaceId]     = useState(races[0]?.id ?? '')
  const [loading, setLoading]   = useState(false)
  const [scraped, setScraped]   = useState<ScrapedResult[] | null>(null)
  const [source, setSource]     = useState('')
  const [fetchError, setFetchError] = useState('')
  const [importing, setImporting]   = useState(false)
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
        body: JSON.stringify({ url: url.trim(), type: 'results' }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchError(data.error)
      } else {
        setScraped(data.results ?? [])
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
    const json = JSON.stringify(
      scraped.map(r => ({
        athlete_name: r.name,
        bib: r.bib,
        pro_pos: r.pro_pos,
        swim_time: r.swim_time,
        t1_time: r.t1_time,
        bike_time: r.bike_time,
        t2_time: r.t2_time,
        run_time: r.run_time,
        finish_time: r.finish_time,
        dnf: r.dnf,
        dns: r.dns,
      }))
    )
    setImporting(true)
    setImportResult(null)
    const res = await bulkImportResults(raceId, json)
    setImportResult(res)
    setImporting(false)
    if (!res.errors?.length) setScraped(null)
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-[var(--color-orange)]" />
        <h2 className="text-lg font-bold">Importar Resultados</h2>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--color-muted)] mb-1 block">URL da página de resultados</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              placeholder="https://protriathletes.org/events/2026-pTO-european-open/results"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Prova</label>
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
          {loading ? 'Buscando...' : 'Buscar Resultados'}
        </button>

        {fetchError && (
          <div className="flex items-start gap-2 text-sm text-[var(--color-danger)] bg-red-950/30 rounded-lg p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {fetchError}
          </div>
        )}

        {scraped !== null && (
          <>
            <p className="text-sm">
              <span className="font-bold text-white">{scraped.length}</span>
              <span className="text-[var(--color-muted)]"> resultados encontrados · fonte: </span>
              <span className="text-[var(--color-orange)]">{source}</span>
            </p>

            {scraped.length > 0 && (
              <div className="rounded-xl border border-[var(--color-navy-border)] overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)] bg-[var(--color-navy-elevated)]">
                        <th className="text-left px-3 py-2 font-medium">Nome</th>
                        <th className="px-2 py-2 font-medium">Pos</th>
                        <th className="px-2 py-2 font-medium">Nado</th>
                        <th className="px-2 py-2 font-medium">Bike</th>
                        <th className="px-2 py-2 font-medium">Corrida</th>
                        <th className="px-2 py-2 font-medium">Total</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-navy-border)]">
                      {scraped.map((r, i) => (
                        <tr key={i} className="hover:bg-[var(--color-navy-elevated)]/20">
                          <td className="px-3 py-1.5 font-medium">{r.name}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--color-muted)]">{r.pro_pos ?? '—'}</td>
                          <td className="px-2 py-1.5 text-center font-mono text-[var(--color-muted)]">{formatTime(r.swim_time)}</td>
                          <td className="px-2 py-1.5 text-center font-mono text-[var(--color-muted)]">{formatTime(r.bike_time)}</td>
                          <td className="px-2 py-1.5 text-center font-mono text-[var(--color-muted)]">{formatTime(r.run_time)}</td>
                          <td className="px-2 py-1.5 text-center font-mono">{formatTime(r.finish_time)}</td>
                          <td className="px-2 py-1.5 text-center">
                            {r.dnf ? <span className="text-[var(--color-danger)] font-bold">DNF</span>
                              : r.dns ? <span className="text-[var(--color-muted)] font-bold">DNS</span>
                              : <span className="text-[var(--color-success)]">OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scraped.length === 0 && (
              <p className="text-sm text-[var(--color-muted)] text-center py-4">
                Nenhum resultado encontrado nesta URL.
              </p>
            )}

            {importResult && (
              <div className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
                importResult.errors?.length ? 'bg-yellow-950/30 text-yellow-400' : 'bg-green-950/30 text-[var(--color-success)]'
              }`}>
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p>{importResult.inserted} resultado(s) importado(s).</p>
                  {importResult.errors?.map((e, idx) => (
                    <p key={idx} className="text-[var(--color-danger)] text-xs mt-1">{e}</p>
                  ))}
                  {(importResult.errors?.length ?? 0) > 0 && (
                    <p className="text-xs mt-2 text-[var(--color-muted)]">
                      Erros acima indicam atletas não encontrados na startlist desta prova. Importe a startlist primeiro.
                    </p>
                  )}
                </div>
              </div>
            )}

            {scraped.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing || !raceId}
                className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {importing ? 'Importando...' : `Importar ${scraped.length} resultado${scraped.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
