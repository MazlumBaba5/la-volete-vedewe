import { NextResponse } from 'next/server'
import { getActor, refreshConversationSummary, validateConversationAccess } from '@/app/api/chat/_helpers'
import { isMissingColumnError } from '@/app/api/chat/_helpers'
import cloudinary from '@/lib/cloudinary/config'

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

    let currentMessage: {
      id: string
      sender_profile_id: string
      attachment_cloudinary_id: string | null
      attachment_kind: 'image' | 'video' | null
    } | null = null

    const withAttachment = await admin
      .from('chat_messages')
      .select('id, sender_profile_id, attachment_cloudinary_id, attachment_kind')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (withAttachment.error) {
      if (
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_cloudinary_id') ||
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_kind')
      ) {
        const legacy = await admin
          .from('chat_messages')
          .select('id, sender_profile_id')
          .eq('id', messageId)
          .eq('conversation_id', conversationId)
          .maybeSingle()

        if (legacy.error) {
          throw legacy.error
        }

        currentMessage = (legacy.data as { id: string; sender_profile_id: string } | null)
          ? {
              ...(legacy.data as { id: string; sender_profile_id: string }),
              attachment_cloudinary_id: null,
              attachment_kind: null,
            }
          : null
      } else {
        throw withAttachment.error
      }
    } else {
      currentMessage = withAttachment.data as {
        id: string
        sender_profile_id: string
        attachment_cloudinary_id: string | null
        attachment_kind: 'image' | 'video' | null
      } | null
    }

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

    if (currentMessage.attachment_cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(currentMessage.attachment_cloudinary_id, {
          resource_type: currentMessage.attachment_kind === 'video' ? 'video' : 'image',
        })
      } catch {}
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
