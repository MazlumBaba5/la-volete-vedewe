import { NextResponse } from 'next/server'
import { getActor, refreshConversationSummary, validateConversationAccess } from '@/app/api/chat/_helpers'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const { user, role } = await getActor()
    if (!user || (role !== 'guest' && role !== 'advisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, messageId } = await params
    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: message, error: messageError } = await admin
      .from('chat_messages')
      .select('id, sender_profile_id')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (messageError) {
      throw messageError
    }

    const currentMessage = message as { id: string; sender_profile_id: string } | null
    if (!currentMessage?.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (currentMessage.sender_profile_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own messages.' }, { status: 403 })
    }

    const { error: deleteError } = await admin
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('conversation_id', conversationId)

    if (deleteError) {
      throw deleteError
    }

    await refreshConversationSummary(conversationId, conversation.created_at)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete message' },
      { status: 500 }
    )
  }
}
