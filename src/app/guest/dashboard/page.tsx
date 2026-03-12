'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CityAutocomplete from '@/components/ui/CityAutocomplete'

// Types

type GuestRow = {
  id: string
  profile_id: string
  name: string
  slug: string
  city: string | null
  age: number | null
  bio: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

type ProfileForm = {
  name: string
  city: string
  age: number | null
  bio: string
  phone: string
}

type TabId = 'profile' | 'settings'

// Component

export default function GuestDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [guest, setGuest] = useState<GuestRow | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<ProfileForm>({
    name: '', city: '', age: null, bio: '', phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [settingsEmail, setSettingsEmail] = useState('')
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

    setUserEmail(user.email ?? '')
    setSettingsEmail(user.email ?? '')

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    if (data) {
      const row = data as GuestRow
      setGuest(row)
      setForm({
        name: row.name,
        city: row.city ?? '',
        age: row.age,
        bio: row.bio ?? '',
        phone: row.phone ?? '',
      })
    } else if (error) {
      console.error('[guest-dashboard] load error:', error.message)
    }
    setLoading(false)
  }

  function upd<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/guest/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveMsg({ type: 'error', text: json.error ?? 'Failed to save' })
      } else {
        setSaveMsg({ type: 'success', text: 'Profile saved!' })
        await loadData()
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Network error - please try again' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsMsg(null)
    try {
      const supabase = createClient()
      const updates: { email?: string; password?: string } = {}
      if (settingsEmail !== userEmail) updates.email = settingsEmail
      if (settingsPassword) updates.password = settingsPassword

      if (Object.keys(updates).length === 0) {
        setSettingsMsg({ type: 'error', text: 'No changes to apply' })
        return
      }
      const { error } = await supabase.auth.updateUser(updates)
      if (error) {
        setSettingsMsg({ type: 'error', text: error.message })
      } else {
        setSettingsMsg({ type: 'success', text: 'Settings updated!' })
        setSettingsPassword('')
        if (updates.email) setUserEmail(settingsEmail)
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

  if (!guest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-main)' }}>
        <p className="text-gray-400">Guest profile not found.</p>
        <Link href="/register" className="btn-accent px-6 py-2.5 text-sm">Create your account</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>

      {/* Header */}
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
          <span className="text-sm font-medium text-gray-200 hidden sm:block">{guest.name}</span>
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">Sign out</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1">
          {(['profile', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: activeTab === tab ? 'var(--accent)' : 'var(--bg-card)',
                color: activeTab === tab ? '#fff' : '#9ca3af',
                border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {tab === 'profile' ? 'My profile' : 'Settings'}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-white">My profile</h1>
            </div>

            {saveMsg && (
              <div
                className="text-xs px-4 py-3 rounded-lg"
                style={{
                  background: saveMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${saveMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: saveMsg.type === 'success' ? '#86efac' : '#fca5a5',
                }}
              >
                {saveMsg.text}
              </div>
            )}

            <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Name <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => upd('name', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    City <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <CityAutocomplete
                    city={form.city}
                    region=""
                    required
                    onChange={(city) => upd('city', city)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Age</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={form.age ?? ''}
                  onChange={(e) => upd('age', e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 28"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Bio</label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => upd('bio', e.target.value)}
                  placeholder="A short introduction about yourself..."
                  className="input-dark resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Phone{' '}
                  <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => upd('phone', e.target.value)}
                  placeholder="+39 3XX XXX XXXX"
                  className="input-dark"
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-accent px-8 py-2.5 text-sm w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save changes'}
            </button>

            {/* Explore section */}
            <div
              className="rounded-xl p-6 text-center space-y-3"
              style={{ background: 'rgba(233,30,140,0.06)', border: '1px solid rgba(233,30,140,0.2)' }}
            >
              <p className="text-sm font-semibold text-white">Start exploring</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Browse advisor profiles in your city and find who you are looking for.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/" className="btn-accent text-sm px-5 py-2">Browse home</Link>
                <Link href="/listings" className="btn-outline text-sm px-5 py-2">All listings</Link>
              </div>
            </div>
          </form>
        )}

        {/* SETTINGS */}
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
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  className="input-dark"
                />
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
                {settingsSaving ? 'Saving...' : 'Update security'}
              </button>
            </form>

            <div className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 className="font-semibold" style={{ color: '#fca5a5' }}>Danger zone</h3>
              <p className="text-sm text-gray-400">Deleting your account will permanently remove all your data.</p>
              <button
                type="button"
                onClick={() => alert('Please contact support to delete your account.')}
                className="text-sm px-4 py-2 rounded-lg border transition-all"
                style={{ background: 'transparent', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
              >
                Delete account
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
