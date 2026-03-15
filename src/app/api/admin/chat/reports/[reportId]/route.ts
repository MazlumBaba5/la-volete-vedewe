import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

const ALLOWED_ACTIONS = new Set(['reviewing', 'resolved', 'dismissed'])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportId } = await params
    const payload = (await req.json()) as {
      action?: 'reviewing' | 'resolved' | 'dismissed'
      adminNote?: string
    }

    if (!payload.action || !ALLOWED_ACTIONS.has(payload.action)) {
      return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('chat_reports')
      .update({
        status: payload.action,
        admin_note: payload.adminNote?.trim() ? payload.adminNote.trim() : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: String(session.username ?? 'admin'),
      })
      .eq('id', reportId)

    if (error) {
      if (
        error.message.includes('relation "public.chat_reports" does not exist')
        || error.message.includes('relation "chat_reports" does not exist')
      ) {
        return NextResponse.json({ error: 'Run chat_setup.sql first to enable moderation reports.' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

