import { ImageResponse } from 'next/og'
import { createPublicClient } from '~/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Trixer Athlete'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const pub = createPublicClient()
  const { data: athlete } = await pub
    .from('athletes')
    .select('name, country, current_price, type, photo_url')
    .eq('id', params.id)
    .single()

  if (!athlete) return new ImageResponse(<div>Atleta não encontrado</div>)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0B0B0F, #1A1A22)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '40px',
        }}
      >
        {/* Border Glow */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(to right, #1E90FF, #7B3FE4)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          {/* Avatar */}
          <div style={{ 
            width: '240px', height: '240px', borderRadius: '120px', overflow: 'hidden', display: 'flex', 
            border: '8px solid #2E2E3A', background: 'linear-gradient(to bottom, #1E90FF, #7B3FE4)' 
          }}>
            {athlete.photo_url ? (
              <img src={athlete.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '80px', fontWeight: '900', margin: 'auto' }}>
                {athlete.name.split(' ').slice(0,2).map((n:any)=>n[0]).join('')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E90FF', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '10px' }}>
              {athlete.type} ATHLETE
            </span>
            <h1 style={{ fontSize: '72px', fontWeight: '900', margin: 0, lineHeight: 1 }}>
              {athlete.name}
            </h1>
            <p style={{ fontSize: '32px', color: '#888899', margin: '10px 0 30px 0' }}>
              {athlete.country}
            </p>
            <div style={{ background: 'rgba(30, 144, 255, 0.1)', border: '1px solid rgba(30, 144, 255, 0.3)', padding: '15px 30px', borderRadius: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '48px', fontWeight: '900', color: '#1E90FF' }}>
                T${Number(athlete.current_price).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '40px', right: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px', color: '#888899' }}>Disponível em</span>
          <span style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>Trixer.com.br</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
