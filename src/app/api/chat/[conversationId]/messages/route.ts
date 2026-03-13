import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, role: null }
  }

  const role = user.user_metadata?.role as 'guest' | 'advisor' | undefined
  return { user, role: role ?? null }
}

async function validateConversationAccess(conversationId: string, userId: string, role: 'guest' | 'advisor') {
  const admin = createAdminClient()
  const { data: conversation, error } = await admin
    .from('chat_conversations')
    .select('id, advisor_id, guest_profile_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!conversation) {
    return { admin, conversation: null }
  }

  if (role === 'guest' && conversation.guest_profile_id !== userId) {
    return { admin, conversation: null }
  }

  if (role === 'advisor') {
    const { data: advisor } = await admin
      .from('advisors')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (!advisor?.id || advisor.id !== conversation.advisor_id) {
      return { admin, conversation: null }
    }
  }

  return { admin, conversation }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { user, role } = await getActor()
    if (!user || (role !== 'guest' && role !== 'advisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: messages, error } = await admin
      .from('chat_messages')
      .select('id, sender_profile_id, sender_role, body, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    const unreadSenderRole = role === 'guest' ? 'advisor' : 'guest'
    await admin
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_role', unreadSenderRole)
      .is('read_at', null)

    return NextResponse.json({
      conversationId,
      messages: messages ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load chat messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { user, role } = await getActor()
    if (!user || (role !== 'guest' && role !== 'advisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const body = (await req.json()) as { body?: string }
    const text = body.body?.trim() ?? ''
    if (!text) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: message, error } = await admin
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_profile_id: user.id,
        sender_role: role,
        body: text,
      }])
      .select('id, sender_profile_id, sender_role, body, created_at, read_at')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send chat message' },
      { status: 500 }
    )
  }
}
