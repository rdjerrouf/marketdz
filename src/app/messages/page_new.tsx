'use client'

import { useUser } from '@/hooks/useUser'
import MessagingInterface from '@/components/chat/MessagingInterface'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MessagesPageNew() {
  const { loading } = useUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="h-96 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-2">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Chat with buyers and sellers about your listings</p>
        </div>

        {/* Messaging Interface */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden min-h-[calc(100vh-200px)]">
          <MessagingInterface />
        </div>
      </div>
    </div>
  )
}
