import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Shield, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/helpers'

const navLinks = [
  { to: '/safety-center', label: 'Safety Center' },
  { to: '/about',         label: 'About' },
  { to: '/faq',           label: 'FAQ' },
  { to: '/contact',       label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location                = useLocation()
  const navigate                = useNavigate()

  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  const navBg = isHome && !scrolled
    ? 'bg-transparent'
    : 'bg-white/90 backdrop-blur-md border-b border-[#E5E3DF] shadow-sm'

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', navBg)}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center
                          group-hover:bg-teal-600 transition-colors">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg text-[#2C2C2C] group-hover:text-teal-600 transition-colors">
            WomenSafe <span className="text-teal-500">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-[#6B7280] hover:text-[#2C2C2C] hover:bg-slate-100'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/analyze')}
            className="btn-primary text-sm py-2 px-5"
          >
            Start Analysis
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#E5E3DF] shadow-lg">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  location.pathname.startsWith(to)
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-[#2C2C2C] hover:bg-slate-50'
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-[#E5E3DF]">
              <button
                onClick={() => navigate('/analyze')}
                className="btn-primary w-full justify-center"
              >
                Start Analysis
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
