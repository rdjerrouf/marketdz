# Email Verification Setup Guide

This guide explains how to configure email verification for MarketDZ in both local development and production (cloud Supabase).

## 📋 Overview

Email verification has been implemented with the following flow:
1. User signs up → Email sent with verification link
2. User clicks link → Redirected to `/auth/confirm`
3. Email verified → User can sign in
4. Unverified users cannot sign in

## 🏠 Local Development Setup

### 1. Enable Email Confirmations

By default, local Supabase uses **Inbucket** to catch emails (no real emails sent).

#### View Verification Emails:
```bash
# After signing up, check the Inbucket UI:
open http://127.0.0.1:54324
```

Or check via CLI:
```bash
npx supabase status
# Look for "Inbucket URL: http://127.0.0.1:54324"
```

### 2. Configure Email Settings (Optional)

Edit `supabase/config.toml`:

```toml
[auth.email]
# Enable email confirmations
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

# Email template settings
[auth.email.template.confirmation]
subject = "Confirm your email - MarketDZ"
content_path = "./supabase/templates/confirmation.html"
```

### 3. Test Locally

```bash
# 1. Start Supabase
npx supabase start

# 2. Start dev server
npm run dev

# 3. Sign up a new user at http://localhost:3000/signup

# 4. Check Inbucket for the email: http://127.0.0.1:54324

# 5. Click the verification link in the email

# 6. Verify you're redirected to /auth/confirm and email is confirmed
```

## ☁️ Cloud Supabase Configuration

### Step 1: Access Cloud Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **vrlzwxoiglzwmhndpolj**
3. Navigate to **Authentication** → **Settings**

### Step 2: Enable Email Confirmations

1. Scroll to **Email Auth**
2. Ensure these settings are configured:

```
✅ Enable email confirmations
✅ Enable email sign-ups
❌ Double confirm email changes (optional - prevents email change without verification)
```

### Step 3: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Customize the template (optional):

**Subject:**
```
Verify your email - MarketDZ 🇩🇿
```

**Body:**
```html
<h2>Welcome to MarketDZ!</h2>
<p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### Step 4: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL to **Site URL**:

**For Production:**
```
https://marketdz.vercel.app
```

**For Development (if testing with cloud):**
```
http://localhost:3000
```

3. Add redirect URLs to **Redirect URLs** whitelist:

```
https://marketdz.vercel.app/auth/confirm
https://marketdz.vercel.app/auth/callback
http://localhost:3000/auth/confirm (if testing locally with cloud)
http://localhost:3000/auth/callback (if testing locally with cloud)
```

### Step 5: Configure Email Provider (SMTP)

Supabase provides limited free emails. For production, configure your own SMTP:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Configure your email provider:

**Example with Gmail:**
```
Host: smtp.gmail.com
Port: 587
User: your-email@gmail.com
Password: your-app-specific-password
Sender email: noreply@marketdz.com
Sender name: MarketDZ
```

**Recommended Providers:**
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **Amazon SES** (Pay-as-you-go, very cheap)
- **Resend** (Modern, developer-friendly)

### Step 6: Test in Production

1. Deploy your app to Vercel (if not already deployed)
2. Sign up with a real email address
3. Check your inbox for the verification email
4. Click the verification link
5. Verify you're redirected to `/auth/confirm`
6. Try signing in - should work after verification

## 🔧 Environment Variables

Make sure these environment variables are set:

### Local (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=https://vrlzwxoiglzwmhndpolj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_cloud_anon_key
NEXT_PUBLIC_SITE_URL=https://marketdz.vercel.app
```

## 🐛 Troubleshooting

### Email Not Received (Local)
- Check Inbucket: http://127.0.0.1:54324
- Check Supabase logs: `npx supabase logs`
- Ensure Supabase is running: `npx supabase status`

### Email Not Received (Cloud)
- Check Supabase Dashboard → Logs
- Verify SMTP settings are correct
- Check spam/junk folder
- Verify email provider limits (Supabase free tier: ~30 emails/hour)

### Verification Link Not Working
- Check that redirect URLs are whitelisted in Supabase dashboard
- Verify `NEXT_PUBLIC_SITE_URL` matches your deployment URL
- Check browser console for errors
- Ensure `/auth/confirm` page exists and is accessible

### "Email not confirmed" Error on Signin
- This is expected! Users must verify their email first
- Have them check their inbox for the verification email
- They can request a new verification email from the signup page

### Users Still Auto-Confirmed
- Check `src/app/api/auth/signup/route.ts`
- Ensure `email_confirm: false` (not `true`)
- Check Supabase Dashboard → Authentication → Settings → "Enable email confirmations" is ON

## 📝 API Endpoints

### POST `/api/auth/signup`
Creates a new user account and sends verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "wilaya": "16",
  "city": "Algiers"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully! Please check your email to verify your account.",
  "requiresVerification": true
}
```

### POST `/api/auth/resend-verification`
Resends verification email to user.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

### GET `/auth/confirm`
Handles email verification callback from Supabase.

**URL Parameters:**
- `token_hash`: Verification token from email link
- `type`: Should be "email"

## 🔒 Security Notes

1. **Never commit** email provider credentials
2. **Use app-specific passwords** for Gmail (not your main password)
3. **Limit email sending rates** to prevent abuse
4. **Monitor email logs** for suspicious activity
5. **Set up rate limiting** on auth endpoints (TODO)

## ✅ Verification Checklist

Before going to production, verify:

- [ ] Email confirmations enabled in cloud Supabase
- [ ] SMTP provider configured (not using Supabase free tier)
- [ ] Email templates customized with branding
- [ ] Redirect URLs whitelisted
- [ ] Environment variables set in Vercel
- [ ] Test signup → email → verification → signin flow
- [ ] Test resend email functionality
- [ ] Verification emails not going to spam
- [ ] Email links work on mobile devices

## 📚 Additional Resources

- [Supabase Email Auth Docs](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Template Customization](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Last Updated:** 2025-01-26
**Status:** ✅ Implemented and ready for testing
