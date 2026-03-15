import { createAdminClient, createClient } from '@/lib/supabase/server'

export type ChatRole = 'guest' | 'advisor'
type DbErrorLike = { code?: string; message?: string }
type ChatRateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
  message?: string
}

type ConversationAccessRow = {
  id: string
  advisor_id: string
  guest_profile_id: string
  created_at: string
}

type BlockRow = {
  id: string
  advisor_id: string
  guest_profile_id: string
  blocked_by_profile_id: string
  blocked_by_role: ChatRole
  created_at: string
}

type AdvisorIdRow = {
  id: string
}

export async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, role: null as ChatRole | null }
  }

  const role = user.user_metadata?.role as ChatRole | undefined
  return { user, role: role ?? null }
}

export function isMissingTableError(error: DbErrorLike | null | undefined, tableName: string) {
  if (!error) return false
  if (error.code === '42P01') return true
  return error.message?.includes(`relation "${tableName}" does not exist`) ?? false
}

export function isMissingColumnError(error: DbErrorLike | null | undefined, tableName: string, columnName: string) {
  if (!error) return false
  if (error.code === '42703') return true
  return (
    error.message?.includes(`column ${tableName}.${columnName} does not exist`) ||
    error.message?.includes(`column "${columnName}" does not exist`)
  ) ?? false
}

export async function validateConversationAccess(conversationId: string, userId: string, role: ChatRole) {
  const admin = createAdminClient()
  const { data: conversation, error } = await admin
    .from('chat_conversations')
    .select('id, advisor_id, guest_profile_id, created_at')
    .eq('id', conversationId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!conversation) {
    return { admin, conversation: null as ConversationAccessRow | null }
  }

  if (role === 'guest' && conversation.guest_profile_id !== userId) {
    return { admin, conversation: null as ConversationAccessRow | null }
  }

  if (role === 'advisor') {
    const { data: advisor } = await admin
      .from('advisors')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (!(advisor as AdvisorIdRow | null)?.id || (advisor as AdvisorIdRow).id !== conversation.advisor_id) {
      return { admin, conversation: null as ConversationAccessRow | null }
    }
  }

  return { admin, conversation: conversation as ConversationAccessRow }
}

export async function getConversationBlockState(
  conversation: Pick<ConversationAccessRow, 'advisor_id' | 'guest_profile_id'>,
  actorProfileId: string
) {
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from('chat_blocks')
      .select('id, advisor_id, guest_profile_id, blocked_by_profile_id, blocked_by_role, created_at')
      .eq('advisor_id', conversation.advisor_id)
      .eq('guest_profile_id', conversation.guest_profile_id)
      .maybeSingle()

    if (error) {
      if (isMissingTableError(error, 'public.chat_blocks') || isMissingTableError(error, 'chat_blocks')) {
        return { block: null as BlockRow | null, blockedByMe: false, isBlocked: false }
      }

      // Fail-safe: never break chat loading because of block-state lookup issues.
      console.error('[chat:block-state]', error)
      return { block: null as BlockRow | null, blockedByMe: false, isBlocked: false }
    }

    return {
      block: (data as BlockRow | null) ?? null,
      blockedByMe: (data as BlockRow | null)?.blocked_by_profile_id === actorProfileId,
      isBlocked: Boolean(data as BlockRow | null),
    }
  } catch (error) {
    console.error('[chat:block-state:unexpected]', error)
    return { block: null as BlockRow | null, blockedByMe: false, isBlocked: false }
  }
}

export async function refreshConversationSummary(
  conversationId: string,
  fallbackCreatedAt: string
) {
  const admin = createAdminClient()
  const { data: latestMessage } = await admin
    .from('chat_messages')
    .select('body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latest = latestMessage as { body: string; created_at: string } | null
  const nextTimestamp = latest?.created_at ?? fallbackCreatedAt
  const nextPreview = latest?.body ? latest.body.slice(0, 140) : null

  await admin
    .from('chat_conversations')
    .update({
      updated_at: new Date().toISOString(),
      last_message_at: nextTimestamp,
      last_message_preview: nextPreview,
    })
    .eq('id', conversationId)
}

const CHAT_RATE_LIMITS = {
  minIntervalMs: 900,
  shortWindowSeconds: 15,
  shortWindowMax: 8,
  longWindowSeconds: 300,
  longWindowMax: 70,
  perConversationWindowSeconds: 30,
  perConversationWindowMax: 15,
}

function buildRateLimitResponse(message: string, retryAfterSeconds: number): ChatRateLimitResult {
  return {
    allowed: false,
    retryAfterSeconds,
    message,
  }
}

export async function checkChatRateLimit(profileId: string, conversationId: string): Promise<ChatRateLimitResult> {
  const admin = createAdminClient()
  const now = Date.now()

  const { data: latestMessage } = await admin
    .from('chat_messages')
    .select('created_at')
    .eq('sender_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastCreatedAt = latestMessage ? Date.parse(String((latestMessage as { created_at: string }).created_at)) : NaN
  if (Number.isFinite(lastCreatedAt)) {
    const elapsedMs = now - lastCreatedAt
    if (elapsedMs < CHAT_RATE_LIMITS.minIntervalMs) {
      const retryAfterSeconds = Math.max(1, Math.ceil((CHAT_RATE_LIMITS.minIntervalMs - elapsedMs) / 1000))
      return buildRateLimitResponse('You are sending messages too quickly. Please wait a moment.', retryAfterSeconds)
    }
  }

  const shortWindowFrom = new Date(now - CHAT_RATE_LIMITS.shortWindowSeconds * 1000).toISOString()
  const { count: shortCount } = await admin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_profile_id', profileId)
    .gte('created_at', shortWindowFrom)

  if ((shortCount ?? 0) >= CHAT_RATE_LIMITS.shortWindowMax) {
    return buildRateLimitResponse(
      `Too many messages in ${CHAT_RATE_LIMITS.shortWindowSeconds} seconds. Please slow down.`,
      CHAT_RATE_LIMITS.shortWindowSeconds
    )
  }

  const perConversationFrom = new Date(now - CHAT_RATE_LIMITS.perConversationWindowSeconds * 1000).toISOString()
  const { count: perConversationCount } = await admin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_profile_id', profileId)
    .eq('conversation_id', conversationId)
    .gte('created_at', perConversationFrom)

  if ((perConversationCount ?? 0) >= CHAT_RATE_LIMITS.perConversationWindowMax) {
    return buildRateLimitResponse(
      'Too many messages in this conversation. Please wait before sending more.',
      CHAT_RATE_LIMITS.perConversationWindowSeconds
    )
  }

  const longWindowFrom = new Date(now - CHAT_RATE_LIMITS.longWindowSeconds * 1000).toISOString()
  const { count: longCount } = await admin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_profile_id', profileId)
    .gte('created_at', longWindowFrom)

  if ((longCount ?? 0) >= CHAT_RATE_LIMITS.longWindowMax) {
    return buildRateLimitResponse(
      'Message limit reached for the moment. Try again shortly.',
      60
    )
  }

  return { allowed: true, retryAfterSeconds: 0 }
}
