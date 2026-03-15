import { NextResponse } from 'next/server'
import { getActor, validateConversationAccess } from '@/app/api/chat/_helpers'
import { isMissingTableError } from '@/app/api/chat/_helpers'

export async function POST(
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

    const { error } = await admin
      .from('chat_blocks')
      .upsert([{
        advisor_id: conversation.advisor_id,
        guest_profile_id: conversation.guest_profile_id,
        blocked_by_profile_id: user.id,
        blocked_by_role: role,
        created_at: new Date().toISOString(),
      }], { onConflict: 'advisor_id,guest_profile_id' })

    if (error) {
      if (isMissingTableError(error, 'public.chat_blocks') || isMissingTableError(error, 'chat_blocks')) {
        return NextResponse.json({ error: 'Run chat_setup.sql again to enable block user.' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to block user' },
      { status: 500 }
    )
  }
}

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

    const { error } = await admin
      .from('chat_blocks')
      .delete()
      .eq('advisor_id', conversation.advisor_id)
      .eq('guest_profile_id', conversation.guest_profile_id)
      .eq('blocked_by_profile_id', user.id)

    if (error) {
      if (isMissingTableError(error, 'public.chat_blocks') || isMissingTableError(error, 'chat_blocks')) {
        return NextResponse.json({ error: 'Run chat_setup.sql again to enable block user.' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to unblock user' },
      { status: 500 }
    )
  }
}
