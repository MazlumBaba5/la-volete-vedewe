import { NextResponse } from 'next/server'
import { createCaptchaChallenge } from '@/lib/admin-auth'

export async function GET() {
  return NextResponse.json(createCaptchaChallenge())
}
