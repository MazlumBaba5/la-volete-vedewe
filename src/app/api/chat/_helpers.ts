import { createAdminClient, createClient } from '@/lib/supabase/server'

export type ChatRole = 'guest' | 'advisor'
type DbErrorLike = { code?: string; message?: string }

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
