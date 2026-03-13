import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary/config'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.user_metadata?.role !== 'guest') {
      return NextResponse.json({ error: 'Only registered client accounts can update this avatar' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and WebP are allowed' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `lvvd/guests/${user.id}/avatar`,
          resource_type: 'image',
          transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
        },
        (error, uploadResult) => {
          if (error) reject(error)
          else resolve(uploadResult as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })

    const previousCloudinaryId = user.user_metadata?.avatar_cloudinary_id as string | undefined
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        avatar_url: result.secure_url,
        avatar_cloudinary_id: result.public_id,
      },
    })

    if (updateError) {
      try {
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' })
      } catch {}
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (previousCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(previousCloudinaryId, { resource_type: 'image' })
      } catch {}
    }

    return NextResponse.json({ avatar_url: result.secure_url })
  } catch (error) {
    console.error('[guest avatar upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.user_metadata?.role !== 'guest') {
      return NextResponse.json({ error: 'Only registered client accounts can update this avatar' }, { status: 403 })
    }

    const previousCloudinaryId = user.user_metadata?.avatar_cloudinary_id as string | undefined
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        avatar_url: null,
        avatar_cloudinary_id: null,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (previousCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(previousCloudinaryId, { resource_type: 'image' })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[guest avatar delete]', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
