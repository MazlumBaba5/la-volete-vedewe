import { NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminCredentials,
  verifyCaptchaChallenge,
} from '@/lib/admin-auth'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string
      password?: string
      captchaAnswer?: string
      captchaToken?: string
    }

    if (!body.username || !body.password || !body.captchaAnswer || !body.captchaToken) {
      return NextResponse.json({ error: 'Username, password and captcha are required.' }, { status: 400 })
    }

    if (!verifyCaptchaChallenge(body.captchaToken, body.captchaAnswer)) {
      return NextResponse.json({ error: 'Captcha verification failed.' }, { status: 400 })
    }

    const credentials = getAdminCredentials()
    if (body.username !== credentials.username || body.password !== credentials.password) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(body.username), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
