// Test favorites API endpoint directly
'use client';

import { useState } from 'react';

export default function FavoritesAPITest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test GET favorites
      const response = await fetch('/api/favorites', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: {
          'content-type': response.headers.get('content-type'),
          'set-cookie': response.headers.get('set-cookie')
        }
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setLoading(false);
  };

  const testAddFavorite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: 'test-listing-123'
        })
      });
      const data = await response.json();
      
      setResult({
        action: 'POST /api/favorites',
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    } catch (error) {
      setResult({
        action: 'POST /api/favorites',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">🧪 Favorites API Test</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Test GET /api/favorites
        </button>
        
        <button
          onClick={testAddFavorite}
          disabled={loading}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Test POST /api/favorites
        </button>
      </div>
      
      {loading && <div className="text-sm">Loading...</div>}
      
      {result && (
        <div className="bg-white p-3 rounded border">
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
