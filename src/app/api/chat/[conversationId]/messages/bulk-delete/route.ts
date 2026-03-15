import { NextResponse } from 'next/server'
import { refreshConversationSummary, getActor, validateConversationAccess } from '@/app/api/chat/_helpers'
import { isMissingColumnError } from '@/app/api/chat/_helpers'
import cloudinary from '@/lib/cloudinary/config'

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

    const withAttachment = await admin
      .from('chat_messages')
      .select('id, attachment_cloudinary_id, attachment_kind')
      .eq('conversation_id', conversationId)
      .eq('sender_profile_id', user.id)
      .in('id', messageIds)

    let ownedRows: Array<{
      id: string
      attachment_cloudinary_id: string | null
      attachment_kind: 'image' | 'video' | null
    }> = []

    if (withAttachment.error) {
      if (
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_cloudinary_id') ||
        isMissingColumnError(withAttachment.error, 'chat_messages', 'attachment_kind')
      ) {
        const legacy = await admin
          .from('chat_messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('sender_profile_id', user.id)
          .in('id', messageIds)

        if (legacy.error) {
          throw legacy.error
        }

        ownedRows = ((legacy.data ?? []) as Array<{ id: string }>).map((entry) => ({
          id: entry.id,
          attachment_cloudinary_id: null,
          attachment_kind: null,
        }))
      } else {
        throw withAttachment.error
      }
    } else {
      ownedRows = (withAttachment.data ?? []) as Array<{
        id: string
        attachment_cloudinary_id: string | null
        attachment_kind: 'image' | 'video' | null
      }>
    }
    const ownedIds = ownedRows.map((item) => item.id)
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

    for (const entry of ownedRows) {
      if (!entry.attachment_cloudinary_id) continue
      try {
        await cloudinary.uploader.destroy(entry.attachment_cloudinary_id, {
          resource_type: entry.attachment_kind === 'video' ? 'video' : 'image',
        })
      } catch {}
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
