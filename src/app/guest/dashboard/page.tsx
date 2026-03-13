'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TabId = 'account' | 'settings'
type ClientMembershipResponse = {
  schema_ready: boolean
  currentPlan: 'free' | 'gold'
  message?: string
  membership: {
    plan: 'gold'
    status: string
    stripe_customer_id: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    updated_at: string
  } | null
}

export default function GuestDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [membershipLoading, setMembershipLoading] = useState(true)
  const [membershipBusy, setMembershipBusy] = useState<'checkout' | null>(null)
  const [membershipData, setMembershipData] = useState<ClientMembershipResponse>({
    schema_ready: true,
    currentPlan: 'free',
    membership: null,
  })
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const billingStatus = searchParams.get('billing')

    if (billingStatus === 'success') {
      setAccountMsg({ type: 'success', text: 'Stripe checkout completed. Gold activation will appear as soon as Stripe confirms the subscription.' })
    } else if (billingStatus === 'cancel') {
      setAccountMsg({ type: 'error', text: 'Stripe checkout was canceled before completion.' })
    }

    if (billingStatus) {
      router.replace('/guest/dashboard', { scroll: false })
    }
  }, [router])

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
    await loadMembership()
    setLoading(false)
  }

  async function loadMembership() {
    setMembershipLoading(true)
    try {
      const res = await fetch('/api/guest/membership', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load Gold membership')
      }
      setMembershipData(json as ClientMembershipResponse)
    } catch (error) {
      setAccountMsg({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load Gold membership' })
    } finally {
      setMembershipLoading(false)
    }
  }

  async function handleMembershipCheckout() {
    setMembershipBusy('checkout')
    setAccountMsg(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'client_membership', plan: 'gold' }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Unable to start Gold checkout')
      }
      window.location.href = json.url as string
    } catch (error) {
      setAccountMsg({ type: 'error', text: error instanceof Error ? error.message : 'Unable to start Gold checkout' })
      setMembershipBusy(null)
    }
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

              {accountMsg && (
                <div
                  className="text-xs px-4 py-3 rounded-lg"
                  style={{
                    background: accountMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${accountMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: accountMsg.type === 'success' ? '#86efac' : '#fca5a5',
                  }}
                >
                  {accountMsg.text}
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Username</p>
                <p className="mt-2 text-lg font-bold text-white">{username}</p>
              </div>

              <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#fde68a' }}>Gold membership</p>
                    <h2 className="mt-2 text-xl font-black text-white">Live chat unlock</h2>
                    <p className="mt-2 text-sm" style={{ color: '#f3f4f6' }}>
                      Gold lets registered client accounts unlock 30 days of live chat with Premium and Diamond advisors for EUR 7 per renewal.
                    </p>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,158,11,0.18)' }}>
                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: '#fde68a' }}>Current plan</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {membershipLoading ? 'Loading...' : membershipData.currentPlan === 'gold' ? 'Gold' : 'Free'}
                    </p>
                  </div>
                </div>

                {!membershipData.schema_ready && (
                  <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#fde68a' }}>
                    {membershipData.message}
                  </div>
                )}

                {membershipData.membership && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Status</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {membershipData.membership.status === 'active'
                          ? membershipData.membership.cancel_at_period_end
                            ? 'Active until period end'
                            : 'Active'
                          : membershipData.membership.status}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Access until</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {membershipData.membership.current_period_end
                          ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(membershipData.membership.current_period_end))
                          : 'Not available yet'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleMembershipCheckout}
                    disabled={membershipBusy !== null || !membershipData.schema_ready}
                    className={`${membershipData.currentPlan === 'gold' ? 'btn-outline' : 'btn-accent'} px-5 py-2 text-sm disabled:opacity-60`}
                  >
                    {membershipBusy === 'checkout'
                      ? 'Redirecting...'
                      : membershipData.currentPlan === 'gold'
                      ? 'Renew Gold for another 30 days'
                      : 'Buy Gold for 30 days'}
                  </button>
                  <button
                    type="button"
                    onClick={loadMembership}
                    disabled={membershipLoading || membershipBusy !== null}
                    className="btn-ghost px-5 py-2 text-sm disabled:opacity-60"
                  >
                    {membershipLoading ? 'Refreshing...' : 'Refresh status'}
                  </button>
                </div>
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
