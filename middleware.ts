/**
 * Middleware - Locale Routing + Session Validation
 *
 * ORDER:
 * 1. next-intl handles locale detection + URL rewriting
 * 2. Supabase validates session and refreshes auth cookies
 * 3. Admin route protection (check admin_users table)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing'

// next-intl locale middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const pathname = request.nextUrl.pathname

  // ── Skip locale handling for API routes and static files ──
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthCallback = pathname.startsWith('/auth/')

  // Run next-intl locale middleware first (for non-API, non-auth-callback routes)
  let response: NextResponse
  if (!isApiRoute && !isAuthCallback) {
    response = intlMiddleware(request) as NextResponse
  } else {
    response = NextResponse.next({
      request: { headers: request.headers },
    })
  }

  // ── Supabase session refresh ──
  // CRITICAL: reads cookies from request, writes refreshed tokens to response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const isProd = process.env.NODE_ENV === 'production'
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? isProd,
              sameSite: options?.sameSite ?? 'lax',
              path: options?.path ?? '/',
            })
          })
        },
      },
    }
  )

  // Validate user session
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (error && !error.message.includes('Auth session missing') &&
        !error.message.includes('Invalid Refresh Token') &&
        !error.message.includes('Refresh Token Not Found')) {
      console.log('🔧 Middleware: Auth error:', error.message)
    }
  } catch {
    // Non-fatal — continue without user
  }

  // ── Admin route protection ──
  // Admin routes may be at /admin or /<locale>/admin
  const isAdminRoute = pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    /^\/(?:ar|fr|en)\/admin(\/|$)/.test(pathname)

  if (isAdminRoute) {
    if (!user) {
      const signinUrl = new URL('/signin', request.url)
      signinUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signinUrl)
    }

    let isAdmin = false

    // PRIMARY: Check admin_users table
    try {
      const { data: adminRows } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('role', ['super_admin', 'admin', 'moderator'])
        .limit(1)

      if (adminRows && adminRows.length > 0) isAdmin = true
    } catch { /* fallthrough */ }

    // FALLBACK 1: user metadata
    if (!isAdmin) {
      if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
        isAdmin = true
      }
    }

    // FALLBACK 2: bootstrap allowlist
    if (!isAdmin) {
      const BOOTSTRAP_ADMINS = ['rdjerrouf@gmail.com', 'anyadjerrouf@gmail.com']
      if (BOOTSTRAP_ADMINS.includes(user.email || '') &&
          user.app_metadata?.provider !== 'anonymous') {
        isAdmin = true
        console.warn('⚠️ BOOTSTRAP: Allowing admin via temporary allowlist:', user.email)
      }
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Performance header
  const duration = Date.now() - start
  response.headers.set('X-Response-Time', `${duration}ms`)

  if (isApiRoute) {
    response.headers.set('X-Pool-Strategy', 'supabase-pgbouncer')
    response.headers.set('X-DlalaDZ-Version', '1.0.0')
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
