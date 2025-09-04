// Debug authentication component
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useFavorites';

export default function AuthDebug() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSessionInfo({
        session: session,
        user: session?.user,
        error: error,
        accessToken: session?.access_token ? 'Present' : 'Missing'
      });
    };
    
    checkSession();
  }, []);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">🔍 Authentication Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>useAuth Hook:</strong></div>
        <div>- Loading: {loading ? 'Yes' : 'No'}</div>
        <div>- Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>- User ID: {user?.id || 'None'}</div>
        <div>- User Email: {user?.email || 'None'}</div>
        
        <div className="mt-4"><strong>Direct Session Check:</strong></div>
        <div>- Session exists: {sessionInfo?.session ? 'Yes' : 'No'}</div>
        <div>- User ID: {sessionInfo?.user?.id || 'None'}</div>
        <div>- Access Token: {sessionInfo?.accessToken || 'Missing'}</div>
        <div>- Error: {sessionInfo?.error?.message || 'None'}</div>
      </div>
      
      <button
        onClick={() => window.location.reload()}
        className="mt-3 bg-blue-500 text-white px-3 py-1 rounded text-sm"
      >
        Refresh Debug
      </button>
    </div>
  );
}
