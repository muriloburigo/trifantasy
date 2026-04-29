import type { Athlete } from '~/lib/trixerTypes'

type Props = {
  athlete: Athlete
  size?: number
  showGradient?: boolean
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

/** Round avatar with initials fallback. */
export const AthleteAvatar = ({ athlete, size = 96, showGradient = true }: Props) => {
  const initials = initialsOf(athlete.name)
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: showGradient
          ? 'linear-gradient(135deg, hsl(211 100% 60%), hsl(268 83% 65%))'
          : 'hsl(240 30% 18%)',
      }}
    >
      {athlete.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={athlete.photoUrl}
          alt={athlete.name}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <span
          className="font-display font-black text-white"
          style={{ fontSize: size * 0.36, letterSpacing: '-0.04em' }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
