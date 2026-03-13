import { createAdminClient } from '@/lib/supabase/server'
import { isChatOpenForTesting } from '@/lib/chat-access'
import { isSubscriptionCurrentlyActive } from '@/lib/subscriptions'

type ViewerContext = {
  userId: string
  role: 'guest' | 'advisor'
}

async function hasGuestGoldMembership(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('client_memberships')
    .select('status, current_period_end')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return isSubscriptionCurrentlyActive(data)
}

async function getAdvisorPaidTier(advisorId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })
    .limit(5)
    .returns<Array<{ tier: string; status: string; current_period_end: string | null }>>()

  if (error) {
    throw error
  }

  const active = (data ?? []).find((item) =>
    (item.tier === 'premium' || item.tier === 'diamond') &&
    isSubscriptionCurrentlyActive(item)
  )

  return active?.tier ?? 'free'
}

export async function canOpenChatWithAdvisor(viewer: ViewerContext, advisorId: string) {
  if (isChatOpenForTesting()) {
    return true
  }

  if (viewer.role === 'guest') {
    const [hasGold, advisorTier] = await Promise.all([
      hasGuestGoldMembership(viewer.userId),
      getAdvisorPaidTier(advisorId),
    ])

    return hasGold && (advisorTier === 'premium' || advisorTier === 'diamond')
  }

  const advisorTier = await getAdvisorPaidTier(advisorId)
  return advisorTier === 'premium' || advisorTier === 'diamond'
}
