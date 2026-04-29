import type { Athlete, CardFormat } from '~/lib/trixerTypes'
import { CardFrame } from './shared/CardFrame'
import { AthleteAvatar } from './shared/AthleteAvatar'
import { DeltaTag } from './shared/DeltaTag'

type Props = {
  format: CardFormat
  title?: string
  subtitle?: string
  athletes: Athlete[]
  variant?: 'rising' | 'falling' | 'mixed'
}

export const PowerRankingCard = ({
  format,
  title = 'Rising on the market',
  subtitle,
  athletes,
  variant = 'rising',
}: Props) => {
  const isStory = format === 'story'
  const items = athletes.slice(0, isStory ? 7 : 5)

  return (
    <CardFrame format={format} eyebrow={variant === 'falling' ? 'MARKET DOWN' : 'MARKET UP'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 56 : 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1
            className="font-display font-black"
            style={{
              fontSize: isStory ? 96 : 76,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'white',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: isStory ? 28 : 24, color: 'hsl(220 15% 70%)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 24 : 18 }}>
          {items.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isStory ? 28 : 22,
                padding: isStory ? '20px 24px' : '16px 20px',
                background: 'hsl(240 30% 14% / 0.7)',
                border: '1px solid hsl(220 30% 100% / 0.06)',
                borderRadius: 18,
              }}
            >
              <span
                className="font-display font-black"
                style={{
                  fontSize: isStory ? 40 : 32,
                  width: isStory ? 60 : 48,
                  color: 'hsl(220 15% 50%)',
                  letterSpacing: '-0.02em',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <AthleteAvatar athlete={a} size={isStory ? 80 : 64} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  className="font-display font-bold"
                  style={{ fontSize: isStory ? 32 : 26, color: 'white', lineHeight: 1.1 }}
                >
                  {a.name}
                </span>
                <span style={{ fontSize: isStory ? 20 : 17, color: 'hsl(220 15% 65%)' }}>
                  {a.countryFlag} {a.country.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <DeltaTag delta={a.deltaT} size={isStory ? 'lg' : 'md'} />
                <span
                  className="font-display font-bold"
                  style={{ fontSize: isStory ? 28 : 22, color: 'hsl(211 100% 70%)' }}
                >
                  T${a.currentT}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardFrame>
  )
}
