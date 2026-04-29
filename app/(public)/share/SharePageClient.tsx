'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'
import { Download, Loader2, Sparkles } from 'lucide-react'

import type { CardFormat, TemplateId, Athlete, Race, PodiumEntry, Roster, LeagueStanding } from '~/lib/trixerTypes'
import { FORMAT_DIMENSIONS } from '~/lib/trixerTypes'
import { CardPreview } from '~/app/components/cards/CardPreview'
import { PowerRankingCard } from '~/app/components/cards/PowerRankingCard'
import { RacePreviewCard } from '~/app/components/cards/RacePreviewCard'
import { RaceRecapCard } from '~/app/components/cards/RaceRecapCard'
import { MyRosterCard } from '~/app/components/cards/MyRosterCard'
import { LeagueStandingsCard } from '~/app/components/cards/LeagueStandingsCard'

type Props = {
  rising: Athlete[]
  falling: Athlete[]
  nextRace: { race: Race; favorites: Athlete[]; daysUntil: number } | null
  lastRace: { race: Race; podium: PodiumEntry[] } | null
  roster: Roster | null
  leagueStandings: { leagueName: string; standings: LeagueStanding[] } | null
}

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: 'power-ranking',    label: 'Power Ranking',    description: 'Top athletes rising or falling on the market' },
  { id: 'race-preview',     label: 'Race Preview',     description: 'Cover for the next race with top picks' },
  { id: 'race-recap',       label: 'Race Recap',       description: 'Final podium with times and market impact' },
  { id: 'my-roster',        label: 'My Roster',        description: "Your 5-athlete team — viral share card" },
  { id: 'league-standings', label: 'League Standings', description: 'Top 10 of a Trix League' },
]

export default function SharePageClient({
  rising,
  falling,
  nextRace,
  lastRace,
  roster,
  leagueStandings,
}: Props) {
  const params = useSearchParams()
  const initialTemplate = (params.get('template') as TemplateId) ?? 'power-ranking'
  const initialFormat   = (params.get('format')   as CardFormat)  ?? 'feed'

  const [template, setTemplate] = useState<TemplateId>(initialTemplate)
  const [format,   setFormat]   = useState<CardFormat>(initialFormat)
  const [exporting, setExporting] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [b64Photos, setB64Photos] = useState<Record<string, string>>({})

  // Editable fields
  const [prTitle,    setPrTitle]    = useState('Rising on the market')
  const [prSubtitle, setPrSubtitle] = useState('This week · ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
  const [prVariant,  setPrVariant]  = useState<'rising' | 'falling'>('rising')

  const previewRef = useRef<HTMLDivElement>(null)

  // ── Pre-convert all athlete photos to base64 to avoid CORS issues ────────
  const allPhotoUrls = useMemo(() => {
    const urls = new Set<string>()
    const addAthletes = (list: Athlete[]) => list.forEach(a => { if (a.photoUrl) urls.add(a.photoUrl) })
    addAthletes(rising)
    addAthletes(falling)
    if (nextRace) addAthletes(nextRace.favorites)
    if (lastRace) lastRace.podium.forEach(p => { if (p.athlete.photoUrl) urls.add(p.athlete.photoUrl) })
    if (roster)   addAthletes(roster.athletes)
    return [...urls]
  }, [rising, falling, nextRace, lastRace, roster])

  useEffect(() => {
    if (allPhotoUrls.length === 0) { setImagesReady(true); return }
    setImagesReady(false)
    let cancelled = false
    ;(async () => {
      const photos: Record<string, string> = {}
      for (const url of allPhotoUrls) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width  = img.naturalWidth  || img.width
              canvas.height = img.naturalHeight || img.height
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0)
              try { photos[url] = canvas.toDataURL('image/png') } catch { /* tainted */ }
              resolve()
            }
            img.onerror = () => resolve()
            img.src = url + (url.includes('?') ? '&' : '?') + '_b64=1'
          })
        } catch { /* skip */ }
      }
      if (!cancelled) { setB64Photos(photos); setImagesReady(true) }
    })()
    return () => { cancelled = true }
  }, [allPhotoUrls])

  // Replace photoUrl with base64 version for export-safe rendering
  const resolvePhoto = (url?: string) => (url && b64Photos[url]) ? b64Photos[url] : url
  const withB64 = (athletes: Athlete[]): Athlete[] =>
    athletes.map(a => ({ ...a, photoUrl: resolvePhoto(a.photoUrl) }))

  const previewMaxW = 480
  const previewMaxH = format === 'story' ? 700 : 480

  const card = useMemo(() => {
    switch (template) {
      case 'power-ranking':
        return (
          <PowerRankingCard
            format={format}
            title={prTitle}
            subtitle={prSubtitle}
            variant={prVariant}
            athletes={withB64(prVariant === 'falling' ? falling : rising)}
          />
        )
      case 'race-preview':
        if (!nextRace) return <EmptyState message="No upcoming race with startlist found." />
        return (
          <RacePreviewCard
            format={format}
            race={nextRace.race}
            favorites={withB64(nextRace.favorites)}
            daysUntil={nextRace.daysUntil}
          />
        )
      case 'race-recap':
        if (!lastRace) return <EmptyState message="No race recap data available yet." />
        return (
          <RaceRecapCard
            format={format}
            race={lastRace.race}
            podium={lastRace.podium.map(p => ({ ...p, athlete: { ...p.athlete, photoUrl: resolvePhoto(p.athlete.photoUrl) } }))}
          />
        )
      case 'my-roster':
        if (!roster) return <EmptyState message="Build your roster first to generate this card." />
        return <MyRosterCard format={format} roster={{ ...roster, athletes: withB64(roster.athletes) }} />
      case 'league-standings':
        if (!leagueStandings) return <EmptyState message="Join a league to generate standings cards." />
        return (
          <LeagueStandingsCard
            format={format}
            leagueName={leagueStandings.leagueName}
            standings={leagueStandings.standings}
          />
        )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, format, prTitle, prSubtitle, prVariant, rising, falling, nextRace, lastRace, roster, leagueStandings, b64Photos])

  const handleExport = async () => {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const { w, h } = FORMAT_DIMENSIONS[format]
      const dataUrl = await toPng(previewRef.current, {
        width: w,
        height: h,
        pixelRatio: 2,
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
      })
      const link = document.createElement('a')
      link.download = `trixer-${template}-${format}-${Date.now()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('[SharePage] Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-navy)] text-[var(--color-text)]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Title */}
        <div className="mb-8 flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-[var(--color-orange)] mt-1 shrink-0" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
              Card Generator
            </h1>
            <p className="text-[var(--color-muted)] mt-1 max-w-xl text-sm">
              Pick a template, tweak the content, export a 1080px PNG ready for Instagram.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* ── Editor panel ── */}
          <div className="space-y-5">
            {/* Template */}
            <Panel label="Template">
              <div className="grid gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`text-left rounded-xl p-3 transition-all border ${
                      template === t.id
                        ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40'
                        : 'bg-white/[0.03] border-[var(--color-navy-border)] hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-sm">{t.label}</div>
                    <div className="text-xs text-[var(--color-muted)] mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </Panel>

            {/* Format */}
            <Panel label="Format">
              <div className="grid grid-cols-2 gap-2">
                {(['feed', 'story'] as CardFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                      format === f
                        ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40 text-[var(--color-orange)]'
                        : 'bg-white/[0.03] border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white'
                    }`}
                  >
                    {f === 'feed' ? 'Feed 4:5' : 'Story 9:16'}
                  </button>
                ))}
              </div>
            </Panel>

            {/* Content controls — only shown for power-ranking */}
            {template === 'power-ranking' && (
              <Panel label="Content">
                <Field label="Title">
                  <input
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-orange)]/60"
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    value={prSubtitle}
                    onChange={(e) => setPrSubtitle(e.target.value)}
                    className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-orange)]/60"
                  />
                </Field>
                <Field label="Variant">
                  <div className="grid grid-cols-2 gap-2">
                    {(['rising', 'falling'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setPrVariant(v)}
                        className={`py-2 rounded-lg text-sm font-bold border transition-all capitalize ${
                          prVariant === v
                            ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40 text-[var(--color-orange)]'
                            : 'bg-white/[0.03] border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
              </Panel>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={exporting || !imagesReady}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-orange)] hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-bold transition-all"
            >
              {exporting || !imagesReady
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Download className="h-5 w-5" />
              }
              {exporting
                ? 'Rendering…'
                : !imagesReady
                ? 'Carregando fotos…'
                : `Download PNG (${FORMAT_DIMENSIONS[format].w}×${FORMAT_DIMENSIONS[format].h})`}
            </button>
          </div>

          {/* ── Preview ── */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest">
              Live preview · scaled to fit
            </p>
            <CardPreview ref={previewRef} format={format} maxWidth={previewMaxW} maxHeight={previewMaxH}>
              {card}
            </CardPreview>
            <p className="text-xs text-[var(--color-muted)] text-center">
              Exports at full {FORMAT_DIMENSIONS[format].w}×{FORMAT_DIMENSIONS[format].h} resolution.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(240 47% 7%)',
        color: 'hsl(220 15% 60%)',
        fontSize: 20,
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 48,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}
