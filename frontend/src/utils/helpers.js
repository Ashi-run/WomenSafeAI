import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Returns risk level label, color class, and badge class based on score 0–100.
 */
export function getRiskLevel(score) {
  if (score === null || score === undefined) return { label: 'Unknown', color: 'text-slate-400', bgClass: 'bg-slate-200', badgeClass: 'badge-neutral', barColor: '#9CA3AF' }
  if (score <= 25) return { label: 'Low Risk',      color: 'text-sage-500',  bgClass: 'bg-sage-500',  badgeClass: 'badge-low',      barColor: '#4CAF79' }
  if (score <= 50) return { label: 'Moderate Risk', color: 'text-amber-500', bgClass: 'bg-amber-500', badgeClass: 'badge-medium',   barColor: '#F5A623' }
  if (score <= 75) return { label: 'High Risk',     color: 'text-coral-500', bgClass: 'bg-coral-500', badgeClass: 'badge-high',     barColor: '#E8614A' }
  return                  { label: 'Critical Risk', color: 'text-red-600',   bgClass: 'bg-red-600',   badgeClass: 'badge-critical', barColor: '#C0392B' }
}

/** Format score as 2-digit string */
export function formatScore(score) {
  if (score === null || score === undefined) return '--'
  return Math.round(score).toString()
}

/** Format file size for display */
export function formatFileSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
}

/** Max file sizes */
export const MAX_PHOTO_SIZE     = 10 * 1024 * 1024  // 10 MB
export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024  // 5 MB per screenshot
export const MAX_SCREENSHOTS    = 10

/** Truncate text */
export function truncate(str, maxLength = 120) {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/** Delay utility for async flows */
export const delay = (ms) => new Promise((res) => setTimeout(res, ms))
