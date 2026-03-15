import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { deriveAvailability, sanitizeDateTypes } from '@/lib/advisor-profile-options'
import { invalidateMarketplaceCache } from '@/lib/marketplace-cache'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as { action?: 'offline' | 'online' }
    if (!body.action || !['offline', 'online'].includes(body.action)) {
      return NextResponse.json({ error: 'Invalid account action' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, date_types')
      .eq('profile_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json({ error: advisorError?.message ?? 'Advisor profile not found' }, { status: 404 })
    }

    const nextAvailability =
      body.action === 'offline'
        ? 'offline'
        : deriveAvailability(sanitizeDateTypes(advisor.date_types))

    const { error } = await admin
      .from('advisors')
      .update({ availability: nextAvailability })
      .eq('id', advisor.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    invalidateMarketplaceCache()
    return NextResponse.json({ ok: true, availability: nextAvailability })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: advisor } = await admin
      .from('advisors')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (advisor?.id) {
      const advisorId = advisor.id as string
      await admin.from('favorites').delete().eq('advisor_id', advisorId)
      await admin.from('reviews').delete().eq('advisor_id', advisorId)
      await admin.from('reports').delete().eq('advisor_id', advisorId)
      await admin.from('subscriptions').delete().eq('advisor_id', advisorId)
      await admin.from('advisor_media').delete().eq('advisor_id', advisorId)
      await admin.from('advisor_verification_uploads').delete().eq('advisor_id', advisorId)

      const { error: advisorDeleteError } = await admin
        .from('advisors')
        .delete()
        .eq('id', advisorId)

      if (advisorDeleteError) {
        return NextResponse.json({ error: advisorDeleteError.message }, { status: 500 })
      }
    }

    await admin.from('favorites').delete().eq('profile_id', user.id)
    await admin.from('reviews').delete().eq('profile_id', user.id)
    await admin.from('reports').delete().eq('reporter_id', user.id)
    await admin.from('credit_transactions').delete().eq('profile_id', user.id)
    await admin.from('credit_wallets').delete().eq('profile_id', user.id)
    await admin.from('profiles').delete().eq('id', user.id)

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    invalidateMarketplaceCache()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
