// src/app/not-found.tsx
'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        <div className="text-green-600 text-8xl font-bold mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or doesn't exist.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Go Home
          </Link>
          
          <Link
            href="/browse"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Browse Listings
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="block w-full text-green-600 py-2 px-4 hover:text-green-700 transition-colors font-medium"
          >
            ← Go Back
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you think this is a mistake, please{' '}
            <Link href="/help" className="text-green-600 hover:text-green-700">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
