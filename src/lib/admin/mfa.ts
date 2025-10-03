// src/lib/admin/mfa.ts
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { authenticator } from 'otplib'

export interface AdminMFA {
  id: string
  admin_user_id: string
  secret_key: string
  backup_codes: string[]
  enabled_at?: string
  last_used_at?: string
  is_enabled: boolean
  created_at: string
  updated_at: string
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

// Setup MFA for admin user
export async function setupAdminMFA(adminUserId: string): Promise<{
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}> {
  const supabase = createAdminClient()

  // Generate TOTP secret
  const secret = authenticator.generateSecret()

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  // Encrypt sensitive data (in production, use proper encryption)
  const encryptedSecret = encryptData(secret)
  const encryptedBackupCodes = backupCodes.map(code => encryptData(code))

  // Check if MFA already exists
  const { data: existingMFA } = await supabase
    .from('admin_mfa')
    .select('*')
    .eq('admin_user_id', adminUserId)
    .single()

  if (existingMFA) {
    // Update existing MFA setup
    const { error } = await supabase
      .from('admin_mfa')
      .update({
        secret_key: encryptedSecret,
        backup_codes: encryptedBackupCodes,
        is_enabled: false, // Must be enabled after verification
        updated_at: new Date().toISOString()
      })
      .eq('admin_user_id', adminUserId)
  } else {
    // Create new MFA setup
    const { error } = await supabase
      .from('admin_mfa')
      .insert({
        admin_user_id: adminUserId,
        secret_key: encryptedSecret,
        backup_codes: encryptedBackupCodes,
        is_enabled: false
      })
  }

  // Generate QR code URL for authenticator apps
  const appName = 'MarketDZ Admin'
  const accountName = `admin-${adminUserId.slice(0, 8)}`
  const qrCodeUrl = authenticator.keyuri(accountName, appName, secret)

  return {
    secret,
    qrCodeUrl,
    backupCodes
  }
}

// Enable MFA after verification
export async function enableAdminMFA(
  adminUserId: string,
  token: string
): Promise<boolean> {
  const supabase = createAdminClient()

  // Get MFA setup
  const { data: mfa, error } = await supabase
    .from('admin_mfa')
    .select('*')
    .eq('admin_user_id', adminUserId)
    .single()

  if (error || !mfa) {
    throw new Error('MFA not set up for this user')
  }

  // Decrypt secret and verify token
  const secret = decryptData(mfa.secret_key)
  const isValid = authenticator.verify({ token, secret })

  if (!isValid) {
    throw new Error('Invalid MFA token')
  }

  // Enable MFA
  await supabase
    .from('admin_mfa')
    .update({
      is_enabled: true,
      enabled_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    })
    .eq('admin_user_id', adminUserId)

  return true
}

// Verify MFA token
export async function verifyAdminMFA(
  adminUserId: string,
  token: string
): Promise<boolean> {
  const supabase = createAdminClient()

  // Get MFA setup
  const { data: mfa, error } = await supabase
    .from('admin_mfa')
    .select('*')
    .eq('admin_user_id', adminUserId)
    .eq('is_enabled', true)
    .single()

  if (error || !mfa) {
    return false
  }

  let isValid = false

  // Check if it's a TOTP token
  if (token.length === 6 && /^\d+$/.test(token)) {
    const secret = decryptData(mfa.secret_key)
    isValid = authenticator.verify({ token, secret })
  }
  // Check if it's a backup code
  else if (token.length === 8) {
    const backupCodes = mfa.backup_codes.map((code: string) => decryptData(code))
    isValid = backupCodes.includes(token)

    // If backup code is used, remove it
    if (isValid) {
      const remainingCodes = backupCodes.filter((code: string) => code !== token)
      const encryptedRemainingCodes = remainingCodes.map((code: string) => encryptData(code))

      await supabase
        .from('admin_mfa')
        .update({
          backup_codes: encryptedRemainingCodes,
          last_used_at: new Date().toISOString()
        })
        .eq('admin_user_id', adminUserId)
    }
  }

  // Update last used timestamp if valid
  if (isValid) {
    await supabase
      .from('admin_mfa')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('admin_user_id', adminUserId)
  }

  return isValid
}

// Disable MFA
export async function disableAdminMFA(
  adminUserId: string,
  token: string
): Promise<boolean> {
  const supabase = createAdminClient()

  // Verify current token first
  const isValid = await verifyAdminMFA(adminUserId, token)

  if (!isValid) {
    throw new Error('Invalid MFA token')
  }

  // Disable MFA
  await supabase
    .from('admin_mfa')
    .update({
      is_enabled: false,
      updated_at: new Date().toISOString()
    })
    .eq('admin_user_id', adminUserId)

  return true
}

// Get MFA status
export async function getAdminMFAStatus(adminUserId: string): Promise<{
  isEnabled: boolean
  hasBackupCodes: boolean
  lastUsed?: string
}> {
  const supabase = createAdminClient()

  const { data: mfa } = await supabase
    .from('admin_mfa')
    .select('is_enabled, backup_codes, last_used_at')
    .eq('admin_user_id', adminUserId)
    .single()

  if (!mfa) {
    return {
      isEnabled: false,
      hasBackupCodes: false
    }
  }

  return {
    isEnabled: mfa.is_enabled,
    hasBackupCodes: mfa.backup_codes && mfa.backup_codes.length > 0,
    lastUsed: mfa.last_used_at
  }
}

// Generate new backup codes
export async function generateNewBackupCodes(
  adminUserId: string,
  mfaToken: string
): Promise<string[]> {
  const supabase = createAdminClient()

  // Verify MFA token first
  const isValid = await verifyAdminMFA(adminUserId, mfaToken)

  if (!isValid) {
    throw new Error('Invalid MFA token')
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes()
  const encryptedBackupCodes = backupCodes.map(code => encryptData(code))

  // Update backup codes
  await supabase
    .from('admin_mfa')
    .update({
      backup_codes: encryptedBackupCodes,
      updated_at: new Date().toISOString()
    })
    .eq('admin_user_id', adminUserId)

  return backupCodes
}

// Helper functions

function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

function encryptData(data: string): string {
  // In production, use proper encryption with AWS KMS, HashiCorp Vault, etc.
  // This is a simple example - DO NOT use in production
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(process.env.MFA_ENCRYPTION_KEY || 'fallback-key', 'salt', 32)
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

function decryptData(encryptedData: string): string {
  // In production, use proper decryption
  // This is a simple example - DO NOT use in production
  try {
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.MFA_ENCRYPTION_KEY || 'fallback-key', 'salt', 32)

    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]

    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Failed to decrypt MFA data')
  }
}

// Check if admin requires MFA
export async function adminRequiresMFA(adminUserId: string): Promise<boolean> {
  const { isEnabled } = await getAdminMFAStatus(adminUserId)

  // In production, you might want to enforce MFA for certain roles
  // For now, it's optional but recommended
  return false // Change to true to enforce MFA
}

// MFA middleware helper
export async function verifyMFAForSession(
  adminUserId: string,
  mfaToken?: string
): Promise<boolean> {
  const mfaRequired = await adminRequiresMFA(adminUserId)

  if (!mfaRequired) {
    return true
  }

  if (!mfaToken) {
    return false
  }

  return await verifyAdminMFA(adminUserId, mfaToken)
}