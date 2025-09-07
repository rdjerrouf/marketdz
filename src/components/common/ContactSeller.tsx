// src/components/common/ContactSeller.tsx - Simple contact seller button
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStartConversation } from '@/hooks/useSimpleMessages';
import { useUser } from '@/hooks/useUser';

interface ContactSellerProps {
  listingId: string;
  sellerId: string;
  sellerName: string;
  className?: string;
}

export default function ContactSeller({ 
  listingId, 
  sellerId, 
  sellerName, 
  className = '' 
}: ContactSellerProps) {
  const router = useRouter();
  const { user } = useUser();
  const { startConversation, loading, error } = useStartConversation();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  // Don't show button if user is the seller
  if (user && user.id === sellerId) {
    return null;
  }

  const handleContactSeller = () => {
    if (!user) {
      // Redirect to sign in
      router.push(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setInitialMessage(`Hi ${sellerName}, I'm interested in your listing. Is it still available?`);
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!initialMessage.trim()) return;

    console.log('🆕 Starting conversation:', { listingId, sellerId, initialMessage });
    
    const conversation = await startConversation(listingId, sellerId, initialMessage);
    
    if (conversation) {
      console.log('✅ Conversation started, redirecting to chat:', conversation.id);
      router.push(`/chat/${conversation.id}`);
    }
  };

  return (
    <>
      <button
        onClick={handleContactSeller}
        className={`
          px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 
          text-white rounded-lg hover:from-green-600 hover:to-emerald-600 
          transition-all duration-200 transform hover:scale-105 
          font-medium shadow-lg
          ${className}
        `}
      >
        💬 Contact Seller
      </button>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Contact {sellerName}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your message:
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Type your message here..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!initialMessage.trim() || loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
            
            {/* Debug Info */}
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600 font-mono">
              <div>Listing ID: {listingId}</div>
              <div>Seller ID: {sellerId}</div>
              <div>User ID: {user?.id || 'None'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
