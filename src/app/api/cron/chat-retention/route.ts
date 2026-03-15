import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary/config'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const DEFAULT_RETENTION_DAYS = 30
const DEFAULT_BATCH_SIZE = 200
const DEFAULT_MAX_BATCHES = 20

type CleanupStats = {
  conversationsDeleted: number
  mediaDeleteRequested: number
  mediaDeleteFailed: number
  batches: number
}

type MediaRow = {
  attachment_cloudinary_id: string | null
  attachment_kind: 'image' | 'video' | null
}

type DbErrorLike = { code?: string; message?: string }

function isMissingTableError(error: DbErrorLike | null | undefined, tableName: string) {
  if (!error) return false
  if (error.code === '42P01') return true
  return error.message?.includes(`relation "${tableName}" does not exist`) ?? false
}

function isMissingColumnError(error: DbErrorLike | null | undefined, tableName: string, columnName: string) {
  if (!error) return false
  if (error.code === '42703') return true
  return (
    error.message?.includes(`column ${tableName}.${columnName} does not exist`) ||
    error.message?.includes(`column "${columnName}" does not exist`)
  ) ?? false
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function isAuthorized(req: NextRequest) {
  const expected = process.env.CHAT_RETENTION_CRON_SECRET || process.env.CRON_SECRET
  if (!expected) {
    return { ok: false as const, missingSecret: true }
  }

  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret')?.trim() ?? ''
  const querySecret = req.nextUrl.searchParams.get('secret')?.trim() ?? ''
  const provided = bearerToken || headerSecret || querySecret

  return { ok: provided === expected, missingSecret: false as const }
}

async function cleanupBatch(cutoffIso: string, batchSize: number): Promise<{
  done: boolean
  conversationsDeleted: number
  mediaDeleteRequested: number
  mediaDeleteFailed: number
}> {
  const admin = createAdminClient()

  const { data: conversationRows, error: conversationError } = await admin
    .from('chat_conversations')
    .select('id')
    .lt('last_message_at', cutoffIso)
    .order('last_message_at', { ascending: true })
    .limit(batchSize)

  if (conversationError) {
    if (
      isMissingTableError(conversationError, 'public.chat_conversations') ||
      isMissingTableError(conversationError, 'chat_conversations')
    ) {
      return { done: true, conversationsDeleted: 0, mediaDeleteRequested: 0, mediaDeleteFailed: 0 }
    }
    throw conversationError
  }

  const conversationIds = (conversationRows ?? []).map((row) => String(row.id))
  if (conversationIds.length === 0) {
    return { done: true, conversationsDeleted: 0, mediaDeleteRequested: 0, mediaDeleteFailed: 0 }
  }

  let mediaRows: MediaRow[] = []
  const mediaQuery = await admin
    .from('chat_messages')
    .select('attachment_cloudinary_id, attachment_kind')
    .in('conversation_id', conversationIds)
    .not('attachment_cloudinary_id', 'is', null)

  if (mediaQuery.error) {
    if (
      isMissingTableError(mediaQuery.error, 'public.chat_messages') ||
      isMissingTableError(mediaQuery.error, 'chat_messages') ||
      isMissingColumnError(mediaQuery.error, 'chat_messages', 'attachment_cloudinary_id') ||
      isMissingColumnError(mediaQuery.error, 'chat_messages', 'attachment_kind')
    ) {
      mediaRows = []
    } else {
      throw mediaQuery.error
    }
  } else {
    mediaRows = (mediaQuery.data ?? []) as MediaRow[]
  }

  const mediaTargets = new Map<string, 'image' | 'video'>()
  for (const row of mediaRows) {
    const cloudinaryId = row.attachment_cloudinary_id?.trim()
    if (!cloudinaryId) continue
    mediaTargets.set(cloudinaryId, row.attachment_kind === 'video' ? 'video' : 'image')
  }

  let mediaDeleteFailed = 0
  if (mediaTargets.size > 0) {
    const jobs = Array.from(mediaTargets.entries())
    for (let index = 0; index < jobs.length; index += 20) {
      const chunk = jobs.slice(index, index + 20)
      const results = await Promise.allSettled(
        chunk.map(([cloudinaryId, resourceType]) =>
          cloudinary.uploader.destroy(cloudinaryId, { resource_type: resourceType })
        )
      )
      for (const result of results) {
        if (result.status === 'rejected') {
          mediaDeleteFailed += 1
        }
      }
    }
  }

  const { error: deleteError } = await admin
    .from('chat_conversations')
    .delete()
    .in('id', conversationIds)

  if (deleteError) {
    throw deleteError
  }

  return {
    done: conversationIds.length < batchSize,
    conversationsDeleted: conversationIds.length,
    mediaDeleteRequested: mediaTargets.size,
    mediaDeleteFailed,
  }
}

async function runCleanup(req: NextRequest) {
  try {
    const auth = isAuthorized(req)
    if (auth.missingSecret) {
      return NextResponse.json(
        { error: 'Missing CHAT_RETENTION_CRON_SECRET (or CRON_SECRET) environment variable.' },
        { status: 500 }
      )
    }
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const retentionDays = parsePositiveInt(process.env.CHAT_RETENTION_DAYS ?? null, DEFAULT_RETENTION_DAYS)
    const batchSize = parsePositiveInt(process.env.CHAT_RETENTION_BATCH_SIZE ?? null, DEFAULT_BATCH_SIZE)
    const maxBatches = parsePositiveInt(process.env.CHAT_RETENTION_MAX_BATCHES ?? null, DEFAULT_MAX_BATCHES)
    const cutoffIso = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

    const stats: CleanupStats = {
      conversationsDeleted: 0,
      mediaDeleteRequested: 0,
      mediaDeleteFailed: 0,
      batches: 0,
    }

    for (let i = 0; i < maxBatches; i += 1) {
      const batchResult = await cleanupBatch(cutoffIso, batchSize)
      stats.batches += 1
      stats.conversationsDeleted += batchResult.conversationsDeleted
      stats.mediaDeleteRequested += batchResult.mediaDeleteRequested
      stats.mediaDeleteFailed += batchResult.mediaDeleteFailed

      if (batchResult.done) {
        return NextResponse.json({
          ok: true,
          cutoff: cutoffIso,
          retentionDays,
          batchSize,
          maxBatches,
          ...stats,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      cutoff: cutoffIso,
      retentionDays,
      batchSize,
      maxBatches,
      ...stats,
      partial: true,
      message: 'Reached max batches. Run again to continue cleanup.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to run chat retention cleanup' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runCleanup(req)
}

export async function POST(req: NextRequest) {
  return runCleanup(req)
}
