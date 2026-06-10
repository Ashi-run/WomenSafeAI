import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="pt-20 pb-20 min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-display text-teal-100 mb-2 select-none">404</div>
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-3">Page not found</h1>
        <p className="text-[#6B7280] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">Back to Home</Link>
          <Link to="/analyze" className="btn-secondary">Start Analysis</Link>
        </div>
      </div>
    </div>
  )
}
