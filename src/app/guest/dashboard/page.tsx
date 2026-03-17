'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatInbox from '@/components/chat/ChatInbox'

type TabId = 'account' | 'chat' | 'settings'
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

type GuestProfileResponse = {
  profile_id: string
  name: string
  role: string
  avatar_url: string | null
}

type GuestFavoriteItem = {
  favorite_id: string
  advisor_id: string
  advisor_name: string
  advisor_slug: string | null
  city: string | null
  availability: string | null
  latest_photo_url: string | null
  created_at: string
  unread_count: number
}

type GuestFavoriteNotification = {
  id: string
  advisor_id: string
  advisor_name: string
  advisor_slug: string | null
  event_type: 'new_photo' | 'online' | 'offline'
  payload: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

type GuestFavoritesResponse = {
  schema_ready: boolean
  currentPlan: 'free' | 'gold'
  message?: string
  unread_total: number
  items: GuestFavoriteItem[]
  notifications: GuestFavoriteNotification[]
}

export default function GuestDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [membershipLoading, setMembershipLoading] = useState(true)
  const [membershipBusy, setMembershipBusy] = useState<'checkout' | null>(null)
  const [membershipData, setMembershipData] = useState<ClientMembershipResponse>({
    schema_ready: true,
    currentPlan: 'free',
    membership: null,
  })
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesBusy, setFavoritesBusy] = useState<'read' | null>(null)
  const [favoritesData, setFavoritesData] = useState<GuestFavoritesResponse>({
    schema_ready: true,
    currentPlan: 'free',
    unread_total: 0,
    items: [],
    notifications: [],
  })
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [avatarBusy, setAvatarBusy] = useState<'upload' | 'remove' | null>(null)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadChatUnreadCount()
    }, 15000)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeTab !== 'account') return
    if (membershipData.currentPlan !== 'gold') return

    const id = window.setInterval(() => {
      void loadFavorites(true)
    }, 30000)

    return () => window.clearInterval(id)
  }, [activeTab, membershipData.currentPlan])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const billingStatus = searchParams.get('billing')
    const requestedTab = searchParams.get('tab')
    const requestedConversation = searchParams.get('conversation')

    if (requestedTab === 'account' || requestedTab === 'chat' || requestedTab === 'settings') {
      setActiveTab(requestedTab)
    }

    if (requestedConversation) {
      setInitialConversationId(requestedConversation)
    }

    if (billingStatus === 'success') {
      setAccountMsg({ type: 'success', text: 'Stripe checkout completed. Gold activation will appear as soon as Stripe confirms the payment.' })
    } else if (billingStatus === 'cancel') {
      setAccountMsg({ type: 'error', text: 'Stripe checkout was canceled before completion.' })
    }

    if (billingStatus) {
      const target = requestedConversation
        ? `/guest/dashboard?tab=chat&conversation=${requestedConversation}`
        : requestedTab
        ? `/guest/dashboard?tab=${requestedTab}`
        : '/guest/dashboard'
      router.replace(target, { scroll: false })
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

    try {
      const res = await fetch('/api/guest/profile', { cache: 'no-store' })
      const json = await res.json() as GuestProfileResponse
      if (res.ok) {
        setUsername(json.name)
        setAvatarUrl(json.avatar_url)
      } else {
        const nextUsername =
          (user.user_metadata?.username as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split('@')[0] ||
          'guest'
        setUsername(nextUsername)
        setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null)
      }
    } catch {
      const nextUsername =
        (user.user_metadata?.username as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        'guest'
      setUsername(nextUsername)
      setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null)
    }
    await Promise.all([loadMembership(), loadFavorites(), loadChatUnreadCount()])
    setLoading(false)
  }

  async function loadChatUnreadCount() {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json() as { items?: Array<{ unreadCount?: number }> }
      const unread = (json.items ?? []).reduce((sum, item) => sum + (item.unreadCount ?? 0), 0)
      setChatUnreadCount(unread)
    } catch {
      // silent: unread badge should not block dashboard rendering
    }
  }

  async function handleAvatarUpload(file: File | null) {
    if (!file) return

    setAvatarBusy('upload')
    setSettingsMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/guest/avatar', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to upload avatar')
      }
      setAvatarUrl(json.avatar_url as string)
      setSettingsMsg({ type: 'success', text: 'Avatar updated.' })
    } catch (error) {
      setSettingsMsg({ type: 'error', text: error instanceof Error ? error.message : 'Unable to upload avatar' })
    } finally {
      setAvatarBusy(null)
    }
  }

  async function handleAvatarRemove() {
    setAvatarBusy('remove')
    setSettingsMsg(null)
    try {
      const res = await fetch('/api/guest/avatar', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to remove avatar')
      }
      setAvatarUrl(null)
      setSettingsMsg({ type: 'success', text: 'Avatar removed.' })
    } catch (error) {
      setSettingsMsg({ type: 'error', text: error instanceof Error ? error.message : 'Unable to remove avatar' })
    } finally {
      setAvatarBusy(null)
    }
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

  async function loadFavorites(silent = false) {
    if (!silent) {
      setFavoritesLoading(true)
    }

    try {
      const res = await fetch('/api/guest/favorites', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load favorites')
      }
      setFavoritesData(json as GuestFavoritesResponse)
    } catch (error) {
      setAccountMsg({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load favorites' })
    } finally {
      if (!silent) {
        setFavoritesLoading(false)
      }
    }
  }

  async function handleMarkFavoritesAsRead() {
    setFavoritesBusy('read')
    try {
      const res = await fetch('/api/guest/favorites/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to mark notifications as read')
      }
      await loadFavorites(true)
    } catch (error) {
      setAccountMsg({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to mark notifications as read',
      })
    } finally {
      setFavoritesBusy(null)
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

  function favoriteEventLabel(eventType: GuestFavoriteNotification['event_type']) {
    if (eventType === 'new_photo') return 'posted new photos'
    if (eventType === 'online') return 'is now online'
    return 'went offline'
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
            L❤❤D
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-9 overflow-hidden rounded-xl sm:block" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt={username} width={36} height={36} className="h-full w-full object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-200 hidden sm:block">{username}</span>
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">Sign out</button>
        </div>
      </header>

      <div
        className={`${activeTab === 'chat' ? 'max-w-[1400px]' : 'max-w-2xl'} mx-auto px-4 py-8 space-y-6`}
      >
        <div className="flex gap-1">
            {([
              { id: 'account', label: 'Account' },
              { id: 'chat', label: 'Chat' },
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
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {tab.id === 'chat' && chatUnreadCount > 0 && (
                  <span
                    aria-label={`${chatUnreadCount} unread chat messages`}
                    title={`${chatUnreadCount} unread`}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: '#ff4fa0', boxShadow: '0 0 0 3px rgba(255,79,160,0.22)' }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h1 className="text-2xl font-black text-white">Client account</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your client account is active. You can browse listings, leave reviews, and with Gold save favorites with live alerts.
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
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={username} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Username</p>
                    <p className="mt-2 text-lg font-bold text-white">{username}</p>
                  </div>
                </div>
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
                    onClick={() => {
                      void Promise.all([loadMembership(), loadFavorites(true)])
                    }}
                    disabled={membershipLoading || membershipBusy !== null || favoritesLoading}
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

            <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                    Favorites & alerts
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">Gold activity center</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {favoritesData.unread_total > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkFavoritesAsRead}
                      disabled={favoritesBusy !== null || favoritesLoading}
                      className="btn-ghost px-4 py-2 text-xs disabled:opacity-60"
                    >
                      {favoritesBusy === 'read' ? 'Marking...' : 'Mark all as read'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadFavorites()}
                    disabled={favoritesLoading || favoritesBusy !== null}
                    className="btn-ghost px-4 py-2 text-xs disabled:opacity-60"
                  >
                    {favoritesLoading ? 'Refreshing...' : 'Refresh alerts'}
                  </button>
                </div>
              </div>

              {!favoritesData.schema_ready && (
                <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#fde68a' }}>
                  {favoritesData.message}
                </div>
              )}

              {favoritesData.schema_ready && favoritesData.currentPlan !== 'gold' && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fef3c7' }}>
                  Gold is required to save favorite advisors and receive alerts when they post new photos or switch online/offline.
                </div>
              )}

              {favoritesData.schema_ready && favoritesData.currentPlan === 'gold' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Saved advisors</h3>
                    {favoritesLoading ? (
                      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>Loading favorites...</p>
                    ) : favoritesData.items.length === 0 ? (
                      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No favorites saved yet. Open any advisor profile and tap “Save to favorites”.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {favoritesData.items.map((item) => (
                          <div
                            key={item.favorite_id}
                            className="flex items-center gap-3 rounded-xl px-3 py-3"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              {item.latest_photo_url ? (
                                <Image src={item.latest_photo_url} alt={item.advisor_name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                  {item.advisor_name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {item.advisor_slug ? (
                                <Link href={`/profile/${item.advisor_slug}`} className="text-sm font-semibold text-white hover:underline">
                                  {item.advisor_name}
                                </Link>
                              ) : (
                                <p className="text-sm font-semibold text-white">{item.advisor_name}</p>
                              )}
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {item.city || 'Unknown city'} · {item.availability === 'offline' ? 'Offline' : 'Online'}
                              </p>
                            </div>
                            {item.unread_count > 0 && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                style={{ background: 'var(--accent)' }}
                              >
                                {item.unread_count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">Recent alerts</h3>
                    {favoritesLoading ? (
                      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>Loading alerts...</p>
                    ) : favoritesData.notifications.length === 0 ? (
                      <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        No alerts yet. You&apos;ll see updates here when your favorites post photos or switch online/offline.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {favoritesData.notifications.slice(0, 12).map((notification) => (
                          <div
                            key={notification.id}
                            className="rounded-xl px-3 py-2.5 text-xs"
                            style={{
                              background: notification.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(233,30,140,0.12)',
                              border: `1px solid ${notification.is_read ? 'var(--border)' : 'rgba(233,30,140,0.35)'}`,
                            }}
                          >
                            <p className="text-sm text-white">
                              {notification.advisor_slug ? (
                                <Link href={`/profile/${notification.advisor_slug}`} className="font-semibold hover:underline">
                                  {notification.advisor_name}
                                </Link>
                              ) : (
                                <span className="font-semibold">{notification.advisor_name}</span>
                              )}
                              {' '}
                              {favoriteEventLabel(notification.event_type)}
                            </p>
                            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                              {new Intl.DateTimeFormat('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(notification.created_at))}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatInbox role="guest" initialConversationId={initialConversationId} />
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

              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-400">Avatar</label>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={username} width={80} height={80} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="btn-outline text-sm px-4 py-2 cursor-pointer inline-flex">
                      {avatarBusy === 'upload' ? 'Uploading...' : 'Upload avatar'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={avatarBusy !== null}
                        onChange={(e) => {
                          void handleAvatarUpload(e.target.files?.[0] ?? null)
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => void handleAvatarRemove()}
                        disabled={avatarBusy !== null}
                        className="btn-ghost text-sm px-4 py-2 disabled:opacity-60"
                      >
                        {avatarBusy === 'remove' ? 'Removing...' : 'Remove avatar'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  This image is shown to advisors as your chat avatar.
                </p>
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
