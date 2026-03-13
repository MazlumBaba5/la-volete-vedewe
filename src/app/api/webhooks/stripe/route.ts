import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe/client'
import {
  activateClientMembershipFromCheckoutSession,
  activateSubscriptionFromCheckoutSession,
  creditWalletFromCheckoutSession,
  syncClientMembershipFromStripe,
  syncSubscriptionFromStripe,
} from '@/services/billing.service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  try {
    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed':
        await activateClientMembershipFromCheckoutSession(event.data.object as Stripe.Checkout.Session)
        await activateSubscriptionFromCheckoutSession(event.data.object as Stripe.Checkout.Session)
        await creditWalletFromCheckoutSession(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription)
        await syncClientMembershipFromStripe(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`[stripe] Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe] webhook processing failed', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
