'use client'
// src/components/ui/PhotoUpload.tsx

import { useState, useRef, useCallback } from 'react'

export interface UploadedPhoto {
    id: string
    url: string
    publicId: string
    isCover: boolean
}

interface Props {
    photos: UploadedPhoto[]
    onChange: (photos: UploadedPhoto[]) => void
    maxPhotos?: number
}

export default function PhotoUpload({ photos, onChange, maxPhotos = 10 }: Props) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const uploadFile = async (file: File): Promise<UploadedPhoto | null> => {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()

        if (!res.ok) {
            setError(json.error ?? 'Upload failed')
            return null
        }

        return {
            id: json.id,
            url: json.url,
            publicId: json.publicId,
            isCover: json.isCover,
        }
    }

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const remaining = maxPhotos - photos.length
        if (remaining <= 0) {
            setError(`Maximum ${maxPhotos} photos allowed`)
            return
        }

        const toUpload = fileArray.slice(0, remaining)
        setUploading(true)
        setError('')

        const results: UploadedPhoto[] = []
        for (const file of toUpload) {
            const photo = await uploadFile(file)
            if (photo) results.push(photo)
        }

        if (results.length > 0) onChange([...photos, ...results])
        setUploading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photos, maxPhotos])

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: id }),
        })
        if (res.ok) {
            const updated = photos.filter((p) => p.id !== id)
            if (updated.length > 0 && !updated.some((p) => p.isCover)) updated[0].isCover = true
            onChange(updated)
        } else {
            setError('Failed to delete photo')
        }
    }

    const handleSetCover = async (id: string) => {
        const res = await fetch('/api/upload', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: id }),
        })
        if (res.ok) {
            onChange(photos.map((p) => ({ ...p, isCover: p.id === id })))
        }
    }

    return (
        <div className="space-y-4">

            {/* Drop zone */}
            {photos.length < maxPhotos && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => inputRef.current?.click()}
                    className="rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                    style={{
                        border: `2px dashed ${dragOver ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                        background: dragOver ? 'rgba(233,30,140,0.07)' : 'rgba(255,255,255,0.02)',
                    }}
                >
                    {uploading ? (
                        <>
                            <div className="w-8 h-8 rounded-full border-2 animate-spin"
                                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                            <p className="text-sm text-gray-400">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="text-4xl">📷</div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-white">Drop photos here or click to select</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    JPG, PNG, WebP · max 10MB each · {photos.length}/{maxPhotos} photos
                                </p>
                            </div>
                        </>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </p>
            )}

            {/* Photo grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-xl overflow-hidden" style={{ paddingBottom: '133%' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt="" className="absolute inset-0 w-full h-full object-cover" />

                            {photo.isCover && (
                                <div className="absolute top-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: 'var(--accent)', color: '#fff' }}>
                                    Cover
                                </div>
                            )}

                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: 'rgba(0,0,0,0.6)' }}>
                                {!photo.isCover && (
                                    <button onClick={() => handleSetCover(photo.id)}
                                        className="text-xs px-2 py-1 rounded font-medium"
                                        style={{ background: 'var(--accent)', color: '#fff' }}>
                                        Set cover
                                    </button>
                                )}
                                <button onClick={() => handleDelete(photo.id)}
                                    className="text-xs px-2 py-1 rounded font-medium"
                                    style={{ background: 'rgba(239,68,68,0.8)', color: '#fff' }}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}