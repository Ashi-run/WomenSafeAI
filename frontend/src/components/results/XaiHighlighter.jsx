/**
 * XaiHighlighter
 * ==============
 * Renders conversation text with SHAP-attributed words visually highlighted.
 *
 * Props
 * -----
 *   attributions  — array of { word, weight, is_trigger } from the API
 *   originalText  — the raw conversation string (used as fallback if
 *                   attributions is empty or fails to reassemble)
 *   className     — optional extra class on the outer wrapper
 *
 * Visual encoding
 * ---------------
 *   is_trigger=true, weight ≥ 0.7  → deep red bg + white text (critical trigger)
 *   is_trigger=true, weight ≥ 0.4  → coral bg + dark text    (strong trigger)
 *   is_trigger=true, weight < 0.4  → amber bg + dark text    (mild trigger)
 *   is_trigger=false, weight ≥ 0.5 → light teal bg           (supporting context)
 *   everything else                → plain text
 *
 * A legend is shown above the text explaining the colour encoding.
 * Hovering a highlighted word shows a tooltip with the exact weight value.
 */

import { useState } from 'react'
import { Info, Zap } from 'lucide-react'
import { cn } from '../../utils/helpers'

/* ─── Colour decision ─── */
function getTokenStyle(token) {
  const { is_trigger, weight } = token

  if (is_trigger) {
    if (weight >= 0.7) return {
      bg:      'bg-red-600',
      text:    'text-white',
      border:  'border-red-700',
      label:   'Critical trigger',
      ring:    'ring-red-300',
    }
    if (weight >= 0.4) return {
      bg:      'bg-coral-500',
      text:    'text-white',
      border:  'border-coral-600',
      label:   'Strong trigger',
      ring:    'ring-coral-300',
    }
    return {
      bg:      'bg-amber-400',
      text:    'text-amber-900',
      border:  'border-amber-500',
      label:   'Mild trigger',
      ring:    'ring-amber-200',
    }
  }

  // High-weight non-trigger = supporting context
  if (weight >= 0.5) return {
    bg:      'bg-teal-100',
    text:    'text-teal-800',
    border:  'border-teal-200',
    label:   'Supporting context',
    ring:    'ring-teal-200',
  }

  return null  // plain text
}

/* ─── Single highlighted token ─── */
function Token({ token }) {
  const [hovered, setHovered] = useState(false)
  const style = getTokenStyle(token)

  if (!style) {
    // Plain word — render with a space after
    return <span>{token.word} </span>
  }

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'inline px-0.5 py-0.5 rounded mx-px cursor-default',
          'border text-xs sm:text-sm font-medium leading-relaxed',
          'transition-all duration-150',
          style.bg, style.text, style.border,
          hovered && `ring-2 ${style.ring}`,
        )}
      >
        {token.word}
      </span>
      {/* Tooltip */}
      {hovered && (
        <span className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20',
          'whitespace-nowrap px-2 py-1 rounded-md shadow-lg',
          'text-[11px] font-medium pointer-events-none',
          'bg-[#2C2C2C] text-white',
        )}>
          {style.label} · weight {(token.weight * 100).toFixed(0)}%
          {/* Caret */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2C2C2C]" />
        </span>
      )}
      {' '}
    </span>
  )
}

/* ─── Legend ─── */
function Legend() {
  const items = [
    { bg: 'bg-red-600',    text: 'text-white',      label: 'Critical trigger word' },
    { bg: 'bg-coral-500',  text: 'text-white',      label: 'Strong trigger word'   },
    { bg: 'bg-amber-400',  text: 'text-amber-900',  label: 'Mild trigger word'     },
    { bg: 'bg-teal-100',   text: 'text-teal-800',   label: 'Supporting context'    },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280] mb-3">
      <span className="font-medium text-[#2C2C2C] flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        AI Attribution Legend:
      </span>
      {items.map(({ bg, text, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={cn('inline-block w-3 h-3 rounded-sm border', bg)} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  )
}

/* ─── Empty state ─── */
function EmptyState({ originalText }) {
  if (!originalText) return (
    <p className="text-sm text-[#9CA3AF] italic">No conversation text to display.</p>
  )
  return (
    <>
      <p className="text-xs text-[#9CA3AF] italic mb-3">
        No word-level attributions available for this result — the text is shown below for reference.
      </p>
      <p className="text-sm text-[#2C2C2C] leading-relaxed whitespace-pre-wrap font-mono">
        {originalText}
      </p>
    </>
  )
}

/* ─── Main component ─── */
export default function XaiHighlighter({ attributions, originalText, className }) {
  // Guard: if no attributions or empty, fall back to plain text
  const hasAttributions = Array.isArray(attributions) && attributions.length > 0

  const triggerCount = hasAttributions
    ? attributions.filter(t => t.is_trigger).length
    : 0

  return (
    <div className={cn('space-y-3', className)}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-sm font-semibold text-[#2C2C2C] flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          Explainable AI — Word Attribution
        </h4>
        {triggerCount > 0 && (
          <span className="badge badge-critical text-[10px]">
            {triggerCount} trigger word{triggerCount !== 1 ? 's' : ''} detected
          </span>
        )}
      </div>

      {/* Info note — only relevant when SHAP attributions are present */}
      {hasAttributions && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Words are highlighted based on their influence on the AI's fraud prediction (SHAP values).
            Trigger words are the strongest contributors to the risk score — they are not proof of fraud
            by themselves, but indicate language patterns the model flags as high-risk.
          </p>
        </div>
      )}

      {/* Legend */}
      {hasAttributions && <Legend />}

      {/* Token render */}
      <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E3DF] leading-8 text-sm">
        {hasAttributions
          ? attributions.map((token, i) => <Token key={i} token={token} />)
          : <EmptyState originalText={originalText} />
        }
      </div>

      {/* Attribution note */}
      {hasAttributions && (
        <p className="text-[10px] text-[#9CA3AF] text-right">
          Hover any highlighted word to see its exact attribution weight.
        </p>
      )}
    </div>
  )
}
