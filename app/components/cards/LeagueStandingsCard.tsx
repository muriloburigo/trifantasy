import type { CardFormat, LeagueStanding } from '~/lib/trixerTypes'
import { CardFrame } from './shared/CardFrame'

type Props = {
  format: CardFormat
  leagueName: string
  standings: LeagueStanding[]
}

const medalFor = (pos: number) =>
  pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null

export const LeagueStandingsCard = ({ format, leagueName, standings }: Props) => {
  const isStory = format === 'story'
  const items = standings.slice(0, isStory ? 10 : 8)

  return (
    <CardFrame format={format} eyebrow="STANDINGS">
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 56 : 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: isStory ? 22 : 18, color: 'hsl(268 83% 75%)', letterSpacing: '0.22em' }}
          >
            Trix League
          </span>
          <h1
            className="font-display font-black"
            style={{
              fontSize: isStory ? 100 : 76,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'white',
            }}
          >
            {leagueName}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 14 : 10 }}>
          {items.map((s) => {
            const medal = medalFor(s.position)
            const isTop = s.position <= 3
            return (
              <div
                key={s.position}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isStory ? 24 : 18,
                  padding: isStory ? '20px 26px' : '14px 20px',
                  background: isTop
                    ? 'linear-gradient(135deg, hsl(211 100% 60% / 0.12), hsl(240 30% 14% / 0.7))'
                    : 'hsl(240 30% 14% / 0.6)',
                  border: isTop
                    ? '1px solid hsl(211 100% 70% / 0.25)'
                    : '1px solid hsl(220 30% 100% / 0.05)',
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    width: isStory ? 64 : 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: medal ? (isStory ? 44 : 34) : isStory ? 32 : 26,
                  }}
                  className={medal ? '' : 'font-display font-black'}
                >
                  {medal ?? (
                    <span style={{ color: 'hsl(220 15% 50%)', letterSpacing: '-0.02em' }}>
                      {s.position}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: isStory ? 64 : 50,
                    height: isStory ? 64 : 50,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, hsl(211 100% 60%), hsl(268 83% 65%))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {s.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.avatarUrl}
                      alt={s.name}
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      className="font-display font-black"
                      style={{ color: 'white', fontSize: isStory ? 22 : 18, letterSpacing: '-0.04em' }}
                    >
                      {s.initials}
                    </span>
                  )}
                </div>
                <span
                  className="font-display font-bold"
                  style={{ flex: 1, fontSize: isStory ? 30 : 24, color: 'white' }}
                >
                  {s.name}
                </span>
                <span style={{ fontSize: isStory ? 18 : 14, color: 'hsl(220 15% 60%)' }}>
                  T${s.walletT} · A${s.athletesT}
                </span>
                <span
                  className="font-display font-black"
                  style={{
                    fontSize: isStory ? 32 : 26,
                    color: 'hsl(211 100% 70%)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: isStory ? 110 : 90,
                    textAlign: 'right',
                  }}
                >
                  T${s.totalT}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </CardFrame>
  )
}
