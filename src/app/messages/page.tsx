// src/app/messages/page.tsx - Simple messaging interface
'use client';

import { useRouter } from 'next/navigation';
import { useConversations } from '@/hooks/useSimpleMessages';
import { useUser } from '@/hooks/useUser';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useUser();
  const { conversations, loading, error, refetch } = useConversations();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        </div>
        
        <div className="relative z-10 text-center bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
          <h1 className="text-2xl font-bold mb-4 text-white">Please sign in</h1>
          <p className="text-white/80">You need to be signed in to access messages.</p>
          <button
            onClick={() => router.push('/signin')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 min-h-screen">
        {/* Header */}
        <div className="mb-8 pt-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white/80 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">💬 Messages</h1>
            <p className="text-purple-200">Your conversations with other users</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-6 bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-white text-sm font-mono space-y-1">
            <div>User ID: {user.id}</div>
            <div>Conversations: {conversations.length}</div>
            <div>Loading: {loading ? 'true' : 'false'}</div>
            {error && <div className="text-red-300">Error: {error}</div>}
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Messages Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Messages</h2>
              <p className="text-red-300 mb-6">{error}</p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Messages Yet</h2>
              <p className="text-purple-200 mb-6">
                Start conversations by contacting sellers on listings you're interested in.
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 font-medium"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Your Conversations ({conversations.length})</h2>
              
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                        {conversation.other_user?.avatar_url ? (
                          <img
                            src={conversation.other_user.avatar_url}
                            alt="User"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {conversation.other_user?.first_name?.[0]}{conversation.other_user?.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      
                      {/* Conversation Info */}
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors">
                          {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                        </h3>
                        <p className="text-purple-300 text-sm">
                          {conversation.listing_id ? 'About a listing' : 'General conversation'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-right">
                      <div className="text-purple-200 text-sm">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </div>
                      <div className="text-purple-300 text-xs">
                        {new Date(conversation.last_message_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Debug Info */}
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-purple-300 font-mono">
                    ID: {conversation.id} | Status: {conversation.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
