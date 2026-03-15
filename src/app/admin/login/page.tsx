'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Challenge = {
  question: string
  token: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadChallenge()
  }, [])

  async function loadChallenge() {
    const res = await fetch('/api/admin/auth/challenge', { cache: 'no-store' })
    const json = await res.json()
    setChallenge(json as Challenge)
    setCaptchaAnswer('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!challenge) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          captchaAnswer,
          captchaToken: challenge.token,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Unable to sign in')
        await loadChallenge()
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>LvvD Team</p>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Protected access for profile verification reviews.
          </p>
        </div>

        {error && (
          <div className="text-xs px-4 py-3 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-dark" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" />
          </div>
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Custom captcha</p>
                <p className="mt-2 text-lg font-bold text-white">{challenge?.question ?? 'Loading...'}</p>
              </div>
              <button type="button" onClick={loadChallenge} className="btn-ghost text-xs px-3 py-1.5">
                Refresh
              </button>
            </div>
            <input
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Your answer"
              className="input-dark"
            />
          </div>

          <button type="submit" disabled={loading || !challenge} className="btn-accent w-full justify-center py-3 text-sm">
            {loading ? 'Signing in...' : 'Open admin panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
