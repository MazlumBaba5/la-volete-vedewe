import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestGoldStatus } from '@/lib/guest-gold'

function isMissingFavoritesSchema(message?: string) {
  return Boolean(message?.includes('relation "public.favorites" does not exist'))
}

const SETUP_MESSAGE = 'Run guest_favorites_notifications_setup.sql first to enable Gold favorites notifications.'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ advisorId: string }> }
) {
  try {
    const membership = await getGuestGoldStatus()

    if (membership.kind === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (membership.kind === 'forbidden') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    const { advisorId } = await params
    if (!advisorId) {
      return NextResponse.json({ error: 'Advisor id is required' }, { status: 400 })
    }

    if (!membership.schemaReady) {
      return NextResponse.json({
        schema_ready: false,
        currentPlan: membership.currentPlan,
        can_use_favorites: false,
        is_favorite: false,
        message: membership.message,
      })
    }

    if (!membership.isGold) {
      return NextResponse.json({
        schema_ready: true,
        currentPlan: membership.currentPlan,
        can_use_favorites: false,
        is_favorite: false,
        message: 'Gold membership is required to use favorites and alerts.',
      })
    }

    const admin = createAdminClient()
    const { data: favorite, error } = await admin
      .from('favorites')
      .select('id')
      .eq('profile_id', membership.userId)
      .eq('advisor_id', advisorId)
      .maybeSingle()

    if (error) {
      if (isMissingFavoritesSchema(error.message)) {
        return NextResponse.json({
          schema_ready: false,
          currentPlan: membership.currentPlan,
          can_use_favorites: false,
          is_favorite: false,
          message: SETUP_MESSAGE,
        })
      }

      throw error
    }

    return NextResponse.json({
      schema_ready: true,
      currentPlan: membership.currentPlan,
      can_use_favorites: true,
      is_favorite: Boolean(favorite?.id),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load favorite status' },
      { status: 500 }
    )
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ advisorId: string }> }
) {
  try {
    const membership = await getGuestGoldStatus()

    if (membership.kind === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (membership.kind === 'forbidden') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    if (!membership.schemaReady) {
      return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
    }

    if (!membership.isGold) {
      return NextResponse.json({ error: 'Gold membership is required to save favorites.' }, { status: 403 })
    }

    const { advisorId } = await params
    if (!advisorId) {
      return NextResponse.json({ error: 'Advisor id is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id')
      .eq('id', advisorId)
      .maybeSingle()

    if (advisorError) throw advisorError
    if (!advisor?.id) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    const { error } = await admin
      .from('favorites')
      .upsert(
        [{ profile_id: membership.userId, advisor_id: advisorId }],
        { onConflict: 'profile_id,advisor_id', ignoreDuplicates: true }
      )

    if (error) {
      if (isMissingFavoritesSchema(error.message)) {
        return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ ok: true, is_favorite: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ advisorId: string }> }
) {
  try {
    const membership = await getGuestGoldStatus()

    if (membership.kind === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (membership.kind === 'forbidden') {
      return NextResponse.json({ error: 'Only registered client accounts can access this endpoint' }, { status: 403 })
    }

    if (!membership.schemaReady) {
      return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
    }

    if (!membership.isGold) {
      return NextResponse.json({ error: 'Gold membership is required to manage favorites.' }, { status: 403 })
    }

    const { advisorId } = await params
    if (!advisorId) {
      return NextResponse.json({ error: 'Advisor id is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('favorites')
      .delete()
      .eq('profile_id', membership.userId)
      .eq('advisor_id', advisorId)

    if (error) {
      if (isMissingFavoritesSchema(error.message)) {
        return NextResponse.json({ error: SETUP_MESSAGE }, { status: 400 })
      }
      throw error
    }

    await admin
      .from('guest_notifications')
      .delete()
      .eq('profile_id', membership.userId)
      .eq('advisor_id', advisorId)

    return NextResponse.json({ ok: true, is_favorite: false })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to remove favorite' },
      { status: 500 }
    )
  }
}
