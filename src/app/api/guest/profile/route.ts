import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidGuestUsername, normalizeGuestUsername } from '@/lib/guest-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const username =
      (user.user_metadata?.username as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split('@')[0] ||
      'guest'

    return NextResponse.json({
      profile_id: user.id,
      name: username,
      role: user.user_metadata?.role ?? 'guest',
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as Record<string, unknown>
    const requestedName = typeof body.name === 'string' ? body.name : ''

    if (!isValidGuestUsername(requestedName)) {
      return NextResponse.json({ error: 'Choose a username with at least 3 characters' }, { status: 400 })
    }

    const username = normalizeGuestUsername(requestedName)
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        name: username,
        username,
      },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
