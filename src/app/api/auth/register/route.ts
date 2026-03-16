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
import { isValidGuestUsername, normalizeGuestUsername } from '@/lib/guest-auth'
import { findDutchCity } from '@/lib/netherlands-cities'
import cloudinary from '@/lib/cloudinary/config'
import { invalidateMarketplaceCache } from '@/lib/marketplace-cache'

const MIN_ADVISOR_PHOTOS = 3
const MAX_ADVISOR_PHOTOS = 25
const MAX_ADVISOR_PHOTO_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_ADVISOR_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type Body = {
  email: string
  password: string
  role: 'guest' | 'advisor'
  name?: string
  advisorCategory?: 'woman' | 'man' | 'couple' | 'shemale'
  age?: number
  gender?: 'female' | 'male' | 'shemale' | 'couple'
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

type ParsedRegistrationPayload = {
  body: Body
  advisorPhotos: File[]
}

function categoryFromGender(gender: 'female' | 'male' | 'shemale' | 'couple') {
  if (gender === 'male') return 'man'
  if (gender === 'shemale') return 'shemale'
  if (gender === 'couple') return 'couple'
  return 'woman'
}

function makeSlug(name = '') {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'user'}-${Math.random().toString(36).slice(2, 8)}`
}

async function parseRegistrationPayload(req: Request): Promise<ParsedRegistrationPayload> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const payload = formData.get('payload')

    if (typeof payload !== 'string' || payload.trim().length === 0) {
      throw new Error('invalid_payload')
    }

    const body = JSON.parse(payload) as Body
    const advisorPhotos = formData
      .getAll('photos')
      .filter((entry): entry is File => entry instanceof File)

    return { body, advisorPhotos }
  }

  const body = (await req.json()) as Body
  return { body, advisorPhotos: [] }
}

function validateAdvisorPhotos(photos: File[]) {
  if (photos.length < MIN_ADVISOR_PHOTOS) {
    return `Upload at least ${MIN_ADVISOR_PHOTOS} profile photos`
  }

  if (photos.length > MAX_ADVISOR_PHOTOS) {
    return `You can upload up to ${MAX_ADVISOR_PHOTOS} profile photos`
  }

  for (const file of photos) {
    if (!ALLOWED_ADVISOR_PHOTO_TYPES.has(file.type)) {
      return 'Only JPG, PNG and WebP photos are allowed'
    }

    if (file.size > MAX_ADVISOR_PHOTO_SIZE_BYTES) {
      return 'Each photo must be 10MB or less'
    }
  }

  return null
}

async function uploadAdvisorPhotos(advisorId: string, photos: File[]) {
  const uploaded: Array<{ url: string; publicId: string }> = []

  try {
    for (const photo of photos) {
      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `lvvd/advisors/${advisorId}`,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error) reject(error)
            else resolve(uploadResult as { secure_url: string; public_id: string })
          }
        ).end(buffer)
      })

      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
      })
    }

    return uploaded
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((photo) => cloudinary.uploader.destroy(photo.publicId, { resource_type: 'image' }))
    )
    throw error
  }
}

export async function POST(req: Request) {
  try {
    let parsed: ParsedRegistrationPayload
    try {
      parsed = await parseRegistrationPayload(req)
    } catch {
      return NextResponse.json({ error: 'Invalid registration payload' }, { status: 400 })
    }

    const { body, advisorPhotos } = parsed

    if (body.role !== 'guest' && body.role !== 'advisor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

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

      if (!body.gender || !['female', 'male', 'shemale', 'couple'].includes(body.gender)) {
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

      const photoError = validateAdvisorPhotos(advisorPhotos)
      if (photoError) {
        return NextResponse.json({ error: photoError }, { status: 400 })
      }
    } else {
      if (!body.name?.trim() || !isValidGuestUsername(body.name)) {
        return NextResponse.json({ error: 'Choose a username with at least 3 characters' }, { status: 400 })
      }
    }

    const normalizedGender = (body.gender && ['female', 'male', 'shemale', 'couple'].includes(body.gender))
      ? body.gender
      : 'female'
    const advisorCategory = categoryFromGender(normalizedGender)

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email as string,
      password: body.password,
      options: {
        data: {
          role: body.role,
          name: body.role === 'guest' ? normalizeGuestUsername(body.name?.trim() || '') : body.name?.trim() || '',
          username: body.role === 'guest' ? normalizeGuestUsername(body.name?.trim() || '') : '',
          advisor_category: advisorCategory,
          age: body.age ?? null,
          gender: normalizedGender,
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
      const admin = createAdminClient()

      const { data: advisor, error: advisorError } = await admin
        .from('advisors')
        .insert([{
          profile_id: userId,
          name,
          slug,
          advisor_category: advisorCategory,
          city,
          region: selectedCity?.region || null,
          age: body.age ?? null,
          gender: normalizedGender,
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
        .select('id')
        .single()

      if (advisorError || !advisor) {
        console.error('[register] advisor insert error:', advisorError?.message)
        return NextResponse.json({ error: advisorError?.message ?? 'Failed to create advisor profile' }, { status: 500 })
      }

      let uploadedPhotos: Array<{ url: string; publicId: string }>
      try {
        uploadedPhotos = await uploadAdvisorPhotos(advisor.id as string, advisorPhotos)
      } catch (uploadError) {
        console.error('[register] advisor photo upload failed:', uploadError)
        return NextResponse.json({ error: 'Unable to upload advisor photos. Please try again.' }, { status: 500 })
      }

      const advisorMediaRows = uploadedPhotos.map((photo, index) => ({
        advisor_id: advisor.id,
        cloudinary_id: photo.publicId,
        url: photo.url,
        media_type: 'photo',
        is_cover: index === 0,
        is_private: false,
        sort_order: index,
      }))

      const { error: mediaError } = await admin.from('advisor_media').insert(advisorMediaRows)
      if (mediaError) {
        console.error('[register] advisor media insert error:', mediaError.message)
        await Promise.allSettled(
          uploadedPhotos.map((photo) => cloudinary.uploader.destroy(photo.publicId, { resource_type: 'image' }))
        )
        return NextResponse.json({ error: 'Unable to save advisor photos. Please try again.' }, { status: 500 })
      }

      invalidateMarketplaceCache()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
