import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Shield, User, MessageSquare, LayoutGrid,
  Info, ChevronRight, Lock, Loader2, AlertCircle,
  Wifi, Clock, RefreshCcw
} from 'lucide-react'
import { useAnalysis } from '../context/AnalysisContext'
import { submitAnalysis, analyzeProfile, analyzeConversation } from '../services/api'
import FileDropzone from '../components/analysis/FileDropzone'
import AnalysisLoadingOverlay from '../components/analysis/AnalysisLoadingOverlay'
import { cn } from '../utils/helpers'

/* ─── Tab definitions ─── */
const TABS = [
  { id: 'full',         label: 'Full Analysis',     icon: LayoutGrid,    desc: 'Profile + Conversation' },
  { id: 'profile',      label: 'Profile Only',       icon: User,          desc: 'Photo, Username, Bio' },
  { id: 'conversation', label: 'Conversation Only',  icon: MessageSquare, desc: 'Chat Text or Screenshots' },
]

/* ─── Confidence indicator ─── */
function ConfidenceBar({ score }) {
  const level =
    score >= 75 ? { label: 'High confidence',   color: 'bg-sage-500',  width: score } :
    score >= 40 ? { label: 'Good confidence',   color: 'bg-amber-500', width: score } :
    score >= 10 ? { label: 'Low confidence',    color: 'bg-coral-500', width: score } :
                  { label: 'Add inputs above',  color: 'bg-slate-200', width: 4      }

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-xs text-[#6B7280] mb-1.5">
          <span className="font-medium">Analysis coverage</span>
          <span className={score >= 40 ? 'text-teal-600 font-medium' : ''}>{level.label}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', level.color)}
            style={{ width: `${level.width}%` }}
          />
        </div>
      </div>
      <div className="text-sm font-semibold text-[#2C2C2C] w-10 text-right">{score}%</div>
    </div>
  )
}

/* ─── Profile form section ─── */
function ProfileSection({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-500" />
          Profile Information
        </h3>
        <p className="text-sm text-[#6B7280]">Provide as much as you have. Every input increases accuracy.</p>
      </div>

      <FileDropzone
        label="Profile Photo"
        hint="Upload the profile picture of the contact you want to analyze"
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
        files={data.profilePhoto ? [data.profilePhoto] : []}
        onFilesChange={(files) => onChange('profilePhoto', files[0] || null)}
      />

      <div>
        <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
          Username / Handle
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g. @john_smith1987 or john.williams.us"
          value={data.username}
          onChange={(e) => onChange('username', e.target.value)}
        />
        <p className="text-xs text-[#9CA3AF] mt-1.5">Include platform name if known, e.g. "Instagram: @handle"</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
          Bio / About Section
        </label>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Paste the person's bio or about section here..."
          value={data.bio}
          onChange={(e) => onChange('bio', e.target.value)}
        />
        <p className="text-xs text-[#9CA3AF] mt-1.5">Copy the full bio from their dating profile, Instagram, Facebook, etc.</p>
      </div>
    </div>
  )
}

/* ─── Conversation form section ─── */
function ConversationSection({ data, onChange }) {
  const [inputMode, setInputMode] = useState('screenshots')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-500" />
          Conversation Analysis
        </h3>
        <p className="text-sm text-[#6B7280]">Upload screenshots or paste chat text. Both give equivalent results.</p>
      </div>

      {/* Toggle */}
      <div className="inline-flex rounded-lg border border-[#E5E3DF] p-1 bg-white">
        {[
          { id: 'screenshots', label: 'Upload Screenshots' },
          { id: 'text',        label: 'Paste Text' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setInputMode(id)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              inputMode === id
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#2C2C2C]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {inputMode === 'screenshots' ? (
        <>
          <FileDropzone
            label="Chat Screenshots"
            hint="Upload screenshots from WhatsApp, Instagram, Telegram, etc."
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
            maxFiles={10}
            maxSize={5 * 1024 * 1024}
            files={data.chatScreenshots}
            onFilesChange={(files) => onChange('chatScreenshots', files)}
          />
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Our OCR engine will extract text from your screenshots automatically. You'll have a chance to review and correct the extracted text before analysis begins.
            </p>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
            Chat Text
          </label>
          <textarea
            className="textarea"
            rows={10}
            placeholder={`Paste your conversation here. Format like:\n\nHim: Hey, I've been thinking about you all day...\nMe: Oh really? What have you been up to?\nHim: I'm working on an important contract in Dubai...`}
            value={data.chatText}
            onChange={(e) => onChange('chatText', e.target.value)}
          />
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            Label messages with "Me:" and their name or "Him:" / "Her:" / "Them:" to help the AI identify speaker turns.
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Error display with retry ─── */
function FormError({ error, onRetry }) {
  const isNetwork  = error?.toLowerCase().includes('network') || error?.toLowerCase().includes('failed to fetch')
  const isTimeout  = error?.toLowerCase().includes('timeout') || error?.toLowerCase().includes('time')
  const isServer   = error?.toLowerCase().includes('500') || error?.toLowerCase().includes('server')

  const Icon = isNetwork ? Wifi : isTimeout ? Clock : AlertCircle

  const hint = isNetwork
    ? 'Check your internet connection and try again.'
    : isTimeout
    ? 'The analysis took too long. Try with less input or try again shortly.'
    : isServer
    ? 'Our servers are experiencing issues. Please try again in a moment.'
    : null

  return (
    <div className="p-4 rounded-xl bg-coral-50 border border-coral-200">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-coral-700">{error}</p>
          {hint && <p className="text-xs text-coral-600 mt-1">{hint}</p>}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-medium text-coral-700 hover:text-coral-800
                       px-3 py-1.5 rounded-lg hover:bg-coral-100 transition-colors flex-shrink-0"
          >
            <RefreshCcw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function AnalyzePage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { setAnalysisResult, setIsLoading, setAnalysisInput } = useAnalysis()

  const initialTab = location.state?.mode || 'full'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [formData, setFormData] = useState({
    profilePhoto:    null,
    username:        '',
    bio:             '',
    chatText:        '',
    chatScreenshots: [],
  })

  const [submitting, setSubmitting]     = useState(false)
  const [showOverlay, setShowOverlay]   = useState(false)
  const [formError, setFormError]       = useState('')
  const lastPayloadRef                  = useRef(null)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError('')
  }

  /* Calculate coverage score 0–100 */
  const coverageScore = (() => {
    let pts = 0
    if (formData.profilePhoto)                                              pts += 25
    if (formData.username.trim())                                           pts += 15
    if (formData.bio.trim().length > 20)                                    pts += 20
    if (formData.chatText.trim().length > 50 || formData.chatScreenshots.length > 0) pts += 40
    return pts
  })()

  const hasProfileInput = formData.profilePhoto || formData.username.trim() || formData.bio.trim()
  const hasConvoInput   = formData.chatText.trim() || formData.chatScreenshots.length > 0
  const canSubmit =
    (activeTab === 'full'         && (hasProfileInput || hasConvoInput)) ||
    (activeTab === 'profile'      && hasProfileInput) ||
    (activeTab === 'conversation' && hasConvoInput)

  /* Core submission logic — extracted so retry can call it directly */
  const runAnalysis = async (tab, data) => {
    setSubmitting(true)
    setShowOverlay(true)
    setIsLoading(true)
    setFormError('')
    setAnalysisInput(data)

    // Store for retry
    lastPayloadRef.current = { tab, data }

    try {
      let result
      if (tab === 'profile') {
        result = await analyzeProfile(data)
      } else if (tab === 'conversation') {
        result = await analyzeConversation(data)
      } else {
        result = await submitAnalysis(data)
      }

      setAnalysisResult(result)
      navigate('/results')
    } catch (err) {
      setFormError(err.message || 'Analysis failed. Please try again.')
      setShowOverlay(false)
    } finally {
      setSubmitting(false)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setFormError('Please provide at least one input before analyzing.')
      return
    }
    await runAnalysis(activeTab, formData)
  }

  const handleRetry = () => {
    if (lastPayloadRef.current) {
      const { tab, data } = lastPayloadRef.current
      runAnalysis(tab, data)
    }
  }

  return (
    <>
      {/* Full-screen overlay during API call */}
      {showOverlay && <AnalysisLoadingOverlay mode={activeTab} />}

      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">

          {/* Header */}
          <div className="text-center pt-10 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 mb-4">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">Secure Analysis</span>
            </div>
            <h1 className="text-3xl md:text-4xl text-[#2C2C2C] mb-3">Analyze a Contact</h1>
            <p className="text-[#6B7280]">
              Upload what you have. Everything is analyzed and immediately discarded — nothing is stored.
            </p>
          </div>

          {/* Privacy strip */}
          <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-teal-50 border border-teal-100 mb-8 flex-wrap">
            {[
              { icon: Lock,   text: 'Uploads not stored' },
              { icon: Shield, text: 'No account needed'  },
              { icon: Lock,   text: '100% free'          },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                <Icon className="w-3 h-3" />
                {text}
              </div>
            ))}
          </div>

          {/* Tab selector */}
          <div className="card p-1.5 flex gap-1 mb-6">
            {TABS.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                type="button"
                disabled={submitting}
                onClick={() => { setActiveTab(id); setFormError('') }}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all',
                  activeTab === id
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-[#6B7280] hover:bg-slate-50 hover:text-[#2C2C2C]',
                  submitting && 'cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
                <span className={cn('text-[10px] font-normal', activeTab === id ? 'text-teal-100' : 'text-[#9CA3AF]')}>
                  {desc}
                </span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile section */}
            {(activeTab === 'full' || activeTab === 'profile') && (
              <div className="card p-6 transition-all duration-300">
                <ProfileSection data={formData} onChange={handleChange} />
              </div>
            )}

            {/* Conversation section */}
            {(activeTab === 'full' || activeTab === 'conversation') && (
              <div className="card p-6 transition-all duration-300">
                <ConversationSection data={formData} onChange={handleChange} />
              </div>
            )}

            {/* Coverage bar (full mode) */}
            {activeTab === 'full' && (hasProfileInput || hasConvoInput) && (
              <ConfidenceBar score={coverageScore} />
            )}

            {/* Error */}
            {formError && (
              <FormError
                error={formError}
                onRetry={lastPayloadRef.current ? handleRetry : null}
              />
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={cn(
                'w-full btn-primary py-4 text-base justify-center group relative overflow-hidden',
                (!canSubmit || submitting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Shimmer on hover */}
              {canSubmit && !submitting && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                 bg-gradient-to-r from-transparent via-white/10 to-transparent
                                 transition-transform duration-700 ease-in-out" />
              )}

              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Analyze Now
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              By analyzing, you confirm this is for personal safety purposes only.
              Results are probabilistic risk assessments, not definitive proof.
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
