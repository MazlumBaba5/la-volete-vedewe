'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type VerificationNotification = {
  id: string
  name: string
  slug: string
  city: string
  verification_submitted_at: string | null
  verification_status: string
  created_at: string
  upload_count: number
  verification_uploads: Array<{
    id: string
    kind: string
    url: string
    created_at: string
  }>
  profile_photos: Array<{
    id: string
    url: string
    is_cover: boolean
    sort_order: number
  }>
}

type NotificationsResponse = {
  schema_ready: boolean
  message?: string
  items: VerificationNotification[]
}

type ChatModerationReport = {
  id: string
  conversation_id: string
  advisor_id: string
  advisor_name: string
  advisor_slug: string | null
  guest_profile_id: string
  guest_name: string
  reporter_profile_id: string
  reporter_name: string
  reporter_role: 'advisor' | 'guest'
  reason: 'spam' | 'abuse' | 'scam' | 'fake' | 'other'
  details: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  admin_note: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

type ChatModerationBlock = {
  id: string
  advisor_id: string
  advisor_name: string
  advisor_slug: string | null
  guest_profile_id: string
  guest_name: string
  blocked_by_profile_id: string
  blocked_by_name: string
  blocked_by_role: 'advisor' | 'guest'
  created_at: string
}

type ChatModerationResponse = {
  schema_ready: boolean
  message?: string
  reports: ChatModerationReport[]
  blocks: ChatModerationBlock[]
}

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [moderationLoading, setModerationLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<NotificationsResponse>({ schema_ready: true, items: [] })
  const [moderation, setModeration] = useState<ChatModerationResponse>({
    schema_ready: true,
    reports: [],
    blocks: [],
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<{ url: string; label: string } | null>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const loadNotifications = useCallback(async function loadNotificationsInner() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/notifications/verification', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load notifications')
      }
      setData(json as NotificationsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadModeration = useCallback(async function loadModerationInner() {
    setModerationLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/chat/moderation', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load chat moderation data')
      }
      setModeration(json as ChatModerationResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load chat moderation data')
    } finally {
      setModerationLoading(false)
    }
  }, [])

  const loadAll = useCallback(async function loadAllInner() {
    await Promise.all([loadNotifications(), loadModeration()])
  }, [loadModeration, loadNotifications])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  async function handleVerificationAction(advisorId: string, action: 'confirm' | 'refuse') {
    setActionBusy(`${advisorId}:${action}`)
    setError('')
    try {
      const res = await fetch(`/api/admin/verification/${advisorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to update verification request')
      }
      setExpandedId((current) => (current === advisorId ? null : current))
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update verification request')
    } finally {
      setActionBusy(null)
    }
  }

  async function handleReportAction(reportId: string, action: 'reviewing' | 'resolved' | 'dismissed') {
    const adminNote = window.prompt('Admin note (optional)') ?? ''
    setActionBusy(`report:${reportId}:${action}`)
    setError('')
    try {
      const res = await fetch(`/api/admin/chat/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNote: adminNote.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to update report')
      }
      await loadModeration()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update report')
    } finally {
      setActionBusy(null)
    }
  }

  async function handleLiftBlock(blockId: string) {
    const confirmed = window.confirm('Remove this block from chat blocklist?')
    if (!confirmed) return

    setActionBusy(`block:${blockId}:lift`)
    setError('')
    try {
      const res = await fetch(`/api/admin/chat/blocks/${blockId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to remove block')
      }
      await loadModeration()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove block')
    } finally {
      setActionBusy(null)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8" style={{ background: 'var(--bg-main)' }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>LvvD Admin</p>
            <h1 className="mt-2 text-3xl font-black text-white">Verification Notifications</h1>
            <p className="mt-2 text-sm" style={{ color: '#d1d5db' }}>
              Review new advisor verification requests submitted to the LvvD team.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void loadAll()} className="btn-outline px-4 py-2 text-sm">Refresh</button>
            <button onClick={handleLogout} className="btn-ghost px-4 py-2 text-sm">Logout</button>
          </div>
        </div>

        {!data.schema_ready && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}>
            {data.message}
          </div>
        )}

        {!moderation.schema_ready && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}>
            {moderation.message}
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Pending requests</p>
            <p className="mt-3 text-3xl font-black text-white">{loading ? '...' : data.items.length}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Uploads required</p>
            <p className="mt-3 text-3xl font-black text-white">2</p>
            <p className="mt-2 text-sm" style={{ color: '#d1d5db' }}>Front selfie + proof selfie.</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Next step</p>
            <p className="mt-3 text-sm text-white">Manual approval workflow</p>
            <p className="mt-2 text-sm" style={{ color: '#d1d5db' }}>Open each request, compare the private selfies with the public profile, then confirm or refuse.</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-bold text-white">Submitted advisor verifications</h2>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Loading notifications...</div>
          ) : data.items.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.items.map((item) => (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 flex-wrap text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.28)', color: '#fde68a' }}>
                          {item.verification_status}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#d1d5db' }}>
                        {item.city} · Submitted {formatDate(item.verification_submitted_at)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.upload_count}/2 verification uploads received
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${item.slug}`} className="btn-ghost text-sm px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        View profile
                      </Link>
                      <span className="text-xs font-semibold" style={{ color: '#d1d5db' }}>
                        {expandedId === item.id ? 'Hide details' : 'Open request'}
                      </span>
                    </div>
                  </button>

                  {expandedId === item.id && (
                    <div className="px-6 pb-6 space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#fde68a' }}>
                          Verification selfies
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {item.verification_uploads.map((upload) => (
                            <div key={upload.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                              <button type="button" className="block w-full text-left" onClick={() => setZoomedImage({
                                url: upload.url,
                                label: upload.kind === 'front_selfie' ? 'Front selfie' : 'Proof selfie',
                              })}>
                                <Image src={upload.url} alt={upload.kind} width={1200} height={960} className="h-80 w-full cursor-zoom-in object-cover" unoptimized />
                              </button>
                              <div className="px-4 py-3">
                                <p className="text-sm font-semibold text-white">
                                  {upload.kind === 'front_selfie' ? 'Front selfie' : 'Proof selfie'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                  Uploaded {formatDate(upload.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#d1d5db' }}>
                          Profile photos
                        </h4>
                        {item.profile_photos.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {item.profile_photos.slice(0, 5).map((photo) => (
                              <div key={photo.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <button type="button" className="block w-full text-left" onClick={() => setZoomedImage({
                                  url: photo.url,
                                  label: `Profile photo ${photo.sort_order + 1}`,
                                })}>
                                  <Image src={photo.url} alt="" width={960} height={720} className="h-56 w-full cursor-zoom-in object-cover" unoptimized />
                                </button>
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Photo {photo.sort_order + 1}
                                  </span>
                                  {photo.is_cover && (
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                                      style={{ background: 'rgba(233,30,140,0.15)', border: '1px solid rgba(233,30,140,0.25)', color: '#f9a8d4' }}>
                                      Cover
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            No profile photos found for this advisor yet.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleVerificationAction(item.id, 'confirm')}
                          disabled={actionBusy !== null}
                          className="btn-accent px-5 py-2.5 text-sm disabled:opacity-60"
                        >
                          {actionBusy === `${item.id}:confirm` ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerificationAction(item.id, 'refuse')}
                          disabled={actionBusy !== null}
                          className="px-5 py-2.5 text-sm rounded-lg border disabled:opacity-60"
                          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
                        >
                          {actionBusy === `${item.id}:refuse` ? 'Refusing...' : 'Refuse'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
              No advisor verification notifications yet.
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold text-white">Chat reports</h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {moderationLoading ? '...' : moderation.reports.length}
              </span>
            </div>

            {moderationLoading ? (
              <div className="px-6 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading reports...</div>
            ) : moderation.reports.length > 0 ? (
              <div className="divide-y max-h-[560px] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {moderation.reports.map((report) => (
                  <div key={report.id} className="px-6 py-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {report.reporter_name} reported {report.reporter_role === 'guest' ? report.advisor_name : report.guest_name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(report.created_at)} · {report.reason.toUpperCase()}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          background: report.status === 'open'
                            ? 'rgba(239,68,68,0.15)'
                            : report.status === 'reviewing'
                            ? 'rgba(245,158,11,0.15)'
                            : 'rgba(34,197,94,0.15)',
                          border: report.status === 'open'
                            ? '1px solid rgba(239,68,68,0.35)'
                            : report.status === 'reviewing'
                            ? '1px solid rgba(245,158,11,0.35)'
                            : '1px solid rgba(34,197,94,0.35)',
                          color: report.status === 'open'
                            ? '#fca5a5'
                            : report.status === 'reviewing'
                            ? '#fde68a'
                            : '#86efac',
                        }}
                      >
                        {report.status}
                      </span>
                    </div>

                    {report.details && (
                      <p className="text-sm" style={{ color: '#d1d5db' }}>
                        {report.details}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {report.advisor_slug ? (
                        <Link href={`/profile/${report.advisor_slug}`} className="btn-ghost px-3 py-1.5 text-xs">
                          View advisor profile
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleReportAction(report.id, 'reviewing')}
                        disabled={actionBusy !== null}
                        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        {actionBusy === `report:${report.id}:reviewing` ? 'Saving...' : 'Mark reviewing'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReportAction(report.id, 'resolved')}
                        disabled={actionBusy !== null}
                        className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60"
                      >
                        {actionBusy === `report:${report.id}:resolved` ? 'Saving...' : 'Resolve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReportAction(report.id, 'dismissed')}
                        disabled={actionBusy !== null}
                        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
                        style={{ color: '#fca5a5' }}
                      >
                        {actionBusy === `report:${report.id}:dismissed` ? 'Saving...' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                No chat reports yet.
              </div>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold text-white">Chat blocklist</h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {moderationLoading ? '...' : moderation.blocks.length}
              </span>
            </div>

            {moderationLoading ? (
              <div className="px-6 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading blocks...</div>
            ) : moderation.blocks.length > 0 ? (
              <div className="divide-y max-h-[560px] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {moderation.blocks.map((block) => (
                  <div key={block.id} className="px-6 py-5 space-y-3">
                    <div>
                      <p className="font-semibold text-white">
                        {block.guest_name} ↔ {block.advisor_name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Blocked by {block.blocked_by_name} ({block.blocked_by_role}) · {formatDate(block.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {block.advisor_slug ? (
                        <Link href={`/profile/${block.advisor_slug}`} className="btn-ghost px-3 py-1.5 text-xs">
                          View advisor profile
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleLiftBlock(block.id)}
                        disabled={actionBusy !== null}
                        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
                        style={{ color: '#fca5a5' }}
                      >
                        {actionBusy === `block:${block.id}:lift` ? 'Removing...' : 'Remove block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                No active chat blocks.
              </div>
            )}
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-h-[95vh] max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Close
            </button>
            <div className="mb-3 text-sm font-semibold text-white">{zoomedImage.label}</div>
            <Image
              src={zoomedImage.url}
              alt={zoomedImage.label}
              width={1600}
              height={1600}
              className="max-h-[88vh] w-full rounded-2xl object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}
