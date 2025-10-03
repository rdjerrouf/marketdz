// src/lib/admin/auth.ts
import { createClient } from '@supabase/supabase-js'

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support'

export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  permissions: Record<string, any>
  created_at: string
  updated_at: string
  last_login_at?: string
  is_active: boolean
  notes?: string
}

export interface AdminSession {
  id: string
  admin_user_id: string
  session_token: string
  ip_address?: string
  user_agent?: string
  created_at: string
  last_activity_at: string
  expires_at: string
  is_active: boolean
  logout_reason?: string
}

// Create Supabase client for admin operations (client-side)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    }
  )
}

// Check if user is admin and get their role
export async function getAdminUser(userId?: string): Promise<AdminUser | null> {
  const supabase = createAdminClient()

  console.log('🔍 getAdminUser called with userId:', userId)

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  console.log('🔍 getAdminUser query result:', { data, error })

  if (error || !data) {
    console.log('🔍 getAdminUser returning null due to:', error ? error.message : 'no data')
    return null
  }

  return data as AdminUser
}

// Verify admin session and permissions
export async function verifyAdminSession(
  sessionToken: string,
  requiredRole?: AdminRole
): Promise<AdminUser | null> {
  const supabase = createAdminClient()

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('admin_sessions')
    .select(`
      *,
      admin_users (*)
    `)
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (sessionError || !session) {
    return null
  }

  const adminUser = session.admin_users as AdminUser

  // Check role permissions
  if (requiredRole && !hasRole(adminUser.role, requiredRole)) {
    return null
  }

  // Update last activity
  await supabase
    .from('admin_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', session.id)

  // Update admin last login
  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminUser.id)

  return adminUser
}

// Create admin session
export async function createAdminSession(
  adminUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const supabase = createAdminClient()

  // Generate session token
  const sessionToken = generateSessionToken()

  // Set expiry (24 hours for admins, 8 hours for others)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_user_id: adminUserId,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    throw new Error('Failed to create admin session')
  }

  // Log login activity
  await logAdminActivity(adminUserId, 'login', 'system', 'admin_panel', {
    ip_address: ipAddress,
    user_agent: userAgent
  })

  return sessionToken
}

// Logout admin session
export async function logoutAdminSession(
  sessionToken: string,
  reason: 'manual' | 'timeout' | 'security' = 'manual'
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('admin_sessions')
    .update({
      is_active: false,
      logout_reason: reason
    })
    .eq('session_token', sessionToken)
}

// Check role hierarchy
export function hasRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, number> = {
    'support': 1,
    'moderator': 2,
    'admin': 3,
    'super_admin': 4
  }

  return hierarchy[userRole] >= hierarchy[requiredRole]
}

// Log admin activity
export async function logAdminActivity(
  adminUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('admin_activity_logs')
    .insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || {}
    })
}

// Generate secure session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Note: Server-side middleware helper moved to separate file to avoid client/server conflicts

// Permission checking utilities
export function canManageUsers(role: AdminRole): boolean {
  return hasRole(role, 'admin')
}

export function canManageAdmins(role: AdminRole): boolean {
  return role === 'super_admin'
}

export function canViewLogs(role: AdminRole): boolean {
  return hasRole(role, 'admin')
}

export function canModerateContent(role: AdminRole): boolean {
  return hasRole(role, 'moderator')
}

// Clean up expired sessions (call periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('admin_sessions')
    .update({
      is_active: false,
      logout_reason: 'timeout'
    }, { count: 'exact' })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)

  return count || 0
}