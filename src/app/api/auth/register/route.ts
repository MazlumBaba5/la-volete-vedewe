import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  deriveAvailability,
  isAdvisorEthnicity,
  isSexOrientation,
  sanitizeAvailabilitySlots,
  sanitizeDateTypes,
  sanitizeRates,
  sanitizeServices,
} from '@/lib/advisor-profile-options'
import { isValidGuestUsername, normalizeGuestUsername } from '@/lib/guest-auth'
import { findDutchCity } from '@/lib/netherlands-cities'

type Body = {
  email: string
  password: string
  role: 'guest' | 'advisor'
  name?: string
  advisorCategory?: 'woman' | 'man' | 'couple' | 'shemale'
  age?: number
  gender?: 'female' | 'male' | 'shemale'
  ethnicity?: string
  city?: string
  region?: string
  bio?: string
  sexualOrientation?: 'Straight' | 'Lesbian' | 'Gay' | 'Bisex'
  dateTypes?: string[]
  servicesTags?: string[]
  incallRates?: unknown[]
  outcallRates?: unknown[]
  availabilitySlots?: string[]
  phone?: string
  whatsappAvailable?: boolean
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

    if (!body.password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const selectedCity = findDutchCity(body.city)
    const dateTypes = sanitizeDateTypes(body.dateTypes)
    const servicesTags = sanitizeServices(body.servicesTags)
    const availabilitySlots = sanitizeAvailabilitySlots(body.availabilitySlots)
    const incallRates = sanitizeRates(body.incallRates, 'incall')
    const outcallRates = sanitizeRates(body.outcallRates, 'outcall')

    if (body.role === 'advisor') {
      if (!body.email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      if (!selectedCity) {
        return NextResponse.json({ error: 'Please select a valid city in the Netherlands' }, { status: 400 })
      }

      if (!Number.isInteger(body.age) || Number(body.age) < 18 || Number(body.age) > 80) {
        return NextResponse.json({ error: 'Please enter a valid age between 18 and 80' }, { status: 400 })
      }

      if (!body.ethnicity || !isAdvisorEthnicity(body.ethnicity)) {
        return NextResponse.json({ error: 'Please select a valid ethnicity' }, { status: 400 })
      }

      if (!body.gender || !['female', 'male', 'shemale'].includes(body.gender)) {
        return NextResponse.json({ error: 'Please select a valid gender' }, { status: 400 })
      }

      if (!body.bio?.trim()) {
        return NextResponse.json({ error: 'Profile description is required' }, { status: 400 })
      }

      if (!body.sexualOrientation || !isSexOrientation(body.sexualOrientation)) {
        return NextResponse.json({ error: 'Please select a valid sex orientation' }, { status: 400 })
      }

      if (dateTypes.length === 0) {
        return NextResponse.json({ error: 'Select at least one type of date' }, { status: 400 })
      }

      if (servicesTags.length === 0) {
        return NextResponse.json({ error: 'Select at least one available service' }, { status: 400 })
      }

      if (availabilitySlots.length === 0) {
        return NextResponse.json({ error: 'Select at least one availability slot' }, { status: 400 })
      }

      if (dateTypes.includes('Incall') && incallRates.length === 0) {
        return NextResponse.json({ error: 'Add at least one InCall price' }, { status: 400 })
      }

      if (dateTypes.includes('Outcall') && outcallRates.length === 0) {
        return NextResponse.json({ error: 'Add at least one OutCall price' }, { status: 400 })
      }
    } else {
      if (!body.name?.trim() || !isValidGuestUsername(body.name)) {
        return NextResponse.json({ error: 'Choose a username with at least 3 characters' }, { status: 400 })
      }
    }

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email as string,
      password: body.password,
      options: {
        data: {
          role: body.role,
          name: body.role === 'guest' ? normalizeGuestUsername(body.name?.trim() || '') : body.name?.trim() || '',
          username: body.role === 'guest' ? normalizeGuestUsername(body.name?.trim() || '') : '',
          advisor_category: body.advisorCategory ?? 'woman',
          age: body.age ?? null,
          gender: body.gender ?? 'female',
          ethnicity: body.ethnicity?.trim() ?? '',
          city: selectedCity?.city ?? '',
          region: selectedCity?.region ?? '',
          bio: body.bio?.trim() ?? '',
          sexual_orientation: body.sexualOrientation ?? '',
          date_types: dateTypes,
          services_tags: servicesTags,
          incall_rates: incallRates,
          outcall_rates: outcallRates,
          availability_slots: availabilitySlots,
          phone: body.phone?.trim() || '',
          whatsapp_available: Boolean(body.whatsappAvailable),
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
        age: body.age ?? null,
        gender: body.gender ?? 'female',
        ethnicity: body.ethnicity?.trim() || null,
        bio: body.bio?.trim() || null,
        sexual_orientation: body.sexualOrientation ?? null,
        date_types: dateTypes,
        services_tags: servicesTags,
        incall_rates: incallRates,
        outcall_rates: outcallRates,
        availability_slots: availabilitySlots,
        availability: deriveAvailability(dateTypes),
        phone: body.phone?.trim() || null,
        whatsapp_available: Boolean(body.whatsappAvailable),
        status: 'pending',
      }])

      if (error) {
        // Non-fatal: the dashboard will create the row on first load from user_metadata
        console.warn('[register] advisor insert warning:', error.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
