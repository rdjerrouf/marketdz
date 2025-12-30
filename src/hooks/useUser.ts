/**
 * useUser Hook - Combines Auth User with Profile Data
 *
 * WHY THIS EXISTS:
 * - Auth user only has email/id (from Supabase Auth)
 * - Profile data (name, avatar, location) lives in profiles table
 * - This hook merges both for complete user information
 * - Auto-refreshes profile when auth state changes
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';

export function useUser() {
  // Get user from AuthContext (single source of truth)
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('🔍 useUser: Fetching profile for user:', user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('🔍 useUser: Profile data:', profile);
      setProfile(profile);
      setLoading(false);
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  return { user, profile, loading: authLoading || loading };
}