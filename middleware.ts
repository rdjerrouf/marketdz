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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: false,
              secure: false,
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
     * - images - public images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
