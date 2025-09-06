// Mock authentication helper for testing
import { supabase } from '@/lib/supabase/client'

export const mockSignIn = async () => {
  // This is a temporary solution to simulate authentication
  // We'll create a mock session in localStorage that the useUser hook can detect
  
  const mockUser = {
    id: 'mock-user-123',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockProfile = {
    id: 'mock-user-123',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '0550000001',
    city: 'Alger',
    wilaya: '16',
    bio: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Store mock data in localStorage for persistence
  localStorage.setItem('mockAuth', JSON.stringify({
    user: mockUser,
    profile: mockProfile,
    authenticated: true
  }))

  // Trigger a custom event that useUser can listen to
  window.dispatchEvent(new CustomEvent('mockAuthChange', {
    detail: { user: mockUser, profile: mockProfile }
  }))

  return { user: mockUser, profile: mockProfile }
}

export const mockSignOut = async () => {
  localStorage.removeItem('mockAuth')
  
  // Trigger sign out event
  window.dispatchEvent(new CustomEvent('mockAuthChange', {
    detail: { user: null, profile: null }
  }))
  
  return true
}

export const getMockAuth = () => {
  if (typeof window === 'undefined') return null
  
  const mockData = localStorage.getItem('mockAuth')
  if (!mockData) return null
  
  try {
    return JSON.parse(mockData)
  } catch {
    return null
  }
}
