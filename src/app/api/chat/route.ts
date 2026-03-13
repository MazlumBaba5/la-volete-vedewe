import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getChatAccessMessage, isChatOpenForTesting } from '@/lib/chat-access'

type ConversationRow = {
  id: string
  advisor_id: string
  guest_profile_id: string
  last_message_at: string
  last_message_preview: string | null
  created_at: string
}

async function getGuestName(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) return 'Client'
  return (
    (data.user.user_metadata?.username as string | undefined) ||
    (data.user.user_metadata?.name as string | undefined) ||
    data.user.email?.split('@')[0] ||
    'Client'
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = user.user_metadata?.role as 'guest' | 'advisor' | undefined
    if (role !== 'guest' && role !== 'advisor') {
      return NextResponse.json({ error: 'Only registered accounts can use chat' }, { status: 403 })
    }

    const admin = createAdminClient()

    let conversations: ConversationRow[] = []
    if (role === 'advisor') {
      const { data: advisor, error: advisorError } = await admin
        .from('advisors')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (advisorError) throw advisorError
      if (!advisor?.id) return NextResponse.json({ items: [], chatOpenForTesting: isChatOpenForTesting(), message: getChatAccessMessage() })

      const { data, error } = await admin
        .from('chat_conversations')
        .select('id, advisor_id, guest_profile_id, last_message_at, last_message_preview, created_at')
        .eq('advisor_id', advisor.id)
        .order('last_message_at', { ascending: false })

      if (error) {
        if (error.message.includes('relation "public.chat_conversations" does not exist')) {
          return NextResponse.json({ items: [], schema_ready: false, chatOpenForTesting: isChatOpenForTesting(), message: 'Run chat_setup.sql first to enable chat.' })
        }
        throw error
      }

      conversations = (data ?? []) as ConversationRow[]
      const items = await Promise.all(conversations.map(async (conversation) => {
        const guestName = await getGuestName(conversation.guest_profile_id)
        const { count: unreadCount } = await admin
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('sender_role', 'guest')
          .is('read_at', null)

        return {
          id: conversation.id,
          counterpartName: guestName,
          counterpartRole: 'guest',
          counterpartSlug: null,
          advisorId: conversation.advisor_id,
          lastMessageAt: conversation.last_message_at,
          lastMessagePreview: conversation.last_message_preview,
          unreadCount: unreadCount ?? 0,
        }
      }))

      return NextResponse.json({ items, schema_ready: true, chatOpenForTesting: isChatOpenForTesting(), message: getChatAccessMessage() })
    }

    const { data, error } = await admin
      .from('chat_conversations')
      .select('id, advisor_id, guest_profile_id, last_message_at, last_message_preview, created_at')
      .eq('guest_profile_id', user.id)
      .order('last_message_at', { ascending: false })

    if (error) {
      if (error.message.includes('relation "public.chat_conversations" does not exist')) {
        return NextResponse.json({ items: [], schema_ready: false, chatOpenForTesting: isChatOpenForTesting(), message: 'Run chat_setup.sql first to enable chat.' })
      }
      throw error
    }

    conversations = (data ?? []) as ConversationRow[]
    const items = await Promise.all(conversations.map(async (conversation) => {
      const { data: advisor } = await admin
        .from('advisors')
        .select('name, slug')
        .eq('id', conversation.advisor_id)
        .maybeSingle()

      const { count: unreadCount } = await admin
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .eq('sender_role', 'advisor')
        .is('read_at', null)

      return {
        id: conversation.id,
        counterpartName: (advisor?.name as string | undefined) ?? 'Advisor',
        counterpartRole: 'advisor',
        counterpartSlug: (advisor?.slug as string | undefined) ?? null,
        advisorId: conversation.advisor_id,
        lastMessageAt: conversation.last_message_at,
        lastMessagePreview: conversation.last_message_preview,
        unreadCount: unreadCount ?? 0,
      }
    }))

    return NextResponse.json({ items, schema_ready: true, chatOpenForTesting: isChatOpenForTesting(), message: getChatAccessMessage() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load chat conversations' },
      { status: 500 }
    )
  }
}
