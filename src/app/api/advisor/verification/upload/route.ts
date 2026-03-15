import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary/config'

const ALLOWED_KINDS = new Set(['front_selfie', 'proof_selfie'])

function isMissingVerificationSchema(message?: string) {
  return Boolean(
    message?.includes('column advisors.verification_status does not exist') ||
    message?.includes('relation "public.advisor_verification_uploads" does not exist')
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json({ error: 'Advisor profile not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const kind = String(formData.get('kind') ?? '')

    if (!ALLOWED_KINDS.has(kind)) {
      return NextResponse.json({ error: 'Invalid verification upload type' }, { status: 400 })
    }

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and WebP are allowed' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await admin
      .from('advisor_verification_uploads')
      .select('id, cloudinary_id')
      .eq('advisor_id', advisor.id)
      .eq('kind', kind)
      .maybeSingle()

    if (existingError) {
      if (isMissingVerificationSchema(existingError.message)) {
        return NextResponse.json({ error: 'Run advisor_verification_setup.sql first to enable verification uploads.' }, { status: 400 })
      }
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing?.cloudinary_id) {
      if (advisor.verification_status !== 'rejected') {
        return NextResponse.json({
          error: 'This verification photo was already uploaded and cannot be changed from the advisor dashboard.',
        }, { status: 400 })
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `lvvd/advisors/${advisor.id}/verification`,
          resource_type: 'image',
        },
        (error, uploadResult) => {
          if (error) reject(error)
          else resolve(uploadResult as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })

    if (existing?.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(existing.cloudinary_id, { resource_type: 'image' })
      } catch (destroyError) {
        console.error('[verification upload] cloudinary destroy failed', destroyError)
      }

      const { error: deleteExistingError } = await admin
        .from('advisor_verification_uploads')
        .delete()
        .eq('id', existing.id)

      if (deleteExistingError) {
        try {
          await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' })
        } catch (cleanupError) {
          console.error('[verification upload] cleanup destroy failed', cleanupError)
        }
        return NextResponse.json({ error: deleteExistingError.message }, { status: 500 })
      }
    }

    const { data: uploadRow, error: uploadError } = await admin
      .from('advisor_verification_uploads')
      .insert({
        advisor_id: advisor.id,
        kind,
        cloudinary_id: result.public_id,
        url: result.secure_url,
      })
      .select('id, kind, url, created_at')
      .single()

    if (uploadError) {
      try {
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' })
      } catch (cleanupError) {
        console.error('[verification upload] cleanup destroy failed', cleanupError)
      }
      if (isMissingVerificationSchema(uploadError.message)) {
        return NextResponse.json({ error: 'Run advisor_verification_setup.sql first to enable verification uploads.' }, { status: 400 })
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error: advisorUpdateError } = await admin
      .from('advisors')
      .update({ verification_status: 'not_submitted', verification_submitted_at: null })
      .eq('id', advisor.id)

    if (advisorUpdateError) {
      if (isMissingVerificationSchema(advisorUpdateError.message)) {
        return NextResponse.json({ error: 'Run advisor_verification_setup.sql first to enable verification uploads.' }, { status: 400 })
      }
      return NextResponse.json({ error: advisorUpdateError.message }, { status: 500 })
    }

    return NextResponse.json(uploadRow)
  } catch (error) {
    console.error('[verification upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
