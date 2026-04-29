type Props = { size?: number; className?: string }

/** TRIXER wordmark — TRIX in brand blue, ER in white. */
export const TrixerLogo = ({ size = 28, className = '' }: Props) => (
  <div
    className={`font-display font-black tracking-tight leading-none ${className}`}
    style={{ fontSize: size, letterSpacing: '-0.02em' }}
  >
    <span style={{ color: 'hsl(211 100% 60%)' }}>TRIX</span>
    <span style={{ color: 'white' }}>ER</span>
  </div>
)
