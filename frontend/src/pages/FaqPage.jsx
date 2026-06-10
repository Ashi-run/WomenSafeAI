import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/helpers'

const FAQS = [
  {
    q: 'How accurate is the analysis?',
    a: 'Our classifiers are trained and evaluated on documented fraud patterns. For conversation analysis, we achieve 85–90% accuracy on test datasets of known scam conversations. All results include confidence scores and should be treated as probabilistic assessments, not definitive proof.',
  },
  {
    q: 'Is my data safe? Who can see what I upload?',
    a: 'Nobody. Uploads are processed in memory and immediately discarded after analysis. There is no database storing your inputs, no logs of what you submitted, and no human review of your uploads. The system is architected so that retention is technically impossible.',
  },
  {
    q: 'Can I use this to verify someone before meeting them?',
    a: 'Absolutely — this is one of the most valuable use cases. Uploading their profile and any conversations before a first meeting can surface red flags you might not notice on your own. That said, a low risk score does not guarantee someone is safe to meet.',
  },
  {
    q: 'What if I get a high risk score for someone genuine?',
    a: 'False positives are possible, especially if someone has an unusual online presence or communication style that overlaps with known scam patterns. A high score means we detected patterns that frequently appear in fraud cases — it does not prove the person is a scammer. Use it as one input alongside your own judgment.',
  },
  {
    q: 'Why not just use Google reverse image search?',
    a: 'Reverse image search is a single signal. WomenSafe AI provides five simultaneous analysis streams (photo, username, bio, conversation text, conversation screenshots), weighs them, classifies the scam type, explains every flag in plain language, and provides safety recommendations. It is the difference between one data point and a complete picture.',
  },
  {
    q: 'Is this platform only for women?',
    a: 'Despite the name, anyone can use WomenSafe AI. The name reflects our primary target audience — women are disproportionately targeted by romance scams and sextortion — but the analysis is equally useful for any gender.',
  },
  {
    q: 'What should I do if my risk score is very high?',
    a: 'Read the specific findings and explanations carefully. Consult our Safety Center for guidance specific to the detected scam type. Most importantly: do not send money, do not share intimate images, and do not move the conversation to a private platform. Save all evidence before making any decisions.',
  },
  {
    q: 'Can I report a confirmed scammer through this platform?',
    a: 'Currently we do not maintain a scammer database. To report a scammer, use official channels: the FBI\'s IC3 (ic3.gov), the FTC (reportfraud.ftc.gov), or the platform where the contact was made. Our Safety Center has direct links to all relevant reporting portals.',
  },
  {
    q: 'Does the platform work in languages other than English?',
    a: 'Currently our NLP models are optimised for English. Conversations in other languages will still be analysed but with lower accuracy. Multilingual support is on our development roadmap.',
  },
  {
    q: 'How long does an analysis take?',
    a: 'A full analysis typically completes in 20–60 seconds depending on how much input you provide. Profile-only or conversation-only analyses are faster. You will see a live progress indicator while results are being computed.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E5E3DF] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-teal-600 transition-colors group"
      >
        <span className="font-medium text-[#2C2C2C] leading-snug group-hover:text-teal-600 transition-colors">{q}</span>
        <ChevronDown className={cn('w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="pb-5 text-[#6B7280] text-sm leading-relaxed pr-8">{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-12">
        <h1 className="text-4xl text-[#2C2C2C] mb-3">Frequently Asked Questions</h1>
        <p className="text-[#6B7280] mb-10">Everything you need to know about how WomenSafe AI works.</p>
        <div className="card px-6 py-2">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </div>
    </div>
  )
}
