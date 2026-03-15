import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blockId } = await params
    const admin = createAdminClient()
    const { error } = await admin
      .from('chat_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      if (
        error.message.includes('relation "public.chat_blocks" does not exist')
        || error.message.includes('relation "chat_blocks" does not exist')
      ) {
        return NextResponse.json({ error: 'Run chat_setup.sql first to enable blocklist moderation.' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

