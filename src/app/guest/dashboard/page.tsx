'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TabId = 'account' | 'settings'

export default function GuestDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    if (user.user_metadata?.role !== 'guest') {
      router.replace('/advisor/dashboard')
      return
    }

    const nextUsername =
      (user.user_metadata?.username as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split('@')[0] ||
      'guest'

    setUsername(nextUsername)
    setLoading(false)
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsMsg(null)
    try {
      const supabase = createClient()
      if (!settingsPassword) {
        setSettingsMsg({ type: 'error', text: 'Enter a new password first' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: settingsPassword })
      if (error) {
        setSettingsMsg({ type: 'error', text: error.message })
      } else {
        setSettingsMsg({ type: 'success', text: 'Password updated!' })
        setSettingsPassword('')
      }
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <p className="text-sm text-gray-400">Loading your account...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <header
        className="px-4 lg:px-8 h-14 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/">
          <span
            className="text-xl font-black"
            style={{ background: 'linear-gradient(135deg, var(--accent), #ff6eb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Lvvd
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-200 hidden sm:block">{username}</span>
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">Sign out</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-1">
          {([
            { id: 'account', label: 'Account' },
            { id: 'settings', label: 'Settings' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-card)',
                color: activeTab === tab.id ? '#fff' : '#9ca3af',
                border: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h1 className="text-2xl font-black text-white">Client account</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your client account is active. You can browse listings and, later, leave reviews on advisor profiles.
              </p>

              <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Username</p>
                <p className="mt-2 text-lg font-bold text-white">{username}</p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 text-center space-y-3"
              style={{ background: 'rgba(233,30,140,0.06)', border: '1px solid rgba(233,30,140,0.2)' }}
            >
              <p className="text-sm font-semibold text-white">Start exploring</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Browse advisor profiles and save your favorites for later.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/" className="btn-accent text-sm px-5 py-2">Browse home</Link>
                <Link href="/listings" className="btn-outline text-sm px-5 py-2">All listings</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Settings</h1>

            <form
              onSubmit={handleSaveSettings}
              className="rounded-xl p-6 space-y-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold text-gray-200">Account security</h3>

              {settingsMsg && (
                <div
                  className="text-xs px-4 py-3 rounded-lg"
                  style={{
                    background: settingsMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${settingsMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: settingsMsg.type === 'success' ? '#86efac' : '#fca5a5',
                  }}
                >
                  {settingsMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
                <input type="text" value={username} readOnly className="input-dark opacity-70" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New password</label>
                <input
                  type="password"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="input-dark"
                />
              </div>
              <button type="submit" disabled={settingsSaving} className="btn-outline text-sm px-4 py-2">
                {settingsSaving ? 'Saving...' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
