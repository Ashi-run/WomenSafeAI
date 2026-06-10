import React from 'react'

/**
 * Circular score ring with animated fill and centered score.
 */
export default function ScoreRing({ score, size = 120, strokeWidth = 8, color = '#1A6B5A', label, sublabel }) {
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r
  const pct  = score != null ? Math.min(100, Math.max(0, score)) / 100 : 0
  const dash = circ * pct
  const gap  = circ - dash

  return (
    <div className="flex flex-col items-center gap-2">
      
      {/* Relative container ensures the number and the SVG perfectly overlap */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        
        {/* The SVG Rings */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 block"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#F1F5F4"
            strokeWidth={strokeWidth}
          />
          {/* Animated Fill */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={score != null ? color : '#E5E3DF'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1) 300ms' }}
          />
        </svg>

        {/* Centered HTML Text Overlay (Bulletproof centering) */}
        <span
          className="absolute font-bold tracking-tight z-10"
          style={{
            fontSize: size > 100 ? '28px' : '22px',
            fontFamily: '"DM Serif Display", Georgia, serif',
            color: score != null ? color : '#9CA3AF',
            transition: 'color 0.3s',
          }}
        >
          {score != null ? Math.round(score) : '--'}
        </span>

      </div>

      {/* Render labels if they are explicitly passed */}
      {label && (
        <div className="text-center mt-1">
          <p className="text-sm font-semibold text-[#2C2C2C]">{label}</p>
          {sublabel && <p className="text-xs text-[#6B7280] mt-0.5">{sublabel}</p>}
        </div>
      )}
    </div>
  )
}