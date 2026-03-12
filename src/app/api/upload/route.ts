// src/app/api/upload/route.ts
import { createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary/config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: advisor, error: advisorError } = await supabase
            .from('advisors')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (advisorError || !advisor) {
            return NextResponse.json({ error: 'Advisor profile not found' }, { status: 404 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Only JPG, PNG and WebP are allowed' }, { status: 400 })
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
        }

        const { count } = await supabase
            .from('advisor_media')
            .select('*', { count: 'exact', head: true })
            .eq('advisor_id', advisor.id)

        const isCover = (count ?? 0) === 0

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: `lvvd/advisors/${advisor.id}`,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result as { secure_url: string; public_id: string })
                }
            ).end(buffer)
        })

        const { data: media, error: mediaError } = await supabase
            .from('advisor_media')
            .insert({
                advisor_id: advisor.id,
                cloudinary_id: result.public_id,
                url: result.secure_url,
                media_type: 'photo',
                is_cover: isCover,
                is_private: false,
                sort_order: count ?? 0,
            })
            .select()
            .single()

        if (mediaError) {
            console.error('[upload] DB error:', mediaError.message)
            return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 })
        }

        return NextResponse.json({
            id: media.id,
            url: media.url,
            publicId: media.cloudinary_id,
            isCover: media.is_cover,
        })

    } catch (err) {
        console.error('[upload]', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { mediaId } = await req.json()
        if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 })

        const { data: advisor } = await supabase
            .from('advisors')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (!advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })

        const { data: media } = await supabase
            .from('advisor_media')
            .select('cloudinary_id, is_cover')
            .eq('id', mediaId)
            .eq('advisor_id', advisor.id)
            .single()

        if (!media) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

        await cloudinary.uploader.destroy(media.cloudinary_id)
        await supabase.from('advisor_media').delete().eq('id', mediaId)

        if (media.is_cover) {
            const { data: remaining } = await supabase
                .from('advisor_media')
                .select('id')
                .eq('advisor_id', advisor.id)
                .order('sort_order', { ascending: true })
                .limit(1)

            if (remaining && remaining.length > 0) {
                await supabase.from('advisor_media').update({ is_cover: true }).eq('id', remaining[0].id)
            }
        }

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('[delete photo]', err)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { mediaId } = await req.json()

        const { data: advisor } = await supabase
            .from('advisors')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (!advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })

        await supabase.from('advisor_media').update({ is_cover: false }).eq('advisor_id', advisor.id)
        await supabase.from('advisor_media').update({ is_cover: true }).eq('id', mediaId).eq('advisor_id', advisor.id)

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('[set cover]', err)
        return NextResponse.json({ error: 'Failed to set cover' }, { status: 500 })
    }
}