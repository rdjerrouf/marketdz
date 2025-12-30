/**
 * Auth Callback API - OAuth & Email Confirmation Handler
 *
 * PURPOSE:
 * - Handles Supabase auth redirects (email verification, OAuth, password reset)
 * - Extracts session from URL and sets auth cookies
 * - Redirects user to intended destination (or homepage)
 *
 * FLOW: User clicks email link → Supabase redirects here → Cookies set → Redirect to app
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const redirect = requestUrl.searchParams.get('redirect') || '/'

  const response = NextResponse.redirect(new URL(redirect, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get the session to trigger cookie setting
  const { data: { session } } = await supabase.auth.getSession()

  console.log('🔑 Auth callback: Setting cookies for session:', session ? 'exists' : 'null')

  return response
}
