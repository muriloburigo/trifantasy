type Props = { delta: number; size?: 'sm' | 'md' | 'lg' }

const sizes = {
  sm: { font: 14, padX: 8,  padY: 3, gap: 3 },
  md: { font: 18, padX: 10, padY: 4, gap: 4 },
  lg: { font: 26, padX: 14, padY: 6, gap: 6 },
}

/** +/- T$ pill, green when positive, red when negative, neutral when zero. */
export const DeltaTag = ({ delta, size = 'md' }: Props) => {
  const s = sizes[size]
  const positive = delta > 0
  const negative = delta < 0
  const color = positive
    ? 'hsl(142 71% 55%)'
    : negative
    ? 'hsl(0 84% 65%)'
    : 'hsl(220 15% 65%)'
  const bg = positive
    ? 'hsl(142 71% 45% / 0.15)'
    : negative
    ? 'hsl(0 84% 60% / 0.15)'
    : 'hsl(220 15% 65% / 0.12)'
  const arrow = positive ? '▲' : negative ? '▼' : '—'
  return (
    <span
      className="inline-flex items-center font-display font-bold leading-none"
      style={{
        color,
        background: bg,
        fontSize: s.font,
        padding: `${s.padY}px ${s.padX}px`,
        gap: s.gap,
        borderRadius: 999,
      }}
    >
      <span style={{ fontSize: s.font * 0.75 }}>{arrow}</span>
      {delta === 0 ? '0' : `${positive ? '+' : ''}${delta.toFixed(1)}`}
    </span>
  )
}
