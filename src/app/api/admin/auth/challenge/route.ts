import { NextResponse } from 'next/server'
import { createCaptchaChallenge, isAdminAuthConfigured } from '@/lib/admin-auth'

export async function GET() {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: 'Admin auth is not configured.' }, { status: 503 })
  }

  const challenge = createCaptchaChallenge()
  if (!challenge) {
    return NextResponse.json({ error: 'Admin auth is not configured.' }, { status: 503 })
  }

  return NextResponse.json(challenge)
}
