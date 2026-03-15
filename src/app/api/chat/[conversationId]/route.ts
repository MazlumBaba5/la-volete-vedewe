import { NextResponse } from 'next/server'
import { getActor, validateConversationAccess } from '@/app/api/chat/_helpers'
import { isMissingColumnError } from '@/app/api/chat/_helpers'
import cloudinary from '@/lib/cloudinary/config'

export async function DELETE(
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

    const withAttachment = await admin
      .from('chat_messages')
      .select('attachment_cloudinary_id, attachment_kind')
      .eq('conversation_id', conversationId)
      .not('attachment_cloudinary_id', 'is', null)

    let mediaRows: Array<{ attachment_cloudinary_id: string; attachment_kind: 'image' | 'video' | null }> = []
    if (withAttachment.error) {
      if (
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_cloudinary_id') ||
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_kind')
      ) {
        mediaRows = []
      } else {
        throw withAttachment.error
      }
    } else {
      mediaRows = (withAttachment.data ?? []) as Array<{ attachment_cloudinary_id: string; attachment_kind: 'image' | 'video' | null }>
    }

    const { error } = await admin
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      throw error
    }

    for (const row of mediaRows) {
      try {
        await cloudinary.uploader.destroy(row.attachment_cloudinary_id, {
          resource_type: row.attachment_kind === 'video' ? 'video' : 'image',
        })
      } catch {}
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete conversation' },
      { status: 500 }
    )
  }
}
