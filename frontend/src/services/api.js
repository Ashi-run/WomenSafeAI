import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 300000,   // 5 minutes for AI analysis
})

// ─── Request interceptor — attach any future auth token ───
api.interceptors.request.use((config) => {
  return config
})

// ─── Response interceptor — normalise errors ───
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

// ─── Analysis endpoints ───

/**
 * Submit a full analysis (profile + conversation).
 * Sends a multipart/form-data payload so files can be included.
 *
 * @param {Object} payload
 * @param {File|null}   payload.profilePhoto
 * @param {string}      payload.username
 * @param {string}      payload.bio
 * @param {string}      payload.chatText
 * @param {File[]}      payload.chatScreenshots
 */
export async function submitAnalysis(payload) {
  const form = new FormData()

  if (payload.profilePhoto)  form.append('profile_photo', payload.profilePhoto)
  if (payload.username)      form.append('username', payload.username)
  if (payload.bio)           form.append('bio', payload.bio)
  if (payload.chatText)      form.append('chat_text', payload.chatText)
  if (payload.chatScreenshots?.length) {
    payload.chatScreenshots.forEach((file) =>
      form.append('chat_screenshots', file)
    )
  }

  return api.post('/api/v1/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Quick profile-only analysis.
 */
export async function analyzeProfile(payload) {
  const form = new FormData()
  if (payload.profilePhoto) form.append('profile_photo', payload.profilePhoto)
  if (payload.username)     form.append('username', payload.username)
  if (payload.bio)          form.append('bio', payload.bio)

  return api.post('/api/v1/analyze/profile', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Quick conversation-only analysis.
 */
export async function analyzeConversation(payload) {
  const form = new FormData()
  if (payload.chatText) form.append('chat_text', payload.chatText)
  if (payload.chatScreenshots?.length) {
    payload.chatScreenshots.forEach((f) => form.append('chat_screenshots', f))
  }

  return api.post('/api/v1/analyze/conversation', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ─── Health check ───
export async function healthCheck() {
  return api.get('/api/v1/health')
}

export default api
