import { NextResponse } from 'next/server'
import { refreshConversationSummary, getActor, validateConversationAccess } from '@/app/api/chat/_helpers'

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
    const body = (await req.json()) as { messageIds?: string[] }
    const messageIds = Array.from(new Set(body.messageIds ?? [])).filter(Boolean)

    if (messageIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one message.' }, { status: 400 })
    }

    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: ownedMessages, error: ownedError } = await admin
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_profile_id', user.id)
      .in('id', messageIds)

    if (ownedError) {
      throw ownedError
    }

    const ownedIds = (ownedMessages ?? []).map((item) => item.id as string)
    if (ownedIds.length === 0) {
      return NextResponse.json({ deletedCount: 0, ignoredCount: messageIds.length })
    }

    const { error: deleteError } = await admin
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('sender_profile_id', user.id)
      .in('id', ownedIds)

    if (deleteError) {
      throw deleteError
    }

    await refreshConversationSummary(conversationId, conversation.created_at)

    return NextResponse.json({
      deletedCount: ownedIds.length,
      ignoredCount: messageIds.length - ownedIds.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete selected messages' },
      { status: 500 }
    )
  }
}
