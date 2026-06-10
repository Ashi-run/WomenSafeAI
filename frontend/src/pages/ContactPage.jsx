import { useState } from 'react'
import { Mail, MessageCircle, ExternalLink } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', category: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
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
          <p className="text-[#6B7280]">
            We'll respond within 48 hours. For urgent safety matters, please contact law enforcement directly.
          </p>
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
              <input
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
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
              <textarea
                className="textarea"
                rows={5}
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
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
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group mb-1"
            >
              <ExternalLink className="w-4 h-4 text-teal-500" />
              <span className="text-sm text-[#2C2C2C] group-hover:text-teal-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
