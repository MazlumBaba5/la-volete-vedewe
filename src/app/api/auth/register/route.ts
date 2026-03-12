import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findDutchCity } from '@/lib/netherlands-cities'

type Body = {
  email: string
  password: string
  role: 'guest' | 'advisor'
  name?: string
  advisorCategory?: 'woman' | 'man' | 'couple' | 'shemale'
  city?: string
  region?: string
  phone?: string
}

function makeSlug(name = '') {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'user'}-${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const selectedCity = findDutchCity(body.city)
    if (body.role === 'advisor' && !selectedCity) {
      return NextResponse.json({ error: 'Please select a valid city in the Netherlands' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          role: body.role,
          name: body.name?.trim() || '',
          advisor_category: body.advisorCategory ?? 'woman',
          city: selectedCity?.city ?? '',
          region: selectedCity?.region ?? '',
          phone: body.phone?.trim() || '',
        },
      },
    })

    if (authError) {
      console.error('[register] auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    if (body.role === 'advisor') {
      const name = body.name?.trim() || 'Sofia'
      const city = selectedCity?.city || 'Amsterdam'
      const slug = makeSlug(name)

      const { error } = await supabase.from('advisors').insert([{
        profile_id: userId,
        name,
        slug,
        advisor_category: body.advisorCategory ?? 'woman',
        city,
        region: selectedCity?.region || null,
        phone: body.phone?.trim() || null,
        status: 'active',
      }])

      if (error) {
        // Non-fatal: the dashboard will create the row on first load from user_metadata
        console.warn('[register] advisor insert warning:', error.message)
      }
    } else if (body.role === 'guest') {
      const name = (body.name?.trim() || body.email.split('@')[0] || 'guest')
      const slug = makeSlug(name)

      const { error } = await supabase.from('guests').insert([{
        profile_id: userId,
        name,
        slug,
        city: selectedCity?.city || null,
        region: selectedCity?.region || null,
        phone: body.phone?.trim() || null,
      }])

      if (error) {
        console.warn('[register] guest insert warning:', error.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
