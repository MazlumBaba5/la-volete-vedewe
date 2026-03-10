import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = [
  'name', 'bio', 'city', 'region', 'age', 'gender',
  'height_cm', 'weight_kg', 'eye_color', 'hair_color', 'ethnicity',
  'phone', 'whatsapp_available', 'telegram_available',
  'availability', 'languages', 'services_tags',
] as const

function makeSlug(name = '') {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'user'}-${Math.random().toString(36).slice(2, 8)}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use admin client to bypass RLS for reads (user's own row)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('advisors')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Create the advisor row on first dashboard load (e.g. when the insert at sign-up failed due to RLS)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Check if row already exists (use admin to bypass RLS SELECT)
    const { data: existing } = await admin
      .from('advisors')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existing) {
      const { data } = await admin.from('advisors').select('*').eq('profile_id', user.id).single()
      return NextResponse.json(data)
    }

    const meta = user.user_metadata ?? {}
    const name = (meta.name as string | undefined)?.trim() || (user.email?.split('@')[0] ?? 'user')
    const city = (meta.city as string | undefined)?.trim() || 'Italy'
    const phone = (meta.phone as string | undefined)?.trim() || null
    const slug = makeSlug(name)

    const { data, error } = await admin
      .from('advisors')
      .insert([{ profile_id: user.id, name, slug, city, phone }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
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
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // Use admin client to bypass RLS for updates (user's own row)
    const admin = createAdminClient()
    const { error } = await admin
      .from('advisors')
      .update(updates)
      .eq('profile_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
