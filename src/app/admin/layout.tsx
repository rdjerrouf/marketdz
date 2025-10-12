// src/app/admin/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { AdminUser, AdminRole, getAdminUser, createAdminSession, verifyAdminSession } from '@/lib/admin/auth'
import type { User } from '@supabase/supabase-js'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Simple icon components (replace with your preferred icon library)
const HomeIcon = () => <span>🏠</span>
const UsersIcon = () => <span>👥</span>
const DocumentTextIcon = () => <span>📄</span>
const ChartBarIcon = () => <span>📊</span>
const CurrencyDollarIcon = () => <span>💰</span>
const BellIcon = () => <span>🔔</span>
const CogIcon = () => <span>⚙️</span>
const ShieldCheckIcon = () => <span>🛡️</span>
const KeyIcon = () => <span>🔑</span>
const LogIcon = () => <span>📋</span>

export default function AdminLayout({ children }: AdminLayoutProps) {
  console.log('🔥 ADMIN LAYOUT IS LOADING! This should appear in console!')
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()

    // Set up session timeout warning
    const interval = setInterval(checkSessionExpiry, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const checkAdminAccess = async () => {
    try {
      console.log('🚨 ADMIN LAYOUT BREAKPOINT 1: Starting checkAdminAccess')

      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('🚨 ADMIN LAYOUT BREAKPOINT 2: getUser() result')
      console.log('👤 User:', user ? { id: user.id, email: user.email } : null)
      console.log('❌ Error:', error)

      if (error || !user) {
        console.log('🚨 ADMIN LAYOUT BREAKPOINT 3: No user, redirecting to signin')
        router.push('/signin?redirect=/admin')
        return
      }

      console.log('🚨 ADMIN LAYOUT BREAKPOINT 4: User found, setting user state')
      setUser(user)

      // Check if user is admin - first try direct database check
      console.log('🚨 ADMIN LAYOUT BREAKPOINT 5: Checking admin access')
      console.log('🔍 Checking admin access for user:', { id: user.id, email: user.email })

      // Use API route to check admin status (bypasses client-side RLS issues)
      try {
        console.log('🚨 ADMIN LAYOUT BREAKPOINT 6: Calling admin status API')
        console.log('🔄 Making fetch request to /api/admin/check-status')
        console.log('🍪 Current document cookies:', document.cookie)

        // Get the current session to include Authorization header
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔑 Current session:', session ? 'exists' : 'null')

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add Authorization header if we have a session
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
          console.log('🔑 Adding Authorization header with token')
        }

        const response = await fetch('/api/admin/check-status', {
          credentials: 'include', // Ensure cookies are sent
          headers
        })

        console.log('🚨 ADMIN LAYOUT BREAKPOINT 7: API response received')
        console.log('📊 Response status:', response.status)
        console.log('📊 Response ok:', response.ok)

        if (response.ok) {
          console.log('🚨 ADMIN LAYOUT BREAKPOINT 8: Response OK, parsing JSON')
          const adminStatus = await response.json()
          console.log('🚨 ADMIN LAYOUT BREAKPOINT 9: JSON parsed')
          console.log('📋 API Response:', adminStatus)

          if (adminStatus.isAdmin && adminStatus.method === 'database') {
            console.log('✅ Admin access granted (database method via API)')
            setAdminUser(adminStatus.adminUser)
            return
          }
        } else {
          console.log('⚠️ API call failed:', response.status, response.statusText)
        }
      } catch (apiError) {
        console.log('❌ API call error:', apiError)
      }

      // Fallback: Check admin_users table directly when API fails
      console.log('🔄 API failed, checking admin_users table directly...')

      try {
        // admin_users table is not in generated types, requires type assertion
        const { data: adminRecord, error: dbError } = await (supabase as any)
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (dbError || !adminRecord) {
          console.log('❌ No admin record found in database')
          router.push('/')
          return
        }

        // Create admin user object from database record
        const directAdmin: AdminUser = {
          id: adminRecord.id,
          user_id: adminRecord.user_id,
          role: adminRecord.role as AdminRole,
          permissions: adminRecord.permissions || {},
          created_at: adminRecord.created_at,
          updated_at: adminRecord.updated_at,
          is_active: adminRecord.is_active !== false
        }

        console.log('✅ Admin access granted (direct database method)')
        console.log('👤 Admin role:', adminRecord.role)
        setAdminUser(directAdmin)

      } catch (dbError) {
        console.log('❌ Database check failed:', dbError)

        // Final fallback to legacy email approach
        const adminEmails = [
          'admin@marketdz.com',
          'moderator@marketdz.com',
          'test@example.com',
          'ryad@marketdz.com',
          'rdjerrouf@gmail.com',
          'anyadjerrouf@gmail.com'
        ]

        const isLegacyAdmin = adminEmails.includes(user.email || '')

        if (!isLegacyAdmin) {
          console.log('❌ User not in admin emails list')
          router.push('/')
          return
        }

        // Create legacy admin user object
        const legacyAdmin: AdminUser = {
          id: 'legacy',
          user_id: user.id,
          role: 'admin' as AdminRole,
          permissions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }

        console.log('⚠️ Admin access granted (legacy method - migration needed)')
        setAdminUser(legacyAdmin)
      }

    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const createNewAdminSession = async (adminUserId: string) => {
    try {
      const sessionToken = await createAdminSession(
        adminUserId,
        // Get IP would require server-side implementation
        undefined,
        navigator.userAgent
      )

      localStorage.setItem('admin_session_token', sessionToken)

      // Set session expiry (24 hours)
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + 24)
      setSessionExpiry(expiry)

    } catch (error) {
      console.error('Failed to create admin session:', error)
    }
  }

  const checkSessionExpiry = () => {
    if (sessionExpiry && new Date() > sessionExpiry) {
      handleSessionTimeout()
    }
  }

  const handleSessionTimeout = () => {
    localStorage.removeItem('admin_session_token')
    setAdminUser(null)
    router.push('/admin/login?reason=timeout')
  }

  const handleSignOut = async () => {
    try {
      // Logout admin session
      const sessionToken = localStorage.getItem('admin_session_token')
      if (sessionToken) {
        // Import logout function
        const { logoutAdminSession } = await import('@/lib/admin/auth')
        await logoutAdminSession(sessionToken, 'manual')
      }

      localStorage.removeItem('admin_session_token')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Force logout anyway
      localStorage.removeItem('admin_session_token')
      router.push('/')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      case 'support': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/admin', icon: HomeIcon },
      { name: 'Users', href: '/admin/users', icon: UsersIcon },
      { name: 'Listings', href: '/admin/listings', icon: DocumentTextIcon },
      { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    ]

    // Add role-specific navigation
    if (adminUser?.role === 'super_admin' || adminUser?.role === 'admin') {
      baseNavigation.push(
        { name: 'Admin Management', href: '/admin/admins', icon: KeyIcon },
        { name: 'Activity Logs', href: '/admin/logs', icon: LogIcon },
        { name: 'Revenue', href: '/admin/revenue', icon: CurrencyDollarIcon }
      )
    }

    baseNavigation.push(
      { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
      { name: 'Settings', href: '/admin/settings', icon: CogIcon }
    )

    return baseNavigation
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!adminUser) {
    return null
  }

  const navigation = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>

        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-green-600 flex-shrink-0">
          <div className="flex items-center">
            <ShieldCheckIcon />
            <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 overflow-y-auto">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <item.icon />
              <span className="ml-3">{item.name}</span>
            </a>
          ))}
        </nav>

        {/* User Info */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(adminUser.role)}`}>
                  {adminUser.role.replace('_', ' ')}
                </span>
                {adminUser.id === 'legacy' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    Legacy
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Session expiry warning */}
          {sessionExpiry && (
            <div className="mt-2 text-xs text-gray-500">
              Session expires: {sessionExpiry.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              {/* Session warning */}
              {sessionExpiry && new Date() > new Date(sessionExpiry.getTime() - 30 * 60 * 1000) && (
                <div className="text-orange-600 text-sm">
                  ⚠️ Session expires soon
                </div>
              )}

              <button
                className="text-gray-500 hover:text-gray-700"
                title="Notifications"
                aria-label="View notifications"
              >
                <BellIcon />
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Migration notice - only show for truly legacy users who aren't in database yet */}
        {adminUser.id === 'legacy' && adminUser.user_id !== '407b4e2f-2c18-4e45-b0b0-9d183b2893be' && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <strong>Migration Required:</strong> You're using legacy email-based admin access.
                  Please contact a super admin to migrate to the new role-based system for enhanced security.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}