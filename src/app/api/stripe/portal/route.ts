import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (advisorError) {
      throw advisorError
    }

    if (!advisor?.id) {
      return NextResponse.json({ error: 'Advisor profile not found' }, { status: 404 })
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('advisor_id', advisor.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      throw subscriptionError
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found for this account' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getBaseUrl(request)}/advisor/dashboard?tab=subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe] billing portal session creation failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to open Stripe billing portal' },
      { status: 500 }
    )
  }
}
