import type { ReactNode } from 'react'
import type { CardFormat } from '~/lib/trixerTypes'
import { FORMAT_DIMENSIONS } from '~/lib/trixerTypes'
import { TrixerLogo } from './TrixerLogo'

type Props = {
  format: CardFormat
  eyebrow?: string
  handle?: string
  footerTagline?: string
  children: ReactNode
}

/**
 * Export-ready card surface. Always rendered at exact pixel dimensions
 * (1080×1350 or 1080×1920) so html-to-image captures it pixel-perfect.
 */
export const CardFrame = ({
  format,
  eyebrow,
  handle = '@trixer.app',
  footerTagline = 'The Triathlon Game',
  children,
}: Props) => {
  const { w, h } = FORMAT_DIMENSIONS[format]
  const isStory = format === 'story'
  const padX = isStory ? 80 : 72
  const padY = isStory ? 110 : 72

  return (
    <div
      data-card-export-root
      style={{
        width: w,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 15% 0%, hsl(211 100% 60% / 0.18) 0%, transparent 45%), radial-gradient(circle at 100% 100%, hsl(268 83% 55% / 0.22) 0%, transparent 50%), linear-gradient(180deg, hsl(240 47% 7%), hsl(245 40% 9%))',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* subtle grid texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(hsl(220 30% 100% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 100% / 0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: `${padY}px ${padX}px`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <TrixerLogo size={isStory ? 44 : 38} />
          {eyebrow && (
            <span
              className="font-display font-bold uppercase"
              style={{
                fontSize: isStory ? 18 : 16,
                letterSpacing: '0.18em',
                color: 'hsl(211 100% 70%)',
              }}
            >
              {eyebrow}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: isStory ? 64 : 36,
            paddingBottom: isStory ? 48 : 24,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid hsl(220 30% 100% / 0.08)',
            fontSize: isStory ? 22 : 20,
            color: 'hsl(220 15% 70%)',
          }}
        >
          <span className="font-display font-semibold" style={{ color: 'white' }}>
            {handle}
          </span>
          <span className="font-display" style={{ letterSpacing: '0.04em' }}>
            {footerTagline}
          </span>
        </div>
      </div>
    </div>
  )
}
