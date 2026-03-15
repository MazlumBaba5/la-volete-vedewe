import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary/config'
import {
  checkChatRateLimit,
  getActor,
  getConversationBlockState,
  validateConversationAccess,
} from '@/app/api/chat/_helpers'
import { isMissingColumnError } from '@/app/api/chat/_helpers'

export const runtime = 'nodejs'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { message?: unknown; error?: { message?: unknown } }
    if (typeof maybe.message === 'string' && maybe.message.trim()) return maybe.message
    if (typeof maybe.error?.message === 'string' && maybe.error.message.trim()) return maybe.error.message
  }
  return 'Unable to upload media'
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: 'Cloudinary environment variables are missing.' }, { status: 500 })
    }

    const { user, role } = await getActor()
    if (!user || (role !== 'guest' && role !== 'advisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { admin, conversation } = await validateConversationAccess(conversationId, user.id, role)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const blockState = await getConversationBlockState(conversation, user.id)
    if (blockState.isBlocked) {
      return NextResponse.json({ error: 'This conversation is blocked.' }, { status: 403 })
    }

    const rateLimit = await checkChatRateLimit(user.id, conversationId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.message ?? 'Too many messages. Please slow down.',
          retry_after_seconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caption = String(formData.get('caption') ?? '').trim()
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.has(file.type)
    const isVideo = VIDEO_TYPES.has(file.type)
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, GIF, MP4, MOV and WEBM are allowed.' }, { status: 400 })
    }

    const maxSize = isVideo ? 40 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? 'Video too large (max 40MB).' : 'Image too large (max 15MB).' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const kind = isVideo ? 'video' : 'image'

    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `lvvd/chat/${conversationId}`,
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, uploadResult) => {
          if (error) reject(new Error(getErrorMessage(error)))
          else resolve(uploadResult as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })

    const fallbackText = kind === 'video' ? '[Video]' : '[Photo]'
    const body = caption || fallbackText

    const { data: message, error: insertError } = await admin
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_profile_id: user.id,
        sender_role: role,
        body,
        attachment_url: uploaded.secure_url,
        attachment_kind: kind,
        attachment_cloudinary_id: uploaded.public_id,
      }])
      .select('id, sender_profile_id, sender_role, body, attachment_url, attachment_kind, attachment_cloudinary_id, created_at, read_at')
      .single()

    if (insertError) {
      try {
        await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: kind === 'video' ? 'video' : 'image' })
      } catch {}
      if (
        isMissingColumnError(insertError, 'chat_messages', 'attachment_url') ||
        isMissingColumnError(insertError, 'chat_messages', 'attachment_kind') ||
        isMissingColumnError(insertError, 'chat_messages', 'attachment_cloudinary_id')
      ) {
        return NextResponse.json({ error: 'Run chat_setup.sql again to enable chat media attachments.' }, { status: 400 })
      }
      throw insertError
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
