'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'
import { Check, ChevronDown, Download, Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { CardFormat, TemplateId, Athlete, Race, PodiumEntry, Roster, LeagueStanding } from '~/lib/trixerTypes'
import { FORMAT_DIMENSIONS } from '~/lib/trixerTypes'
import { CardPreview } from '~/app/components/cards/CardPreview'
import { PowerRankingCard } from '~/app/components/cards/PowerRankingCard'
import { RacePreviewCard } from '~/app/components/cards/RacePreviewCard'
import { RaceRecapCard } from '~/app/components/cards/RaceRecapCard'
import { MyRosterCard } from '~/app/components/cards/MyRosterCard'
import { LeagueStandingsCard } from '~/app/components/cards/LeagueStandingsCard'

type UpcomingRaceOption = { race: Race; favorites: Athlete[]; daysUntil: number }
type FinishedRaceOption = { race: Race; podium: PodiumEntry[] }

type LeagueStandingsOption = { leagueId: string; leagueName: string; standings: LeagueStanding[] }

type Props = {
  rising: Athlete[]
  falling: Athlete[]
  upcomingRaces: UpcomingRaceOption[]
  finishedRaces: FinishedRaceOption[]
  roster: Roster | null
  allLeagueStandings: LeagueStandingsOption[]
}

const TEMPLATE_IDS: TemplateId[] = [
  'power-ranking',
  'race-preview',
  'race-recap',
  'my-roster',
  'league-standings',
]

export default function SharePageClient({
  rising,
  falling,
  upcomingRaces,
  finishedRaces,
  roster,
  allLeagueStandings,
}: Props) {
  const t = useTranslations('share')
  const params = useSearchParams()
  const initialTemplate = (params.get('template') as TemplateId) ?? 'power-ranking'
  const initialFormat   = (params.get('format')   as CardFormat)  ?? 'feed'

  const [template, setTemplate] = useState<TemplateId>(initialTemplate)
  const [format,   setFormat]   = useState<CardFormat>(initialFormat)
  const [exporting, setExporting] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [b64Photos, setB64Photos] = useState<Record<string, string>>({})

  // Race / league selectors
  const [selectedUpcomingId, setSelectedUpcomingId] = useState<string>(upcomingRaces[0]?.race.id ?? '')
  const [selectedFinishedId, setSelectedFinishedId] = useState<string>(finishedRaces[0]?.race.id ?? '')
  const [selectedLeagueId,   setSelectedLeagueId]   = useState<string>(allLeagueStandings[0]?.leagueId ?? '')

  // Editable fields
  const [prTitle,    setPrTitle]    = useState(() => t('defaultPrTitle'))
  const [prSubtitle, setPrSubtitle] = useState(() => t('defaultPrSubtitle') + ' · ' + new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
  const [prVariant,  setPrVariant]  = useState<'rising' | 'falling'>('rising')

  const previewRef = useRef<HTMLDivElement>(null)

  const selectedUpcoming = upcomingRaces.find(r => r.race.id === selectedUpcomingId) ?? upcomingRaces[0] ?? null
  const selectedFinished = finishedRaces.find(r => r.race.id === selectedFinishedId) ?? finishedRaces[0] ?? null
  const selectedLeague   = allLeagueStandings.find(l => l.leagueId === selectedLeagueId) ?? allLeagueStandings[0] ?? null

  // ── Pre-convert all athlete photos to base64 to avoid CORS issues ────────
  const allPhotoUrls = useMemo(() => {
    const urls = new Set<string>()
    const addAthletes = (list: Athlete[]) => list.forEach(a => { if (a.photoUrl) urls.add(a.photoUrl) })
    addAthletes(rising)
    addAthletes(falling)
    upcomingRaces.forEach(r => addAthletes(r.favorites))
    finishedRaces.forEach(r => r.podium.forEach(p => { if (p.athlete.photoUrl) urls.add(p.athlete.photoUrl) }))
    if (roster) addAthletes(roster.athletes)
    allLeagueStandings.forEach(ls => ls.standings.forEach(s => { if (s.avatarUrl) urls.add(s.avatarUrl) }))
    return [...urls]
  }, [rising, falling, upcomingRaces, finishedRaces, roster, allLeagueStandings])

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
            labels={{ eyebrowUp: t('cardMarketUpEyebrow'), eyebrowDown: t('cardMarketDownEyebrow') }}
          />
        )
      case 'race-preview':
        if (!selectedUpcoming) return <EmptyState message={t('emptyNoRace')} />
        return (
          <RacePreviewCard
            format={format}
            race={selectedUpcoming.race}
            favorites={withB64(selectedUpcoming.favorites)}
            daysUntil={selectedUpcoming.daysUntil}
            labels={{
              eyebrow: t('cardRacePreviewEyebrow'),
              labelDate: t('cardRacePreviewDate'),
              labelLocation: t('cardRacePreviewLocation'),
              labelDistance: t('cardRacePreviewDistance'),
              labelStartsIn: t('cardRacePreviewStartsIn'),
              labelDays: t('cardRacePreviewDays'),
              topPicks: t('cardRacePreviewTopPicks'),
            }}
          />
        )
      case 'race-recap':
        if (!selectedFinished) return <EmptyState message={t('emptyNoRecap')} />
        return (
          <RaceRecapCard
            format={format}
            race={selectedFinished.race}
            podium={selectedFinished.podium.map(p => ({ ...p, athlete: { ...p.athlete, photoUrl: resolvePhoto(p.athlete.photoUrl) } }))}
            labels={{ eyebrow: t('cardRaceRecapEyebrow'), finalResults: t('cardRaceRecapFinalResults') }}
          />
        )
      case 'my-roster':
        if (!roster) return <EmptyState message={t('emptyNoRoster')} />
        return (
          <MyRosterCard
            format={format}
            roster={{ ...roster, athletes: withB64(roster.athletes) }}
            labels={{ eyebrow: t('cardMyRosterEyebrow'), total: t('cardMyRosterTotal'), cta: t('cardMyRosterCta') }}
          />
        )
      case 'league-standings':
        if (!selectedLeague) return <EmptyState message={t('emptyNoLeague')} />
        return (
          <LeagueStandingsCard
            format={format}
            leagueName={selectedLeague.leagueName}
            standings={selectedLeague.standings.map(s => ({
              ...s,
              avatarUrl: s.avatarUrl ? (b64Photos[s.avatarUrl] ?? s.avatarUrl) : undefined,
            }))}
            labels={{ eyebrow: t('cardLeagueEyebrow'), leagueLabel: t('cardLeagueLabel') }}
          />
        )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, format, prTitle, prSubtitle, prVariant, rising, falling, selectedUpcoming, selectedFinished, roster, selectedLeague, b64Photos])

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
              {t('pageTitle')}
            </h1>
            <p className="text-[var(--color-muted)] mt-1 max-w-xl text-sm">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* ── Editor panel ── */}
          <div className="space-y-5">

            {/* Template */}
            <Panel label={t('panelTemplate')}>
              <div className="grid gap-2">
                {TEMPLATE_IDS.map((id) => {
                  const labelKey = `tpl${id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')}Label` as any
                  const descKey  = `tpl${id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')}Desc`  as any
                  return (
                    <button
                      key={id}
                      onClick={() => setTemplate(id)}
                      className={`text-left rounded-xl p-3 transition-all border ${
                        template === id
                          ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40'
                          : 'bg-white/[0.03] border-[var(--color-navy-border)] hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-sm">{t(labelKey)}</div>
                      <div className="text-xs text-[var(--color-muted)] mt-0.5">{t(descKey)}</div>
                    </button>
                  )
                })}
              </div>
            </Panel>

            {/* Format */}
            <Panel label={t('panelFormat')}>
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
                    {f === 'feed' ? t('formatFeed') : t('formatStory')}
                  </button>
                ))}
              </div>
            </Panel>

            {/* Content controls */}
            {template === 'power-ranking' && (
              <Panel label={t('panelContent')}>
                <Field label={t('fieldTitle')}>
                  <input
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-orange)]/60"
                  />
                </Field>
                <Field label={t('fieldSubtitle')}>
                  <input
                    value={prSubtitle}
                    onChange={(e) => setPrSubtitle(e.target.value)}
                    className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-orange)]/60"
                  />
                </Field>
                <Field label={t('fieldVariant')}>
                  <div className="grid grid-cols-2 gap-2">
                    {(['rising', 'falling'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setPrVariant(v)}
                        className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                          prVariant === v
                            ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/40 text-[var(--color-orange)]'
                            : 'bg-white/[0.03] border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white'
                        }`}
                      >
                        {v === 'rising' ? t('variantRising') : t('variantFalling')}
                      </button>
                    ))}
                  </div>
                </Field>
              </Panel>
            )}

            {/* Race selector — upcoming */}
            {template === 'race-preview' && upcomingRaces.length > 0 && (
              <Panel label={t('selectorUpcomingLabel')}>
                <Combobox
                  options={upcomingRaces.map(r => ({
                    id: r.race.id,
                    label: r.race.name,
                    sublabel: fmtDate(r.race.date),
                  }))}
                  value={selectedUpcomingId}
                  onChange={setSelectedUpcomingId}
                  searchPlaceholder={t('selectorUpcomingPlaceholder')}
                />
              </Panel>
            )}

            {/* Race selector — finished */}
            {template === 'race-recap' && finishedRaces.length > 0 && (
              <Panel label={t('selectorFinishedLabel')}>
                <Combobox
                  options={finishedRaces.map(r => ({
                    id: r.race.id,
                    label: r.race.name,
                    sublabel: fmtDate(r.race.date),
                  }))}
                  value={selectedFinishedId}
                  onChange={setSelectedFinishedId}
                  searchPlaceholder={t('selectorFinishedPlaceholder')}
                />
              </Panel>
            )}

            {/* League selector */}
            {template === 'league-standings' && allLeagueStandings.length > 1 && (
              <Panel label={t('selectorLeagueLabel')}>
                <Combobox
                  options={allLeagueStandings.map(l => ({
                    id: l.leagueId,
                    label: l.leagueName,
                    sublabel: `${l.standings.length} ${t('selectorLeagueMembersLabel')}`,
                  }))}
                  value={selectedLeagueId}
                  onChange={setSelectedLeagueId}
                  searchPlaceholder={t('selectorLeagueLabel')}
                />
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
                ? t('btnRendering')
                : !imagesReady
                ? t('btnLoadingPhotos')
                : t('btnDownload', { w: FORMAT_DIMENSIONS[format].w, h: FORMAT_DIMENSIONS[format].h })}
            </button>
          </div>

          {/* ── Preview ── */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest">
              {t('previewLabel')}
            </p>
            <CardPreview ref={previewRef} format={format} maxWidth={previewMaxW} maxHeight={previewMaxH}>
              {card}
            </CardPreview>
            <p className="text-xs text-[var(--color-muted)] text-center">
              {t('previewResolution', { w: FORMAT_DIMENSIONS[format].w, h: FORMAT_DIMENSIONS[format].h })}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const fmtDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function Combobox({
  options,
  value,
  onChange,
  searchPlaceholder,
}: {
  options: { id: string; label: string; sublabel?: string }[]
  value: string
  onChange: (id: string) => void
  searchPlaceholder: string
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.id === value)
  const filtered  = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-white/20 transition-all text-left"
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="text-sm font-semibold text-white truncate">{selected.label}</div>
              {selected.sublabel && (
                <div className="text-xs text-[var(--color-muted)] mt-0.5">{selected.sublabel}</div>
              )}
            </>
          ) : (
            <div className="text-sm text-[var(--color-muted)]">{searchPlaceholder}</div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[var(--color-muted)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl shadow-2xl overflow-hidden">
          {options.length > 4 && (
            <div className="p-2 border-b border-[var(--color-navy-border)]">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[var(--color-navy-elevated)] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[var(--color-muted)] outline-none border border-transparent focus:border-[var(--color-orange)]/40 transition-colors"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--color-muted)] text-center">—</div>
            ) : filtered.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setQuery('') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
              >
                <Check
                  className={`h-4 w-4 shrink-0 transition-opacity ${o.id === value ? 'text-[var(--color-orange)] opacity-100' : 'opacity-0'}`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-semibold truncate ${o.id === value ? 'text-[var(--color-orange)]' : 'text-white'}`}>
                    {o.label}
                  </div>
                  {o.sublabel && (
                    <div className="text-xs text-[var(--color-muted)]">{o.sublabel}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
