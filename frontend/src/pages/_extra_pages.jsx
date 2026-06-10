// ─── AboutPage ───────────────────────────────────────────────────────────────
import { Shield, Eye, Lock, Cpu, Users, BookOpen } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-12">
        <h1 className="text-4xl md:text-5xl text-[#2C2C2C] mb-4">About WomenSafe AI</h1>
        <p className="text-[#6B7280] text-lg leading-relaxed mb-12">
          Built to close the information gap between fraud experts and ordinary people navigating the dangerous landscape of online relationships.
        </p>

        {[
          {
            icon: Shield,
            title: 'Our Mission',
            body: 'Online identity fraud devastates lives. Romance scams, catfishing, and sextortion are crimes that disproportionately target women, causing financial ruin and lasting psychological harm. WomenSafe AI exists to give anyone the tools that only fraud investigators previously had — in under a minute, for free, without creating an account.',
          },
          {
            icon: Cpu,
            title: 'How the Analysis Works',
            body: 'We use a multi-modal AI pipeline that analyzes up to five types of input simultaneously: profile photos (checking for AI generation and reverse image matches), usernames (pattern analysis against known fraud structures), bios (NLP comparison to documented scam scripts), and conversation text (detecting eight distinct manipulation tactics including love bombing, financial pressure, and platform migration requests). Each signal feeds into a unified risk score with plain-language explanations.',
          },
          {
            icon: Lock,
            title: 'Privacy Commitment',
            body: 'Your uploads are processed in memory and immediately discarded. Nothing you submit is stored in any database. There is no user account system, no logging of inputs, and no resale of any data. The technical architecture is designed so that retention is impossible, not just against policy.',
          },
          {
            icon: Eye,
            title: 'Responsible Use',
            body: 'WomenSafe AI provides probabilistic risk assessment — pattern matching against documented fraud behavior. It is not a lie detector and does not make definitive determinations about any individual. Results should never be used to publicly accuse someone, and a clean result does not guarantee safety. Always trust your instincts alongside any tool.',
          },
          {
            icon: Users,
            title: 'Who Built This',
            body: 'WomenSafe AI was built as an academic project exploring the intersection of AI, online safety, and explainable machine learning. It is designed as a research platform with a public safety mission.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#2C2C2C] mb-2">{title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FaqPage ──────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/helpers'

const FAQS = [
  {
    q: 'How accurate is the analysis?',
    a: 'Our classifiers have been trained and evaluated on documented fraud patterns. For conversation analysis, we achieve 85-90% accuracy on test datasets of known scam conversations. However, all results include confidence scores and should be treated as probabilistic assessments, not definitive proof.',
  },
  {
    q: 'Is my data safe? Who can see what I upload?',
    a: 'Nobody. Uploads are processed in memory and immediately discarded after analysis. There is no database storing your inputs, no logs of what you submitted, and no human review of your uploads. The system is architected so that retention is technically impossible, not just against a policy that could be changed.',
  },
  {
    q: 'Can I use this to verify someone before meeting them for the first time?',
    a: 'Absolutely — this is one of the most valuable use cases. Uploading their profile and any conversations before a first meeting can surface red flags you might not notice on your own. That said, a low risk score does not guarantee someone is safe to meet.',
  },
  {
    q: 'What if I get a high risk score for someone who is actually genuine?',
    a: 'False positives are possible, especially if someone has an unusual online presence or uses communication styles that overlap with known scam patterns. A high score means we detected patterns that frequently appear in fraud cases — it does not prove the person is a scammer. Use it as one input among many, including your own judgment.',
  },
  {
    q: 'Why can\'t I just use Google reverse image search?',
    a: 'Reverse image search is a single signal. WomenSafe AI provides five simultaneous analysis streams (photo, username, bio, conversation text, conversation screenshots), weighs them against each other, classifies the scam type, explains every flag in plain language, and provides safety recommendations. It\'s the difference between one data point and a complete picture.',
  },
  {
    q: 'Is this platform only for women?',
    a: 'Despite the name, anyone can use WomenSafe AI. The name reflects our primary target audience — women are disproportionately targeted by romance scams and sextortion — but the analysis is equally useful for any gender.',
  },
  {
    q: 'What should I do if my risk score is very high?',
    a: 'First, don\'t panic. Read the specific findings and explanations carefully. Then consult our Safety Center for guidance specific to the detected scam type. Most importantly: do not send money, do not share intimate images, and do not move the conversation to a private platform. Save all evidence.',
  },
  {
    q: 'Can I report a confirmed scammer through this platform?',
    a: 'Currently, we do not have a scammer database or reporting system. To report a scammer, use the official channels: the FBI\'s IC3 (ic3.gov), the FTC (reportfraud.ftc.gov), or the platform where the contact was made. Our Safety Center has direct links to all relevant reporting portals.',
  },
  {
    q: 'Does the platform work in languages other than English?',
    a: 'Currently, our NLP models are optimized for English. Conversations in other languages will still be analyzed but with lower accuracy. Multilingual support is on our development roadmap.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E5E3DF] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-teal-600 transition-colors"
      >
        <span className="font-medium text-[#2C2C2C] leading-snug">{q}</span>
        <ChevronDown className={cn('w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="pb-5 text-[#6B7280] text-sm leading-relaxed pr-8">{a}</p>
      )}
    </div>
  )
}

export function FaqPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-12">
        <h1 className="text-4xl text-[#2C2C2C] mb-3">Frequently Asked Questions</h1>
        <p className="text-[#6B7280] mb-10">Everything you need to know about how WomenSafe AI works.</p>
        <div className="card p-2">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="px-4">
              <FaqItem q={q} a={a} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ContactPage ──────────────────────────────────────────────────────────────
import { Mail, MessageCircle, ExternalLink as ExtLink } from 'lucide-react'

export function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', category: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production this would call an API endpoint
    setSent(true)
  }

  if (sent) {
    return (
      <div className="pt-20 pb-20 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-3">Message sent!</h2>
          <p className="text-[#6B7280]">We'll respond within 48 hours. For urgent safety matters, please contact law enforcement directly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-xl mx-auto px-4 pt-12">
        <h1 className="text-4xl text-[#2C2C2C] mb-3">Contact Us</h1>
        <p className="text-[#6B7280] mb-2 leading-relaxed">
          Questions, feedback, or concerns about the platform? We'll respond within 48 hours.
        </p>
        <p className="text-xs text-[#9CA3AF] mb-8">
          Do not submit personal information about third parties through this form.
          For immediate safety emergencies, contact law enforcement.
        </p>

        <div className="card p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Name</label>
              <input className="input" placeholder="Your name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Email</label>
              <input type="email" className="input" placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select a topic...</option>
                <option>General question</option>
                <option>Technical issue</option>
                <option>Feedback or suggestion</option>
                <option>Privacy concern</option>
                <option>Partnership inquiry</option>
                <option>Press / Media</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Message</label>
              <textarea className="textarea" rows={5} placeholder="How can we help?"
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-[#2C2C2C] mb-4">Urgent? Report directly</h3>
          {[
            { label: 'FBI Internet Crime Complaint Center', url: 'https://www.ic3.gov' },
            { label: 'FTC Fraud Report', url: 'https://reportfraud.ftc.gov' },
            { label: 'India Cybercrime Portal', url: 'https://cybercrime.gov.in' },
          ].map(({ label, url }) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group mb-1">
              <ExtLink className="w-4 h-4 text-teal-500" />
              <span className="text-sm text-[#2C2C2C] group-hover:text-teal-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── NotFoundPage ─────────────────────────────────────────────────────────────
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-display text-teal-100 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-3">Page not found</h1>
        <p className="text-[#6B7280] mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <RouterLink to="/" className="btn-primary">Back to Home</RouterLink>
      </div>
    </div>
  )
}
