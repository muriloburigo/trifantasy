import type { CardFormat, PodiumEntry, Race } from '~/lib/trixerTypes'
import { CardFrame } from './shared/CardFrame'
import { AthleteAvatar } from './shared/AthleteAvatar'
import { DeltaTag } from './shared/DeltaTag'

type Labels = { eyebrow: string; finalResults: string }
const DEFAULT_LABELS: Labels = { eyebrow: 'RACE RECAP', finalResults: 'Final results' }

type Props = {
  format: CardFormat
  race: Race
  podium: PodiumEntry[]
  labels?: Partial<Labels>
}

const medals = ['🥇', '🥈', '🥉']

export const RaceRecapCard = ({ format, race, podium, labels: labelsProp }: Props) => {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const isStory = format === 'story'
  const top3 = podium.slice(0, 3)

  return (
    <CardFrame format={format} eyebrow={labels.eyebrow}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 60 : 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: isStory ? 20 : 16, color: 'hsl(268 83% 75%)', letterSpacing: '0.22em' }}
          >
            {labels.finalResults}
          </span>
          <h1
            className="font-display font-black"
            style={{
              fontSize: isStory ? 110 : 84,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'white',
            }}
          >
            {race.name}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isStory ? 28 : 20 }}>
          {top3.map((entry, i) => (
            <div
              key={entry.athlete.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isStory ? 32 : 24,
                padding: isStory ? '32px 32px' : '24px 24px',
                background:
                  i === 0
                    ? 'linear-gradient(135deg, hsl(45 90% 55% / 0.18), hsl(240 30% 14% / 0.7))'
                    : 'hsl(240 30% 14% / 0.7)',
                border:
                  i === 0
                    ? '1px solid hsl(45 90% 60% / 0.4)'
                    : '1px solid hsl(220 30% 100% / 0.06)',
                borderRadius: 22,
              }}
            >
              <span style={{ fontSize: isStory ? 64 : 48 }}>{medals[i]}</span>
              <AthleteAvatar athlete={entry.athlete} size={isStory ? 100 : 80} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span
                  className="font-display font-bold"
                  style={{ fontSize: isStory ? 36 : 28, color: 'white', lineHeight: 1.1 }}
                >
                  {entry.athlete.name}
                </span>
                <span style={{ fontSize: isStory ? 22 : 18, color: 'hsl(220 15% 65%)' }}>
                  {entry.athlete.countryFlag} {entry.athlete.country.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span
                  className="font-display font-black"
                  style={{
                    fontSize: isStory ? 40 : 32,
                    color: 'white',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {entry.time}
                </span>
                <span style={{ fontSize: isStory ? 18 : 15, color: 'hsl(220 15% 60%)' }}>
                  {entry.gap}
                </span>
                <DeltaTag delta={entry.athlete.deltaT} size={isStory ? 'md' : 'sm'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardFrame>
  )
}
