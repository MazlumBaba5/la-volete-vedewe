import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: advisors, error } = await admin
      .from('advisors')
      .select('id, name, slug, city, verification_submitted_at, verification_status, created_at')
      .eq('verification_status', 'submitted')
      .order('verification_submitted_at', { ascending: false })

    if (error) {
      if (error.message.includes('column advisors.verification_status does not exist')) {
        return NextResponse.json({
          items: [],
          schema_ready: false,
          message: 'Run advisor_verification_setup.sql first to enable verification notifications.',
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const advisorIds = (advisors ?? []).map((item) => item.id)
    const uploadMap = new Map<string, number>()
    const verificationUploadsMap = new Map<string, Array<{ id: string; kind: string; url: string; created_at: string }>>()
    const profilePhotosMap = new Map<string, Array<{ id: string; url: string; is_cover: boolean; sort_order: number }>>()

    if (advisorIds.length > 0) {
      const { data: uploads, error: uploadsError } = await admin
        .from('advisor_verification_uploads')
        .select('id, advisor_id, kind, url, created_at')
        .in('advisor_id', advisorIds)

      if (!uploadsError) {
        for (const upload of uploads ?? []) {
          uploadMap.set(upload.advisor_id as string, (uploadMap.get(upload.advisor_id as string) ?? 0) + 1)
          verificationUploadsMap.set(
            upload.advisor_id as string,
            [...(verificationUploadsMap.get(upload.advisor_id as string) ?? []), {
              id: upload.id as string,
              kind: upload.kind as string,
              url: upload.url as string,
              created_at: upload.created_at as string,
            }]
          )
        }
      }

      const { data: profilePhotos, error: photosError } = await admin
        .from('advisor_media')
        .select('id, advisor_id, url, is_cover, sort_order')
        .in('advisor_id', advisorIds)
        .eq('media_type', 'photo')
        .eq('is_private', false)
        .order('sort_order', { ascending: true })

      if (!photosError) {
        for (const photo of profilePhotos ?? []) {
          profilePhotosMap.set(
            photo.advisor_id as string,
            [...(profilePhotosMap.get(photo.advisor_id as string) ?? []), {
              id: photo.id as string,
              url: photo.url as string,
              is_cover: Boolean(photo.is_cover),
              sort_order: Number(photo.sort_order ?? 0),
            }]
          )
        }
      }
    }

    return NextResponse.json({
      schema_ready: true,
      items: (advisors ?? []).map((advisor) => ({
        ...advisor,
        upload_count: uploadMap.get(advisor.id as string) ?? 0,
        verification_uploads: verificationUploadsMap.get(advisor.id as string) ?? [],
        profile_photos: profilePhotosMap.get(advisor.id as string) ?? [],
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
