// src/app/messages/page.tsx - Main messaging interface
'use client';

import { useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useUser } from '@/hooks/useUser';

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
}

const MessageInput = ({ onSend, isLoading }: MessageInputProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSend(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!content.trim() || isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default function MessagesPage() {
  const { user } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const {
    conversations,
    messages,
    isLoading,
    isLoadingMessages,
    hasMoreMessages,
    error,
    sendMessage,
    loadOlderMessages,
    clearError
  } = useMessages(selectedConversationId || undefined);

  const handleSendMessage = async (content: string) => {
    if (selectedConversationId) {
      await sendMessage(selectedConversationId, content);
    }
  };

  const handleLoadMore = () => {
    if (selectedConversationId && hasMoreMessages && !isLoadingMessages) {
      loadOlderMessages(selectedConversationId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-red-700">{error}</span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            
            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No conversations yet</div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                      selectedConversationId === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                        </h3>
                        {conversation.last_message && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.last_message.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Unread indicator */}
                      {((conversation.buyer_id === user.id && conversation.buyer_unread_count > 0) ||
                        (conversation.seller_id === user.id && conversation.seller_unread_count > 0)) && (
                        <div className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                          {conversation.buyer_id === user.id 
                            ? conversation.buyer_unread_count 
                            : conversation.seller_unread_count}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            {selectedConversationId ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold">
                    {conversations.find(c => c.id === selectedConversationId)?.other_user?.first_name}{' '}
                    {conversations.find(c => c.id === selectedConversationId)?.other_user?.last_name}
                  </h2>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Load More Button */}
                  {hasMoreMessages && (
                    <div className="text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMessages}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        {isLoadingMessages ? 'Loading...' : 'Load older messages'}
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString()}
                          {message.sender_id === user.id && (
                            <span className="ml-2">
                              {message.read_at ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoadingMessages && messages.length === 0 && (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  )}
                </div>

                {/* Message Input */}
                <MessageInput onSend={handleSendMessage} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
