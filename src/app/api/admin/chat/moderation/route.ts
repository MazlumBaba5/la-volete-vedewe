import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

type AdvisorMapValue = { name: string; slug: string | null }
type UserMapValue = { name: string }

function getGuestDisplayName(metadata: Record<string, unknown> | undefined, email?: string | null) {
  const username = typeof metadata?.username === 'string' ? metadata.username : ''
  const name = typeof metadata?.name === 'string' ? metadata.name : ''
  if (username.trim()) return username
  if (name.trim()) return name
  if (email && email.includes('@')) return email.split('@')[0]
  return 'Client'
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const [{ data: reportRows, error: reportsError }, { data: blockRows, error: blocksError }] = await Promise.all([
      admin
        .from('chat_reports')
        .select('id, conversation_id, advisor_id, guest_profile_id, reporter_profile_id, reporter_role, reason, details, status, admin_note, reviewed_at, reviewed_by, created_at')
        .order('created_at', { ascending: false }),
      admin
        .from('chat_blocks')
        .select('id, advisor_id, guest_profile_id, blocked_by_profile_id, blocked_by_role, created_at')
        .order('created_at', { ascending: false }),
    ])

    if (reportsError) {
      if (
        reportsError.message.includes('relation "public.chat_reports" does not exist')
        || reportsError.message.includes('relation "chat_reports" does not exist')
      ) {
        return NextResponse.json({
          schema_ready: false,
          message: 'Run chat_setup.sql first to enable chat moderation reports.',
          reports: [],
          blocks: [],
        })
      }
      throw reportsError
    }

    if (blocksError) {
      if (
        blocksError.message.includes('relation "public.chat_blocks" does not exist')
        || blocksError.message.includes('relation "chat_blocks" does not exist')
      ) {
        return NextResponse.json({
          schema_ready: false,
          message: 'Run chat_setup.sql first to enable chat blocklist review.',
          reports: [],
          blocks: [],
        })
      }
      throw blocksError
    }

    const advisorIds = Array.from(
      new Set(
        [
          ...(reportRows ?? []).map((row) => String(row.advisor_id)),
          ...(blockRows ?? []).map((row) => String(row.advisor_id)),
        ]
      )
    )

    const profileIds = Array.from(
      new Set(
        [
          ...(reportRows ?? []).map((row) => String(row.guest_profile_id)),
          ...(reportRows ?? []).map((row) => String(row.reporter_profile_id)),
          ...(blockRows ?? []).map((row) => String(row.guest_profile_id)),
          ...(blockRows ?? []).map((row) => String(row.blocked_by_profile_id)),
        ]
      )
    )

    const advisorMap = new Map<string, AdvisorMapValue>()
    if (advisorIds.length > 0) {
      const { data: advisors } = await admin
        .from('advisors')
        .select('id, name, slug')
        .in('id', advisorIds)

      for (const advisor of advisors ?? []) {
        advisorMap.set(String(advisor.id), {
          name: String(advisor.name ?? 'Advisor'),
          slug: advisor.slug ? String(advisor.slug) : null,
        })
      }
    }

    const userMap = new Map<string, UserMapValue>()
    for (const profileId of profileIds) {
      const { data: userData, error } = await admin.auth.admin.getUserById(profileId)
      if (error || !userData.user) continue
      userMap.set(profileId, {
        name: getGuestDisplayName(
          (userData.user.user_metadata as Record<string, unknown> | undefined),
          userData.user.email
        ),
      })
    }

    return NextResponse.json({
      schema_ready: true,
      reports: (reportRows ?? []).map((row) => {
        const advisorInfo = advisorMap.get(String(row.advisor_id))
        return {
          id: String(row.id),
          conversation_id: String(row.conversation_id),
          advisor_id: String(row.advisor_id),
          advisor_name: advisorInfo?.name ?? 'Advisor',
          advisor_slug: advisorInfo?.slug ?? null,
          guest_profile_id: String(row.guest_profile_id),
          guest_name: userMap.get(String(row.guest_profile_id))?.name ?? 'Client',
          reporter_profile_id: String(row.reporter_profile_id),
          reporter_name: userMap.get(String(row.reporter_profile_id))?.name ?? 'User',
          reporter_role: String(row.reporter_role),
          reason: String(row.reason),
          details: row.details ? String(row.details) : null,
          status: String(row.status),
          admin_note: row.admin_note ? String(row.admin_note) : null,
          reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
          reviewed_by: row.reviewed_by ? String(row.reviewed_by) : null,
          created_at: String(row.created_at),
        }
      }),
      blocks: (blockRows ?? []).map((row) => {
        const advisorInfo = advisorMap.get(String(row.advisor_id))
        const blockedById = String(row.blocked_by_profile_id)
        return {
          id: String(row.id),
          advisor_id: String(row.advisor_id),
          advisor_name: advisorInfo?.name ?? 'Advisor',
          advisor_slug: advisorInfo?.slug ?? null,
          guest_profile_id: String(row.guest_profile_id),
          guest_name: userMap.get(String(row.guest_profile_id))?.name ?? 'Client',
          blocked_by_profile_id: blockedById,
          blocked_by_name: userMap.get(blockedById)?.name ?? 'User',
          blocked_by_role: String(row.blocked_by_role),
          created_at: String(row.created_at),
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

