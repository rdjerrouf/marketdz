// Quick test component to verify favorites improvements
'use client';

import { useAuth, useFavoriteStatus } from '@/hooks/useFavorites';

export default function FavoritesTest() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isFavorited, loading, toggleFavorite } = useFavoriteStatus('test-listing-id');

  const handleTest = async () => {
    const result = await toggleFavorite();
    console.log('Toggle result:', result);
  };

  if (authLoading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="p-4 border rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-4">Favorites System Test</h3>
      
      <div className="space-y-2">
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user?.email || 'None'}</p>
        <p><strong>Test Listing Favorited:</strong> {isFavorited ? 'Yes' : 'No'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Toggle Favorite
        </button>
      </div>
    </div>
  );
}
