// src/hooks/useUser.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getMockAuth } from '@/lib/auth/mockAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      // First check for mock authentication
      const mockAuth = getMockAuth();
      if (mockAuth && mockAuth.authenticated) {
        setUser(mockAuth.user);
        setProfile(mockAuth.profile);
        setLoading(false);
        return;
      }

      // Otherwise check real Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
      
      setLoading(false);
    };
    
    getUser();
    
    // Listen for mock auth changes
    const handleMockAuthChange = (event: CustomEvent) => {
      setUser(event.detail.user);
      setProfile(event.detail.profile);
      setLoading(false);
    };

    window.addEventListener('mockAuthChange', handleMockAuthChange as EventListener);
    
    // Listen for real Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user?: User | null } | null) => {
        // Only update if we don't have mock auth active
        const mockAuth = getMockAuth();
        if (!mockAuth || !mockAuth.authenticated) {
          setUser(session?.user || null);
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setProfile(profile);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mockAuthChange', handleMockAuthChange as EventListener);
    };
  }, []);

  return { user, profile, loading };
}