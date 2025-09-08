'use client'

import { useState } from 'react'
import { useRealtimeConversations } from '@/hooks/useRealtime'
import { MessageCircle, Search, Plus, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string | null
  last_message_id: string | null
  last_message_at: string
  buyer_unread_count: number
  seller_unread_count: number
  status: string
  created_at: string
  updated_at: string
  buyer?: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  seller?: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  listing?: {
    title: string
    photos: string[]
  }
}

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void
  selectedConversationId?: string
}

export default function ConversationsList({ onSelectConversation, selectedConversationId }: ConversationsListProps) {
  const { conversations, loading } = useRealtimeConversations()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    const buyerName = `${conversation.buyer?.first_name} ${conversation.buyer?.last_name}`.toLowerCase()
    const sellerName = `${conversation.seller?.first_name} ${conversation.seller?.last_name}`.toLowerCase()
    const listingTitle = conversation.listing?.title?.toLowerCase() || ''
    
    return buyerName.includes(query) || sellerName.includes(query) || listingTitle.includes(query)
  })

  const getOtherParticipant = (conversation: Conversation, currentUserId: string) => {
    return conversation.buyer_id === currentUserId ? conversation.seller : conversation.buyer
  }

  const getUnreadCount = (conversation: Conversation, currentUserId: string) => {
    return conversation.buyer_id === currentUserId 
      ? conversation.buyer_unread_count 
      : conversation.seller_unread_count
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          </div>
          <button 
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title="New conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or start a new conversation.
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-6">
                  Start chatting with buyers and sellers about listings.
                </p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Listings
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation: Conversation) => {
              const otherParticipant = getOtherParticipant(conversation, 'current-user-id') // You'll need to get actual user ID
              const unreadCount = getUnreadCount(conversation, 'current-user-id')
              const isSelected = conversation.id === selectedConversationId

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {otherParticipant ? 
                        `${otherParticipant.first_name[0]}${otherParticipant.last_name[0]}` : 
                        '??'
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant ? 
                            `${otherParticipant.first_name} ${otherParticipant.last_name}` : 
                            'Unknown User'
                          }
                        </h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Listing info */}
                      {conversation.listing && (
                        <p className="text-xs text-blue-600 mb-1 truncate">
                          📍 {conversation.listing.title}
                        </p>
                      )}

                      {/* Last message preview */}
                      <p className="text-sm text-gray-600 truncate">
                        Click to view conversation
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
