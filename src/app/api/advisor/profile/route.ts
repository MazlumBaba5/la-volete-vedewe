import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  deriveAvailability,
  isAdvisorEthnicity,
  isSexOrientation,
  sanitizeAvailabilitySlots,
  sanitizeDateTypes,
  sanitizeRates,
  sanitizeServices,
} from '@/lib/advisor-profile-options'
import { findDutchCity } from '@/lib/netherlands-cities'

const ALLOWED_FIELDS = [
  'name', 'bio', 'city', 'region', 'advisor_category', 'age', 'gender',
  'height_cm', 'weight_kg', 'eye_color', 'hair_color', 'ethnicity',
  'phone', 'whatsapp_available', 'telegram_available',
  'availability', 'languages', 'services_tags', 'sexual_orientation',
  'date_types', 'incall_rates', 'outcall_rates', 'availability_slots',
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
    const metaCity = findDutchCity(meta.city as string | undefined)
    const city = metaCity?.city || 'Amsterdam'
    const phone = (meta.phone as string | undefined)?.trim() || null
    const advisorCategory = (meta.advisor_category as string | undefined)?.trim() || 'woman'
    const dateTypes = sanitizeDateTypes(meta.date_types as string[] | undefined)
    const incallRates = sanitizeRates(meta.incall_rates as unknown[] | undefined, 'incall')
    const outcallRates = sanitizeRates(meta.outcall_rates as unknown[] | undefined, 'outcall')
    const slug = makeSlug(name)

    const { data, error } = await admin
      .from('advisors')
      .insert([{
        profile_id: user.id,
        name,
        slug,
        city,
        region: metaCity?.region || null,
        bio: (meta.bio as string | undefined)?.trim() || null,
        age: typeof meta.age === 'number' ? meta.age : null,
        gender: (meta.gender as string | undefined) ?? 'female',
        ethnicity: (meta.ethnicity as string | undefined)?.trim() || null,
        sexual_orientation: (meta.sexual_orientation as string | undefined)?.trim() || null,
        date_types: dateTypes,
        services_tags: sanitizeServices(meta.services_tags as string[] | undefined),
        incall_rates: incallRates,
        outcall_rates: outcallRates,
        availability_slots: sanitizeAvailabilitySlots(meta.availability_slots as string[] | undefined),
        availability: deriveAvailability(dateTypes),
        phone,
        advisor_category: advisorCategory,
      }])
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

    const admin = createAdminClient()
    const { data: current, error: currentError } = await admin
      .from('advisors')
      .select('age, ethnicity, gender')
      .eq('profile_id', user.id)
      .single()

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 })

    if ('city' in updates) {
      const selectedCity = findDutchCity(updates.city as string | undefined)
      if (!selectedCity) {
        return NextResponse.json({ error: 'Please select a valid city in the Netherlands' }, { status: 400 })
      }
      updates.city = selectedCity.city
      updates.region = selectedCity.region
    } else if ('region' in updates) {
      delete updates.region
    }

    if ('age' in updates) {
      const age = updates.age
      if (!Number.isInteger(age) || Number(age) < 18 || Number(age) > 80) {
        return NextResponse.json({ error: 'Please enter a valid age between 18 and 80' }, { status: 400 })
      }
      if (current.age !== null && current.age !== age) {
        return NextResponse.json({ error: 'Age cannot be changed once saved' }, { status: 400 })
      }
    }

    if ('ethnicity' in updates) {
      const ethnicity = String(updates.ethnicity ?? '').trim()
      if (!isAdvisorEthnicity(ethnicity)) {
        return NextResponse.json({ error: 'Please select a valid ethnicity' }, { status: 400 })
      }
      if (current.ethnicity !== null && current.ethnicity !== ethnicity) {
        return NextResponse.json({ error: 'Ethnicity cannot be changed once saved' }, { status: 400 })
      }
      updates.ethnicity = ethnicity
    }

    if ('gender' in updates) {
      const gender = String(updates.gender ?? '').trim()
      if (!['female', 'male', 'shemale'].includes(gender)) {
        return NextResponse.json({ error: 'Please select a valid gender' }, { status: 400 })
      }
      if (current.gender !== null && current.gender !== gender) {
        return NextResponse.json({ error: 'Gender cannot be changed once saved' }, { status: 400 })
      }
      updates.gender = gender
    }

    if ('sexual_orientation' in updates) {
      const sexualOrientation = String(updates.sexual_orientation ?? '').trim()
      if (!isSexOrientation(sexualOrientation)) {
        return NextResponse.json({ error: 'Please select a valid sex orientation' }, { status: 400 })
      }
      updates.sexual_orientation = sexualOrientation
    }

    const dateTypes = 'date_types' in updates ? sanitizeDateTypes(updates.date_types) : null
    if ('date_types' in updates) {
      if (dateTypes!.length === 0) {
        return NextResponse.json({ error: 'Select at least one type of date' }, { status: 400 })
      }
      updates.date_types = dateTypes
      updates.availability = deriveAvailability(dateTypes!)
    }

    if ('services_tags' in updates) {
      const services = sanitizeServices(updates.services_tags)
      if (services.length === 0) {
        return NextResponse.json({ error: 'Select at least one available service' }, { status: 400 })
      }
      updates.services_tags = services
    }

    if ('availability_slots' in updates) {
      const slots = sanitizeAvailabilitySlots(updates.availability_slots)
      if (slots.length === 0) {
        return NextResponse.json({ error: 'Select at least one availability slot' }, { status: 400 })
      }
      updates.availability_slots = slots
    }

    if ('incall_rates' in updates) {
      updates.incall_rates = sanitizeRates(updates.incall_rates, 'incall')
    }

    if ('outcall_rates' in updates) {
      updates.outcall_rates = sanitizeRates(updates.outcall_rates, 'outcall')
    }

    const nextDateTypes = dateTypes ?? sanitizeDateTypes(body.date_types)
    const nextIncallRates = 'incall_rates' in updates ? (updates.incall_rates as unknown[]) : sanitizeRates(body.incall_rates, 'incall')
    const nextOutcallRates = 'outcall_rates' in updates ? (updates.outcall_rates as unknown[]) : sanitizeRates(body.outcall_rates, 'outcall')

    if (nextDateTypes.includes('Incall') && nextIncallRates.length === 0) {
      return NextResponse.json({ error: 'Add at least one InCall price' }, { status: 400 })
    }

    if (nextDateTypes.includes('Outcall') && nextOutcallRates.length === 0) {
      return NextResponse.json({ error: 'Add at least one OutCall price' }, { status: 400 })
    }

    if ('bio' in updates && !String(updates.bio ?? '').trim()) {
      return NextResponse.json({ error: 'Profile description is required' }, { status: 400 })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

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
