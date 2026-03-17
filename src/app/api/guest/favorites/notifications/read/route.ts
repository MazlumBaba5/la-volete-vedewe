import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestGoldStatus } from '@/lib/guest-gold'

type Body = {
  ids?: string[]
}

function isMissingNotificationSchema(message?: string) {
  return Boolean(message?.includes('relation "public.guest_notifications" does not exist'))
}

const SETUP_MESSAGE = 'Run guest_favorites_notifications_setup.sql first to enable Gold favorites notifications.'

export async function POST(req: Request) {
  try {
    const membership = await getGuestGoldStatus()

    if (membership.kind === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (membership.kind === 'forbidden') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    if (!membership.schemaReady) {
      return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
    }

    if (!membership.isGold) {
      return NextResponse.json({ error: 'Gold membership is required to manage favorites notifications.' }, { status: 403 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []

    const admin = createAdminClient()
    let query = admin
      .from('guest_notifications')
      .update({ is_read: true })
      .eq('profile_id', membership.userId)
      .eq('is_read', false)

    if (ids.length > 0) {
      query = query.in('id', ids)
    }

    const { error } = await query
    if (error) {
      if (isMissingNotificationSchema(error.message)) {
        return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update notifications' },
      { status: 500 }
    )
  }
}
