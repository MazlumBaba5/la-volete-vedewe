import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendVerificationNotificationEmail } from '@/lib/email'

type VerificationKind = 'front_selfie' | 'proof_selfie'

function isMissingReviewedAtColumn(message?: string) {
  return Boolean(message?.includes('column advisors.verification_reviewed_at does not exist'))
}

function isMissingVerificationSchema(message?: string) {
  return Boolean(
    message?.includes('column advisors.verification_status does not exist') ||
    message?.includes('relation "public.advisor_verification_uploads" does not exist')
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    let { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, status, is_verified, verification_status, verification_submitted_at, verification_reviewed_at, verification_note')
      .eq('profile_id', user.id)
      .single()

    if (advisorError && isMissingReviewedAtColumn(advisorError.message)) {
      const fallbackResult = await admin
        .from('advisors')
        .select('id, status, is_verified, verification_status, verification_submitted_at, verification_note')
        .eq('profile_id', user.id)
        .single()

      advisor = fallbackResult.data
        ? { ...fallbackResult.data, verification_reviewed_at: null }
        : null
      advisorError = fallbackResult.error
    }

    if (advisorError && !isMissingVerificationSchema(advisorError.message)) {
      return NextResponse.json({ error: advisorError.message }, { status: 500 })
    }

    if (advisorError && isMissingVerificationSchema(advisorError.message)) {
      const { data: legacyAdvisor, error: legacyError } = await admin
        .from('advisors')
        .select('id, status, is_verified')
        .eq('profile_id', user.id)
        .single()

      if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 })

      return NextResponse.json({
        status: legacyAdvisor.status,
        is_verified: legacyAdvisor.is_verified,
        verification_status: 'not_submitted',
        verification_submitted_at: null,
        verification_reviewed_at: null,
        verification_note: 'Run advisor_verification_setup.sql to enable the verification workflow.',
        uploads: [],
        schema_ready: false,
      })
    }

    const { data: uploads, error: uploadsError } = await admin
      .from('advisor_verification_uploads')
      .select('id, kind, url, created_at')
      .eq('advisor_id', advisor.id)
      .order('created_at', { ascending: false })

    if (uploadsError && !isMissingVerificationSchema(uploadsError.message)) {
      return NextResponse.json({ error: uploadsError.message }, { status: 500 })
    }

    return NextResponse.json({
      status: advisor.status,
      is_verified: advisor.is_verified,
      verification_status: advisor.verification_status ?? 'not_submitted',
      verification_submitted_at: advisor.verification_submitted_at,
      verification_reviewed_at: advisor.verification_reviewed_at,
      verification_note: advisor.verification_note,
      uploads: uploads ?? [],
      schema_ready: true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, name, city, slug')
      .eq('profile_id', user.id)
      .single()

    if (advisorError) return NextResponse.json({ error: advisorError.message }, { status: 500 })

    const { data: uploads, error: uploadsError } = await admin
      .from('advisor_verification_uploads')
      .select('kind')
      .eq('advisor_id', advisor.id)

    if (uploadsError) {
      if (isMissingVerificationSchema(uploadsError.message)) {
        return NextResponse.json({
          error: 'Run advisor_verification_setup.sql first to enable verification uploads.',
        }, { status: 400 })
      }
      return NextResponse.json({ error: uploadsError.message }, { status: 500 })
    }

    const kinds = new Set((uploads ?? []).map((item) => item.kind as VerificationKind))
    if (!kinds.has('front_selfie') || !kinds.has('proof_selfie')) {
      return NextResponse.json({
        error: 'Upload both verification selfies before submitting for review.',
      }, { status: 400 })
    }

    const submittedAt = new Date().toISOString()
    let { error: updateError } = await admin
      .from('advisors')
      .update({
        status: 'pending',
        verification_status: 'submitted',
        verification_submitted_at: submittedAt,
        verification_reviewed_at: null,
      })
      .eq('id', advisor.id)

    if (updateError && isMissingReviewedAtColumn(updateError.message)) {
      updateError = (
        await admin
          .from('advisors')
          .update({
            status: 'pending',
            verification_status: 'submitted',
            verification_submitted_at: submittedAt,
          })
          .eq('id', advisor.id)
      ).error
    }

    if (updateError) {
      if (isMissingVerificationSchema(updateError.message)) {
        return NextResponse.json({
          error: 'Run advisor_verification_setup.sql first to enable verification status updates.',
        }, { status: 400 })
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    try {
      await sendVerificationNotificationEmail({
        advisorName: advisor.name as string,
        city: advisor.city as string,
        slug: advisor.slug as string,
        submittedAt,
      })
    } catch (error) {
      console.warn('[verification email]', error)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
