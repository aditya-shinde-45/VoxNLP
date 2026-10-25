const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = await response.json()
      message = payload.detail?.message || payload.detail || message
    } catch { /* Binary/error responses may not contain JSON. */ }
    throw new ApiError(message, response.status)
  }
  return response.json() as Promise<T>
}

export type Language = { code: string; name: string; nlp_available: boolean }
export type Analysis = {
  language: string
  analyzer: string
  advanced_analysis_available: boolean
  tokens: Array<{ text: string; lemma: string | null; pos: string | null; tag: string | null; start: number; end: number }>
  entities: Array<{ text: string; label: string; start: number; end: number }>
  summary: { characters: number; words: number; sentences: number; tokens: number; entities: number }
}
export type Voice = { id: string; name: string }
export type SystemStatus = {
  tts: { model: string; state: string; device: string; gpu_name: string | null; ready: boolean }
  nlp: { english_available: boolean }
  service_ready: boolean
}

export const api = {
  languages: () => request<{ languages: Language[] }>('/languages'),
  voices: () => request<{ built_in: Voice[] }>('/voices'),
  status: () => request<SystemStatus>('/system/status'),
  analyze: (text: string, language: string) => request<Analysis>('/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language }) }),
  synthesize: async (data: { text: string; language: string; speaker?: string }) => {
    const form = new FormData()
    form.append('text', data.text)
    form.append('language', data.language)
    if (data.speaker) form.append('speaker', data.speaker)
    const response = await fetch(`${API_BASE_URL}/synthesize`, { method: 'POST', body: form })
    if (!response.ok) {
      let message = `Request failed (${response.status})`
      try { const payload = await response.json(); message = payload.detail?.message || payload.detail || message } catch { /* ignore malformed error bodies */ }
      throw new ApiError(message, response.status)
    }
    return response.blob()
  },
  history: () => request<{ items: Array<{ id: string; text: string; language: string; created_at: string }> }>('/history'),
}
