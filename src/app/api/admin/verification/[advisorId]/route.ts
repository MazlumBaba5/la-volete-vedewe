import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { invalidateMarketplaceCache } from '@/lib/marketplace-cache'

function isMissingReviewedAtColumn(message?: string) {
  return Boolean(message?.includes('column advisors.verification_reviewed_at does not exist'))
}

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
    const reviewedAt = new Date().toISOString()
    const patch =
      body.action === 'confirm'
        ? {
            status: 'active',
            is_verified: true,
            verification_status: 'approved',
            verification_reviewed_at: reviewedAt,
            verification_note: body.note?.trim() || 'Verification confirmed by LvvD team.',
          }
        : {
            status: 'pending',
            is_verified: false,
            verification_status: 'rejected',
            verification_reviewed_at: reviewedAt,
            verification_note: body.note?.trim() || 'Verification refused by LvvD team.',
          }

    let { error } = await admin
      .from('advisors')
      .update(patch)
      .eq('id', advisorId)

    if (error && isMissingReviewedAtColumn(error.message)) {
      const fallbackPatch = { ...patch }
      delete fallbackPatch.verification_reviewed_at
      error = (
        await admin
          .from('advisors')
          .update(fallbackPatch)
          .eq('id', advisorId)
      ).error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    invalidateMarketplaceCache()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
