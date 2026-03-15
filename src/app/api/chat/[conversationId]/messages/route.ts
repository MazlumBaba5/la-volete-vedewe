import { NextResponse } from 'next/server'
import {
  checkChatRateLimit,
  getActor,
  getConversationBlockState,
  isMissingColumnError,
  validateConversationAccess,
} from '@/app/api/chat/_helpers'

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

    let messages: Array<Record<string, unknown>> = []
    const withAttachment = await admin
      .from('chat_messages')
      .select('id, sender_profile_id, sender_role, body, attachment_url, attachment_kind, attachment_cloudinary_id, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (withAttachment.error) {
      if (
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_url') ||
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_kind') ||
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_cloudinary_id')
      ) {
        const legacy = await admin
          .from('chat_messages')
          .select('id, sender_profile_id, sender_role, body, created_at, read_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (legacy.error) {
          throw legacy.error
        }
        messages = ((legacy.data ?? []) as Array<Record<string, unknown>>).map((entry) => ({
          ...entry,
          attachment_url: null,
          attachment_kind: null,
          attachment_cloudinary_id: null,
        }))
      } else {
        throw withAttachment.error
      }
    } else {
      messages = (withAttachment.data ?? []) as Array<Record<string, unknown>>
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
      messages,
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

    const rateLimit = await checkChatRateLimit(user.id, conversationId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.message ?? 'Too many messages. Please slow down.',
          retry_after_seconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    const { data: message, error } = await admin
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_profile_id: user.id,
        sender_role: role,
        body: text,
      }])
      .select('id, sender_profile_id, sender_role, body, attachment_url, attachment_kind, attachment_cloudinary_id, created_at, read_at')
      .single()

    if (error) {
      if (
        isMissingColumnError(error, 'chat_messages', 'attachment_url') ||
        isMissingColumnError(error, 'chat_messages', 'attachment_kind') ||
        isMissingColumnError(error, 'chat_messages', 'attachment_cloudinary_id')
      ) {
        const legacyInsert = await admin
          .from('chat_messages')
          .insert([{
            conversation_id: conversationId,
            sender_profile_id: user.id,
            sender_role: role,
            body: text,
          }])
          .select('id, sender_profile_id, sender_role, body, created_at, read_at')
          .single()

        if (legacyInsert.error) {
          throw legacyInsert.error
        }

        return NextResponse.json({
          ...(legacyInsert.data as Record<string, unknown>),
          attachment_url: null,
          attachment_kind: null,
          attachment_cloudinary_id: null,
        }, { status: 201 })
      }
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
