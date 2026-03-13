import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isSubscriptionCurrentlyActive } from '@/lib/subscriptions'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.user_metadata?.role !== 'guest') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: membership, error } = await admin
      .from('client_memberships')
      .select('plan, status, stripe_customer_id, current_period_end, cancel_at_period_end, updated_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.message.includes('relation "public.client_memberships" does not exist')) {
        return NextResponse.json({
          schema_ready: false,
          currentPlan: 'free',
          membership: null,
          message: 'Run client_gold_setup.sql first to enable Gold memberships.',
        })
      }

      throw error
    }

    const normalizedMembership = membership
      ? {
          ...membership,
          status: isSubscriptionCurrentlyActive(membership) ? membership.status : 'expired',
        }
      : null

    return NextResponse.json({
      schema_ready: true,
      currentPlan: normalizedMembership && normalizedMembership.status === 'active' ? 'gold' : 'free',
      membership: normalizedMembership,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load client membership' },
      { status: 500 }
    )
  }
}
