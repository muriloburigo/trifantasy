import { ImageResponse } from 'next/og'
import { createAdminClient } from '~/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Meu Elenco no Trixer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

export default async function Image({ params }: { params: { userId: string } }) {
  const admin = createAdminClient()

  const [profileRes, portfolioRes] = await Promise.all([
    admin.from('profiles').select('name, wallet').eq('id', params.userId).single(),
    admin
      .from('portfolio')
      .select('bought_price, athlete:athletes(name, current_price, photo_url, country, type)')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const portfolio = portfolioRes.data ?? []

  if (!profile || portfolio.length === 0) {
    return new ImageResponse(
      <div style={{ background: '#0B0B0F', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 40 }}>
        Trixer — O Game do Triathlon
      </div>
    )
  }

  const wallet = Number(profile.wallet ?? 0)
  const totalNow = portfolio.reduce((s, p) => s + Number((p.athlete as any)?.current_price ?? 0), 0)
  const netWorth = wallet + totalNow

  const athletes = portfolio.map(p => p.athlete as any)

  // Pad to 5 for consistent layout
  const slots = [...athletes, ...Array(5 - athletes.length).fill(null)].slice(0, 5)

  const CARD_W = 192
  const CARD_H = 260
  const GAP = 16
  const totalWidth = slots.length * CARD_W + (slots.length - 1) * GAP
  const startX = (1200 - totalWidth) / 2

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0B0F 0%, #12121A 60%, #0B0B0F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
          background: 'linear-gradient(to right, #FF6B00, #7B3FE4)',
        }} />

        {/* Background glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '40%',
          width: '600px', height: '600px', borderRadius: '300px',
          background: 'radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 70%)',
          transform: 'translateX(-50%) translateY(-50%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 40px' }}>

          {/* Header: Trixer brand + user name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF6B00, #7B3FE4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 900,
              }}>T</div>
              <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                <span style={{ color: '#FF6B00' }}>TRIX</span><span style={{ color: 'white' }}>ER</span>
              </span>
              <span style={{ fontSize: '12px', color: '#555566', marginLeft: '6px', letterSpacing: '3px', textTransform: 'uppercase' }}>Fantasy Game</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '12px', color: '#666677', textTransform: 'uppercase', letterSpacing: '2px' }}>Elenco de</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{profile.name}</span>
            </div>
          </div>

          {/* Athlete cards row */}
          <div style={{
            display: 'flex', gap: `${GAP}px`, justifyContent: 'center', flex: 1, alignItems: 'center',
          }}>
            {slots.map((athlete: any, i) =>
              athlete ? (
                <div key={i} style={{
                  width: `${CARD_W}px`,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '20px 12px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Card top glow */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(to right, #FF6B00, #7B3FE4)',
                  }} />

                  {/* Photo */}
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '44px',
                    overflow: 'hidden', marginBottom: '14px',
                    border: '3px solid rgba(255,107,0,0.4)',
                    background: 'linear-gradient(135deg, #1E1E2A, #2E2E3A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {athlete.photo_url ? (
                      <img
                        src={athlete.photo_url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#FF6B00' }}>
                        {initials(athlete.name)}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <span style={{
                    fontSize: athlete.name.length > 14 ? '13px' : '15px',
                    fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                    color: 'white', marginBottom: '8px',
                    maxWidth: '160px',
                  }}>
                    {athlete.name}
                  </span>

                  {/* Price */}
                  <div style={{
                    background: 'rgba(255,107,0,0.12)',
                    border: '1px solid rgba(255,107,0,0.25)',
                    borderRadius: '8px', padding: '5px 14px',
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#FF6B00' }}>
                      T${Number(athlete.current_price).toFixed(0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div key={i} style={{
                  width: `${CARD_W}px`, height: `${CARD_H}px`,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.1)' }}>+</span>
                </div>
              )
            )}
          </div>

          {/* Footer: net worth */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)',
                borderRadius: '12px', padding: '8px 20px', display: 'flex', flexDirection: 'column',
              }}>
                <span style={{ fontSize: '11px', color: '#888899', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2px' }}>Patrimônio</span>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#FF6B00', lineHeight: 1 }}>T${netWorth.toFixed(0)}</span>
              </div>
              <span style={{ fontSize: '14px', color: '#555566' }}>
                {athletes.length} {athletes.length === 1 ? 'atleta' : 'atletas'}
              </span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#444455' }}>trixer.app</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
