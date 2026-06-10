import { Link } from 'react-router-dom'
import { Shield, Heart, ExternalLink } from 'lucide-react'

const safetyLinks = [
  { to: '/safety-center/romance-scams',  label: 'Romance Scams' },
  { to: '/safety-center/catfishing',     label: 'Catfishing' },
  { to: '/safety-center/sextortion',     label: 'Sextortion' },
  { to: '/safety-center/financial-scams',label: 'Financial Scams' },
  { to: '/safety-center/what-to-do',     label: 'What To Do' },
]

const platformLinks = [
  { to: '/analyze',       label: 'Start Analysis' },
  { to: '/about',         label: 'About' },
  { to: '/faq',           label: 'FAQ' },
  { to: '/contact',       label: 'Contact' },
]

const externalLinks = [
  { href: 'https://www.ic3.gov',         label: 'Report to FBI IC3' },
  { href: 'https://reportfraud.ftc.gov', label: 'Report to FTC' },
  { href: 'https://cybercrime.gov.in',   label: 'India Cybercrime Portal' },
]

export default function Footer() {
  return (
    <footer className="bg-[#2C2C2C] text-white/80">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg text-white">
                WomenSafe <span className="text-teal-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              AI-powered fraud detection to help you identify suspicious online contacts. Free. Private. No sign-up required.
            </p>
          </div>

          {/* Safety Center */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Safety Center</h4>
            <ul className="space-y-2.5">
              {safetyLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/60 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Platform</h4>
            <ul className="space-y-2.5">
              {platformLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/60 hover:text-teal-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Report */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Report Fraud</h4>
            <ul className="space-y-2.5">
              {externalLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-teal-400 transition-colors flex items-center gap-1.5"
                  >
                    {label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-xs text-white/40 max-w-xl leading-relaxed">
              <strong className="text-white/60">Disclaimer:</strong> WomenSafe AI provides probabilistic risk assessment, not definitive proof of fraud. Results should not be used to publicly accuse individuals. Always verify concerns through appropriate channels.
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40 whitespace-nowrap">
              Made with <Heart className="w-3 h-3 text-coral-400" /> for online safety
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">
            © {new Date().getFullYear()} WomenSafe AI. Uploads are not stored. No account required. No data sold.
          </p>
        </div>
      </div>
    </footer>
  )
}
