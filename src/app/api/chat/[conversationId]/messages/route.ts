import { NextResponse } from 'next/server'
import { getActor, getConversationBlockState, validateConversationAccess } from '@/app/api/chat/_helpers'

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

    const blockState = await getConversationBlockState(conversation, user.id)

    return NextResponse.json({
      conversationId,
      messages: messages ?? [],
      block: {
        isBlocked: blockState.isBlocked,
        blockedByRole: blockState.block?.blocked_by_role ?? null,
        blockedByMe: blockState.blockedByMe,
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? 'Unable to load chat messages')
        : 'Unable to load chat messages'
    return NextResponse.json(
      { error: errorMessage },
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

    const blockState = await getConversationBlockState(conversation, user.id)
    if (blockState.isBlocked) {
      return NextResponse.json({ error: 'This conversation is blocked.' }, { status: 403 })
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
