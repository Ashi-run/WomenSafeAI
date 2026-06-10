import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Shield, AlertTriangle, CheckCircle, ChevronDown,
  RefreshCcw, BookOpen, ExternalLink, Clock, Target,
  Heart, DollarSign, Lock, AlertCircle, UserX, Printer,
  Info, CheckCircle2, Zap, MessageSquare, User, FileText, ScanEye,
} from 'lucide-react'
import { useAnalysis } from '../context/AnalysisContext'
import ScoreRing from '../components/results/ScoreRing'
import RiskBar from '../components/results/RiskBar'
import ResultsSkeleton from '../components/results/ResultsSkeleton'
import XaiHighlighter from '../components/results/XaiHighlighter'
import { getRiskLevel, cn } from '../utils/helpers'

/* ─── Tactic icon map ─── */
const TACTIC_ICONS = {
  love_bombing:           Heart,
  financial_pressure:     DollarSign,
  platform_migration:     ExternalLink,
  urgency_creation:       Clock,
  isolation_tactics:      UserX,
  emotional_manipulation: AlertTriangle,
  sextortion_signal:      Lock,
  social_engineering:     Target,
  task_scam_heuristic:    Zap,
  photo_anomaly:          Shield,
  gan_face_detected:      ScanEye,    // GAN/liveness finding gets the eye-scan icon
  username_pattern:       AlertCircle,
  bio_script:             AlertCircle,
  coercive_control:       Lock,
  behavioral_risk:        AlertTriangle,
}

/* ─── Expandable finding card ─── */
function FindingCard({ finding, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const { badgeClass }  = getRiskLevel(finding.severity_score)
  const Icon = TACTIC_ICONS[finding.tactic_key] || AlertCircle

  const severityColor = {
    critical: { border: 'border-red-200',    bar: 'bg-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-500'    },
    high:     { border: 'border-coral-200',  bar: 'bg-coral-500',  iconBg: 'bg-coral-50',  iconText: 'text-coral-500'  },
    medium:   { border: 'border-amber-200',  bar: 'bg-amber-500',  iconBg: 'bg-amber-50',  iconText: 'text-amber-600'  },
    low:      { border: 'border-slate-200',  bar: 'bg-sage-500',   iconBg: 'bg-green-50',  iconText: 'text-sage-500'   },
  }[finding.severity] || { border: 'border-slate-200', bar: 'bg-slate-400', iconBg: 'bg-slate-50', iconText: 'text-slate-500' }

  return (
    <div className={cn('rounded-xl border overflow-hidden transition-shadow', severityColor.border, open && 'shadow-card')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors text-left"
        aria-expanded={open}
      >
        <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', severityColor.bar)} />
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', severityColor.iconBg)}>
          <Icon className={cn('w-5 h-5', severityColor.iconText)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-semibold text-sm text-[#2C2C2C]">{finding.title}</span>
            <span className={`badge ${badgeClass} text-[10px]`}>{finding.severity_score}% confidence</span>
            {finding.source && <span className="badge badge-neutral text-[10px]">{finding.source}</span>}
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">{finding.summary}</p>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-[#9CA3AF] flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-[#E5E3DF] p-4 bg-slate-50/60 space-y-4">
          <div>
            <h5 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">What was found</h5>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">{finding.detail}</p>
          </div>
          {finding.evidence && finding.evidence.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Evidence from input</h5>
              <div className="space-y-2">
                {finding.evidence.map((ev, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white border border-[#E5E3DF] text-sm text-[#2C2C2C] italic">
                    "{ev}"
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h5 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Why this matters</h5>
            <p className="text-sm text-[#6B7280] leading-relaxed">{finding.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Recommendation item ─── */
function RecommendationItem({ item, tier }) {
  const tierStyle = {
    immediate:  { dot: 'bg-red-500' },
    short_term: { dot: 'bg-amber-500' },
    support:    { dot: 'bg-teal-500' },
  }[tier] || { dot: 'bg-slate-400' }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', tierStyle.dot)} />
      <div className="flex-1">
        <p className="text-sm text-[#2C2C2C] leading-relaxed">{item.text}</p>
        {item.link && (
          <a
            href={item.link}
            target={item.link.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="text-xs text-teal-600 hover:underline flex items-center gap-1 mt-1"
          >
            {item.link_label || 'Learn more'} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ─── Score card ─── */
function ScoreCard({ score, label, sublabel, ringColor }) {
  const { label: riskLabel, badgeClass } = getRiskLevel(score)
  return (
    <div className="card p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
      <ScoreRing score={score} size={90} color={ringColor} />
      <div className="text-center">
        <p className="font-semibold text-[#2C2C2C] text-xs sm:text-sm leading-tight">{label}</p>
        {sublabel && <p className="text-[10px] sm:text-xs text-[#6B7280]">{sublabel}</p>}
        <span className={`badge ${badgeClass} mt-1.5 sm:mt-2 text-[10px] sm:text-xs`}>{riskLabel}</span>
      </div>
    </div>
  )
}

/* ─── Inputs summary ─── */
function InputsSummary({ inputs }) {
  if (!inputs || inputs.length === 0) return null
  const labels = {
    profile_photo: 'Photo',
    username:      'Username',
    bio:           'Bio',
    conversation:  'Conversation',
    chat_text:     'Chat Text',
  }
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center text-xs text-[#6B7280] mb-2">
      <span>Inputs analyzed:</span>
      {inputs.map(k => (
        <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
          <CheckCircle2 className="w-3 h-3" />
          {labels[k] || k}
        </span>
      ))}
    </div>
  )
}

/* ─── Analyzed photo preview ─── */
function PhotoPreviewCard({ photoBase64, ganDetected }) {
  if (!photoBase64) return null

  return (
    <div className="card p-5 mb-6">
      <h3 className="font-semibold text-[#2C2C2C] text-sm mb-3 flex items-center gap-2">
        <ScanEye className="w-4 h-4 text-teal-500" />
        Analyzed Profile Photo
        {ganDetected && (
          <span className="badge badge-critical text-[10px] ml-auto">GAN Detected</span>
        )}
      </h3>
      <div className="flex items-start gap-4">
        {/* Thumbnail — ring color signals GAN verdict */}
        <div className={cn(
          'flex-shrink-0 rounded-xl overflow-hidden border-2',
          ganDetected ? 'border-red-400' : 'border-[#E5E3DF]',
        )}>
          <img
            src={photoBase64}
            alt="Analyzed profile photo"
            className="w-24 h-24 object-cover"
          />
        </div>
        {/* Caption */}
        <div className="flex-1 min-w-0">
          {ganDetected ? (
            <>
              <p className="text-xs font-semibold text-red-600 mb-1">AI-Generated Face Detected</p>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                The liveness model flagged this photo as likely GAN-synthesized. The
                red border indicates a Critical Risk verdict — this face does not
                correspond to a real person.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-[#2C2C2C] mb-1">Photo submitted for analysis</p>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                The liveness model did not flag this photo as AI-generated.
                ELA forensic analysis results are shown in the Score Breakdown below.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


/* ─── Data Analyzed card ─── */
function DataAnalyzedCard({ username, bio }) {
  const hasUsername = username && username.trim()
  const hasBio      = bio && bio.trim()
  if (!hasUsername && !hasBio) return null

  return (
    <div className="card p-5 mb-6">
      <h3 className="font-semibold text-[#2C2C2C] text-sm mb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-teal-500" />
        Data Analyzed
      </h3>
      <div className="space-y-3">
        {hasUsername && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-[#E5E3DF]">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">Username</p>
              <p className="text-sm text-[#2C2C2C] font-mono break-all">{username}</p>
            </div>
          </div>
        )}
        {hasBio && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-[#E5E3DF]">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">Bio</p>
              <p className="text-sm text-[#2C2C2C] leading-relaxed line-clamp-4">{bio}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function SubScoreBreakdown({ subScores }) {
  if (!subScores || subScores.length === 0) return null

  return (
    <div className="card p-6 mb-6 space-y-4">
      <h3 className="font-semibold text-[#2C2C2C] text-sm">Score Breakdown</h3>
      {subScores.map(({ label, score, is_safety_score }) => {
        /*
         * BUG FIX: "Safe" sub-score inversion.
         *
         * The ONNX model returns P(Safe) as one of its output probabilities.
         * When the contact appears safe, P(Safe) → 100 — which getRiskLevel()
         * would normally classify as "Critical Risk" and render red.
         *
         * For safety metrics (is_safety_score=true), we invert the display:
         *   - The bar fills proportionally to the score (high fill = good)
         *   - The color is hardcoded green regardless of the numeric value
         *   - The label reads "Very Safe" / "Mostly Safe" / "Uncertain"
         *   - We show a green shield icon instead of the risk badge
         *
         * This inversion is ONLY applied to sub-scores flagged by the backend
         * with is_safety_score=true.  All other scores use normal risk logic.
         */
        if (is_safety_score) {
          const safeLabel =
            score >= 75 ? 'Very Safe'    :
            score >= 50 ? 'Mostly Safe'  :
            score >= 25 ? 'Uncertain'    : 'Low Safety Signal'
          return (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7280] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-sage-500" />
                  {label}
                  <span className="text-[10px] text-sage-600 font-normal ml-1">(safety metric)</span>
                </span>
                <span className="font-semibold text-sage-600">
                  {score != null ? score : '--'}/100 · {safeLabel}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full overflow-hidden h-3">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width:           `${score ?? 0}%`,
                    backgroundColor: '#4CAF79',   /* sage-500 — always green */
                    transition:      'width 1.2s cubic-bezier(0.4,0,0.2,1) 300ms',
                  }}
                />
              </div>
            </div>
          )
        }

        /* Normal risk metric — use RiskBar as-is */
        return <RiskBar key={label} label={label} score={score} />
      })}
    </div>
  )
}

/* ─── Print styles ─── */
function ensurePrintStyles() {
  if (document.getElementById('ws-print-styles')) return
  const style = document.createElement('style')
  style.id = 'ws-print-styles'
  style.textContent = `
    @media print {
      body { background: white !important; }
      header, nav, footer, [data-no-print] { display: none !important; }
      .card { box-shadow: none !important; border: 1px solid #e5e3df !important; }
      .animate-spin { animation: none !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `
  document.head.appendChild(style)
}
/* ─── Narrative Text Highlighter ─── */
function HighlightedNarrative({ text }) {
  if (!text) return null;
  // Splits the text by the exact parentheses string we generated in the backend
  const parts = text.split(/(\(identity risk:.*?\))/g);

  return (
    <p className="text-[#6B7280] max-w-xl mx-auto leading-relaxed text-sm sm:text-base mt-2">
      {parts.map((part, i) => {
        if (part.startsWith('(identity risk:')) {
          return (
            <span key={i} className="font-semibold text-[#2C2C2C] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mx-1 shadow-sm whitespace-nowrap">
              {part.replace(/[()]/g, '')}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

/* ─── Main Results Page ─── */
export default function ResultsPage() {
  const navigate = useNavigate()
  const { analysisResult, isLoading, resetAnalysis } = useAnalysis()

  useEffect(() => {
    if (!analysisResult && !isLoading) {
      navigate('/analyze', { replace: true })
    }
  }, [analysisResult, isLoading, navigate])

  useEffect(() => { ensurePrintStyles() }, [])

  if (isLoading && !analysisResult) return <ResultsSkeleton />
  if (!analysisResult) return null

  const r       = analysisResult
  const overall = getRiskLevel(r.overall_risk_score)

  const riskRingColor = (score) => {
    if (score === null || score === undefined) return '#9CA3AF'
    return score > 75 ? '#C0392B' : score > 50 ? '#E8614A' : score > 25 ? '#F5A623' : '#4CAF79'
  }

  const handleNewAnalysis = () => { resetAnalysis(); navigate('/analyze') }
  const handleExportPDF   = () => { window.print() }

  /* Sort findings by severity_score descending */
  const sortedFindings = r.findings
    ? [...r.findings].sort((a, b) => (b.severity_score || 0) - (a.severity_score || 0))
    : []

  /* True when the GAN liveness model fired — used to colour the photo preview */
  const ganDetected = sortedFindings.some(f => f.tactic_key === 'gan_face_detected')

  const criticalFindings = sortedFindings.filter(f => f.severity === 'critical' || f.severity === 'high')
  const otherFindings    = sortedFindings.filter(f => f.severity !== 'critical' && f.severity !== 'high')

  /* Does this result have XAI data to show? */
  const hasXai = Array.isArray(r.conversation_attributions) && r.conversation_attributions.length > 0
  /*
   * originalText for XaiHighlighter:
   *   1. Prefer extracted_text from the API (the real unified input that was analyzed)
   *   2. Fall back to reconstructing from attributions token words if needed
   *   3. Null if neither is available (XaiHighlighter handles this gracefully)
   */
  const reconstructedText =
    r.extracted_text?.trim()
      ? r.extracted_text
      : hasXai
        ? r.conversation_attributions.map(t => t.word).join(' ')
        : null

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="pt-10 pb-8 text-center">
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4',
            r.overall_risk_score > 75 ? 'bg-red-50 border-red-200' :
            r.overall_risk_score > 50 ? 'bg-coral-50 border-coral-200' :
            r.overall_risk_score > 25 ? 'bg-amber-50 border-amber-200' :
                                         'bg-green-50 border-green-200'
          )}>
            {r.overall_risk_score > 50
              ? <AlertTriangle className="w-4 h-4 text-coral-500" />
              : <CheckCircle   className="w-4 h-4 text-sage-500"  />
            }
            <span className={cn('text-sm font-semibold', overall.color)}>
              {overall.label}
              {r.scam_category && ` · ${r.scam_category}`}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl text-[#2C2C2C] mb-3">Analysis Results</h1>
          <InputsSummary inputs={r.inputs_provided} />
          <p className="text-[#6B7280] max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
            {r.narrative_summary}
          </p>
          {r.confidence_level != null && (
            <p className="text-xs text-[#9CA3AF] mt-2">
              Analysis confidence: <span className="font-medium text-[#6B7280]">{r.confidence_level}%</span>
            </p>
          )}
        </div>

        {/* ── Three score rings ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <ScoreCard
            score={r.identity_risk_score}
            label="Identity Risk"
            sublabel="Profile signals"
            ringColor={riskRingColor(r.identity_risk_score)}
          />
          <ScoreCard
            score={r.overall_risk_score}
            label="Overall Risk"
            sublabel="Combined score"
            ringColor={riskRingColor(r.overall_risk_score)}
          />
          <ScoreCard
            score={r.conversation_risk_score}
            label="Convo Risk"
            sublabel="Behavior signals"
            ringColor={riskRingColor(r.conversation_risk_score)}
          />
        </div>

        {/* ── Analyzed photo preview ── */}
        <PhotoPreviewCard photoBase64={r.uploaded_photo_base64} ganDetected={ganDetected} />

        {/* ── Data Analyzed card ── */}
        <DataAnalyzedCard username={r.analyzed_username} bio={r.analyzed_bio} />

        {/* ── Sub-score breakdown (with Safe inversion) ── */}
        <SubScoreBreakdown subScores={r.sub_scores} />

        {/* ── XAI Highlighter ── */}
        {(hasXai || r.conversation_risk_score > 0) && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-[#2C2C2C]">Conversation Analysis</h2>
              {hasXai && (
                <span className="badge badge-medium text-[10px] ml-auto">
                  SHAP attributions active
                </span>
              )}
            </div>
            <XaiHighlighter
              attributions={r.conversation_attributions}
              originalText={reconstructedText}
            />
          </div>
        )}

        {/* ── Findings ── */}
        {sortedFindings.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-coral-500" />
              Detected Signals
              <span className="badge badge-high">{sortedFindings.length} found</span>
            </h2>
            {criticalFindings.length > 0 && (
              <div className="space-y-3 mb-3">
                {criticalFindings.map((finding, i) => (
                  <FindingCard key={`${finding.tactic_key}-${i}`} finding={finding} defaultOpen={i === 0} />
                ))}
              </div>
            )}
            {otherFindings.length > 0 && (
              <div className="space-y-3">
                {otherFindings.map((finding, i) => (
                  <FindingCard key={`${finding.tactic_key}-${i}`} finding={finding} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">No Significant Red Flags Found</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-md mx-auto">
              Our analysis did not detect significant fraud signals in the provided information.
              Remember: a low risk score does not guarantee safety. Always trust your instincts.
            </p>
          </div>
        )}

        {/* ── Recommendations ── */}
        {r.recommendations && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#2C2C2C] mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" />
              Safety Recommendations
            </h2>
            {r.recommendations.immediate?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Immediate Actions
                </h4>
                {r.recommendations.immediate.map((item, i) => (
                  <RecommendationItem key={i} item={item} tier="immediate" />
                ))}
              </div>
            )}
            {r.recommendations.short_term?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Short-term Steps
                </h4>
                {r.recommendations.short_term.map((item, i) => (
                  <RecommendationItem key={i} item={item} tier="short_term" />
                ))}
              </div>
            )}
            {r.recommendations.support?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" /> Support &amp; Resources
                </h4>
                {r.recommendations.support.map((item, i) => (
                  <RecommendationItem key={i} item={item} tier="support" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-8 flex gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Important:</strong> These results are probabilistic risk assessments based on
            pattern recognition, not definitive proof of fraud. Do not use these results to publicly
            accuse any individual. If you believe you are in danger, contact local authorities immediately.
          </p>
        </div>

        {/* ── Action bar ── */}
        <div className="flex flex-col sm:flex-row gap-3" data-no-print>
          <button onClick={handleNewAnalysis} className="btn-primary flex-1 justify-center">
            <RefreshCcw className="w-4 h-4" />
            New Analysis
          </button>
          <Link to="/safety-center" className="btn-secondary flex-1 justify-center">
            <BookOpen className="w-4 h-4" />
            Safety Center
          </Link>
          <button
            onClick={handleExportPDF}
            className="btn-ghost flex-1 justify-center border border-[#E5E3DF] hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Save / Print
          </button>
        </div>
        <p className="text-center text-xs text-[#9CA3AF] mt-4" data-no-print>
          Use "Save as PDF" in your browser's print dialog to save a copy.
        </p>
      </div>
    </div>
  )
}
