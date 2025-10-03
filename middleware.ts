// middleware.ts - Handle Supabase authentication for API routes
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const start = Date.now() // Add performance timing
  console.log('🔧 Middleware: Processing request to:', request.nextUrl.pathname);
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'marketdz-auth', // Match client-side storage key
        flowType: 'pkce' // Match client-side flow type
      },
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          console.log('🔧 Middleware: Current cookies:', cookies.map(c => c.name));
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log('🔧 Middleware: Setting cookies:', cookiesToSet.map(c => c.name));
          const isProd = process.env.NODE_ENV === 'production'
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: isProd,
              sameSite: 'lax',
              domain: undefined, // Let browser handle domain automatically
              path: '/'
            })
          })
        },
      },
    }
  )

  // Try to get user session with proper error handling
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    // Enhanced logging for authentication status
    console.log('🔧 Middleware: Auth Status:', {
      isAuthenticated: !!user,
      userId: user?.id?.slice(-8) || 'none',
      email: user?.email || 'none',
      metadata: user?.user_metadata || 'none'
    });

    if (error) {
      // Only log non-standard auth errors
      if (!error.message.includes('Auth session missing') &&
          !error.message.includes('Invalid Refresh Token') &&
          !error.message.includes('Refresh Token Not Found')) {
        console.log('🔧 Middleware: Auth error:', error.message);
      }
      // Don't process user as authenticated if there's an error
    } else if (user) {
      console.log('🔧 Middleware: User authenticated:', { id: user.id.slice(-8), email: user.email });
    } else {
      console.log('🔧 Middleware: No authenticated user');
    }

    // Protect admin routes
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/admin')) {
      if (!user) {
        console.log('🔒 Middleware: Redirecting unauthenticated user from /admin to signin')
        return NextResponse.redirect(new URL('/signin?redirect=/admin', request.url))
      }

      // Check admin_users table (proper RBAC - Supabase AI recommended approach)
      let isAdmin = false
      let adminCheckMethod = 'none'

      try {
        // Lean SELECT 1 query - Supabase AI recommended
        const { data: adminRows, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('role', ['super_admin', 'admin', 'moderator'])
          .limit(1)

        if (adminError) {
          console.warn('⚠️ Admin DB check error:', adminError.message, adminError.code)
        } else if (adminRows && adminRows.length > 0) {
          isAdmin = true
          adminCheckMethod = 'database'
          console.log('✅ Admin verified via database')
        }
      } catch (dbError) {
        console.warn('⚠️ Database admin check failed:', dbError)
      }

      // Fallback 1: Check user metadata (legacy)
      if (!isAdmin) {
        if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
          isAdmin = true
          adminCheckMethod = 'metadata'
          console.log('✅ Admin verified via metadata')
        }
      }

      // Fallback 2: Bootstrap allowlist (TEMPORARY - TODO: REMOVE AFTER SEEDING)
      if (!isAdmin) {
        const BOOTSTRAP_ADMINS = ['rdjerrouf@gmail.com', 'anyadjerrouf@gmail.com']
        const isBootstrapAdmin = BOOTSTRAP_ADMINS.includes(user.email || '') &&
                                 user.app_metadata?.provider !== 'anonymous'

        if (isBootstrapAdmin) {
          isAdmin = true
          adminCheckMethod = 'bootstrap'
          console.warn('⚠️ BOOTSTRAP: Allowing admin via temporary allowlist:', user.email)
          console.warn('⚠️ ACTION REQUIRED: Run "node scripts/seed-admin-user.js" and remove bootstrap fallback')
        }
      }

      if (!isAdmin) {
        console.log('🔒 Middleware: User authenticated but not admin, redirecting to homepage:', {
          email: user.email,
          metadata: user.user_metadata,
          appMetadata: user.app_metadata
        })
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log(`🔒 Middleware: Allowing admin access to /admin (method: ${adminCheckMethod})`)
    }
  } catch (middlewareError) {
    // Catch any unexpected errors in auth processing
    console.log('🔧 Middleware: Unexpected auth error:', middlewareError);
  }

  // Add performance monitoring headers
  const duration = Date.now() - start
  response.headers.set('X-Response-Time', `${duration}ms`)
  response.headers.set('X-Timestamp', new Date().toISOString())
  
  // Add connection pool info for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Pool-Strategy', 'supabase-pgbouncer')
    response.headers.set('X-MarketDZ-Version', '1.0.0')
  }

  console.log('🔧 Middleware: Request completed in', duration, 'ms');
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - icons/ (PWA icons directory)
     * - images - public images
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}