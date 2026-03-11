import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

type LocalSubscriptionStatus = 'active' | 'canceled' | 'expired'

function mapStripeStatus(status: Stripe.Subscription.Status): LocalSubscriptionStatus {
  if (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'unpaid') {
    return 'active'
  }

  if (status === 'canceled') {
    return 'canceled'
  }

  return 'expired'
}

function toIsoDate(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0]

  return {
    start: toIsoDate(firstItem?.current_period_start ?? null),
    end: toIsoDate(firstItem?.current_period_end ?? null),
  }
}

async function findSubscriptionOwner(stripeSubscriptionId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('advisor_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.advisor_id as string | undefined
}

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const metadata = subscription.metadata ?? {}
  const advisorId = metadata.advisor_id || await findSubscriptionOwner(subscription.id)
  const tier = metadata.tier === 'diamond' ? 'diamond' : metadata.tier === 'premium' ? 'premium' : 'free'
  const period = getSubscriptionPeriod(subscription)

  if (!advisorId || tier === 'free') {
    console.warn('[stripe] Missing advisor_id or tier on subscription sync', {
      stripeSubscriptionId: subscription.id,
      advisorId,
      tier,
    })
    return
  }

  const payload = {
    advisor_id: advisorId,
    tier,
    status: mapStripeStatus(subscription.status),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancelled_at: toIsoDate(subscription.canceled_at),
    metadata,
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: lookupError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', existing.id)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .insert([{ ...payload, created_at: new Date().toISOString() }])

  if (error) {
    throw error
  }
}

export async function creditWalletFromCheckoutSession(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {}

  if (metadata.kind !== 'credits') {
    return
  }

  const profileId = metadata.profile_id
  const credits = Number(metadata.credits ?? 0)
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  if (!profileId || !Number.isFinite(credits) || credits <= 0 || !paymentIntentId) {
    console.warn('[stripe] Incomplete credit checkout session metadata', {
      sessionId: session.id,
      profileId,
      credits,
      paymentIntentId,
    })
    return
  }

  const supabase = createAdminClient()

  const { data: existingTransaction, error: transactionLookupError } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (transactionLookupError) {
    throw transactionLookupError
  }

  if (existingTransaction?.id) {
    return
  }

  const { data: wallet, error: walletLookupError } = await supabase
    .from('credit_wallets')
    .select('id, balance')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (walletLookupError) {
    throw walletLookupError
  }

  const nextBalance = (wallet?.balance ?? 0) + credits
  const previousBalance = wallet?.balance ?? 0
  const now = new Date().toISOString()

  let walletId = wallet?.id as string | undefined

  if (!walletId) {
    const { data: createdWallet, error: createWalletError } = await supabase
      .from('credit_wallets')
      .insert([{
        profile_id: profileId,
        balance: nextBalance,
        updated_at: now,
      }])
      .select('id')
      .single()

    if (createWalletError) {
      throw createWalletError
    }

    walletId = createdWallet.id as string
  } else {
    const { error: updateWalletError } = await supabase
      .from('credit_wallets')
      .update({
        balance: nextBalance,
        updated_at: now,
      })
      .eq('id', walletId)

    if (updateWalletError) {
      throw updateWalletError
    }
  }

  const { error: insertTransactionError } = await supabase
    .from('credit_transactions')
    .insert([{
      wallet_id: walletId,
      profile_id: profileId,
      amount: credits,
      balance_after: nextBalance,
      type: 'purchase',
      description: metadata.pack_name ?? 'Credit pack purchase',
      stripe_payment_intent_id: paymentIntentId,
      created_at: now,
    }])

  if (insertTransactionError) {
    const { error: rollbackError } = await supabase
      .from('credit_wallets')
      .update({
        balance: previousBalance,
        updated_at: now,
      })
      .eq('id', walletId)

    if (rollbackError) {
      console.error('[stripe] Failed to rollback wallet after transaction insert error', {
        paymentIntentId,
        rollbackError,
      })
    }

    throw insertTransactionError
  }
}
