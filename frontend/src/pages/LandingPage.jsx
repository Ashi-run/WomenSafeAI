import { useNavigate } from 'react-router-dom'
import {
  Shield, ScanSearch, MessageSquare, FileText, ChevronRight,
  Eye, DollarSign, Heart, Lock, UserX, AlertTriangle, Zap,
  CheckCircle, ArrowRight
} from 'lucide-react'

/* ─────────────────────────────── DATA ─────────────────────────────── */

const DETECT_ITEMS = [
  { icon: Heart,        label: 'Romance Scams',          color: 'text-coral-500',   bg: 'bg-coral-50' },
  { icon: UserX,        label: 'Catfishing',             color: 'text-lavender-500',bg: 'bg-lavender-50/60' },
  { icon: Lock,         label: 'Sextortion',             color: 'text-red-500',     bg: 'bg-red-50' },
  { icon: DollarSign,   label: 'Financial Scams',        color: 'text-amber-500',   bg: 'bg-amber-50' },
  { icon: Eye,          label: 'Fake Identities',        color: 'text-teal-500',    bg: 'bg-teal-50' },
  { icon: AlertTriangle,label: 'Emotional Manipulation', color: 'text-orange-500',  bg: 'bg-orange-50' },
]

const HOW_STEPS = [
  {
    num: '01',
    icon: ScanSearch,
    title: 'Upload What You Have',
    body: 'Profile photo, username, bio, chat screenshots, or conversation text — provide as little or as much as you have.',
  },
  {
    num: '02',
    icon: Zap,
    title: 'AI Analyzes Everything',
    body: 'Our multi-modal AI checks identity signals and conversation patterns against documented fraud profiles simultaneously.',
  },
  {
    num: '03',
    icon: FileText,
    title: 'Get Clear Answers',
    body: 'A unified risk score, plain-language explanation of every flag, and specific safety recommendations in under a minute.',
  },
]

const WHY_CARDS = [
  {
    icon: Shield,
    title: 'Multi-Modal Analysis',
    body: 'The only tool that combines profile identity analysis with conversation behavior analysis in a single unified risk score.',
    accent: 'teal',
  },
  {
    icon: Eye,
    title: 'Explains Every Finding',
    body: 'We don\'t just flag risk — we show you exactly what was detected, why it matters, and the tactics being used.',
    accent: 'lavender',
  },
  {
    icon: Lock,
    title: 'Completely Private',
    body: 'No account. No data storage. Uploads are analyzed and immediately discarded. Nothing about you or the contact is retained.',
    accent: 'coral',
  },
]

const SCENARIOS = [
  {
    tag: 'Romance Scam',
    tagColor: 'badge-high',
    title: 'Photo stolen from another profile',
    body: 'A user uploaded a profile photo of someone they met on a dating app. The analysis found the same image used across 4 different profiles with different names.',
    score: 81,
    scoreLabel: 'High Risk',
    scoreColor: 'text-coral-500',
  },
  {
    tag: 'Financial Scam',
    tagColor: 'badge-critical',
    title: 'Textbook grooming pattern detected',
    body: 'Chat screenshots revealed a clear progression: 3 weeks of love-bombing, then a sudden overseas financial emergency requiring wire transfer.',
    score: 94,
    scoreLabel: 'Critical Risk',
    scoreColor: 'text-red-600',
  },
  {
    tag: 'Catfishing',
    tagColor: 'badge-medium',
    title: 'AI-generated profile photo',
    body: 'The profile photo showed artifacts consistent with AI image generation. Username followed a known synthetic identity pattern.',
    score: 67,
    scoreLabel: 'High Risk',
    scoreColor: 'text-coral-500',
  },
]

/* ─────────────────────────────── COMPONENTS ─────────────────────────────── */

function TrustBar() {
  const items = [
    '🔒 Uploads not stored',
    '🆓 Completely free',
    '👤 No sign-up required',
    '🌐 Works on any device',
  ]
  return (
    <div className="bg-teal-500/5 border-y border-teal-500/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-6">
        {items.map((item) => (
          <span key={item} className="text-sm text-teal-700 font-medium">{item}</span>
        ))}
      </div>
    </div>
  )
}

function HeroSection({ onAnalyze }) {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-teal opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-[#F8F7F4] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
            <span className="text-xs font-medium text-teal-700">AI-Powered Fraud Detection</span>
          </div>

          <h1 className="text-4xl md:text-6xl text-[#2C2C2C] mb-6 animate-fade-up delay-100">
            Is this person really{' '}
            <span className="text-teal-500 italic">who they say</span>
            {' '}they are?
          </h1>

          <p className="text-lg md:text-xl text-[#6B7280] mb-10 leading-relaxed animate-fade-up delay-200">
            Upload a profile, screenshot, or conversation. Our AI detects romance scams,
            catfishing, sextortion, and emotional manipulation in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-300">
            <button
              onClick={() => onAnalyze('full')}
              className="btn-primary text-base py-3.5 px-8 shadow-score w-full sm:w-auto"
            >
              <Shield className="w-5 h-5" />
              Start Full Analysis
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAnalyze('profile')}
              className="btn-secondary text-base py-3.5 px-8 w-full sm:w-auto"
            >
              <ScanSearch className="w-5 h-5" />
              Profile Only
            </button>
            <button
              onClick={() => onAnalyze('conversation')}
              className="btn-secondary text-base py-3.5 px-8 w-full sm:w-auto"
            >
              <MessageSquare className="w-5 h-5" />
              Conversation Only
            </button>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-up delay-400">
            {[
              { value: '$1.3B',  label: 'Lost to romance scams yearly (US)' },
              { value: '70%',    label: 'Victims never report their experience' },
              { value: '< 60s',  label: 'Time to get your risk analysis' },
            ].map(({ value, label }) => (
              <div key={value} className="text-center">
                <div className="text-2xl md:text-3xl font-display text-teal-500">{value}</div>
                <div className="text-xs text-[#6B7280] mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl text-[#2C2C2C]">Three steps to clarity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200 z-0" />

          {HOW_STEPS.map(({ num, icon: Icon, title, body }, i) => (
            <div key={num} className="relative z-10 text-center group">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center mx-auto mb-6
                              group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300">
                <Icon className="w-8 h-8 text-teal-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="text-xs font-mono text-teal-400 mb-2">{num}</div>
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-3">{title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhatWeDetect() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">Detection Coverage</p>
          <h2 className="text-3xl md:text-4xl text-[#2C2C2C]">What we identify</h2>
          <p className="text-[#6B7280] mt-4 max-w-xl mx-auto">
            Our AI is trained to detect the full spectrum of online identity fraud and manipulation tactics.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DETECT_ITEMS.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="card-hover p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <span className="font-medium text-[#2C2C2C] text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyWomenSafe() {
  const accentMap = {
    teal:    { ring: 'ring-teal-200',    icon: 'bg-teal-100 text-teal-600' },
    lavender:{ ring: 'ring-lavender-200',icon: 'bg-lavender-100 text-lavender-600' },
    coral:   { ring: 'ring-coral-200',   icon: 'bg-coral-100 text-coral-600' },
  }

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">Why Us</p>
          <h2 className="text-3xl md:text-4xl text-[#2C2C2C]">Different by design</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WHY_CARDS.map(({ icon: Icon, title, body, accent }) => {
            const a = accentMap[accent]
            return (
              <div key={title} className={`card p-8 ring-1 ${a.ring}`}>
                <div className={`w-12 h-12 rounded-xl ${a.icon} flex items-center justify-center mb-6`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-3">{title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{body}</p>
              </div>
            )
          })}
        </div>

        {/* Comparison row */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-center text-[#2C2C2C] mb-8">
            How we compare to existing tools
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="text-left py-3 px-4 text-teal-700 font-semibold rounded-tl-lg">Feature</th>
                  <th className="py-3 px-4 text-[#6B7280] font-medium">Google Reverse Image</th>
                  <th className="py-3 px-4 text-[#6B7280] font-medium">Social Catfish</th>
                  <th className="py-3 px-4 text-teal-700 font-semibold bg-teal-100 rounded-tr-lg">WomenSafe AI ✦</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Profile photo analysis',    true,  true,  true ],
                  ['Bio / text analysis',        false, false, true ],
                  ['Conversation analysis',      false, false, true ],
                  ['Screenshot OCR',             false, false, true ],
                  ['Unified risk score',         false, false, true ],
                  ['Explains every finding',     false, false, true ],
                  ['Safety recommendations',     false, false, true ],
                  ['Free & no sign-up',          true,  false, true ],
                ].map(([feat, g, sc, ws]) => (
                  <tr key={feat} className="border-b border-[#E5E3DF]">
                    <td className="py-3 px-4 text-[#2C2C2C] font-medium">{feat}</td>
                    <td className="py-3 px-4 text-center">{g  ? '✅' : '❌'}</td>
                    <td className="py-3 px-4 text-center">{sc ? '✅' : '❌'}</td>
                    <td className="py-3 px-4 text-center bg-teal-50">{ws ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function ExampleScenarios({ onAnalyze }) {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">Real Scenarios</p>
          <h2 className="text-3xl md:text-4xl text-[#2C2C2C]">What our analysis finds</h2>
          <p className="text-[#6B7280] mt-4">Illustrative examples based on documented fraud patterns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SCENARIOS.map(({ tag, tagColor, title, body, score, scoreLabel, scoreColor }) => (
            <div key={title} className="card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <span className={`badge ${tagColor}`}>{tag}</span>
                <div className="text-right">
                  <div className={`text-2xl font-display font-bold ${scoreColor}`}>{score}</div>
                  <div className={`text-xs ${scoreColor} font-medium`}>{scoreLabel}</div>
                </div>
              </div>
              <h4 className="font-semibold text-[#2C2C2C] mb-2 leading-snug">{title}</h4>
              <p className="text-[#6B7280] text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button onClick={() => onAnalyze('full')} className="btn-primary">
            Analyze Your Contact
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function SafetyCenterPreview() {
  const topics = [
    {
      to: '/safety-center/romance-scams',
      label: 'Romance Scams',
      color: 'bg-coral-500',
      excerpt: 'How scammers build fake relationships to extract money and personal information over weeks or months.',
    },
    {
      to: '/safety-center/sextortion',
      label: 'Sextortion',
      color: 'bg-red-600',
      excerpt: 'Recognizing threats involving intimate content and knowing exactly what to do if it happens to you.',
    },
    {
      to: '/safety-center/what-to-do',
      label: 'I Think I\'ve Been Scammed',
      color: 'bg-teal-500',
      excerpt: 'Immediate steps to take, how to report, and where to find support if you\'ve been targeted.',
    },
  ]

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-2">Safety Center</p>
            <h2 className="text-3xl text-[#2C2C2C]">Learn to protect yourself</h2>
          </div>
          <a href="/safety-center" className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
            View all topics <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topics.map(({ label, color, excerpt, to }) => (
            <a key={to} href={to} className="card-hover p-6 group block">
              <div className={`w-10 h-1.5 rounded-full ${color} mb-5`} />
              <h4 className="font-semibold text-[#2C2C2C] mb-2 group-hover:text-teal-600 transition-colors">{label}</h4>
              <p className="text-[#6B7280] text-sm leading-relaxed">{excerpt}</p>
              <div className="mt-4 flex items-center gap-1 text-teal-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBanner({ onAnalyze }) {
  return (
    <section className="section bg-teal-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-400 opacity-50" />
      <div className="relative container text-center">
        <h2 className="text-3xl md:text-5xl text-white mb-4 font-display">
          Trust your instincts.
          <br />
          <span className="italic">We'll back them up with data.</span>
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
          If something feels off, it probably is. Run a free analysis in under a minute.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onAnalyze('full')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg
                       bg-white text-teal-600 font-semibold text-base
                       hover:bg-teal-50 transition-colors shadow-lg"
          >
            <Shield className="w-5 h-5" />
            Start Free Analysis
          </button>
          <a
            href="/safety-center"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg
                       border-2 border-white/50 text-white font-medium text-base
                       hover:bg-white/10 transition-colors"
          >
            Visit Safety Center
          </a>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {['No account needed', 'Private & secure', 'Free forever', 'Results in 60 seconds'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
              <CheckCircle className="w-4 h-4 text-white/70" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── PAGE ─────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate()

  const handleAnalyze = (mode) => {
    navigate('/analyze', { state: { mode } })
  }

  return (
    <>
      <HeroSection onAnalyze={handleAnalyze} />
      <TrustBar />
      <HowItWorks />
      <WhatWeDetect />
      <WhyWomenSafe />
      <ExampleScenarios onAnalyze={handleAnalyze} />
      <SafetyCenterPreview />
      <CtaBanner onAnalyze={handleAnalyze} />
    </>
  )
}
