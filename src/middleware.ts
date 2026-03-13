import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PATHS = ['/advisor/dashboard', '/guest/dashboard']
const ADMIN_PROTECTED_PATH = '/admin'
const ADMIN_LOGIN_PATH = '/admin/login'
const ADMIN_SESSION_COOKIE = 'lvvd_admin_session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always refresh the Supabase session cookie
  const response = await updateSession(request)

  if (pathname.startsWith(ADMIN_PROTECTED_PATH) && pathname !== ADMIN_LOGIN_PATH) {
    const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!adminSession) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url))
    }
  }

  // Redirect unauthenticated visitors away from protected routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
