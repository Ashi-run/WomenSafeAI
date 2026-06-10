import { Shield, Eye, Lock, Cpu, Users } from 'lucide-react'

export default function AboutPage() {
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
            body: 'Your uploads are processed in memory and immediately discarded after analysis. Nothing you submit is stored in any database. There is no user account system, no logging of inputs, and no resale of any data. The system is architected so that retention is impossible — not just against a policy that could be changed.',
          },
          {
            icon: Eye,
            title: 'Responsible Use',
            body: 'WomenSafe AI provides probabilistic risk assessment — pattern matching against documented fraud behavior. It is not a lie detector and does not make definitive determinations about any individual. Results should never be used to publicly accuse someone, and a clean result does not guarantee safety. Always trust your instincts alongside any tool.',
          },
          {
            icon: Users,
            title: 'Who Built This',
            body: 'WomenSafe AI was built as an academic project exploring the intersection of AI, online safety, and explainable machine learning. It is designed as a research platform with a public safety mission, and presented at academic venues including ACM conferences.',
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
