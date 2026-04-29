import type { CardFormat, Roster } from '~/lib/trixerTypes'
import { CardFrame } from './shared/CardFrame'
import { AthleteAvatar } from './shared/AthleteAvatar'

type Props = {
  format: CardFormat
  roster: Roster
}

export const MyRosterCard = ({ format, roster }: Props) => {
  const isStory = format === 'story'

  return (
    <CardFrame format={format} eyebrow="MY ROSTER">
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 64 : 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: isStory ? 22 : 18, color: 'hsl(268 83% 75%)', letterSpacing: '0.22em' }}
          >
            {roster.leagueName}
          </span>
          <h1
            className="font-display font-black"
            style={{
              fontSize: isStory ? 130 : 100,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              margin: 0,
              color: 'white',
            }}
          >
            {roster.trixerName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: isStory ? 26 : 22, color: 'hsl(220 15% 65%)' }}>Total</span>
            <span
              className="font-display font-black"
              style={{
                fontSize: isStory ? 72 : 56,
                lineHeight: 1,
                backgroundImage: 'linear-gradient(135deg, hsl(211 100% 70%), hsl(268 83% 75%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-0.03em',
              }}
            >
              T${roster.totalT}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: isStory ? 18 : 14,
          }}
        >
          {roster.athletes.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: isStory ? '26px 8px' : '20px 6px',
                background: 'hsl(240 30% 14% / 0.7)',
                border: '1px solid hsl(220 30% 100% / 0.06)',
                borderRadius: 18,
              }}
            >
              <AthleteAvatar athlete={a} size={isStory ? 110 : 88} />
              <span
                className="font-display font-bold"
                style={{ fontSize: isStory ? 18 : 15, color: 'white', textAlign: 'center', lineHeight: 1.1 }}
              >
                {a.name}
              </span>
              <span style={{ fontSize: isStory ? 16 : 13, color: 'hsl(211 100% 70%)', fontWeight: 700 }}>
                T${a.currentT}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: isStory ? '28px 32px' : '20px 26px',
            background: 'linear-gradient(135deg, hsl(211 100% 60% / 0.18), hsl(268 83% 65% / 0.18))',
            border: '1px solid hsl(211 100% 70% / 0.3)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="font-display font-bold" style={{ fontSize: isStory ? 30 : 24, color: 'white' }}>
            Beat my roster →
          </span>
          <span style={{ fontSize: isStory ? 22 : 18, color: 'hsl(220 15% 75%)' }}>
            trixer.app
          </span>
        </div>
      </div>
    </CardFrame>
  )
}
