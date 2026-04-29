import type { Athlete, CardFormat, Race } from '~/lib/trixerTypes'
import { CardFrame } from './shared/CardFrame'
import { AthleteAvatar } from './shared/AthleteAvatar'

type Props = {
  format: CardFormat
  race: Race
  favorites: Athlete[]
  daysUntil?: number
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

export const RacePreviewCard = ({ format, race, favorites, daysUntil }: Props) => {
  const isStory = format === 'story'
  const picks = favorites.slice(0, isStory ? 5 : 4)

  return (
    <CardFrame format={format} eyebrow="NEXT RACE">
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 64 : 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {race.series && (
            <span
              className="font-display font-bold uppercase"
              style={{ fontSize: isStory ? 22 : 18, color: 'hsl(268 83% 75%)', letterSpacing: '0.22em' }}
            >
              {race.series} Series
            </span>
          )}
          <h1
            className="font-display font-black"
            style={{
              fontSize: isStory ? 156 : 120,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              margin: 0,
              backgroundImage: 'linear-gradient(135deg, hsl(211 100% 70%), hsl(268 83% 75%))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {race.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isStory ? 32 : 24, marginTop: 12 }}>
            <Meta label="DATE" value={formatDate(race.date)} isStory={isStory} />
            <Meta label="LOCATION" value={race.location} isStory={isStory} />
            <Meta label="DISTANCE" value={race.distance.toUpperCase()} isStory={isStory} />
            {typeof daysUntil === 'number' && (
              <Meta label="STARTS IN" value={`${daysUntil} DAYS`} isStory={isStory} highlight />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 28 : 20 }}>
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: isStory ? 24 : 20, color: 'hsl(220 15% 70%)', letterSpacing: '0.2em' }}
          >
            Top picks
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${picks.length}, 1fr)`,
              gap: isStory ? 22 : 16,
            }}
          >
            {picks.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  padding: isStory ? '26px 12px' : '20px 10px',
                  background: 'hsl(240 30% 14% / 0.7)',
                  border: '1px solid hsl(220 30% 100% / 0.06)',
                  borderRadius: 18,
                }}
              >
                <AthleteAvatar athlete={a} size={isStory ? 110 : 88} />
                <span
                  className="font-display font-bold"
                  style={{ fontSize: isStory ? 22 : 18, color: 'white', textAlign: 'center', lineHeight: 1.1 }}
                >
                  {a.name}
                </span>
                <span style={{ fontSize: isStory ? 18 : 14, color: 'hsl(220 15% 65%)' }}>
                  {a.countryFlag} T${a.currentT}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardFrame>
  )
}

const Meta = ({
  label,
  value,
  isStory,
  highlight,
}: {
  label: string
  value: string
  isStory: boolean
  highlight?: boolean
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span
      style={{
        fontSize: isStory ? 16 : 13,
        color: 'hsl(220 15% 60%)',
        letterSpacing: '0.18em',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <span
      className="font-display font-bold"
      style={{
        fontSize: isStory ? 28 : 22,
        color: highlight ? 'hsl(211 100% 70%)' : 'white',
        letterSpacing: '-0.01em',
      }}
    >
      {value}
    </span>
  </div>
)
