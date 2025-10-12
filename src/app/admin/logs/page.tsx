'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface ActivityLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown> | null
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed' | 'pending'
  created_at: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all')
  const [resourceFilter, setResourceFilter] = useState<'all' | 'users' | 'listings' | 'admin' | 'auth'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      // Mock activity logs data
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          user_id: 'user-123',
          user_email: 'rdjerrouf@gmail.com',
          action: 'login',
          resource_type: 'auth',
          status: 'success',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Mac Intel)',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          details: { method: 'email' }
        },
        {
          id: '2',
          user_id: 'user-456',
          user_email: 'user@example.com',
          action: 'create_listing',
          resource_type: 'listings',
          resource_id: 'listing-789',
          status: 'success',
          ip_address: '192.168.1.101',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          details: { title: 'iPhone 14 Pro', category: 'Electronics', price: 1200 }
        },
        {
          id: '3',
          user_id: 'admin-001',
          user_email: 'rdjerrouf@gmail.com',
          action: 'promote_user',
          resource_type: 'admin',
          resource_id: 'user-456',
          status: 'success',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          details: { target_user: 'user@example.com', new_role: 'moderator' }
        },
        {
          id: '4',
          user_id: 'user-789',
          user_email: 'test@example.com',
          action: 'login',
          resource_type: 'auth',
          status: 'failed',
          ip_address: '192.168.1.102',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          details: { error: 'invalid_credentials', attempts: 3 }
        },
        {
          id: '5',
          user_id: 'user-123',
          user_email: 'rdjerrouf@gmail.com',
          action: 'update_profile',
          resource_type: 'users',
          resource_id: 'user-123',
          status: 'success',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          details: { fields_updated: ['first_name', 'phone'] }
        },
        {
          id: '6',
          user_id: 'user-456',
          user_email: 'user@example.com',
          action: 'delete_listing',
          resource_type: 'listings',
          resource_id: 'listing-123',
          status: 'success',
          ip_address: '192.168.1.101',
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          details: { listing_title: 'Old iPhone', reason: 'sold' }
        },
        {
          id: '7',
          user_id: 'system',
          action: 'cleanup_expired_sessions',
          resource_type: 'admin',
          status: 'success',
          created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          details: { sessions_cleaned: 15 }
        },
        {
          id: '8',
          user_id: 'user-999',
          user_email: 'suspicious@example.com',
          action: 'bulk_message_send',
          resource_type: 'admin',
          status: 'failed',
          ip_address: '192.168.1.103',
          created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
          details: { blocked_reason: 'spam_detection', message_count: 50 }
        }
      ]

      setLogs(mockLogs)
      toast.success('Activity logs loaded')
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'failed': return '❌'
      case 'pending': return '⏳'
      default: return '📝'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getResourceBadgeColor = (resourceType: string) => {
    switch (resourceType) {
      case 'auth': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'users': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'listings': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'admin': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getActionDisplayName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'login': 'User Login',
      'logout': 'User Logout',
      'signup': 'User Registration',
      'create_listing': 'Create Listing',
      'update_listing': 'Update Listing',
      'delete_listing': 'Delete Listing',
      'promote_user': 'Promote User',
      'demote_user': 'Demote User',
      'update_profile': 'Update Profile',
      'change_password': 'Change Password',
      'bulk_message_send': 'Bulk Message Send',
      'cleanup_expired_sessions': 'Session Cleanup'
    }
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false
    if (resourceFilter !== 'all' && log.resource_type !== resourceFilter) return false

    // Date filtering
    if (dateFilter !== 'all') {
      const logDate = new Date(log.created_at)
      const now = new Date()
      const diffMs = now.getTime() - logDate.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      switch (dateFilter) {
        case 'today':
          if (diffHours > 24) return false
          break
        case 'week':
          if (diffHours > 24 * 7) return false
          break
        case 'month':
          if (diffHours > 24 * 30) return false
          break
      }
    }

    return true
  })

  const getLogCounts = () => {
    return {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      pending: logs.filter(l => l.status === 'pending').length
    }
  }

  const counts = getLogCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-2 text-gray-600">
            System activity and audit trail
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">📊</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">✅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-2xl font-bold text-green-600">{counts.success}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">❌</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{counts.failed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl">⏳</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'failed' | 'pending')}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Resource Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Resource:</label>
                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value as 'all' | 'users' | 'listings' | 'admin' | 'auth')}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="auth">Authentication</option>
                  <option value="users">Users</option>
                  <option value="listings">Listings</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-500">
                Showing {filteredLogs.length} of {logs.length} events
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white shadow rounded-lg">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No activity logs found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_email || 'System'}
                          </div>
                          {log.user_id && (
                            <div className="text-xs text-gray-500">ID: {log.user_id}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getStatusIcon(log.status)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getActionDisplayName(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getResourceBadgeColor(log.resource_type)}`}>
                          {log.resource_type}
                        </span>
                        {log.resource_id && (
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {log.resource_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {log.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto max-w-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export and Actions */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Activity logs help track user actions and system events for security and audit purposes.
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => toast.success('Export functionality coming soon')}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => loadLogs()}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}