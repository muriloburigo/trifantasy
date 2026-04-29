'use client'
import { forwardRef, type ReactNode } from 'react'
import type { CardFormat } from '~/lib/trixerTypes'
import { FORMAT_DIMENSIONS } from '~/lib/trixerTypes'

type Props = {
  format: CardFormat
  maxWidth: number
  maxHeight: number
  children: ReactNode
}

/**
 * Renders the card at exact pixel dimensions, then visually scales it down
 * with CSS transform so it fits the preview area.
 * What you see is byte-perfect what html-to-image will export.
 */
export const CardPreview = forwardRef<HTMLDivElement, Props>(
  ({ format, maxWidth, maxHeight, children }, ref) => {
    const { w, h } = FORMAT_DIMENSIONS[format]
    const scale = Math.min(maxWidth / w, maxHeight / h, 1)
    return (
      <div
        style={{
          width: w * scale,
          height: h * scale,
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow:
            '0 30px 80px -20px hsl(211 100% 60% / 0.35), 0 0 0 1px hsl(220 30% 100% / 0.06)',
        }}
      >
        <div
          ref={ref}
          style={{
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    )
  }
)
CardPreview.displayName = 'CardPreview'
