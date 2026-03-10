'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Types

type GenderType = 'female' | 'male' | 'other'
type AvailabilityType = 'incall' | 'outcall' | 'both'

type AdvisorRow = {
  id: string
  profile_id: string
  name: string
  slug: string
  bio: string | null
  city: string
  region: string | null
  country: string
  age: number | null
  gender: GenderType
  height_cm: number | null
  weight_kg: number | null
  eye_color: string | null
  hair_color: string | null
  ethnicity: string | null
  availability: AvailabilityType
  languages: string[]
  services_tags: string[]
  phone: string | null
  whatsapp_available: boolean
  telegram_available: boolean
  status: string
  is_verified: boolean
  is_featured: boolean
  views_count: number
  contacts_count: number
  created_at: string
  updated_at: string
}

type ProfileForm = {
  name: string
  bio: string
  city: string
  region: string
  age: number | null
  gender: GenderType
  height_cm: number | null
  weight_kg: number | null
  eye_color: string
  hair_color: string
  ethnicity: string
  availability: AvailabilityType
  languages: string[]
  services_tags: string[]
  phone: string
  whatsapp_available: boolean
  telegram_available: boolean
}

type TabId = 'overview' | 'profile' | 'subscription' | 'settings'

// Helpers

function profileCompleteness(advisor: AdvisorRow): number {
  const optional: (keyof AdvisorRow)[] = [
    'bio', 'age', 'height_cm', 'weight_kg',
    'eye_color', 'hair_color', 'ethnicity', 'phone',
  ]
  const filled = optional.filter((f) => {
    const v = advisor[f]
    return v !== null && v !== undefined && String(v).trim() !== ''
  })
  return Math.round(((filled.length + 2) / (optional.length + 2)) * 100)
}

function rowToForm(r: AdvisorRow): ProfileForm {
  return {
    name: r.name,
    bio: r.bio ?? '',
    city: r.city,
    region: r.region ?? '',
    age: r.age,
    gender: r.gender ?? 'female',
    height_cm: r.height_cm,
    weight_kg: r.weight_kg,
    eye_color: r.eye_color ?? '',
    hair_color: r.hair_color ?? '',
    ethnicity: r.ethnicity ?? '',
    availability: r.availability ?? 'both',
    languages: r.languages ?? ['it'],
    services_tags: r.services_tags ?? [],
    phone: r.phone ?? '',
    whatsapp_available: r.whatsapp_available ?? false,
    telegram_available: r.telegram_available ?? false,
  }
}

// Component

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [advisor, setAdvisor] = useState<AdvisorRow | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<ProfileForm>({
    name: '', bio: '', city: '', region: '', age: null, gender: 'female',
    height_cm: null, weight_kg: null, eye_color: '', hair_color: '',
    ethnicity: '', availability: 'both', languages: ['it'], services_tags: [],
    phone: '', whatsapp_available: false, telegram_available: false,
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

    // Load via server-side API route (respects RLS / cookie auth)
    let res = await fetch('/api/advisor/profile')

    if (res.status === 404) {
      // Row doesn't exist yet (e.g. insert at sign-up was blocked by RLS) — create it now
      res = await fetch('/api/advisor/profile', { method: 'POST' })
    }

    if (res.ok) {
      const data = await res.json() as AdvisorRow
      setAdvisor(data)
      setForm(rowToForm(data))
    } else {
      const json = await res.json().catch(() => ({}))
      console.error('[dashboard] load error:', json.error ?? res.status)
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
      const res = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveMsg({ type: 'error', text: json.error ?? 'Failed to save' })
      } else {
        setSaveMsg({ type: 'success', text: 'Profile saved successfully!' })
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
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  if (!advisor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-main)' }}>
        <p className="text-gray-400">Advisor profile not found.</p>
        <Link href="/register" className="btn-accent px-6 py-2.5 text-sm">Create your profile</Link>
      </div>
    )
  }

  const pct = profileCompleteness(advisor)

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
          <span className="text-sm font-medium text-gray-200 hidden sm:block">{advisor.name}</span>
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">Sign out</button>
        </div>
      </header>

      <div className="flex" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-56 shrink-0 min-h-[calc(100vh-3.5rem)] py-6 px-4 gap-1"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          {([
            { id: 'overview', icon: '\u{1F4CA}', label: 'Overview' },
            { id: 'profile', icon: '\u{1F464}', label: 'My profile' },
            { id: 'subscription', icon: '\u{1F48E}', label: 'Subscription' },
            { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: activeTab === tab.id ? 'rgba(233,30,140,0.12)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : '#9ca3af',
                border: `1px solid ${activeTab === tab.id ? 'rgba(233,30,140,0.25)' : 'transparent'}`,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <Link
            href={`/profile/${advisor.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View public profile
          </Link>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8 py-8 min-w-0">

          {/* Mobile tabs */}
          <div className="flex gap-1 overflow-x-auto pb-4 lg:hidden">
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'profile', label: 'Profile' },
              { id: 'subscription', label: 'Subscription' },
              { id: 'settings', label: 'Settings' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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

          {/* Profile completeness banner */}
          {pct < 80 && activeTab === 'overview' && (
            <div
              className="mb-6 rounded-xl p-4 flex items-start gap-4"
              style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.25)' }}
            >
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-white">Complete your profile &mdash; {pct}%</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  A complete profile attracts up to 3x more contacts. Add your bio, physical details, and contact info.
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
              </div>
              <button onClick={() => setActiveTab('profile')} className="btn-accent shrink-0 text-xs px-4 py-2">
                Complete
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-black text-white">Hello, {advisor.name}!</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here is a summary of your activity</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total views', value: advisor.views_count.toLocaleString() },
                  { label: 'Contacts received', value: advisor.contacts_count.toString() },
                  {
                    label: 'Profile status',
                    value: advisor.status === 'active' ? 'Active' : advisor.status === 'pending' ? 'Pending review' : advisor.status,
                  },
                  { label: 'Identity verified', value: advisor.is_verified ? 'Yes' : 'No' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-6 flex flex-col sm:flex-row gap-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shrink-0"
                  style={{ background: 'var(--bg-elevated)', border: '2px dashed rgba(255,255,255,0.1)' }}
                >
                  {'\u{1F464}'}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {advisor.name}{advisor.age ? `, ${advisor.age}` : ''}
                    </h2>
                    {advisor.is_verified && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {advisor.city}{advisor.region ? ` · ${advisor.region}` : ''} &middot; {advisor.views_count.toLocaleString()} total views
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setActiveTab('profile')} className="btn-outline text-xs px-3 py-1.5">
                      Edit profile
                    </button>
                    <Link href={`/profile/${advisor.slug}`} className="btn-ghost text-xs px-3 py-1.5">
                      View listing
                    </Link>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(233,30,140,0.25)' }}
              >
                <h3 className="text-lg font-bold text-white mb-2">Go Diamond and triple your views</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Diamond profiles always appear at the top and receive on average 3x more contact requests.
                </p>
                <button onClick={() => setActiveTab('subscription')} className="btn-accent text-sm px-6 py-2.5">
                  Discover Diamond
                </button>
              </div>
            </div>
          )}

          {/* PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              <h1 className="text-2xl font-black text-white">Edit profile</h1>

              {/* Photo upload suggestion (not yet implemented) */}
              <div
                className="rounded-xl p-5 flex items-center gap-5"
                style={{ background: 'rgba(233,30,140,0.05)', border: '1px dashed rgba(233,30,140,0.35)' }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  {'\u{1F4F7}'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Upload your photos</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Profiles with photos receive up to 10x more contacts. Up to 10 photos &mdash; JPG / PNG / WebP.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn-ghost text-xs px-4 py-2 shrink-0"
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                  title="Photo upload coming soon"
                >
                  Upload photos
                </button>
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

              {/* Basic info */}
              <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Name / Alias <span style={{ color: 'var(--accent)' }}>*</span>
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
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => upd('city', e.target.value)}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Region / District</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => upd('region', e.target.value)}
                    placeholder="e.g. Lazio, Milan area..."
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Bio</label>
                  <textarea
                    rows={5}
                    value={form.bio}
                    onChange={(e) => upd('bio', e.target.value)}
                    placeholder="Write a short description about yourself - personality, what you offer, how to contact you..."
                    className="input-dark resize-none"
                  />
                </div>
              </div>

              {/* Physical attributes */}
              <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Physical attributes</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Age</label>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      value={form.age ?? ''}
                      onChange={(e) => upd('age', e.target.value ? Number(e.target.value) : null)}
                      placeholder="25"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      min={140}
                      max={210}
                      value={form.height_cm ?? ''}
                      onChange={(e) => upd('height_cm', e.target.value ? Number(e.target.value) : null)}
                      placeholder="168"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      min={40}
                      max={150}
                      value={form.weight_kg ?? ''}
                      onChange={(e) => upd('weight_kg', e.target.value ? Number(e.target.value) : null)}
                      placeholder="55"
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => upd('gender', e.target.value as GenderType)}
                      className="input-dark"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other / Trans</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Ethnicity</label>
                    <input
                      type="text"
                      value={form.ethnicity}
                      onChange={(e) => upd('ethnicity', e.target.value)}
                      placeholder="e.g. European, Latina, Asian..."
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Hair color</label>
                    <input
                      type="text"
                      value={form.hair_color}
                      onChange={(e) => upd('hair_color', e.target.value)}
                      placeholder="e.g. Blonde, Brunette, Red..."
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Eye color</label>
                    <input
                      type="text"
                      value={form.eye_color}
                      onChange={(e) => upd('eye_color', e.target.value)}
                      placeholder="e.g. Blue, Brown, Green..."
                      className="input-dark"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & availability */}
              <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Contact &amp; availability</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Phone{' '}
                    <span style={{ color: 'var(--text-muted)' }}>(visible to registered users only)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => upd('phone', e.target.value)}
                    placeholder="+39 3XX XXX XXXX"
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Availability</label>
                  <select
                    value={form.availability}
                    onChange={(e) => upd('availability', e.target.value as AvailabilityType)}
                    className="input-dark"
                  >
                    <option value="incall">Incall only</option>
                    <option value="outcall">Outcall only</option>
                    <option value="both">Both (incall &amp; outcall)</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.whatsapp_available}
                      onChange={(e) => upd('whatsapp_available', e.target.checked)}
                      className="accent-pink-500"
                    />
                    <span className="text-sm text-gray-300">WhatsApp available</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.telegram_available}
                      onChange={(e) => upd('telegram_available', e.target.checked)}
                      className="accent-pink-500"
                    />
                    <span className="text-sm text-gray-300">Telegram available</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" disabled={saving} className="btn-accent px-8 py-2.5 text-sm">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                {saveMsg?.type === 'success' && (
                  <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Saved</span>
                )}
              </div>
            </form>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-2xl font-black text-white">Subscription</h1>
              <div className="grid sm:grid-cols-3 gap-4">
                {([
                  {
                    level: 'free', name: 'Standard', price: 'Free', period: '',
                    features: ['1 photo', 'Base position', 'Visible in results', 'No badge'],
                    cta: 'Current plan', current: true, highlight: false,
                  },
                  {
                    level: 'premium', name: 'Premium', price: 'EUR 29', period: '/ mo',
                    features: ['Up to 5 photos', 'Priority position', 'Premium badge', 'Advanced stats'],
                    cta: 'Upgrade to Premium', current: false, highlight: false,
                  },
                  {
                    level: 'diamond', name: 'Diamond', price: 'EUR 59', period: '/ mo',
                    features: ['Unlimited photos', 'Top of results', 'Diamond badge', 'Full stats', 'Priority support'],
                    cta: 'Upgrade to Diamond', current: false, highlight: true,
                  },
                ] as const).map((plan) => (
                  <div
                    key={plan.level}
                    className="rounded-xl p-5 flex flex-col gap-4"
                    style={{
                      background: plan.highlight
                        ? 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,58,237,0.1))'
                        : 'var(--bg-card)',
                      border: `1px solid ${plan.highlight ? 'rgba(233,30,140,0.4)' : plan.current ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                    }}
                  >
                    {plan.highlight && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start" style={{ background: 'var(--accent)', color: '#fff' }}>
                        RECOMMENDED
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-white">{plan.name}</h3>
                      <p className="text-2xl font-black text-white mt-1">
                        {plan.price}<span className="text-sm font-normal text-gray-400">{plan.period}</span>
                      </p>
                    </div>
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#d1d5db' }}>
                          <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={plan.current}
                      className={plan.current ? 'btn-ghost text-sm py-2 cursor-default' : 'btn-accent text-sm py-2'}
                    >
                      {plan.current ? 'Current plan' : plan.cta}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Secure payment via Stripe &middot; Cancel anytime &middot; No commitment
              </p>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-lg">
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

        </main>
      </div>
    </div>
  )
}
