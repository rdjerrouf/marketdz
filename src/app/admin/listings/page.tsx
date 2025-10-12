// src/app/admin/listings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  description: string | null
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  subcategory: string | null
  status: 'active' | 'sold' | 'expired' | 'rented' | 'completed'
  location_city: string
  location_wilaya: string
  created_at: string
  user_id: string
  photos: string[]
  metadata: Record<string, unknown> | null
  profiles?: {
    first_name: string
    last_name: string
    email?: string
  }
}

export default function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'expired' | 'rented' | 'completed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedListings, setSelectedListings] = useState<string[]>([])

  const listingsPerPage = 20

  useEffect(() => {
    fetchListings()
  }, [currentPage, searchTerm, filterStatus])

  const fetchListings = async () => {
    try {
      setLoading(true)

      // LEAN APPROACH: Always filter by status first to use index efficiently
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .range((currentPage - 1) * listingsPerPage, currentPage * listingsPerPage - 1)
        .order('created_at', { ascending: false })
        .limit(listingsPerPage) // Hard limit for cost control

      // Always apply status filter to use compound index
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      } else {
        // Default to active listings when no filter to use index
        query = query.in('status', ['active', 'sold', 'expired', 'rented', 'completed'])
      }

      if (searchTerm) {
        // Use FTS for better performance with bilingual support
        query = query.or(`search_vector_ar.fts.${searchTerm},search_vector_fr.fts.${searchTerm}`)
      }

      const { data, error, count } = await query

      if (error) throw error

      setListings(data || [])
      setTotalPages(Math.ceil((count || 0) / listingsPerPage))

    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleListingAction = async (listingId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const updateData: any = {}
      
      switch (action) {
        case 'approve':
          updateData.status = 'active'
          break
        case 'reject':
          updateData.status = 'expired'
          break
        case 'delete':
          const { error: deleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId)
          
          if (deleteError) throw deleteError
          fetchListings()
          return
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('listings')
          .update(updateData)
          .eq('id', listingId)

        if (error) throw error
      }

      fetchListings()
    } catch (error) {
      console.error('Error updating listing:', error)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('listings')
          .delete()
          .in('id', selectedListings)

        if (error) throw error
      } else {
        const status = action === 'approve' ? 'active' : 'expired'
        const { error } = await supabase
          .from('listings')
          .update({ status })
          .in('id', selectedListings)

        if (error) throw error
      }

      setSelectedListings([])
      fetchListings()
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const toggleListingSelection = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' DA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Listings Management</h1>
          <p className="text-gray-600">Review and moderate platform listings</p>
        </div>
        
        {selectedListings.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedListings.length} selected</span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Listings
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Listings</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    aria-label="Select all listings"
                    title="Select all listings"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedListings(listings.map(l => l.id))
                      } else {
                        setSelectedListings([])
                      }
                    }}
                    checked={selectedListings.length === listings.length && listings.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label={`Select listing: ${listing.title}`}
                      title={`Select listing: ${listing.title}`}
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => toggleListingSelection(listing.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {listing.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {listing.category}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {listing.description?.substring(0, 100)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {listing.profiles?.first_name} {listing.profiles?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">ID: {listing.user_id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {listing.price ? formatPrice(listing.price) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.location_city}</div>
                    <div className="text-sm text-gray-500">{listing.location_wilaya}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(listing.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {(listing.status as any) === 'pending' && (
                        <>
                          <button
                            onClick={() => handleListingAction(listing.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleListingAction(listing.id, 'reject')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleListingAction(listing.id, 'delete')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
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
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNumber
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}