/**
 * /api/card/render — Trixer Card Generator
 *
 * Renderiza cards Instagram 1080×1350 com o MESMO design da página /share.
 * Usa Satori (ImageResponse) com layout copiado dos componentes reais.
 *
 * GET /api/card/render?type=race-preview&race_id=<uuid>
 * GET /api/card/render?type=market-update
 * GET /api/card/render?type=race-recap&race_id=<uuid>
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '~/lib/supabase/server'

export const runtime = 'edge'

const W = 1080
const H = 1350

// ── Mesmas cores do CardFrame / globals ───────────────────────────────────────
const BG_GRADIENT =
  'radial-gradient(circle at 15% 0%, hsl(211 100% 60% / 0.18) 0%, transparent 45%), radial-gradient(circle at 100% 100%, hsl(268 83% 55% / 0.22) 0%, transparent 50%), linear-gradient(180deg, hsl(240 47% 7%), hsl(245 40% 9%))'
const BLUE     = 'hsl(211 100% 60%)'
const BLUE_LT  = 'hsl(211 100% 70%)'
const PURPLE   = 'hsl(268 83% 65%)'
const WHITE    = '#FFFFFF'
const MUTED    = 'hsl(220 15% 65%)'
const DIM      = 'hsl(220 15% 50%)'
const CARD_BG  = 'hsl(240 30% 14% / 0.7)'
const BORDER   = 'hsl(220 30% 100% / 0.06)'
const GREEN    = 'hsl(142 71% 55%)'
const RED      = 'hsl(0 84% 65%)'
const GOLD     = '#F5B942'

// ── Utils ─────────────────────────────────────────────────────────────────────

/** ISO 3166-1 alpha-2 → flag emoji */
function flag(code?: string | null) {
  if (!code || code.length !== 2) return ''
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

/** Iniciais do nome (máx 2 letras) */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

/** Seconds → h:mm:ss */
function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Shared layout pieces ──────────────────────────────────────────────────────

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', display: 'flex', fontFamily: 'sans-serif' }}>
      {/* Base background — solid color always renders in Satori */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0A0A12', display: 'flex' }} />
      {/* Top-left blue glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 600, height: 600, display: 'flex',
        background: 'linear-gradient(135deg, rgba(30,144,255,0.20) 0%, transparent 65%)' }} />
      {/* Bottom-right purple glow */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 650, height: 650, display: 'flex',
        background: 'linear-gradient(315deg, rgba(123,63,228,0.22) 0%, transparent 65%)' }} />
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, display: 'flex',
        background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})` }} />
      {/* Grid texture */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex',
        backgroundImage:
          'linear-gradient(hsl(220 30% 100% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 100% / 0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
      {/* Content */}
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '72px',
      }}>
        {children}
      </div>
    </div>
  )
}

function Header({ eyebrow }: { eyebrow: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 13,
          background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: WHITE, fontWeight: 900, fontSize: 26, letterSpacing: '-1px' }}>T</span>
        </div>
        <span style={{ color: WHITE, fontWeight: 800, fontSize: 30, letterSpacing: '-0.5px' }}>TRIXER</span>
      </div>
      {/* Eyebrow */}
      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.18em', color: BLUE_LT }}>
        {eyebrow}
      </span>
    </div>
  )
}

function Footer() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 24, borderTop: '1px solid hsl(220 30% 100% / 0.08)',
      fontSize: 20, color: MUTED,
    }}>
      <span style={{ color: WHITE, fontWeight: 700 }}>@trixer.app</span>
      <span style={{ letterSpacing: '0.04em' }}>The Triathlon Game</span>
    </div>
  )
}

/** Círculo com foto do atleta ou iniciais em gradiente */
function Avatar({ photoUrl, name, size = 64 }: { photoUrl?: string | null, name: string, size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {photoUrl
        ? <img src={photoUrl} width={size} height={size} style={{ objectFit: 'cover' }} />
        : <span style={{ color: WHITE, fontWeight: 900, fontSize: size * 0.36, letterSpacing: '-0.04em' }}>
            {initials(name)}
          </span>
      }
    </div>
  )
}

/** Pill verde/vermelho com variação de preço */
function DeltaTag({ delta, size = 'md' }: { delta: number, size?: 'sm' | 'md' | 'lg' }) {
  const fs   = size === 'lg' ? 26 : size === 'md' ? 18 : 14
  const px   = size === 'lg' ? 18 : size === 'md' ? 12 : 8
  const py   = size === 'lg' ? 8  : size === 'md' ? 5  : 3
  const clr  = delta > 0 ? GREEN : delta < 0 ? RED : MUTED
  const bg   = delta > 0 ? 'hsl(142 71% 55% / 0.15)' : delta < 0 ? 'hsl(0 84% 65% / 0.15)' : 'hsl(220 15% 50% / 0.15)'
  const brd  = delta > 0 ? 'hsl(142 71% 55% / 0.30)' : delta < 0 ? 'hsl(0 84% 65% / 0.30)' : 'transparent'
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: bg, border: `1px solid ${brd}`,
      borderRadius: 100, padding: `${py}px ${px}px`,
      fontSize: fs, fontWeight: 800, color: clr,
    }}>
      <span>{arrow}</span>
      <span>{delta > 0 ? '+' : ''}{delta}</span>
    </div>
  )
}

// ── Card: Market Update ───────────────────────────────────────────────────────
// Layout: cópia do PowerRankingCard — rank + avatar + nome + país + preço + delta

function MarketUpdateCard({ athletes, title = 'Rising on the market', subtitle }: {
  athletes: any[], title?: string, subtitle?: string
}) {
  return (
    <Frame>
      <Header eyebrow="MARKET UPDATE" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, flex: 1 }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{ fontSize: 76, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0, color: WHITE }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 24, color: MUTED, margin: 0 }}>{subtitle}</p>
          )}
        </div>
        {/* Athlete rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {athletes.slice(0, 5).map((a: any, i: number) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 22,
              padding: '16px 20px',
              background: CARD_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
            }}>
              {/* Rank */}
              <span style={{ fontSize: 32, fontWeight: 900, width: 48, color: DIM, letterSpacing: '-0.02em', flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {/* Avatar */}
              <Avatar photoUrl={a.photo_url} name={a.name} size={64} />
              {/* Name + Country */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>{a.name}</span>
                <span style={{ fontSize: 17, color: MUTED }}>
                  {flag(a.country_code)} {a.country?.toUpperCase()}
                </span>
              </div>
              {/* Price + Delta */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <DeltaTag delta={a.price_change} size="md" />
                <span style={{ fontSize: 22, fontWeight: 700, color: BLUE_LT }}>T${a.current_price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})`,
        borderRadius: 16, padding: '22px 0', marginTop: 24, marginBottom: 24,
      }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: WHITE, letterSpacing: '0.07em' }}>
          BUILD YOUR SQUAD · TRIXER.APP
        </span>
      </div>
      <Footer />
    </Frame>
  )
}

// ── Card: Race Preview ────────────────────────────────────────────────────────
// Layout: cópia do RacePreviewCard — nome grande + grid de atletas com fotos

function RacePreviewCard({ race, daysUntil, picks }: { race: any, daysUntil: number, picks: any[] }) {
  const [y, m, d] = race.date.split('-').map(Number)
  const dateStr = formatDate(race.date)

  return (
    <Frame>
      <Header eyebrow="NEXT RACE" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, flex: 1 }}>
        {/* Race info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {race.series && (
            <span style={{ fontSize: 18, fontWeight: 700, color: PURPLE, letterSpacing: '0.22em' }}>
              {race.series.toUpperCase()} SERIES
            </span>
          )}
          {/* Race name — big, white (Satori não suporta gradient text) */}
          <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: WHITE, display: 'flex', flexWrap: 'wrap' }}>
            {race.name}
          </div>
          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 12 }}>
            <MetaItem label="DATE" value={dateStr} />
            <MetaItem label="LOCATION" value={race.location?.split(',')[0] ?? ''} />
            <MetaItem label="DISTANCE" value={race.distance?.toUpperCase()} />
            <MetaItem label="STARTS IN" value={`${daysUntil} DAYS`} highlight />
          </div>
        </div>
        {/* Top picks grid */}
        {picks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: MUTED, letterSpacing: '0.2em' }}>TOP PICKS</span>
            <div style={{ display: 'flex', gap: 16 }}>
              {picks.slice(0, 4).map((a: any) => (
                <div key={a.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  flex: 1, padding: '20px 10px',
                  background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18,
                }}>
                  <Avatar photoUrl={a.photo_url} name={a.name} size={88} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: WHITE, textAlign: 'center', lineHeight: 1.1 }}>
                    {a.name}
                  </span>
                  <span style={{ fontSize: 14, color: MUTED }}>{flag(a.country_code)} T${a.current_price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})`,
        borderRadius: 16, padding: '22px 0', marginTop: 24, marginBottom: 24,
      }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: WHITE, letterSpacing: '0.07em' }}>
          LOCK YOUR SQUAD · TRIXER.APP
        </span>
      </div>
      <Footer />
    </Frame>
  )
}

function MetaItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, color: MUTED, letterSpacing: '0.18em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: highlight ? BLUE_LT : WHITE, letterSpacing: '-0.01em' }}>
        {value}
      </span>
    </div>
  )
}

// ── Card: Race Recap ──────────────────────────────────────────────────────────
// Layout: cópia do RaceRecapCard — pódio com medalhas, fotos, tempo e delta

function PodiumRow({ r, i, highlight }: { r: any, i: number, highlight: boolean }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 18px',
      background: highlight ? `hsl(211 100% 60% / 0.1)` : CARD_BG,
      border: `1px solid ${highlight ? 'hsl(211 100% 60% / 0.25)' : BORDER}`,
      borderRadius: 16,
    }}>
      <span style={{ fontSize: 26, flexShrink: 0, width: 36 }}>
        {medals[i] ?? <span style={{ fontSize: 20, fontWeight: 900, color: MUTED }}>{i + 1}</span>}
      </span>
      <Avatar photoUrl={r.photo_url} name={r.name ?? ''} size={52} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: WHITE, lineHeight: 1 }}>{r.name}</span>
        <span style={{ fontSize: 14, color: MUTED }}>
          {flag(r.country_code)} {r.country?.toUpperCase()}{r.finish_time ? ` · ${r.finish_time}` : ''}
        </span>
      </div>
      {r.price_change !== undefined && r.price_change !== null && (
        <DeltaTag delta={r.price_change} size="sm" />
      )}
    </div>
  )
}

function RaceRecapCard({ race, podium }: { race: any, podium: any[] }) {
  // Split by position to interleave men/women (same pro_pos = different genders)
  const byPos: Record<number, any[]> = {}
  podium.forEach(r => {
    const p = r.pro_pos ?? 99
    byPos[p] = byPos[p] ?? []
    byPos[p].push(r)
  })
  // Build interleaved list: pos1-man, pos1-woman, pos2-man, pos2-woman...
  const rows: any[] = []
  Object.keys(byPos).sort((a,b) => Number(a)-Number(b)).forEach(pos => {
    byPos[Number(pos)].forEach(r => rows.push(r))
  })

  return (
    <Frame>
      <Header eyebrow="RACE RECAP" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        {/* Race title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: PURPLE, letterSpacing: '0.2em' }}>
            {race.distance?.toUpperCase()} · {race.location?.split(',')[0]?.toUpperCase()}
          </span>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: WHITE, display: 'flex', flexWrap: 'wrap' }}>
            {race.name}
          </div>
        </div>
        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: MUTED, letterSpacing: '0.2em' }}>RESULTS</span>
          {rows.slice(0, 6).map((r: any, i: number) => (
            <PodiumRow key={i} r={r} i={podium.filter(p => p.pro_pos < r.pro_pos).length} highlight={i === 0} />
          ))}
        </div>
      </div>
      {/* CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(90deg, ${GOLD}, hsl(35 90% 55%))`,
        borderRadius: 16, padding: '20px 0', marginTop: 20, marginBottom: 20,
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#0B0B0F', letterSpacing: '0.07em' }}>
          SEE HOW YOUR SQUAD SCORED · TRIXER.APP
        </span>
      </div>
      <Footer />
    </Frame>
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type') ?? 'market-update'
  const raceId = searchParams.get('race_id')
  const admin  = createAdminClient()

  try {
    let element: React.ReactElement

    if (type === 'race-preview' && raceId) {
      const { data: race } = await admin.from('races')
        .select('id, name, date, location, distance, series, race_athletes(athlete:athletes(id, name, country, country_code, photo_url, current_price, pto_rank))')
        .eq('id', raceId).single()
      if (!race) return new Response('Race not found', { status: 404 })

      const [y, m, d] = race.date.split('-').map(Number)
      const daysUntil = Math.max(0, Math.round((new Date(y, m - 1, d).getTime() - Date.now()) / 86400000))
      const picks = (race.race_athletes ?? [])
        .map((ra: any) => ra.athlete).filter(Boolean)
        .sort((a: any, b: any) => (a.pto_rank ?? 999) - (b.pto_rank ?? 999))
        .slice(0, 4)

      element = <RacePreviewCard race={race} daysUntil={daysUntil} picks={picks} />

    } else if (type === 'race-recap' && raceId) {
      const { data: race } = await admin.from('races')
        .select('id, name, date, location, distance').eq('id', raceId).single()
      const { data: results } = await admin.from('results')
        .select('pro_pos, finish_time, athlete:athletes(id, name, country, country_code, photo_url)')
        .eq('race_id', raceId).not('pro_pos', 'is', null).lte('pro_pos', 5).order('pro_pos')
      if (!race) return new Response('Race not found', { status: 404 })

      // Get race-specific delta from price_history (not current price_change which may be from a later race)
      const athleteIds = (results ?? []).map((r: any) => r.athlete?.id).filter(Boolean)
      const { data: priceHistory } = await admin.from('athlete_price_history')
        .select('athlete_id, change')
        .eq('race_id', raceId)
        .eq('reason', 'race_result')
        .in('athlete_id', athleteIds)
      const deltaMap: Record<string, number> = {}
      ;(priceHistory ?? []).forEach((h: any) => {
        // Sum all entries for same athlete (in case of multiple entries)
        deltaMap[h.athlete_id] = (deltaMap[h.athlete_id] ?? 0) + h.change
      })

      // Group by gender to show separate podiums (men + women)
      const allPodium = (results ?? []).map((r: any) => ({
        name: r.athlete?.name,
        country: r.athlete?.country,
        country_code: r.athlete?.country_code,
        photo_url: r.athlete?.photo_url,
        price_change: deltaMap[r.athlete?.id] ?? null,
        finish_time: formatTime(r.finish_time),
        pro_pos: r.pro_pos,
      }))

      element = <RaceRecapCard race={race} podium={allPodium} />

    } else {
      // market-update: rising athletes sorted by price_change
      const { data: athletes } = await admin.from('athletes')
        .select('id, name, country, country_code, photo_url, current_price, price_change')
        .gt('price_change', 0)
        .order('price_change', { ascending: false })
        .limit(5)

      const top = athletes?.[0]
      const subtitle = top
        ? `${top.name} +T$${top.price_change} · ${top.country}`
        : 'Weekly market movements'

      element = <MarketUpdateCard athletes={athletes ?? []} subtitle={subtitle} />
    }

    return new ImageResponse(element, { width: W, height: H })

  } catch (err: any) {
    console.error('[card/render]', err)
    return new Response(err.message, { status: 500 })
  }
}
