import { NextResponse } from 'next/server'
import { isSubscriptionCurrentlyActive } from '@/lib/subscriptions'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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

    const { data: subscriptionRows, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('tier, status, stripe_customer_id, current_period_end, cancel_at_period_end, updated_at')
      .eq('advisor_id', advisor.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (subscriptionError) {
      throw subscriptionError
    }

    const activeSubscription = subscriptionRows?.find((row) => isSubscriptionCurrentlyActive(row)) ?? null
    const latestSubscription = subscriptionRows?.[0]
      ? {
          ...subscriptionRows[0],
          status: isSubscriptionCurrentlyActive(subscriptionRows[0]) ? subscriptionRows[0].status : 'expired',
        }
      : null

    const { data: wallet, error: walletError } = await admin
      .from('credit_wallets')
      .select('balance, updated_at')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (walletError) {
      throw walletError
    }

    const { data: transactions, error: transactionsError } = await admin
      .from('credit_transactions')
      .select('id, amount, description, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (transactionsError) {
      throw transactionsError
    }

    return NextResponse.json({
      advisorId: advisor.id,
      currentTier: activeSubscription?.tier ?? 'free',
      subscription: activeSubscription ?? latestSubscription,
      wallet: {
        balance: wallet?.balance ?? 0,
        updatedAt: wallet?.updated_at ?? null,
      },
      recentTransactions: (transactions ?? []).map((row) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    console.error('[billing] failed to load advisor billing summary', error)
    return NextResponse.json({ error: 'Unable to load billing summary' }, { status: 500 })
  }
}
