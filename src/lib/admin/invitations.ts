// src/lib/admin/invitations.ts
import { createClient } from '@supabase/supabase-js'
import { AdminRole } from './auth'
import crypto from 'crypto'

export interface AdminInvitation {
  id: string
  email: string
  role: AdminRole
  invited_by: string
  invitation_token: string
  expires_at: string
  accepted_at?: string
  accepted_by?: string
  created_at: string
  is_active: boolean
  permissions: Record<string, any>
  notes?: string
}

// Create Supabase client for admin operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Send admin invitation
export async function sendAdminInvitation(
  email: string,
  role: AdminRole,
  invitedBy: string,
  permissions: Record<string, any> = {},
  notes?: string
): Promise<AdminInvitation> {
  const supabase = createAdminClient()

  // Check if email already has an active invitation
  const { data: existingInvitation } = await supabase
    .from('admin_invitations')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (existingInvitation) {
    throw new Error('An active invitation already exists for this email')
  }

  // Check if user is already an admin
  const { data: existingUser } = await supabase
    .from('profiles')
    .select(`
      id,
      admin_users (*)
    `)
    .eq('email', email)
    .single()

  if (existingUser?.admin_users) {
    throw new Error('User is already an admin')
  }

  // Generate secure invitation token
  const invitationToken = generateInvitationToken()

  // Set expiry (7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('admin_invitations')
    .insert({
      email,
      role,
      invited_by: invitedBy,
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      permissions,
      notes
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`)
  }

  // TODO: Send invitation email
  await sendInvitationEmail(email, invitationToken, role)

  return invitation as AdminInvitation
}

// Accept admin invitation
export async function acceptAdminInvitation(
  invitationToken: string,
  userId: string
): Promise<AdminInvitation> {
  const supabase = createAdminClient()

  // Get invitation
  const { data: invitation, error: invitationError } = await supabase
    .from('admin_invitations')
    .select('*')
    .eq('invitation_token', invitationToken)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (invitationError || !invitation) {
    throw new Error('Invalid or expired invitation')
  }

  // Check if user email matches invitation
  const { data: user } = await supabase.auth.admin.getUserById(userId)

  if (user.user?.email !== invitation.email) {
    throw new Error('Email does not match invitation')
  }

  // Create admin user
  const { error: adminError } = await supabase
    .from('admin_users')
    .insert({
      user_id: userId,
      role: invitation.role,
      permissions: invitation.permissions,
      created_by: invitation.invited_by,
      notes: `Accepted invitation on ${new Date().toISOString()}`
    })

  if (adminError) {
    throw new Error(`Failed to create admin user: ${adminError.message}`)
  }

  // Mark invitation as accepted
  const { data: updatedInvitation, error: updateError } = await supabase
    .from('admin_invitations')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
      is_active: false
    })
    .eq('id', invitation.id)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Failed to update invitation: ${updateError.message}`)
  }

  return updatedInvitation as AdminInvitation
}

// Get invitation by token
export async function getInvitationByToken(
  token: string
): Promise<AdminInvitation | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_invitations')
    .select('*')
    .eq('invitation_token', token)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  return data as AdminInvitation
}

// List admin invitations
export async function listAdminInvitations(
  includeExpired: boolean = false
): Promise<AdminInvitation[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('admin_invitations')
    .select(`
      *,
      invited_by_user:admin_users!admin_invitations_invited_by_fkey(
        user_id,
        profiles(first_name, last_name, email)
      )
    `)
    .order('created_at', { ascending: false })

  if (!includeExpired) {
    query = query.gte('expires_at', new Date().toISOString())
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`)
  }

  return data as AdminInvitation[]
}

// Revoke invitation
export async function revokeAdminInvitation(
  invitationId: string,
  revokedBy: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('admin_invitations')
    .update({
      is_active: false,
      notes: `Revoked by admin on ${new Date().toISOString()}`
    })
    .eq('id', invitationId)

  if (error) {
    throw new Error(`Failed to revoke invitation: ${error.message}`)
  }
}

// Generate secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Send invitation email (placeholder - implement with your email service)
async function sendInvitationEmail(
  email: string,
  token: string,
  role: AdminRole
): Promise<void> {
  // TODO: Implement email sending logic
  // This could use SendGrid, AWS SES, Resend, etc.

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/accept-invitation?token=${token}`

  console.log(`
📧 ADMIN INVITATION EMAIL (implement actual email service)
==========================================
To: ${email}
Subject: You've been invited to admin MarketDZ

You've been invited to join MarketDZ as an ${role}.

Click here to accept: ${invitationUrl}

This invitation expires in 7 days.
==========================================
  `)

  // Example implementation with a simple email service:
  /*
  await emailService.send({
    to: email,
    subject: 'MarketDZ Admin Invitation',
    template: 'admin-invitation',
    data: {
      invitationUrl,
      role,
      expiresIn: '7 days'
    }
  })
  */
}

// Clean up expired invitations
export async function cleanupExpiredInvitations(): Promise<number> {
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('admin_invitations')
    .update({
      is_active: false,
      notes: 'Expired automatically'
    })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .select('*', { count: 'exact', head: true })

  return count || 0
}