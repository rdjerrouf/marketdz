/**
 * Middleware - Session Validation and Cookie Management
 *
 * RESPONSIBILITIES:
 * 1. Create Supabase client with cookie handlers
 * 2. Validate user session on every request
 * 3. Refresh auth cookies (Supabase handles auto-refresh)
 * 4. Protect admin routes (check admin_users table)
 * 5. Add performance monitoring headers
 *
 * RUNS ON: All requests except static files (see config.matcher below)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  console.log('🔧 Middleware: Processing request to:', request.nextUrl.pathname);

  // Create response that will include updated cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handlers
  // CRITICAL: This reads cookies from request and writes updated cookies to response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read cookies from incoming request
          const cookies = request.cookies.getAll();
          console.log('🔧 Middleware: Current cookies:', cookies.map(c => c.name));
          return cookies;
        },
        setAll(cookiesToSet) {
          // Write updated cookies to both request and response
          // This ensures refreshed tokens are available to API routes
          console.log('🔧 Middleware: Setting cookies:', cookiesToSet.map(c => c.name));
          const isProd = process.env.NODE_ENV === 'production'
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value) // For API routes to read
            response.cookies.set(name, value, { // For browser to receive
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? isProd,
              sameSite: options?.sameSite ?? 'lax',
              path: options?.path ?? '/'
            })
          })
        },
      },
    }
  )

  // Validate user session and handle auth errors
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('🔧 Middleware: Auth Status:', {
      isAuthenticated: !!user,
      userId: user?.id?.slice(-8) || 'none',
      email: user?.email || 'none',
    });

    // Silently ignore common auth errors (missing session, expired tokens)
    if (error) {
      if (!error.message.includes('Auth session missing') &&
          !error.message.includes('Invalid Refresh Token') &&
          !error.message.includes('Refresh Token Not Found')) {
        console.log('🔧 Middleware: Auth error:', error.message);
      }
    } else if (user) {
      console.log('🔧 Middleware: User authenticated:', { id: user.id.slice(-8), email: user.email });
    }

    // ===== ADMIN ROUTE PROTECTION =====
    // Check if user has admin permissions before allowing access to /admin routes
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/admin')) {
      // Redirect unauthenticated users to signin
      if (!user) {
        console.log('🔒 Middleware: Redirecting unauthenticated user from /admin to signin')
        return NextResponse.redirect(new URL('/signin?redirect=/admin', request.url))
      }

      // Check admin status via multiple methods (primary → fallbacks)
      let isAdmin = false
      let adminCheckMethod = 'none'

      // PRIMARY: Check admin_users table (proper RBAC)
      try {
        const { data: adminRows, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('role', ['super_admin', 'admin', 'moderator'])
          .limit(1)

        if (adminError) {
          console.warn('⚠️ Admin DB check error:', adminError.message)
        } else if (adminRows && adminRows.length > 0) {
          isAdmin = true
          adminCheckMethod = 'database'
          console.log('✅ Admin verified via database')
        }
      } catch (dbError) {
        console.warn('⚠️ Database admin check failed:', dbError)
      }

      // FALLBACK 1: Check user metadata (legacy support)
      if (!isAdmin) {
        if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
          isAdmin = true
          adminCheckMethod = 'metadata'
          console.log('✅ Admin verified via metadata')
        }
      }

      // FALLBACK 2: Bootstrap allowlist (TEMPORARY - remove after seeding admins)
      if (!isAdmin) {
        const BOOTSTRAP_ADMINS = ['rdjerrouf@gmail.com', 'anyadjerrouf@gmail.com']
        const isBootstrapAdmin = BOOTSTRAP_ADMINS.includes(user.email || '') &&
                                 user.app_metadata?.provider !== 'anonymous'

        if (isBootstrapAdmin) {
          isAdmin = true
          adminCheckMethod = 'bootstrap'
          console.warn('⚠️ BOOTSTRAP: Allowing admin via temporary allowlist:', user.email)
          console.warn('⚠️ TODO: Run "node scripts/seed-admin-user.js" and remove bootstrap')
        }
      }

      // Deny access if not admin
      if (!isAdmin) {
        console.log('🔒 Middleware: User not admin, redirecting to homepage')
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log(`🔒 Middleware: Admin access granted (method: ${adminCheckMethod})`)
    }
  } catch (middlewareError) {
    console.log('🔧 Middleware: Unexpected error:', middlewareError);
  }

  // Add performance monitoring headers for debugging
  const duration = Date.now() - start
  response.headers.set('X-Response-Time', `${duration}ms`)
  response.headers.set('X-Timestamp', new Date().toISOString())

  // Add API route metadata
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Pool-Strategy', 'supabase-pgbouncer')
    response.headers.set('X-MarketDZ-Version', '1.0.0')
  }

  console.log('🔧 Middleware: Request completed in', duration, 'ms');
  return response
}

/**
 * Middleware Configuration
 *
 * Runs on all requests EXCEPT:
 * - Static files (_next/static, images, favicon, etc.)
 * - Next.js internal routes (_next/image)
 * - PWA assets (manifest.json, icons/)
 *
 * This ensures auth cookies are refreshed on every page navigation and API call
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}