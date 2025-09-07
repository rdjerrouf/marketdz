// src/hooks/useUser.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      console.log('🔍 useUser: Starting authentication check')
      
      // Check Supabase authentication
      const { data: { user } } = await supabase.auth.getUser()
      console.log('🔍 useUser: Supabase user:', user ? { id: user.id, email: user.email } : null)
      
      setUser(user);
      
      if (user) {
        console.log('🔍 useUser: Fetching profile for user:', user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log('🔍 useUser: Profile data:', profile)
        setProfile(profile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    };
    
    getUser();
    
    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
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
    };
  }, []);

  return { user, profile, loading };
}