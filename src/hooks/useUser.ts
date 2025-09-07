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
      console.log('🔍 useUser: Starting authentication check')
      
      // Check real Supabase auth first
      console.log('🔍 useUser: Checking Supabase auth')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('🔍 useUser: Supabase user:', user ? { id: user.id, email: user.email } : null)
      
      if (user) {
        setUser(user);
        console.log('🔍 useUser: Fetching profile for user:', user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log('🔍 useUser: Profile data:', profile)
        setProfile(profile);
        setLoading(false);
        return;
      }

      // Fallback to mock authentication only if no real user
      const mockAuth = getMockAuth();
      console.log('🔍 useUser: No Supabase user, checking mock auth:', mockAuth)
      
      if (mockAuth && mockAuth.authenticated) {
        console.log('✅ useUser: Using mock authentication:', {
          user: mockAuth.user.email,
          profile: `${mockAuth.profile.first_name} ${mockAuth.profile.last_name}`
        })
        setUser(mockAuth.user);
        setProfile(mockAuth.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      
      console.log('🔍 useUser: Setting loading to false')
      setLoading(false);
    };
    
    getUser();
    
    // Also check on window focus (when user returns to tab)
    const handleFocus = () => {
      console.log('🔍 useUser: Window focus detected, rechecking auth')
      getUser();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Listen for mock auth changes
    const handleMockAuthChange = (event: CustomEvent) => {
      console.log('📡 useUser: Mock auth change event received:', event.detail)
      setUser(event.detail.user);
      setProfile(event.detail.profile);
      setLoading(false);
    };

    window.addEventListener('mockAuthChange', handleMockAuthChange as EventListener);
    
    // Listen for real Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user?: User | null } | null) => {
        console.log('🔍 useUser: Supabase auth state change:', event, session?.user?.email)
        setUser(session?.user || null);
        
        if (session?.user) {
          console.log('🔍 useUser: Fetching profile for auth change:', session.user.id)
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('🔍 useUser: Profile from auth change:', profile)
          setProfile(profile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('mockAuthChange', handleMockAuthChange as EventListener);
    };
  }, []);

  return { user, profile, loading };
}