import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestGoldStatus } from '@/lib/guest-gold'

type FavoriteRow = {
  id: string
  advisor_id: string
  created_at: string
}

type AdvisorRow = {
  id: string
  name: string
  slug: string | null
  city: string | null
  availability: string | null
}

type MediaRow = {
  advisor_id: string
  url: string
  created_at: string
  is_cover: boolean
  sort_order: number
}

type NotificationRow = {
  id: string
  advisor_id: string
  event_type: 'new_photo' | 'online' | 'offline'
  payload: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

function isMissingFavoritesSchema(message?: string) {
  return Boolean(
    message?.includes('relation "public.favorites" does not exist') ||
    message?.includes('relation "public.guest_notifications" does not exist')
  )
}

const SETUP_MESSAGE = 'Run guest_favorites_notifications_setup.sql first to enable Gold favorites notifications.'

export async function GET() {
  try {
    const membership = await getGuestGoldStatus()

    if (membership.kind === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (membership.kind === 'forbidden') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    if (!membership.schemaReady) {
      return NextResponse.json({
        schema_ready: false,
        currentPlan: membership.currentPlan,
        message: membership.message,
        unread_total: 0,
        items: [],
        notifications: [],
      })
    }

    if (!membership.isGold) {
      return NextResponse.json({
        schema_ready: true,
        currentPlan: membership.currentPlan,
        message: 'Gold membership is required to use favorites and alerts.',
        unread_total: 0,
        items: [],
        notifications: [],
      })
    }

    const admin = createAdminClient()
    const { data: favorites, error: favoritesError } = await admin
      .from('favorites')
      .select('id, advisor_id, created_at')
      .eq('profile_id', membership.userId)
      .order('created_at', { ascending: false })
      .returns<FavoriteRow[]>()

    if (favoritesError) {
      if (isMissingFavoritesSchema(favoritesError.message)) {
        return NextResponse.json({
          schema_ready: false,
          currentPlan: membership.currentPlan,
          message: SETUP_MESSAGE,
          unread_total: 0,
          items: [],
          notifications: [],
        })
      }

      throw favoritesError
    }

    const favoriteRows = favorites ?? []
    const advisorIds = favoriteRows.map((row) => row.advisor_id)

    if (advisorIds.length === 0) {
      return NextResponse.json({
        schema_ready: true,
        currentPlan: membership.currentPlan,
        unread_total: 0,
        items: [],
        notifications: [],
      })
    }

    const [{ data: advisors, error: advisorsError }, { data: media, error: mediaError }, { data: notifications, error: notificationsError }] = await Promise.all([
      admin
        .from('advisors')
        .select('id, name, slug, city, availability')
        .in('id', advisorIds)
        .returns<AdvisorRow[]>(),
      admin
        .from('advisor_media')
        .select('advisor_id, url, created_at, is_cover, sort_order')
        .in('advisor_id', advisorIds)
        .eq('media_type', 'photo')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .returns<MediaRow[]>(),
      admin
        .from('guest_notifications')
        .select('id, advisor_id, event_type, payload, is_read, created_at')
        .eq('profile_id', membership.userId)
        .in('advisor_id', advisorIds)
        .order('created_at', { ascending: false })
        .limit(100)
        .returns<NotificationRow[]>(),
    ])

    if (advisorsError) throw advisorsError
    if (mediaError) throw mediaError

    if (notificationsError) {
      if (isMissingFavoritesSchema(notificationsError.message)) {
        return NextResponse.json({
          schema_ready: false,
          currentPlan: membership.currentPlan,
          message: SETUP_MESSAGE,
          unread_total: 0,
          items: [],
          notifications: [],
        })
      }

      throw notificationsError
    }

    const advisorMap = new Map((advisors ?? []).map((advisor) => [advisor.id, advisor]))
    const latestPhotoByAdvisor = new Map<string, string>()
    for (const row of media ?? []) {
      if (!latestPhotoByAdvisor.has(row.advisor_id)) {
        latestPhotoByAdvisor.set(row.advisor_id, row.url)
      }
    }

    const unreadByAdvisor = new Map<string, number>()
    for (const row of notifications ?? []) {
      if (row.is_read) continue
      unreadByAdvisor.set(row.advisor_id, (unreadByAdvisor.get(row.advisor_id) ?? 0) + 1)
    }

    const items = favoriteRows
      .map((favorite) => {
        const advisor = advisorMap.get(favorite.advisor_id)
        if (!advisor) return null

        return {
          favorite_id: favorite.id,
          advisor_id: favorite.advisor_id,
          advisor_name: advisor.name,
          advisor_slug: advisor.slug,
          city: advisor.city,
          availability: advisor.availability,
          latest_photo_url: latestPhotoByAdvisor.get(favorite.advisor_id) ?? null,
          created_at: favorite.created_at,
          unread_count: unreadByAdvisor.get(favorite.advisor_id) ?? 0,
        }
      })
      .filter(Boolean)

    const notificationItems = (notifications ?? [])
      .map((notification) => {
        const advisor = advisorMap.get(notification.advisor_id)
        if (!advisor) return null

        return {
          id: notification.id,
          advisor_id: notification.advisor_id,
          advisor_name: advisor.name,
          advisor_slug: advisor.slug,
          event_type: notification.event_type,
          payload: notification.payload,
          is_read: notification.is_read,
          created_at: notification.created_at,
        }
      })
      .filter(Boolean)

    const unreadTotal = (notifications ?? []).reduce(
      (sum, row) => sum + (row.is_read ? 0 : 1),
      0
    )

    return NextResponse.json({
      schema_ready: true,
      currentPlan: membership.currentPlan,
      unread_total: unreadTotal,
      items,
      notifications: notificationItems,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load favorites' },
      { status: 500 }
    )
  }
}
