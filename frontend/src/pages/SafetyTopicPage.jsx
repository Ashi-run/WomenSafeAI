import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

const CONTENT = {
  'romance-scams': {
    title: 'Romance Scams',
    intro: 'A romance scam occurs when a criminal adopts a fake online identity to gain a victim\'s affection and trust. The scammer uses the illusion of a romantic relationship to manipulate and steal from the victim.',
    howItWorks: [
      'Initial contact through dating apps, social media, or even random texts',
      'Rapid escalation of emotional intimacy ("love bombing") within days or weeks',
      'Excuses for why they cannot meet in person or video call (overseas work, military deployment)',
      'Building deep emotional dependency before introducing any financial topic',
      'Crisis narrative introduced: medical emergency, stuck at airport, business deal needing a loan',
      'First small financial request to test willingness — then escalating demands',
      'When victim becomes suspicious, scammer may vanish or attempt to re-engage with a new approach',
    ],
    warningSign: [
      'They profess very strong feelings unusually quickly',
      'Their profile photos look professional or model-quality',
      'They claim to be working overseas (oil rig, military, doctor with MSF)',
      'They avoid video calls, or video quality is always poor',
      'They ask you to move off the dating platform to WhatsApp/Telegram',
      'They introduce a financial problem after gaining your trust',
      'They request gift cards, wire transfers, or cryptocurrency',
    ],
    whatToDo: [
      'Stop all financial transactions immediately — do not send more money',
      'Do a reverse image search on their profile photo',
      'Save all conversation evidence before blocking',
      'Report the profile on the platform where you met them',
      'Contact your bank immediately if you have sent money',
      'Report to FBI IC3 (ic3.gov) or FTC (reportfraud.ftc.gov)',
      'Know you are not alone — this happens to smart, careful people',
    ],
    resources: [
      { label: 'Report to FBI Internet Crime Complaint Center', url: 'https://www.ic3.gov' },
      { label: 'Report to FTC', url: 'https://reportfraud.ftc.gov' },
      { label: 'Romance Scam Victim Support', url: 'https://romancescam.com' },
    ],
  },
  'catfishing': {
    title: 'Catfishing',
    intro: 'Catfishing means creating a fake online persona to deceive someone — usually to establish a relationship under false pretenses. Unlike romance scams, not all catfishing has a financial motive; some is done for emotional manipulation or entertainment.',
    howItWorks: [
      'Stealing photos from social media accounts of real people (often models, soldiers, doctors)',
      'Creating detailed backstories that are plausible but difficult to verify',
      'Maintaining the persona across multiple platforms',
      'Avoiding video calls or using pre-recorded videos',
      'Building emotional attachment before revealing any true intent',
    ],
    warningSign: [
      'Reverse image search finds the photo on other profiles or stock sites',
      'Refuses video calls or always has technical "problems"',
      'Their social media accounts have very few posts or followers',
      'Stories about their life contain inconsistencies over time',
      'They get defensive or angry when you ask verification questions',
    ],
    whatToDo: [
      'Do a reverse image search immediately (Google Images, TinEye)',
      'Request a real-time video call and note any hesitation',
      'Ask specific verifiable questions about their claimed location',
      'Trust your instincts — if something feels off, investigate further',
      'Use WomenSafe AI to run a full profile analysis',
    ],
    resources: [
      { label: 'TinEye Reverse Image Search', url: 'https://tineye.com' },
      { label: 'Google Reverse Image Search', url: 'https://images.google.com' },
    ],
  },
  'sextortion': {
    title: 'Sextortion',
    intro: 'Sextortion is when someone threatens to share intimate photos or videos of you unless you comply with their demands — usually money, more intimate content, or other favors. It is a serious crime in most jurisdictions.',
    howItWorks: [
      'Befriending victim online and building trust',
      'Convincing victim to share intimate images or recording video calls without consent',
      'Threatening to send images/videos to the victim\'s contacts, family, or employer',
      'Demanding payment (often cryptocurrency) to prevent sharing',
      'Continuing to demand more after initial payment — it never stops',
    ],
    warningSign: [
      'Someone you met online asks for intimate photos very quickly',
      'They offer to share intimate content "first" to make you comfortable',
      'They gather information about your friends, family, and workplace',
      'Any threat involving images you have shared',
    ],
    whatToDo: [
      'Do NOT pay — payment encourages more demands and does not guarantee compliance',
      'Do NOT send more images',
      'Screenshot and save all evidence of the threats',
      'Report to the FBI at ic3.gov — sextortion is a federal crime',
      'Report to the platform immediately',
      'Contact the StopNCII platform to prevent image sharing',
      'Tell someone you trust — you do not have to face this alone',
    ],
    resources: [
      { label: 'FBI Sextortion Resources', url: 'https://www.fbi.gov/news/stories/sextortion' },
      { label: 'StopNCII — Prevent Image Sharing', url: 'https://stopncii.org' },
      { label: 'NCMEC CyberTipline', url: 'https://www.missingkids.org/gethelpnow/cybertipline' },
    ],
  },
  'financial-scams': {
    title: 'Financial Scams',
    intro: 'Financial scams use online relationships — romantic or otherwise — as a vector to extract money. The relationship may be fake, or a real acquaintance\'s account may be compromised.',
    howItWorks: [
      'Building a relationship (romantic, friendship, or investment mentor) online',
      'Introducing an investment opportunity with guaranteed high returns',
      'Emergency money requests: stuck at airport, medical bill, business deal',
      'Gift card requests (a universal red flag — no legitimate organization asks for gift cards)',
      'Cryptocurrency investment platforms that are controlled by the scammer',
    ],
    warningSign: [
      'Any request for money, gift cards, or crypto from an online contact',
      'Investment opportunities with guaranteed or unusually high returns',
      '"Pig butchering" — gradual investment platform that lets you withdraw small amounts initially',
      'Urgency and pressure to act before thinking',
      'Reluctance to explain exactly what the money is for',
    ],
    whatToDo: [
      'Never send money, gift cards, or cryptocurrency to someone you have not met',
      'Contact your bank immediately if a transfer has been made',
      'Report investment fraud to the SEC (sec.gov/tcr)',
      'Report to FTC at reportfraud.ftc.gov',
      'Contact your bank\'s fraud department — some transfers can be reversed',
    ],
    resources: [
      { label: 'FTC: Report Fraud', url: 'https://reportfraud.ftc.gov' },
      { label: 'SEC Investment Fraud', url: 'https://www.sec.gov/tcr' },
      { label: 'FBI IC3', url: 'https://www.ic3.gov' },
    ],
  },
  'what-to-do': {
    title: 'I Think I\'ve Been Scammed',
    intro: 'If you think you are being targeted by an online scam, taking the right steps quickly can limit damage and help with recovery. You are not alone — this happens to intelligent, careful people every day.',
    howItWorks: [
      'Right now (if financial loss occurred): contact your bank\'s fraud line immediately',
      'Document everything: screenshot conversations, profiles, payment records',
      'Do not delete conversations — they are evidence',
      'Stop all contact with the person',
      'Report to the platform where contact was made',
      'File a report with law enforcement',
      'Reach out for emotional support — the shame is not yours to carry',
    ],
    warningSign: [
      'You have sent money, gift cards, or cryptocurrency to someone online',
      'You have shared intimate images with someone online',
      'You have received a threat of any kind',
      'Something feels deeply wrong even if you can\'t name it',
    ],
    whatToDo: [
      'Bank: Call your bank fraud line within 24 hours of any transfer',
      'Evidence: Take screenshots of all conversations and profiles now',
      'Platform: Report the profile on dating app, social media, etc.',
      'FBI: File at ic3.gov (US) or your national cybercrime portal',
      'FTC: File at reportfraud.ftc.gov',
      'Support: Contact a trusted friend, family member, or counselor',
      'Remember: Being deceived by a professional criminal is not a reflection of your intelligence',
    ],
    resources: [
      { label: 'FBI IC3 — File a Report', url: 'https://www.ic3.gov' },
      { label: 'FTC — Report Fraud', url: 'https://reportfraud.ftc.gov' },
      { label: 'India Cybercrime Portal', url: 'https://cybercrime.gov.in' },
      { label: 'Victim Connect Resource Center', url: 'https://victimconnect.org' },
    ],
  },
}

export default function SafetyTopicPage() {
  const { topic }  = useParams()
  const navigate   = useNavigate()
  const content    = CONTENT[topic]

  if (!content) {
    return (
      <div className="pt-32 pb-20 text-center px-4">
        <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-4">Topic not found</h1>
        <Link to="/safety-center" className="btn-primary">Back to Safety Center</Link>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back */}
        <div className="pt-8 mb-6">
          <button onClick={() => navigate('/safety-center')} className="btn-ghost text-sm gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Safety Center
          </button>
        </div>

        <h1 className="text-3xl md:text-4xl text-[#2C2C2C] mb-4">{content.title}</h1>
        <p className="text-[#6B7280] text-lg leading-relaxed mb-10">{content.intro}</p>

        {/* How it works */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> How it typically works
          </h2>
          <ol className="space-y-3">
            {content.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-[#6B7280] leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Warning signs */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral-500" /> Warning signs
          </h2>
          <ul className="space-y-2.5">
            {content.warningSign.map((sign, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-coral-500 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-[#6B7280] leading-relaxed">{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What to do */}
        <div className="card p-6 mb-6 border-teal-200">
          <h2 className="font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-500" /> What to do
          </h2>
          <ul className="space-y-2.5">
            {content.whatToDo.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#2C2C2C] leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-[#2C2C2C] mb-4">Official Resources</h2>
          <div className="space-y-3">
            {content.resources.map(({ label, url }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-[#E5E3DF] hover:border-teal-300 hover:bg-teal-50 transition-colors group"
              >
                <span className="text-sm text-[#2C2C2C] flex-1 group-hover:text-teal-700">{label}</span>
                <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-teal-500" />
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[#6B7280] text-sm mb-4">Think someone you know may be a scammer?</p>
          <Link to="/analyze" className="btn-primary">
            Run a Free Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
