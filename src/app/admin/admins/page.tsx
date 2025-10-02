'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AdminUser, AdminRole } from '@/lib/admin/auth'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // For now, show placeholder data until API authentication is fully resolved
      console.log('Loading admin data with placeholder approach...')

      // Mock current admin (you)
      const mockCurrentAdmin: AdminUser = {
        id: 'legacy',
        user_id: 'current-user',
        role: 'admin' as AdminRole,
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }

      // Mock data for display
      setAllUsers([
        {
          id: 'user-1',
          email: 'rdjerrouf@gmail.com',
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString()
        },
        {
          id: 'user-2',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          email_confirmed_at: 'Not confirmed'
        }
      ])

      setAdminUsers([mockCurrentAdmin])

      setCurrentAdmin(mockCurrentAdmin)

      toast.success('Admin data loaded (using placeholder data)')
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const promoteToAdmin = async (userId: string, role: AdminRole = 'moderator') => {
    if (!currentAdmin || !['super_admin', 'admin'].includes(currentAdmin.role)) {
      toast.error('You do not have permission to promote users')
      return
    }

    // For now, show demo message until API is fully working
    toast.success(`Demo: Would promote user ${userId} to ${role} (API pending session fix)`)
  }

  const updateAdminRole = async (adminUserId: string, newRole: AdminRole) => {
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      toast.error('Only super admins can change roles')
      return
    }

    // For now, show demo message until API is fully working
    toast.success(`Demo: Would update admin ${adminUserId} to role ${newRole} (API pending session fix)`)
  }

  const deactivateAdmin = async (adminUserId: string) => {
    if (!currentAdmin || !['super_admin', 'admin'].includes(currentAdmin.role)) {
      toast.error('You do not have permission to deactivate admins')
      return
    }

    // For now, show demo message until API is fully working
    toast.success(`Demo: Would deactivate admin ${adminUserId} (API pending session fix)`)
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-300'
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'moderator': return 'bg-green-100 text-green-800 border-green-300'
      case 'support': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage admin users and their roles. Current role:
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentAdmin?.role || 'support')}`}>
              {currentAdmin?.role || 'None'}
            </span>
          </p>
        </div>

        {/* Current Admin Users */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Admin Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Current Admin
                        </div>
                        <div className="text-sm text-gray-500">admin@marketdz.com</div>
                        <div className="text-xs text-gray-400">ID: {admin.user_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.is_active
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {currentAdmin?.role === 'super_admin' && admin.id !== currentAdmin.id && (
                        <div className="flex space-x-2">
                          <select
                            onChange={(e) => updateAdminRole(admin.id, e.target.value as AdminRole)}
                            value={admin.role}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="support">Support</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          {admin.is_active && (
                            <button
                              onClick={() => deactivateAdmin(admin.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users - Promote to Admin */}
        {(currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin') && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Users (Promote to Admin)</h2>
              <p className="text-sm text-gray-600">Select users to promote to admin roles</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers
                    .filter(user => !adminUsers.some(admin => admin.user_id === user.id))
                    .map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.email_confirmed_at !== 'Not confirmed'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}>
                          {user.email_confirmed_at !== 'Not confirmed' ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => promoteToAdmin(user.id, 'moderator')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Make Moderator
                          </button>
                          {currentAdmin?.role === 'super_admin' && (
                            <button
                              onClick={() => promoteToAdmin(user.id, 'admin')}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Setup Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Quick Setup for Your Account</h3>
          <p className="text-blue-700 mb-4">
            If you need to make yourself a super admin, run this SQL in your Supabase Dashboard:
          </p>
          <div className="bg-blue-900 text-blue-100 p-4 rounded font-mono text-sm overflow-x-auto">
            {`-- Make your account super admin
INSERT INTO public.admin_users (user_id, role, notes)
VALUES (
  'YOUR_USER_ID_HERE',
  'super_admin',
  'Initial super admin setup'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();`}
          </div>
          <p className="text-blue-600 text-sm mt-2">
            Replace YOUR_USER_ID_HERE with your actual user ID from the table above.
          </p>
        </div>
      </div>
    </div>
  )
}