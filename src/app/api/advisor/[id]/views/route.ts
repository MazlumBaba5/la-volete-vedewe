import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { invalidateMarketplaceCache } from '@/lib/marketplace-cache'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Advisor id is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id, slug, views_count')
      .eq('id', id)
      .maybeSingle()

    if (advisorError) {
      return NextResponse.json({ error: advisorError.message }, { status: 500 })
    }

    if (!advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    const nextViews = Number(advisor.views_count ?? 0) + 1
    const { error: updateError } = await admin
      .from('advisors')
      .update({ views_count: nextViews })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    invalidateMarketplaceCache([`marketplace:profile:${advisor.slug as string}`])

    return NextResponse.json({ ok: true, views: nextViews })
  } catch (error) {
    console.error('[advisor views]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
