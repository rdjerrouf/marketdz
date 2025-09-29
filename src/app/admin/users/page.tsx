// src/app/admin/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sendPushNotification, NotificationTemplates } from '@/lib/notifications/push'

interface User {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  city: string | null
  wilaya: string | null
  created_at: string
  updated_at: string
  status?: 'active' | 'suspended' | 'banned'
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const usersPerPage = 20

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Use the new admin API instead of direct database access
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        search: searchTerm,
        status: filterStatus
      })

      // Get current session for Authorization header
      const { data: { session } } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/admin/user-management?${params}`, {
        credentials: 'include',
        headers
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)

    } catch (error) {
      console.error('Error fetching users:', error)
      setActionMessage(`❌ Error loading users: ${error.message || error}`)
      setTimeout(() => setActionMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    try {
      // Map action to status value
      const statusValue = action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned'

      // Use the new admin API
      const { data: { session } } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/admin/user-management', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          action: 'updateStatus',
          userId: userId,
          newStatus: statusValue
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status')
      }

      // Show success message
      setActionMessage(`✅ ${data.message}`)
      setTimeout(() => setActionMessage(null), 3000)

      // Send notification to user
      const user = users.find(u => u.id === userId)
      if (user) {
        let notificationPayload

        switch (action) {
          case 'suspend':
            notificationPayload = {
              title: 'Account Suspended',
              body: 'Your account has been temporarily suspended. Contact support for more information.',
              icon: '/icons/warning.png'
            }
            break
          case 'activate':
            notificationPayload = {
              title: 'Account Activated',
              body: 'Your account has been reactivated. Welcome back!',
              icon: '/icons/success.png'
            }
            break
          case 'ban':
            notificationPayload = {
              title: 'Account Banned',
              body: 'Your account has been permanently banned.',
              icon: '/icons/error.png'
            }
            break
        }

        try {
          await sendPushNotification(userId, notificationPayload)
        } catch (notifError) {
          console.log('Notification failed (non-critical):', notifError)
        }
      }

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      setActionMessage(`❌ Error: ${error.message || error}`)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  const handleBulkAction = async (action: 'notify' | 'suspend' | 'activate') => {
    try {
      if (action === 'notify') {
        // Send bulk notification
        const payload = {
          title: 'Important Announcement',
          body: 'Please check the latest updates in the app.',
          icon: '/icons/announcement.png'
        }

        for (const userId of selectedUsers) {
          await sendPushNotification(userId, payload)
        }
      } else {
        // Handle bulk suspend/activate
        for (const userId of selectedUsers) {
          await handleUserAction(userId, action)
        }
      }

      setSelectedUsers([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and moderate platform users</p>
          {actionMessage && (
            <div className="mt-2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md text-sm">
              {actionMessage}
            </div>
          )}
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Bulk Actions
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Menu */}
      {showBulkActions && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('notify')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Send Notification
            </button>
            <button
              onClick={() => handleBulkAction('suspend')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
            >
              Suspend Users
            </button>
            <button
              onClick={() => handleBulkAction('activate')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Activate Users
            </button>
            <button
              onClick={() => setShowBulkActions(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
              {filterStatus === 'all' && users.length > 0 && !users[0]?.status && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Needs Migration
                </span>
              )}
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={users.length > 0 && !users[0]?.status}
            >
              <option value="all">All Users ({users.length})</option>
              <option value="active">✅ Active Users</option>
              <option value="suspended">⚠️ Suspended Users</option>
              <option value="banned">🚫 Banned Users</option>
            </select>
            {users.length > 0 && !users[0]?.status && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Status feature not available</strong><br/>
                  Run database migration: <code className="bg-orange-100 px-1 rounded">20250928000002_add_user_status_column.sql</code>
                </p>
              </div>
            )}
            {filterStatus === 'suspended' && users[0]?.status && (
              <p className="text-sm text-yellow-600 mt-1">
                💡 Showing suspended users - you can unsuspend them here
              </p>
            )}
            {filterStatus === 'banned' && users[0]?.status && (
              <p className="text-sm text-red-600 mt-1">
                💡 Showing banned users - you can unban them here
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    title="Select all users"
                    aria-label="Select all users"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                    checked={selectedUsers.length === users.length && users.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      title={`Select user ${user.first_name} ${user.last_name}`}
                      aria-label={`Select user ${user.first_name} ${user.last_name}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.id.slice(-8)}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.city || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{user.wilaya || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.status === 'banned'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Show appropriate actions based on user status */}
                    {user.status === undefined ? (
                      /* If status column doesn't exist, show basic actions */
                      <div className="text-xs text-gray-500 italic">
                        Migration needed for user actions
                      </div>
                    ) : (
                      <>
                        {(!user.status || user.status === 'active') && (
                          <>
                            <button
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded border border-yellow-300 hover:bg-yellow-50"
                              title="Suspend this user"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'ban')}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                              title="Ban this user permanently"
                            >
                              Ban
                            </button>
                          </>
                        )}

                        {user.status === 'suspended' && (
                          <>
                            <button
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded border border-green-300 hover:bg-green-50 font-medium"
                              title="Reactivate this suspended user"
                            >
                              ✓ Unsuspend
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'ban')}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                              title="Ban this user permanently"
                            >
                              Ban
                            </button>
                          </>
                        )}

                        {user.status === 'banned' && (
                          <button
                            onClick={() => handleUserAction(user.id, 'activate')}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50 font-medium"
                            title="Unban and reactivate this user"
                          >
                            ✓ Unban
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
