'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ADVISOR_ETHNICITIES,
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_OPTIONS,
  BDSM_SERVICE_OPTIONS,
  buildRatesFromForm,
  createEmptyRateState,
  DATE_TYPE_OPTIONS,
  GENERAL_SERVICE_OPTIONS,
  MASSAGE_SERVICE_OPTIONS,
  PRICE_DURATION_OPTIONS,
  ratesToFormState,
  type PriceCode,
  SEX_ORIENTATION_OPTIONS,
  VIRTUAL_SERVICE_OPTIONS,
} from '@/lib/advisor-profile-options'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import PhotoUpload, { type UploadedPhoto } from '@/components/ui/PhotoUpload'

// Types
type GenderType = 'female' | 'male' | 'shemale'
type AvailabilityType = 'incall' | 'outcall' | 'both'
type AdvisorCategory = 'woman' | 'man' | 'couple' | 'shemale'

type AdvisorRow = {
  id: string
  profile_id: string
  name: string
  slug: string
  bio: string | null
  advisor_category: AdvisorCategory
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
  sexual_orientation: string | null
  availability: AvailabilityType
  date_types: string[]
  languages: string[]
  services_tags: string[]
  incall_rates: unknown[]
  outcall_rates: unknown[]
  availability_slots: string[]
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
  advisor_category: AdvisorCategory
  city: string
  region: string
  age: number | null
  gender: GenderType
  height_cm: number | null
  weight_kg: number | null
  eye_color: string
  hair_color: string
  ethnicity: string
  sexual_orientation: string
  availability: AvailabilityType
  date_types: string[]
  languages: string[]
  services_tags: string[]
  incall_rates: Record<PriceCode, string>
  outcall_rates: Record<PriceCode, string>
  availability_slots: string[]
  phone: string
  whatsapp_available: boolean
  telegram_available: boolean
}

type TabId = 'overview' | 'profile' | 'subscription' | 'settings'
type BillingTier = 'free' | 'premium' | 'diamond'
type CheckoutPlan = BillingTier | 'starter' | 'boost' | 'power'

type BillingSummary = {
  advisorId: string
  currentTier: BillingTier
  subscription: {
    tier: BillingTier
    status: string
    stripe_customer_id: string | null
    current_period_end: string | null
    updated_at: string
  } | null
  wallet: {
    balance: number
    updatedAt: string | null
  }
  recentTransactions: Array<{
    id: string
    amount: number
    description: string | null
    createdAt: string
  }>
}

const SUBSCRIPTION_COMPARISON = [
  {
    title: 'Your personal advertisement',
    rows: [
      { label: 'Show your direct contact information', values: { free: true, premium: true, diamond: true } },
      { label: 'Post up to 25 photos in your profile', values: { free: true, premium: true, diamond: true } },
      { label: 'Link to your website', values: { free: false, premium: true, diamond: true } },
      { label: 'Rotating advertisement image', values: { free: false, premium: false, diamond: true } },
    ],
  },
  {
    title: 'Visibility of your advertisement',
    rows: [
      { label: 'Visible to all marketplace visitors', values: { free: true, premium: true, diamond: true } },
      { label: 'Position of your advertisement', values: { free: 'Standard ads', premium: 'Above Standard ads', diamond: 'Above Premium ads' } },
    ],
  },
  {
    title: 'Available promotion products',
    rows: [
      { label: 'Place your advertisement on top', values: { free: true, premium: true, diamond: true } },
      { label: 'Promo sticker on your advertisement', values: { free: false, premium: true, diamond: true } },
      { label: 'Emoji highlight in your advertisement', values: { free: false, premium: false, diamond: true } },
    ],
  },
] as const

// Helpers
function profileCompleteness(advisor: AdvisorRow): number {
  const optional: (keyof AdvisorRow)[] = [
    'bio', 'age', 'height_cm', 'weight_kg',
    'eye_color', 'hair_color', 'ethnicity', 'sexual_orientation', 'phone',
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
    advisor_category: r.advisor_category ?? 'woman',
    city: r.city,
    region: r.region ?? '',
    age: r.age,
    gender: r.gender ?? 'female',
    height_cm: r.height_cm,
    weight_kg: r.weight_kg,
    eye_color: r.eye_color ?? '',
    hair_color: r.hair_color ?? '',
    ethnicity: r.ethnicity ?? '',
    sexual_orientation: r.sexual_orientation ?? '',
    availability: r.availability ?? 'both',
    date_types: r.date_types ?? [],
    languages: r.languages ?? ['en'],
    services_tags: r.services_tags ?? [],
    incall_rates: ratesToFormState(r.incall_rates ?? []),
    outcall_rates: ratesToFormState(r.outcall_rates ?? []),
    availability_slots: r.availability_slots ?? [],
    phone: r.phone ?? '',
    whatsapp_available: r.whatsapp_available ?? false,
    telegram_available: r.telegram_available ?? false,
  }
}

function formatShortDate(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

// Component
export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [advisor, setAdvisor] = useState<AdvisorRow | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [billing, setBilling] = useState<BillingSummary | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingBusy, setBillingBusy] = useState<string | null>(null)
  const [billingMsg, setBillingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState<ProfileForm>({
    name: '', bio: '', advisor_category: 'woman', city: '', region: '', age: null, gender: 'female',
    height_cm: null, weight_kg: null, eye_color: '', hair_color: '',
    ethnicity: '', sexual_orientation: '', availability: 'both', date_types: [], languages: ['en'], services_tags: [],
    incall_rates: createEmptyRateState(), outcall_rates: createEmptyRateState(), availability_slots: [],
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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const requestedTab = searchParams.get('tab')
    if (requestedTab === 'overview' || requestedTab === 'profile' || requestedTab === 'subscription' || requestedTab === 'settings') {
      setActiveTab(requestedTab)
    }

    const billingStatus = searchParams.get('billing')
    if (billingStatus === 'success') {
      setBillingMsg({ type: 'success', text: 'Stripe checkout completed successfully.' })
    } else if (billingStatus === 'cancel') {
      setBillingMsg({ type: 'error', text: 'Stripe checkout was canceled before completion.' })
    }

    if (billingStatus) {
      const target = requestedTab ? `/advisor/dashboard?tab=${requestedTab}` : '/advisor/dashboard'
      router.replace(target, { scroll: false })
    }
  }, [router])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    setUserEmail(user.email ?? '')
    setSettingsEmail(user.email ?? '')

    let res = await fetch('/api/advisor/profile')
    if (res.status === 404) {
      res = await fetch('/api/advisor/profile', { method: 'POST' })
    }

    if (res.ok) {
      const data = await res.json() as AdvisorRow
      setAdvisor(data)
      setForm(rowToForm(data))

      // carica foto esistenti
      const { data: mediaData } = await supabase
        .from('advisor_media')
        .select('id, url, cloudinary_id, is_cover')
        .eq('advisor_id', data.id)
        .order('sort_order', { ascending: true })

      if (mediaData) {
        setPhotos(mediaData.map((m) => ({
          id: m.id,
          url: m.url,
          publicId: m.cloudinary_id,
          isCover: m.is_cover,
        })))
      }

      await loadBillingData()
    } else {
      const json = await res.json().catch(() => ({}))
      console.error('[dashboard] load error:', json.error ?? res.status)
      setBillingLoading(false)
    }
    setLoading(false)
  }

  async function loadBillingData() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/advisor/billing')
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load billing summary')
      }

      setBilling(json as BillingSummary)
    } catch (error) {
      console.error('[dashboard] billing load error:', error)
      setBillingMsg({ type: 'error', text: 'Unable to load billing data right now.' })
    } finally {
      setBillingLoading(false)
    }
  }

  function upd<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleMultiField(key: 'date_types' | 'services_tags' | 'availability_slots', value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }))
  }

  function setRateValue(scope: 'incall_rates' | 'outcall_rates', code: PriceCode, value: string) {
    setForm((current) => ({
      ...current,
      [scope]: {
        ...current[scope],
        [code]: value,
      },
    }))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const payload = {
        ...form,
        incall_rates: buildRatesFromForm(form.incall_rates, 'incall'),
        outcall_rates: buildRatesFromForm(form.outcall_rates, 'outcall'),
      }
      const res = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  async function handleCheckout(kind: 'subscription' | 'credits', plan: CheckoutPlan) {
    setBillingBusy(`${kind}:${plan}`)
    setBillingMsg(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, plan }),
      })

      const json = await res.json()
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Unable to start Stripe checkout')
      }

      window.location.href = json.url as string
    } catch (error) {
      setBillingMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to start Stripe checkout',
      })
      setBillingBusy(null)
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
  const ageLocked = advisor.age !== null
  const ethnicityLocked = !!advisor.ethnicity
  const genderLocked = !!advisor.gender
  const hasBdsm = form.date_types.includes('Bdsm')
  const hasMassage = form.date_types.includes('Massage')
  const hasSexCam = form.date_types.includes('SexCam')
  const hasIncall = form.date_types.includes('Incall')
  const hasOutcall = form.date_types.includes('Outcall')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>

      {/* Header */}
      <header className="px-4 lg:px-8 h-14 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/">
          <span className="text-xl font-black"
            style={{ background: 'linear-gradient(135deg, var(--accent), #ff6eb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
        <aside className="hidden lg:flex flex-col w-56 shrink-0 min-h-[calc(100vh-3.5rem)] py-6 px-4 gap-1"
          style={{ borderRight: '1px solid var(--border)' }}>
          {([
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'profile', icon: '👤', label: 'My profile' },
            { id: 'subscription', icon: '💎', label: 'Subscription' },
            { id: 'settings', icon: '⚙️', label: 'Settings' },
          ] as const).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: activeTab === tab.id ? 'rgba(233,30,140,0.12)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : '#9ca3af',
                border: `1px solid ${activeTab === tab.id ? 'rgba(233,30,140,0.25)' : 'transparent'}`,
              }}>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <Link href={`/profile/${advisor.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors">
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? '#fff' : '#9ca3af',
                  border: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile completeness banner */}
          {pct < 80 && activeTab === 'overview' && (
            <div className="mb-6 rounded-xl p-4 flex items-start gap-4"
              style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.25)' }}>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-white">Complete your profile — {pct}%</p>
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

          {/* ── OVERVIEW ── */}
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
                  { label: 'Profile status', value: advisor.status === 'active' ? 'Active' : advisor.status === 'pending' ? 'Pending review' : advisor.status },
                  { label: 'Identity verified', value: advisor.is_verified ? 'Yes' : 'No' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-6 flex flex-col sm:flex-row gap-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shrink-0 overflow-hidden"
                  style={{ background: 'var(--bg-elevated)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                  {photos.find((p) => p.isCover)
                    ? <img src={photos.find((p) => p.isCover)!.url} alt="" className="w-full h-full object-cover" />
                    : '👤'}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {advisor.name}{advisor.age ? `, ${advisor.age}` : ''}
                    </h2>
                    {advisor.is_verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {advisor.city}{advisor.region ? ` · ${advisor.region}` : ''} · {advisor.views_count.toLocaleString()} total views
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setActiveTab('profile')} className="btn-outline text-xs px-3 py-1.5">Edit profile</button>
                    <Link href={`/profile/${advisor.slug}`} className="btn-ghost text-xs px-3 py-1.5">View listing</Link>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(233,30,140,0.25)' }}>
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

          {/* ── PROFILE EDIT ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-5xl">
              <h1 className="text-2xl font-black text-white">Edit profile</h1>

              {/* Photo upload */}
              <div className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(233,30,140,0.05)', border: '1px dashed rgba(233,30,140,0.35)' }}>
                <div>
                  <p className="text-sm font-semibold text-white">Photos</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Profiles with photos receive up to 10x more contacts. Up to 25 photos — JPG / PNG / WebP.
                  </p>
                </div>
                <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={25} />
              </div>

              {saveMsg && (
                <div className="text-xs px-4 py-3 rounded-lg"
                  style={{
                    background: saveMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${saveMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: saveMsg.type === 'success' ? '#86efac' : '#fca5a5',
                  }}>
                  {saveMsg.text}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic information</h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Name / Alias <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <input type="text" required value={form.name} onChange={(e) => upd('name', e.target.value)} className="input-dark" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      City <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <CityAutocomplete city={form.city} region={form.region} required onChange={(city, region) => setForm((f) => ({ ...f, city, region }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Region</label>
                    <input type="text" readOnly value={form.region} placeholder="Auto-filled when city is selected" className="input-dark opacity-70" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Listing category</label>
                    <select value={form.advisor_category} onChange={(e) => upd('advisor_category', e.target.value as AdvisorCategory)} className="input-dark">
                      <option value="woman">Woman</option>
                      <option value="man">Man</option>
                      <option value="couple">Couple</option>
                      <option value="shemale">Shemale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                    <textarea rows={6} required value={form.bio} onChange={(e) => upd('bio', e.target.value)} placeholder="Write a short description about yourself..." className="input-dark resize-none" />
                  </div>
                </div>

                <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Identity & body</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Age</label>
                      <input type="number" min={18} max={80} required disabled={ageLocked} value={form.age ?? ''}
                        onChange={(e) => upd('age', e.target.value ? Number(e.target.value) : null)}
                        placeholder="25" className="input-dark disabled:opacity-60" />
                      {ageLocked && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Locked after first save.</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
                      <select disabled={genderLocked} value={form.gender} onChange={(e) => upd('gender', e.target.value as GenderType)} className="input-dark disabled:opacity-60">
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="shemale">Shemale / Trans</option>
                      </select>
                      {genderLocked && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Locked after first save.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Ethnicity</label>
                      <select disabled={ethnicityLocked} value={form.ethnicity} onChange={(e) => upd('ethnicity', e.target.value)} className="input-dark disabled:opacity-60">
                        <option value="">Select ethnicity</option>
                        {ADVISOR_ETHNICITIES.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      {ethnicityLocked && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Locked after first save.</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Sex orientation</label>
                      <select value={form.sexual_orientation} onChange={(e) => upd('sexual_orientation', e.target.value)} className="input-dark">
                        <option value="">Select orientation</option>
                        {SEX_ORIENTATION_OPTIONS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Height (cm)</label>
                      <input type="number" min={140} max={210} value={form.height_cm ?? ''}
                        onChange={(e) => upd('height_cm', e.target.value ? Number(e.target.value) : null)}
                        placeholder="168" className="input-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Weight (kg)</label>
                      <input type="number" min={40} max={150} value={form.weight_kg ?? ''}
                        onChange={(e) => upd('weight_kg', e.target.value ? Number(e.target.value) : null)}
                        placeholder="55" className="input-dark" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Hair color</label>
                      <input type="text" value={form.hair_color} onChange={(e) => upd('hair_color', e.target.value)} placeholder="e.g. Blonde, Brunette, Red..." className="input-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Eye color</label>
                      <input type="text" value={form.eye_color} onChange={(e) => upd('eye_color', e.target.value)} placeholder="e.g. Blue, Brown, Green..." className="input-dark" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Type of date</h3>
                <div className="flex flex-wrap gap-2">
                  {DATE_TYPE_OPTIONS.map((item) => {
                    const active = form.date_types.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleMultiField('date_types', item)}
                        className="rounded-full px-4 py-2 text-sm transition-all"
                        style={{
                          background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-elevated)',
                          border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                          color: active ? '#fff' : '#cbd5e1',
                        }}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(hasIncall || hasOutcall) && (
                <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Prices</h3>
                  {hasIncall && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-white">InCall prices</h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {PRICE_DURATION_OPTIONS.map((option) => (
                          <label key={`incall-${option.code}`} className="space-y-1">
                            <span className="block text-xs text-gray-400">{option.label}</span>
                            <input
                              type="number"
                              min={0}
                              value={form.incall_rates[option.code]}
                              onChange={(e) => setRateValue('incall_rates', option.code, e.target.value)}
                              placeholder="EUR"
                              className="input-dark"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasOutcall && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-white">OutCall prices</h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {PRICE_DURATION_OPTIONS.map((option) => (
                          <label key={`outcall-${option.code}`} className="space-y-1">
                            <span className="block text-xs text-gray-400">{option.label}</span>
                            <input
                              type="number"
                              min={0}
                              value={form.outcall_rates[option.code]}
                              onChange={(e) => setRateValue('outcall_rates', option.code, e.target.value)}
                              placeholder="EUR"
                              className="input-dark"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Services available</h3>

                {([
                  { title: 'General services', items: GENERAL_SERVICE_OPTIONS },
                  ...(hasBdsm ? [{ title: 'BDSM services', items: BDSM_SERVICE_OPTIONS }] : []),
                  ...(hasMassage ? [{ title: 'Erotic massage services', items: MASSAGE_SERVICE_OPTIONS }] : []),
                  ...(hasSexCam ? [{ title: 'Virtual sex services', items: VIRTUAL_SERVICE_OPTIONS }] : []),
                ] as const).map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item) => {
                        const active = form.services_tags.includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleMultiField('services_tags', item)}
                            className="rounded-full px-3 py-1.5 text-xs transition-all"
                            style={{
                              background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-elevated)',
                              border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                              color: active ? '#fff' : '#cbd5e1',
                            }}
                          >
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Contact & availability</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Phone <span style={{ color: 'var(--text-muted)' }}>(visible to registered users only)</span>
                  </label>
                  <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="+31 6XX XXX XXXX" className="input-dark" />
                </div>

                <div className="space-y-4">
                  {AVAILABILITY_DAYS.map((day) => (
                    <div key={day} className="space-y-2">
                      <p className="text-sm font-medium text-white">{day}</p>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABILITY_TIME_OPTIONS.map((slot) => {
                          const value = `${day} - ${slot}`
                          const active = form.availability_slots.includes(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => toggleMultiField('availability_slots', value)}
                              className="rounded-full px-3 py-1.5 text-xs transition-all"
                              style={{
                                background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-elevated)',
                                border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                                color: active ? '#fff' : '#cbd5e1',
                              }}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.whatsapp_available}
                      onChange={(e) => upd('whatsapp_available', e.target.checked)} className="accent-pink-500" />
                    <span className="text-sm text-gray-300">WhatsApp available</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.telegram_available}
                      onChange={(e) => upd('telegram_available', e.target.checked)} className="accent-pink-500" />
                    <span className="text-sm text-gray-300">Telegram available</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" disabled={saving} className="btn-accent px-8 py-2.5 text-sm">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeTab === 'subscription' && (
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-2xl font-black text-white">Subscription</h1>
              {billingMsg && (
                <div className="text-sm px-4 py-3 rounded-xl"
                  style={{
                    background: billingMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${billingMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: billingMsg.type === 'success' ? '#86efac' : '#fca5a5',
                  }}>
                  {billingMsg.text}
                </div>
              )}

              <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
                <div className="rounded-xl p-6 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Current access</p>
                      <h2 className="text-2xl font-black text-white mt-2">
                        {billingLoading ? 'Loading...' : billing?.currentTier === 'diamond' ? 'Diamond' : billing?.currentTier === 'premium' ? 'Premium' : 'Standard'}
                      </h2>
                      <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>
                        {billing?.currentTier !== 'free' && billing?.subscription?.current_period_end
                          ? `Active until ${formatShortDate(billing.subscription.current_period_end)}`
                          : billing?.subscription?.current_period_end
                          ? `Last paid plan expired on ${formatShortDate(billing.subscription.current_period_end)}`
                          : 'No active paid plan yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Credit balance</p>
                      <p className="text-3xl font-black text-white mt-2">{billingLoading ? '...' : billing?.wallet.balance ?? 0}</p>
                      <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>
                        {billing?.wallet.updatedAt ? `Updated on ${formatShortDate(billing.wallet.updatedAt)}` : 'No credit purchases yet.'}
                      </p>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Subscription status</p>
                      <p className="text-xl font-bold text-white mt-2">
                        {billingLoading ? 'Loading...' : billing?.subscription?.status ?? 'inactive'}
                      </p>
                      <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>
                        One-time payment. Renew manually when the 30-day access period expires.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h2 className="text-lg font-bold text-white">Recent credit activity</h2>
                  {billingLoading ? (
                    <p className="text-sm" style={{ color: '#d1d5db' }}>Loading billing activity...</p>
                  ) : billing?.recentTransactions.length ? (
                    <div className="space-y-3">
                      {billing.recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="rounded-lg p-3"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-white">{transaction.description ?? 'Credit purchase'}</span>
                            <span className="text-sm font-semibold" style={{ color: '#86efac' }}>+{transaction.amount}</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {formatShortDate(transaction.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#d1d5db' }}>
                      Credit purchases will appear here after the first successful checkout.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="rounded-2xl overflow-x-auto"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  border: '1px solid var(--border)',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ minWidth: 920 }}>
                  <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
                    <div className="p-6">
                      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase"
                        style={{ background: 'rgba(233,30,140,0.14)', color: '#f9a8d4' }}>
                        Package Comparison
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-white">{SUBSCRIPTION_COMPARISON[0].title}</h3>
                    </div>
                    {([
                      { level: 'free', name: 'Standard', price: 'Free', period: '' },
                      { level: 'premium', name: 'Premium', price: 'EUR 29', period: '/ 30 days' },
                      { level: 'diamond', name: 'Diamond', price: 'EUR 59', period: '/ 30 days' },
                    ] as const).map((plan) => {
                      const isCurrent = (billing?.currentTier ?? 'free') === plan.level
                      const isBusy = billingBusy === `subscription:${plan.level}`
                      const highlight = plan.level === 'diamond'

                      return (
                        <div
                          key={plan.level}
                          className="p-6 text-center"
                          style={{
                            background: highlight
                              ? 'linear-gradient(180deg, rgba(212,175,55,0.20), rgba(212,175,55,0.05))'
                              : plan.level === 'premium'
                              ? 'linear-gradient(180deg, rgba(34,197,94,0.16), rgba(34,197,94,0.03))'
                              : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
                            borderLeft: '1px solid var(--border)',
                          }}
                        >
                          {highlight && (
                            <span className="mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em]" style={{ background: 'rgba(212,175,55,0.26)', color: '#fff' }}>
                              MOST VISIBLE
                            </span>
                          )}
                          {plan.level === 'premium' && (
                            <span className="mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em]" style={{ background: 'rgba(34,197,94,0.22)', color: '#fff' }}>
                              PRIORITY
                            </span>
                          )}
                          <h3 className={`font-bold ${plan.level === 'diamond' ? 'text-[#d4af37]' : plan.level === 'premium' ? 'text-[#7ecb7e]' : 'text-white'}`}>{plan.name}</h3>
                          <p className="mt-2 text-2xl font-black text-white">
                            {plan.price}
                            <span className="ml-1 text-sm font-normal text-gray-400">{plan.period}</span>
                          </p>
                          <button
                            type="button"
                            disabled={plan.level === 'free' || isCurrent || isBusy}
                            onClick={() => plan.level !== 'free' && handleCheckout('subscription', plan.level)}
                            className={plan.level === 'free' || isCurrent ? 'btn-ghost mt-4 w-full justify-center py-2 text-sm cursor-default' : 'btn-accent mt-4 w-full justify-center py-2 text-sm'}
                          >
                            {plan.level === 'free' || isCurrent ? 'Current plan' : isBusy ? 'Redirecting...' : `Choose ${plan.name}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {SUBSCRIPTION_COMPARISON.flatMap((section, sectionIndex) => {
                    const items: JSX.Element[] = []

                    if (sectionIndex > 0) {
                      items.push(
                        <div
                          key={`${section.title}-divider`}
                          className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]"
                          style={{ borderTop: '1px solid var(--border)' }}
                        >
                          <div className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#f9a8d4' }}>
                            {section.title}
                          </div>
                          <div style={{ borderLeft: '1px solid var(--border)' }} />
                          <div style={{ borderLeft: '1px solid var(--border)' }} />
                          <div style={{ borderLeft: '1px solid var(--border)' }} />
                        </div>
                      )
                    }

                    for (const row of section.rows) {
                      items.push(
                        <div key={row.label} className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="p-6 text-sm" style={{ color: '#d1d5db' }}>
                            {row.label}
                          </div>
                          {(['free', 'premium', 'diamond'] as const).map((level) => {
                            const value = row.values[level]
                            return (
                              <div key={level} className="flex items-center justify-center p-6 text-sm text-center" style={{ borderLeft: '1px solid var(--border)' }}>
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <svg className="h-5 w-5" style={{ color: '#2f9e44' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="h-5 w-5" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )
                                ) : (
                                  <span style={{ color: '#d1d5db' }}>{value}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }

                    return items
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white">Credit packs</h2>
                  <p className="text-sm mt-1" style={{ color: '#d1d5db' }}>
                    One-time Stripe payments for paid visibility actions and future premium boosts.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {([
                    {
                      key: 'starter',
                      name: 'Starter Pack',
                      price: 'EUR 10',
                      credits: 10,
                      description: 'A compact pack for occasional boosts.',
                    },
                    {
                      key: 'boost',
                      name: 'Boost Pack',
                      price: 'EUR 20',
                      credits: 25,
                      description: 'Balanced pack for recurring promotion actions.',
                    },
                    {
                      key: 'power',
                      name: 'Power Pack',
                      price: 'EUR 50',
                      credits: 60,
                      description: 'Best value if you plan to consume credits every week.',
                    },
                  ] as const).map((pack) => {
                    const isBusy = billingBusy === `credits:${pack.key}`

                    return (
                      <div key={pack.key} className="rounded-xl p-5 flex flex-col gap-4"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div>
                          <h3 className="font-bold text-white">{pack.name}</h3>
                          <p className="text-2xl font-black text-white mt-1">{pack.price}</p>
                          <p className="text-sm mt-2" style={{ color: '#d1d5db' }}>{pack.description}</p>
                        </div>
                        <div className="rounded-lg px-3 py-2 self-start"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: '#fff' }}>
                          {pack.credits} credits
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCheckout('credits', pack.key)}
                          disabled={isBusy}
                          className="btn-accent text-sm py-2"
                        >
                          {isBusy ? 'Redirecting...' : `Buy ${pack.name}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Secure payment via Stripe · Cancel anytime · No commitment
              </p>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h1 className="text-2xl font-black text-white">Settings</h1>

              <form onSubmit={handleSaveSettings} className="rounded-xl p-6 space-y-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold text-gray-200">Account security</h3>

                {settingsMsg && (
                  <div className="text-xs px-4 py-3 rounded-lg"
                    style={{
                      background: settingsMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${settingsMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: settingsMsg.type === 'success' ? '#86efac' : '#fca5a5',
                    }}>
                    {settingsMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input type="email" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} className="input-dark" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">New password</label>
                  <input type="password" value={settingsPassword} onChange={(e) => setSettingsPassword(e.target.value)}
                    placeholder="Leave blank to keep current" className="input-dark" />
                </div>
                <button type="submit" disabled={settingsSaving} className="btn-outline text-sm px-4 py-2">
                  {settingsSaving ? 'Saving...' : 'Update security'}
                </button>
              </form>

              <div className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <h3 className="font-semibold" style={{ color: '#fca5a5' }}>Danger zone</h3>
                <p className="text-sm text-gray-400">Deleting your account will permanently remove all your data.</p>
                <button type="button" onClick={() => alert('Please contact support to delete your account.')}
                  className="text-sm px-4 py-2 rounded-lg border transition-all"
                  style={{ background: 'transparent', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}>
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
