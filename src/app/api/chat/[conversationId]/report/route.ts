import { NextResponse } from 'next/server'
import { getActor, isMissingTableError, validateConversationAccess } from '@/app/api/chat/_helpers'

const ALLOWED_REASONS = new Set(['spam', 'abuse', 'scam', 'fake', 'other'])

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { user, role } = await getActor()
    if (!user || (role !== 'guest' && role !== 'advisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (role !== 'advisor') {
      return NextResponse.json({ error: 'Only advisors can submit chat reports.' }, { status: 403 })
    }

    const { conversationId } = await params
    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const payload = (await req.json()) as { reason?: string; details?: string }
    const reason = payload.reason?.trim().toLowerCase() ?? ''
    const details = payload.details?.trim() ?? ''

    if (!ALLOWED_REASONS.has(reason)) {
      return NextResponse.json({ error: 'Invalid report reason.' }, { status: 400 })
    }

    if (details.length > 600) {
      return NextResponse.json({ error: 'Report details are too long (max 600 chars).' }, { status: 400 })
    }

    const { data: existingOpen, error: existingError } = await admin
      .from('chat_reports')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('reporter_profile_id', user.id)
      .in('status', ['open', 'reviewing'])
      .limit(1)
      .maybeSingle()

    if (existingError) {
      if (isMissingTableError(existingError, 'public.chat_reports') || isMissingTableError(existingError, 'chat_reports')) {
        return NextResponse.json({ error: 'Run chat_setup.sql again to enable reports.' }, { status: 400 })
      }
      throw existingError
    }

    if (existingOpen?.id) {
      return NextResponse.json({ error: 'You already have an open report for this conversation.' }, { status: 409 })
    }

    const { error: insertError } = await admin
      .from('chat_reports')
      .insert([{
        conversation_id: conversationId,
        advisor_id: conversation.advisor_id,
        guest_profile_id: conversation.guest_profile_id,
        reporter_profile_id: user.id,
        reporter_role: 'advisor',
        reason,
        details: details || null,
      }])

    if (insertError) {
      if (isMissingTableError(insertError, 'public.chat_reports') || isMissingTableError(insertError, 'chat_reports')) {
        return NextResponse.json({ error: 'Run chat_setup.sql again to enable reports.' }, { status: 400 })
      }
      throw insertError
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit report' },
      { status: 500 }
    )
  }
}
