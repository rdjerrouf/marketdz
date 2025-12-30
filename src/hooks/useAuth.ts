/**
 * useAuth Hook - Authentication State Consumer
 *
 * WHY RE-EXPORT:
 * - Prevents duplicate auth listeners (only AuthContext.tsx has the listener)
 * - Provides backward compatibility for components using old import path
 * - Single source of truth pattern for auth state
 */

// Re-export useAuth from AuthContext to avoid duplicate auth listeners
// This file exists for backward compatibility
export { useAuth } from '@/contexts/AuthContext'
