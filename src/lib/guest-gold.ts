import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isSubscriptionCurrentlyActive } from '@/lib/subscriptions'

type GuestGoldStatus =
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  | {
      kind: 'ok'
      userId: string
      schemaReady: boolean
      currentPlan: 'free' | 'gold'
      isGold: boolean
      message?: string
    }

function isMissingClientMembershipSchema(message?: string) {
  return Boolean(message?.includes('relation "public.client_memberships" does not exist'))
}

export async function getGuestGoldStatus(): Promise<GuestGoldStatus> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { kind: 'unauthorized' }
  }

  if (user.user_metadata?.role !== 'guest') {
    return { kind: 'forbidden' }
  }

  const admin = createAdminClient()
  const { data: membership, error } = await admin
    .from('client_memberships')
    .select('status, current_period_end')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingClientMembershipSchema(error.message)) {
      return {
        kind: 'ok',
        userId: user.id,
        schemaReady: false,
        currentPlan: 'free',
        isGold: false,
        message: 'Run client_gold_setup.sql first to enable Gold memberships.',
      }
    }

    throw error
  }

  const isGold = isSubscriptionCurrentlyActive(membership)

  return {
    kind: 'ok',
    userId: user.id,
    schemaReady: true,
    currentPlan: isGold ? 'gold' : 'free',
    isGold,
  }
}
