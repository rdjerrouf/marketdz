'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import ConversationsList from './ConversationsList'
import ChatInterface from './ChatInterface'
import { MessageCircle } from 'lucide-react'

export default function MessagingInterface() {
  const { user } = useUser()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view messages</h3>
          <p className="text-gray-500">You need to be signed in to access your conversations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-white">
      {/* Conversations sidebar - hidden on mobile when chat is open */}
      <div className={`w-full lg:w-80 lg:border-r lg:border-gray-200 ${
        selectedConversationId && isMobileView ? 'hidden lg:block' : 'block'
      }`}>
        <ConversationsList
          onSelectConversation={(conversationId) => {
            setSelectedConversationId(conversationId)
            setIsMobileView(true)
          }}
          selectedConversationId={selectedConversationId || undefined}
        />
      </div>

      {/* Chat interface - hidden on mobile when no conversation selected */}
      <div className={`flex-1 ${
        !selectedConversationId && isMobileView ? 'hidden lg:block' : 'block'
      }`}>
        {selectedConversationId ? (
          <ChatInterface
            conversationId={selectedConversationId}
            onBack={() => {
              setSelectedConversationId(null)
              setIsMobileView(false)
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a conversation from the sidebar to start chatting, or browse listings to find items you're interested in.
              </p>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Browse Listings
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  View My Listings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
