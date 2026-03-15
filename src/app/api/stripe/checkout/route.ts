import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { getClientMembershipPlan, getCreditPack, getSubscriptionPlan } from '@/lib/stripe/catalog'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

async function getAdvisorForUser(profileId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('advisors')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.id as string | undefined
}

async function getStripeCustomerId(advisorId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('advisor_id', advisorId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.stripe_customer_id as string | undefined
}

async function getGuestStripeCustomerId(profileId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('client_memberships')
    .select('stripe_customer_id')
    .eq('profile_id', profileId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.stripe_customer_id as string | undefined
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      kind?: 'subscription' | 'credits' | 'client_membership'
      plan?: string
    }

    if (!body.kind || !body.plan) {
      return NextResponse.json({ error: 'Missing checkout payload' }, { status: 400 })
    }

    const role = user.user_metadata?.role as string | undefined
    const baseUrl = getBaseUrl(request)

    if (body.kind === 'client_membership') {
      if (role !== 'guest') {
        return NextResponse.json({ error: 'Only registered client accounts can buy Gold' }, { status: 403 })
      }

      const plan = getClientMembershipPlan(body.plan)
      const customerId = await getGuestStripeCustomerId(user.id)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: `${baseUrl}/guest/dashboard?billing=success`,
        cancel_url: `${baseUrl}/guest/dashboard?billing=cancel`,
        allow_promotion_codes: true,
        client_reference_id: user.id,
        customer: customerId,
        customer_email: customerId ? undefined : user.email ?? undefined,
        metadata: {
          kind: 'client_membership',
          profile_id: user.id,
          plan: plan.key,
          price_id: plan.priceId,
        },
      })

      return NextResponse.json({ url: session.url })
    }

    const advisorId = await getAdvisorForUser(user.id)
    if (!advisorId) {
      return NextResponse.json({ error: 'Advisor profile not found' }, { status: 404 })
    }

    const customerId = await getStripeCustomerId(advisorId)
    const successUrl = `${baseUrl}/advisor/dashboard?tab=subscription&billing=success`
    const cancelUrl = `${baseUrl}/advisor/dashboard?tab=subscription&billing=cancel`

    if (body.kind === 'subscription') {
      const plan = getSubscriptionPlan(body.plan)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        client_reference_id: advisorId,
        customer: customerId,
        customer_creation: customerId ? undefined : 'always',
        customer_email: customerId ? undefined : user.email ?? undefined,
        metadata: {
          kind: 'subscription',
          advisor_id: advisorId,
          profile_id: user.id,
          tier: plan.key,
          price_id: plan.priceId,
        },
      })

      return NextResponse.json({ url: session.url })
    }

    const pack = getCreditPack(body.plan)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: advisorId,
      customer: customerId,
      customer_creation: customerId ? undefined : 'always',
      customer_email: customerId ? undefined : user.email ?? undefined,
      metadata: {
        kind: 'credits',
        advisor_id: advisorId,
        profile_id: user.id,
        pack: pack.key,
        pack_name: pack.name,
        credits: String(pack.credits),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe] checkout session creation failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create Stripe checkout session' },
      { status: 500 }
    )
  }
}
