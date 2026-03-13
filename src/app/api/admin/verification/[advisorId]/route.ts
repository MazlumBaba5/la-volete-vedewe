import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ advisorId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { advisorId } = await params
    const body = (await req.json()) as { action?: 'confirm' | 'refuse'; note?: string }
    if (!body.action || !['confirm', 'refuse'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid verification action.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const patch =
      body.action === 'confirm'
        ? {
            status: 'active',
            is_verified: true,
            verification_status: 'approved',
            verification_note: body.note?.trim() || 'Verification confirmed by LvvD team.',
          }
        : {
            status: 'pending',
            is_verified: false,
            verification_status: 'rejected',
            verification_note: body.note?.trim() || 'Verification refused by LvvD team.',
          }

    const { error } = await admin
      .from('advisors')
      .update(patch)
      .eq('id', advisorId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
