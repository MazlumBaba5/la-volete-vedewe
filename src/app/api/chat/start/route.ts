import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { canOpenChatWithAdvisor } from '@/lib/chat'
import { isMissingTableError } from '@/app/api/chat/_helpers'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = user.user_metadata?.role as 'guest' | 'advisor' | undefined
    if (role !== 'guest' && role !== 'advisor') {
      return NextResponse.json({ error: 'Only registered client and advisor accounts can use chat' }, { status: 403 })
    }

    const body = (await req.json()) as { advisorId?: string }
    if (!body.advisorId) {
      return NextResponse.json({ error: 'Missing advisor id' }, { status: 400 })
    }

    const allowed = await canOpenChatWithAdvisor({ userId: user.id, role }, body.advisorId)
    if (!allowed) {
      return NextResponse.json({ error: 'Chat is not available for this account yet.' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, profile_id')
      .eq('id', body.advisorId)
      .maybeSingle()

    if (advisorError) {
      throw advisorError
    }

    if (!advisor?.id) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    const guestProfileId = user.id
    if (role === 'advisor') {
      if (advisor.profile_id !== user.id) {
        return NextResponse.json({ error: 'Advisors can only open their own inbox from the dashboard.' }, { status: 403 })
      }

      return NextResponse.json({ error: 'Use the advisor dashboard inbox to answer client conversations.' }, { status: 400 })
    }

    const { data: block, error: blockError } = await admin
      .from('chat_blocks')
      .select('id')
      .eq('advisor_id', body.advisorId)
      .eq('guest_profile_id', guestProfileId)
      .maybeSingle()

    if (blockError && !isMissingTableError(blockError, 'public.chat_blocks') && !isMissingTableError(blockError, 'chat_blocks')) {
      throw blockError
    }
    if (block?.id) {
      return NextResponse.json({ error: 'You cannot start this chat because one participant blocked the conversation.' }, { status: 403 })
    }

    const { data: existing, error: lookupError } = await admin
      .from('chat_conversations')
      .select('id')
      .eq('advisor_id', body.advisorId)
      .eq('guest_profile_id', guestProfileId)
      .maybeSingle()

    if (lookupError) {
      if (lookupError.message.includes('relation "public.chat_conversations" does not exist')) {
        return NextResponse.json({ error: 'Run chat_setup.sql first to enable chat.' }, { status: 400 })
      }
      throw lookupError
    }

    if (existing?.id) {
      return NextResponse.json({ conversationId: existing.id })
    }

    const { data: conversation, error: insertError } = await admin
      .from('chat_conversations')
      .insert([{
        advisor_id: body.advisorId,
        guest_profile_id: guestProfileId,
      }])
      .select('id')
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start chat conversation' },
      { status: 500 }
    )
  }
}
