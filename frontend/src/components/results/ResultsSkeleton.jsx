/**
 * Skeleton screens for ResultsPage.
 * Used while analysisResult is loading / transitioning in.
 */

function SkeletonBlock({ className = '' }) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  )
}

function SkeletonCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E5E3DF] shadow-card p-6 ${className}`}>
      {children}
    </div>
  )
}

/* Three score ring placeholders */
export function ScoreRingSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map(i => (
        <SkeletonCard key={i} className="flex flex-col items-center gap-3">
          <div className="skeleton rounded-full w-24 h-24" />
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-2.5 w-14" />
          <SkeletonBlock className="h-5 w-16 rounded-full" />
        </SkeletonCard>
      ))}
    </div>
  )
}

/* Sub-score breakdown */
export function SubScoreSkeleton() {
  return (
    <SkeletonCard className="mb-6 space-y-4">
      <SkeletonBlock className="h-4 w-36" />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-full" />
        </div>
      ))}
    </SkeletonCard>
  )
}

/* Findings list */
export function FindingsSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-xl border border-[#E5E3DF] p-4">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-1 h-12 rounded-full flex-shrink-0" />
              <SkeletonBlock className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="h-4 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Header skeleton */
export function HeaderSkeleton() {
  return (
    <div className="pt-10 pb-8 text-center">
      <SkeletonBlock className="h-8 w-48 rounded-full mx-auto mb-6" />
      <SkeletonBlock className="h-10 w-72 mx-auto mb-3" />
      <SkeletonBlock className="h-4 w-96 mx-auto mb-1" />
      <SkeletonBlock className="h-4 w-80 mx-auto" />
    </div>
  )
}

/* Full results skeleton composed */
export default function ResultsSkeleton() {
  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <HeaderSkeleton />
        <ScoreRingSkeleton />
        <SubScoreSkeleton />
        <FindingsSkeleton />
      </div>
    </div>
  )
}
