// src/app/chat/[conversationId]/page.tsx - Simple chat page for debugging
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversationMessages } from '@/hooks/useSimpleMessages';
import { useUser } from '@/hooks/useUser';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const conversationId = params.conversationId as string;
  
  const { messages, loading, error, sending, sendMessage, refetch } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 dark:opacity-15 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 dark:opacity-15 animate-pulse [animation-delay:3s]"></div>
        </div>
        <div className="text-center bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-slate-200 dark:border-white/20">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Authentication Required</h1>
          <p className="text-purple-600 dark:text-purple-200 mb-6">Please sign in to access your messages.</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 dark:opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 dark:opacity-15 animate-pulse [animation-delay:3s]"></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md border-b border-slate-200 dark:border-white/20 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/messages')}
              className="text-slate-700 dark:text-white hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
            >
              ← Back to Messages
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Chat</h1>
          </div>
          
          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-white/50 dark:bg-white/20 text-slate-700 dark:text-white rounded-lg hover:bg-white/70 dark:hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>


      <div className="relative z-10 max-w-4xl mx-auto p-4 h-[calc(100vh-200px)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col">
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-300 mb-2">Error loading messages</div>
                <div className="text-sm text-red-500 dark:text-red-200">{error}</div>
                <button
                  onClick={refetch}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💬</div>
                <div className="text-slate-800 dark:text-white text-lg mb-2">No messages yet</div>
                <div className="text-purple-600 dark:text-purple-200">Start the conversation below!</div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice().reverse().map((message) => {
                  const isMyMessage = message.sender_id === user.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isMyMessage
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white'
                        }`}
                      >
                        {!isMyMessage && message.sender && (
                          <div className="text-xs text-purple-600 dark:text-purple-200 mb-1">
                            {message.sender.first_name} {message.sender.last_name}
                          </div>
                        )}
                        <div className="break-words">{message.content}</div>
                        <div className={`text-xs mt-1 ${isMyMessage ? 'text-purple-200' : 'text-purple-600 dark:text-purple-300'}`}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 dark:border-white/20 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 px-4 py-3 bg-white dark:bg-white/20 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-purple-200 rounded-xl border border-slate-300 dark:border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
