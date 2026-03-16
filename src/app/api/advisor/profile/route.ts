import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  deriveAvailability,
  isAdvisorEyeColor,
  isAdvisorEthnicity,
  isAdvisorHairColor,
  isSexOrientation,
  sanitizeAdvisorHeight,
  sanitizeAvailabilitySlots,
  sanitizeDateTypes,
  sanitizeRates,
  sanitizeServices,
} from '@/lib/advisor-profile-options'
import { findDutchCity } from '@/lib/netherlands-cities'
import { invalidateMarketplaceCache } from '@/lib/marketplace-cache'

const ALLOWED_FIELDS = [
  'name', 'bio', 'city', 'region', 'age', 'gender',
  'height_cm', 'weight_kg', 'eye_color', 'hair_color', 'ethnicity',
  'phone', 'whatsapp_available', 'telegram_available',
  'availability', 'languages', 'services_tags', 'sexual_orientation',
  'date_types', 'incall_rates', 'outcall_rates', 'availability_slots', 'reviews_enabled',
] as const

type AdvisorGender = 'female' | 'male' | 'shemale' | 'couple'
type AdvisorDbGender = AdvisorGender | 'trans' | 'other'
type AdvisorCategory = 'woman' | 'man' | 'couple' | 'shemale'

function makeSlug(name = '') {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'user'}-${Math.random().toString(36).slice(2, 8)}`
}

function categoryFromGender(gender: AdvisorGender): AdvisorCategory {
  if (gender === 'male') return 'man'
  if (gender === 'shemale') return 'shemale'
  if (gender === 'couple') return 'couple'
  return 'woman'
}

function normalizeAdvisorGender(value: unknown): AdvisorGender | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'female' || normalized === 'male' || normalized === 'couple') {
    return normalized
  }
  if (normalized === 'shemale' || normalized === 'trans' || normalized === 'other') {
    return 'shemale'
  }
  return null
}

function getDbGenderCandidates(gender: AdvisorGender): AdvisorDbGender[] {
  if (gender === 'shemale') return ['shemale', 'trans', 'other', 'female', 'male']
  if (gender === 'couple') return ['couple', 'female', 'male']
  if (gender === 'male') return ['male', 'female']
  return ['female', 'male']
}

function isInvalidGenderEnumError(message?: string) {
  return Boolean(message?.includes('invalid input value for enum gender_type'))
}

function isDuplicateAdvisorProfileIdError(message?: string) {
  return Boolean(
    message?.includes('duplicate key value violates unique constraint "advisors_profile_id_key"') ||
    (message?.includes('duplicate key value violates unique constraint') && message?.includes('profile_id'))
  )
}

async function getAdvisorReviewStats(admin: ReturnType<typeof createAdminClient>, advisorId: string) {
  const { data: reviews, error } = await admin
    .from('reviews')
    .select('rating')
    .eq('advisor_id', advisorId)
    .eq('is_visible', true)

  if (error) {
    return { review_count: 0, review_average: 0 }
  }

  const reviewCount = reviews?.length ?? 0
  const reviewAverage = reviewCount
    ? Number(((reviews ?? []).reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviewCount).toFixed(1))
    : 0

  return {
    review_count: reviewCount,
    review_average: reviewAverage,
  }
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
    const reviewStats = await getAdvisorReviewStats(admin, data.id as string)
    return NextResponse.json({
      ...data,
      gender: normalizeAdvisorGender(data.gender) ?? 'female',
      ...reviewStats,
    })
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
      const reviewStats = await getAdvisorReviewStats(admin, data.id as string)
      return NextResponse.json({
        ...data,
        gender: normalizeAdvisorGender(data.gender) ?? 'female',
        ...reviewStats,
      })
    }

    const meta = user.user_metadata ?? {}
    const name = (meta.name as string | undefined)?.trim() || (user.email?.split('@')[0] ?? 'user')
    const metaCity = findDutchCity(meta.city as string | undefined)
    const city = metaCity?.city || 'Amsterdam'
    const phone = (meta.phone as string | undefined)?.trim() || null
    const whatsappAvailable = Boolean(meta.whatsapp_available)
    const rawGender = (meta.gender as string | undefined)?.trim()
    const nextGender = normalizeAdvisorGender(rawGender) ?? 'female'
    const advisorCategory = categoryFromGender(nextGender)
    const dateTypes = sanitizeDateTypes(meta.date_types as string[] | undefined)
    const incallRates = sanitizeRates(meta.incall_rates as unknown[] | undefined, 'incall')
    const outcallRates = sanitizeRates(meta.outcall_rates as unknown[] | undefined, 'outcall')
    const heightCm = sanitizeAdvisorHeight(meta.height_cm ?? meta.heightCm)
    const hairColorRaw = typeof meta.hair_color === 'string'
      ? meta.hair_color.trim()
      : typeof meta.hairColor === 'string'
      ? meta.hairColor.trim()
      : ''
    const eyeColorRaw = typeof meta.eye_color === 'string'
      ? meta.eye_color.trim()
      : typeof meta.eyeColor === 'string'
      ? meta.eyeColor.trim()
      : ''
    const hairColor = hairColorRaw && isAdvisorHairColor(hairColorRaw) ? hairColorRaw : null
    const eyeColor = eyeColorRaw && isAdvisorEyeColor(eyeColorRaw) ? eyeColorRaw : null
    const slug = makeSlug(name)

    const advisorInsertBase = {
      profile_id: user.id,
      name,
      slug,
      city,
      region: metaCity?.region || null,
      bio: (meta.bio as string | undefined)?.trim() || null,
      age: typeof meta.age === 'number' ? meta.age : null,
      height_cm: heightCm,
      hair_color: hairColor,
      eye_color: eyeColor,
      ethnicity: (meta.ethnicity as string | undefined)?.trim() || null,
      sexual_orientation: (meta.sexual_orientation as string | undefined)?.trim() || null,
      date_types: dateTypes,
      services_tags: sanitizeServices(meta.services_tags as string[] | undefined),
      incall_rates: incallRates,
      outcall_rates: outcallRates,
      availability_slots: sanitizeAvailabilitySlots(meta.availability_slots as string[] | undefined),
      availability: deriveAvailability(dateTypes),
      phone,
      whatsapp_available: whatsappAvailable,
      advisor_category: advisorCategory,
    }

    let data: Record<string, unknown> | null = null
    let error: { message?: string } | null = null
    const genderCandidates = getDbGenderCandidates(nextGender)

    for (let index = 0; index < genderCandidates.length; index += 1) {
      const dbGender = genderCandidates[index]
      const attempt = await admin
        .from('advisors')
        .insert([{ ...advisorInsertBase, gender: dbGender }])
        .select()
        .single()

      if (!attempt.error && attempt.data) {
        data = attempt.data as Record<string, unknown>
        error = null
        break
      }

      error = attempt.error as { message?: string } | null
      if (isDuplicateAdvisorProfileIdError(error?.message)) {
        const existingAttempt = await admin
          .from('advisors')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!existingAttempt.error && existingAttempt.data) {
          data = existingAttempt.data as Record<string, unknown>
          error = null
        } else {
          error = (existingAttempt.error as { message?: string } | null) ?? error
        }
        break
      }

      const canRetry =
        index < genderCandidates.length - 1 &&
        isInvalidGenderEnumError(error?.message)
      if (!canRetry) break
    }

    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Unable to create advisor profile' }, { status: 500 })
    invalidateMarketplaceCache()
    return NextResponse.json({
      ...data,
      gender: normalizeAdvisorGender(data.gender) ?? 'female',
      review_count: 0,
      review_average: 0,
    }, { status: 201 })
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
      .select('age, ethnicity, gender, advisor_category')
      .eq('profile_id', user.id)
      .single()

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 })
    const currentNormalizedGender = normalizeAdvisorGender(current.gender)

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

    if ('height_cm' in updates) {
      const rawHeight = updates.height_cm
      const isEmptyHeight = rawHeight === null || rawHeight === ''
      const heightCm = isEmptyHeight ? null : sanitizeAdvisorHeight(rawHeight)
      if (!isEmptyHeight && heightCm === null) {
        return NextResponse.json({ error: 'Please select a valid height between 140 and 210 cm' }, { status: 400 })
      }
      updates.height_cm = heightCm
    }

    if ('hair_color' in updates) {
      const hairColor = String(updates.hair_color ?? '').trim()
      if (!hairColor) {
        updates.hair_color = null
      } else if (!isAdvisorHairColor(hairColor)) {
        return NextResponse.json({ error: 'Please select a valid hair color' }, { status: 400 })
      } else {
        updates.hair_color = hairColor
      }
    }

    if ('eye_color' in updates) {
      const eyeColor = String(updates.eye_color ?? '').trim()
      if (!eyeColor) {
        updates.eye_color = null
      } else if (!isAdvisorEyeColor(eyeColor)) {
        return NextResponse.json({ error: 'Please select a valid eye color' }, { status: 400 })
      } else {
        updates.eye_color = eyeColor
      }
    }

    if ('gender' in updates) {
      const gender = normalizeAdvisorGender(updates.gender)
      if (!gender) {
        return NextResponse.json({ error: 'Please select a valid gender' }, { status: 400 })
      }
      if (current.gender !== null && currentNormalizedGender !== gender) {
        return NextResponse.json({ error: 'Gender cannot be changed once saved' }, { status: 400 })
      }
      updates.gender = gender
      updates.advisor_category = categoryFromGender(gender)
    }

    if (!('gender' in updates) && currentNormalizedGender) {
      updates.advisor_category = categoryFromGender(currentNormalizedGender)
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

    if ('reviews_enabled' in updates) {
      updates.reviews_enabled = Boolean(updates.reviews_enabled)

      if (updates.reviews_enabled === false) {
        const { data: advisorRecord, error: advisorError } = await admin
          .from('advisors')
          .select('id')
          .eq('profile_id', user.id)
          .single()

        if (advisorError) {
          return NextResponse.json({ error: advisorError.message }, { status: 500 })
        }

        const reviewStats = await getAdvisorReviewStats(admin, advisorRecord.id as string)
        if (reviewStats.review_count > 0 && reviewStats.review_average <= 2) {
          return NextResponse.json({
            error: 'Reviews cannot be disabled when your visible review average is 2 stars or lower.',
          }, { status: 400 })
        }
      }
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

    let error: { message?: string } | null = null
    const requestedGender = 'gender' in updates ? normalizeAdvisorGender(updates.gender) : null

    if (requestedGender) {
      const genderCandidates = getDbGenderCandidates(requestedGender)
      for (let index = 0; index < genderCandidates.length; index += 1) {
        const dbGender = genderCandidates[index]
        const attempt = await admin
          .from('advisors')
          .update({ ...updates, gender: dbGender })
          .eq('profile_id', user.id)

        if (!attempt.error) {
          error = null
          break
        }

        error = attempt.error as { message?: string }
        const canRetry =
          index < genderCandidates.length - 1 &&
          isInvalidGenderEnumError(error?.message)
        if (!canRetry) break
      }
    } else {
      const attempt = await admin
        .from('advisors')
        .update(updates)
        .eq('profile_id', user.id)
      error = attempt.error as { message?: string } | null
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    invalidateMarketplaceCache()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
