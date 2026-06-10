import { Link } from 'react-router-dom'
import { Heart, UserX, Lock, DollarSign, HelpCircle, ChevronRight, Shield } from 'lucide-react'

const TOPICS = [
  {
    slug: 'romance-scams',
    icon: Heart,
    color: 'text-coral-500',
    bg: 'bg-coral-50',
    border: 'border-coral-200',
    title: 'Romance Scams',
    subtitle: 'When love is a weapon',
    desc: 'Scammers build fake romantic relationships over weeks or months before introducing financial requests. Learn the playbook and how to spot it.',
    stats: '$1.3B lost in US (2022)',
  },
  {
    slug: 'catfishing',
    icon: UserX,
    color: 'text-lavender-500',
    bg: 'bg-lavender-50/60',
    border: 'border-lavender-200',
    title: 'Catfishing',
    subtitle: 'Fake identities online',
    desc: 'Creating a false persona to deceive someone emotionally. How to verify who you\'re really talking to and why stolen photos are so common.',
    stats: '13M adults catfished in US annually',
  },
  {
    slug: 'sextortion',
    icon: Lock,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'Sextortion',
    subtitle: 'When they have leverage',
    desc: 'Threats involving intimate content. What to do immediately if you receive a threat, and why paying never makes it stop.',
    stats: 'FBI reports surge in cases',
  },
  {
    slug: 'financial-scams',
    icon: DollarSign,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'Financial Scams',
    subtitle: 'Money-motivated deception',
    desc: 'Investment fraud, emergency money requests, gift card scams, and cryptocurrency fraud perpetrated through online relationships.',
    stats: 'Average victim loss: $10,000',
  },
  {
    slug: 'what-to-do',
    icon: HelpCircle,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    title: 'What To Do',
    subtitle: 'If you\'ve been targeted',
    desc: 'Step-by-step guidance for what to do right now, how to preserve evidence, where to report, and how to find support.',
    stats: 'Act fast — time matters',
  },
]

export default function SafetyCenterPage() {
  return (
    <div className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="bg-white border-b border-[#E5E3DF] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 mb-5">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-medium text-teal-700">Safety Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl text-[#2C2C2C] mb-4">
            Knowledge is your best protection
          </h1>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            Understand the tactics scammers use, learn to recognize the warning signs,
            and know exactly what to do if something happens to you.
          </p>
        </div>
      </section>

      {/* Topic cards */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOPICS.map(({ slug, icon: Icon, color, bg, border, title, subtitle, desc, stats }) => (
              <Link
                key={slug}
                to={`/safety-center/${slug}`}
                className={`card-hover p-6 group block border ${border}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-teal-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-[#2C2C2C] text-lg mb-1 group-hover:text-teal-600 transition-colors">{title}</h3>
                <p className="text-sm text-[#9CA3AF] mb-3 font-medium">{subtitle}</p>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{desc}</p>
                <div className={`text-xs font-semibold ${color}`}>{stats}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
