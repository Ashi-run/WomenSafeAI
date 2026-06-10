import { useEffect, useState } from 'react'
import { Shield, ScanSearch, Brain, FileSearch, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

/* ─── Sequence of steps shown while AI analyzes ─── */
const STEPS = [
  { icon: ScanSearch, label: 'Scanning identity signals…',    duration: 2200 },
  { icon: Brain,      label: 'Running behavior analysis…',   duration: 2000 },
  { icon: FileSearch, label: 'Cross-referencing patterns…',  duration: 1800 },
  { icon: Shield,     label: 'Calculating risk score…',      duration: 1500 },
]

function PulsingDot({ delay = 0 }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}

function ScanRing() {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer ring */}
      <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '3s' }}
           viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="50" fill="none" stroke="#1A6B5A" strokeWidth="1.5"
                strokeDasharray="60 260" strokeLinecap="round" opacity="0.4" />
      </svg>
      {/* Middle ring */}
      <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}
           viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="40" fill="none" stroke="#2faa8e" strokeWidth="1"
                strokeDasharray="30 220" strokeLinecap="round" opacity="0.5" />
      </svg>
      {/* Center icon */}
      <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-score z-10">
        <Shield className="w-8 h-8 text-white" />
      </div>
    </div>
  )
}

function StepIndicator({ step, index, currentIndex }) {
  const Icon = step.icon
  const done    = index < currentIndex
  const active  = index === currentIndex
  const pending = index > currentIndex

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500',
      active  && 'bg-teal-50 border border-teal-200',
      done    && 'opacity-60',
      pending && 'opacity-30',
    )}>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300',
        active  ? 'bg-teal-500' : done ? 'bg-sage-500' : 'bg-slate-200'
      )}>
        {done
          ? <CheckCircle2 className="w-4 h-4 text-white" />
          : <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-slate-400')} />
        }
      </div>
      <span className={cn(
        'text-sm font-medium transition-colors duration-300',
        active ? 'text-teal-700' : done ? 'text-[#6B7280]' : 'text-slate-400'
      )}>
        {step.label}
        {active && (
          <span className="inline-flex gap-0.5 ml-1.5 align-middle">
            <PulsingDot delay={0} />
            <PulsingDot delay={200} />
            <PulsingDot delay={400} />
          </span>
        )}
      </span>
    </div>
  )
}

export default function AnalysisLoadingOverlay({ mode = 'full' }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress]       = useState(0)

  const modeLabel = {
    full:         'Full Profile + Conversation',
    profile:      'Profile Identity',
    conversation: 'Conversation Patterns',
  }[mode] || 'Full Analysis'

  /* Advance through steps */
  useEffect(() => {
    let step = 0
    const advance = () => {
      if (step < STEPS.length - 1) {
        step++
        setCurrentStep(step)
      }
    }

    let elapsed = 0
    const timers = STEPS.map((s, i) => {
      const t = setTimeout(() => advance(), elapsed + s.duration)
      elapsed += s.duration
      return t
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  /* Smooth progress bar */
  useEffect(() => {
    const target = Math.round(((currentStep + 1) / STEPS.length) * 90)
    const step   = () => {
      setProgress(p => {
        if (p >= target) return p
        return p + 1
      })
    }
    const id = setInterval(step, 30)
    return () => clearInterval(id)
  }, [currentStep])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F7F4]/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="card p-8 text-center shadow-card-hover">

          {/* Animated scan ring */}
          <div className="flex justify-center mb-6">
            <ScanRing />
          </div>

          {/* Title */}
          <h2 className="text-xl font-display text-[#2C2C2C] mb-1">
            Analyzing Contact
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Running {modeLabel} — this takes about 30 seconds
          </p>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step list */}
          <div className="space-y-1.5 text-left mb-6">
            {STEPS.map((step, i) => (
              <StepIndicator
                key={step.label}
                step={step}
                index={i}
                currentIndex={currentStep}
              />
            ))}
          </div>

          {/* Privacy note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF]">
            <Shield className="w-3 h-3" />
            <span>Inputs are analyzed and immediately discarded</span>
          </div>
        </div>
      </div>
    </div>
  )
}
