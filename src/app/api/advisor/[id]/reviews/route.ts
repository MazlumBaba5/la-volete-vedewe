import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function getViewerUsername(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  return (
    (user.user_metadata?.username as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'guest'
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, profile_id, reviews_enabled')
      .eq('id', id)
      .maybeSingle()

    if (advisorError || !advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    const reviewsEnabled = advisor.reviews_enabled ?? true
    const { data: reviews, error: reviewsError } = await admin
      .from('reviews')
      .select('id, rating, title, comment, reviewer_username, created_at')
      .eq('advisor_id', id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (reviewsError) {
      return NextResponse.json({ error: reviewsError.message }, { status: 500 })
    }

    const visibleReviews = reviewsEnabled ? (reviews ?? []) : []
    const reviewCount = visibleReviews.length
    const averageRating = reviewCount
      ? Number((visibleReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
      : 0

    const { data: { user } } = await supabase.auth.getUser()
    let viewerHasReviewed = false
    let viewerRole: string | null = null

    if (user) {
      viewerRole = (user.user_metadata?.role as string | undefined) ?? null
      const { data: existingReview } = await admin
        .from('reviews')
        .select('id')
        .eq('advisor_id', id)
        .eq('profile_id', user.id)
        .maybeSingle()

      viewerHasReviewed = Boolean(existingReview)
    }

    return NextResponse.json({
      enabled: reviewsEnabled,
      averageRating,
      reviewCount,
      viewerRole,
      viewerHasReviewed,
      canReview: reviewsEnabled && viewerRole === 'guest' && !viewerHasReviewed,
      reviews: visibleReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title ?? '',
        comment: review.comment ?? '',
        reviewerUsername: review.reviewer_username ?? 'guest',
        createdAt: review.created_at,
      })),
    })
  } catch (error) {
    console.error('[reviews:get]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 })
    }

    if (user.user_metadata?.role !== 'guest') {
      return NextResponse.json({ error: 'Only client accounts can leave reviews' }, { status: 403 })
    }

    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, profile_id, reviews_enabled')
      .eq('id', id)
      .maybeSingle()

    if (advisorError || !advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    if (advisor.profile_id === user.id) {
      return NextResponse.json({ error: 'You cannot review your own profile' }, { status: 403 })
    }

    if (!(advisor.reviews_enabled ?? true)) {
      return NextResponse.json({ error: 'This advisor has disabled reviews' }, { status: 403 })
    }

    const body = (await request.json()) as { rating?: number; title?: string; comment?: string }
    const rating = Number(body.rating)
    const title = String(body.title ?? '').trim()
    const comment = String(body.comment ?? '').trim()

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Choose a rating between 1 and 5 stars' }, { status: 400 })
    }

    if (title.length < 3 || title.length > 80) {
      return NextResponse.json({ error: 'Review title must be between 3 and 80 characters' }, { status: 400 })
    }

    if (comment.length < 10 || comment.length > 1000) {
      return NextResponse.json({ error: 'Review description must be between 10 and 1000 characters' }, { status: 400 })
    }

    const { data: existingReview } = await admin
      .from('reviews')
      .select('id')
      .eq('advisor_id', id)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json({ error: 'You already reviewed this advisor' }, { status: 409 })
    }

    const { error: insertError } = await admin
      .from('reviews')
      .insert([{
        advisor_id: id,
        profile_id: user.id,
        reviewer_username: getViewerUsername(user),
        rating,
        title,
        comment,
        is_visible: true,
      }])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[reviews:post]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
