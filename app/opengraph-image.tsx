import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Trixer — O Game do Triathlon'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
          background: 'linear-gradient(to right, #FF6B00, #7B3FE4)',
        }} />

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: '-120px', top: '-120px',
          width: '500px', height: '500px', borderRadius: '250px',
          background: 'radial-gradient(circle, rgba(123,63,228,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', left: '-80px', bottom: '-80px',
          width: '400px', height: '400px', borderRadius: '200px',
          background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)',
        }} />

        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1,
          padding: '60px 80px', justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF6B00, #7B3FE4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', fontWeight: 900,
            }}>T</div>
            <span style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px' }}>
              <span style={{ color: '#FF6B00' }}>TRIX</span>
              <span style={{ color: 'white' }}>ER</span>
            </span>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{
              fontSize: '72px', fontWeight: 900, margin: 0, lineHeight: 1.0,
              color: 'white',
            }}>
              O Fantasy Game
              <br />
              <span style={{ color: '#FF6B00' }}>do Triathlon</span>
            </h1>
            <p style={{ fontSize: '28px', color: '#888899', margin: 0, maxWidth: '700px' }}>
              Monte seu elenco com atletas PRO reais do circuito Ironman e 70.3. Compre, venda e suba no ranking global.
            </p>
          </div>

          {/* Bottom icons row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['🏊', '🚴', '🏃', '🏆'].map((emoji, i) => (
                <div key={i} style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '30px',
                }}>
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#666688' }}>trixer.app</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
