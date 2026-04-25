import { ImageResponse } from 'next/og'
import { createAdminClient } from '~/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Trixer Liga'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const [{ data: league }, { count: memberCount }] = await Promise.all([
    admin.from('leagues').select('name, is_public, invite_code').eq('id', params.id).single(),
    admin.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', params.id),
  ])

  const name = league?.name ?? 'Liga Trixer'
  const count = memberCount ?? 0
  const code = league?.invite_code ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B0B0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left orange panel */}
        <div style={{
          width: '420px',
          background: 'linear-gradient(160deg, #FF6B00 0%, #CC4400 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '100px',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '160px', height: '160px', borderRadius: '80px',
            background: 'rgba(0,0,0,0.15)',
          }} />

          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px', position: 'relative',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 900, color: 'white',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>T</div>
            <span style={{ fontSize: '34px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
              TRIX<span style={{ color: 'rgba(255,255,255,0.6)' }}>ER</span>
            </span>
          </div>

          {/* Trophy */}
          <div style={{
            fontSize: '96px', lineHeight: 1, marginBottom: '20px', position: 'relative',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
          }}>🏆</div>

          <span style={{
            fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '4px', color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
          }}>
            Fantasy Game
          </span>
        </div>

        {/* Right content */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
        }}>
          {/* Subtle purple glow */}
          <div style={{
            position: 'absolute', right: '-80px', top: '-80px',
            width: '400px', height: '400px', borderRadius: '200px',
            background: 'radial-gradient(circle, rgba(123,63,228,0.18) 0%, transparent 70%)',
          }} />

          {/* Top label */}
          <div>
            <span style={{
              fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '4px', color: '#FF6B00',
            }}>
              Você foi convidado para
            </span>
          </div>

          {/* League name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 style={{
              fontSize: name.length > 22 ? '46px' : name.length > 14 ? '54px' : '64px',
              fontWeight: 900, margin: 0, lineHeight: 1.05, color: 'white',
            }}>
              {name}
            </h1>
            <p style={{
              margin: 0, fontSize: '18px', color: 'rgba(255,255,255,0.4)',
            }}>
              {count} {count === 1 ? 'participante' : 'participantes'} · trixer.app
            </p>
          </div>

          {/* Invite code box */}
          {code && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '3px', color: 'rgba(255,255,255,0.4)',
              }}>
                Código de convite
              </span>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,107,0,0.1)',
                border: '1px solid rgba(255,107,0,0.3)',
                borderRadius: '14px', padding: '14px 28px',
                width: 'fit-content',
              }}>
                <span style={{
                  fontSize: '40px', fontWeight: 900, color: 'white',
                  letterSpacing: '10px', fontVariantNumeric: 'tabular-nums',
                }}>
                  {code}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
