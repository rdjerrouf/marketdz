# 🔒 Security Guidelines for MarketDZ

## ⚠️ NEVER COMMIT These Items:

### **API Keys & Credentials**
- Supabase service role keys
- Database passwords
- Third-party API keys
- JWT secrets
- Encryption keys

### **Environment Files**
- `.env.local`
- `.env.production`
- `.env.development`
- Any file with actual credentials

### **Scripts with Hardcoded Credentials**
- Files ending in `-cloud.js`
- Admin creation scripts with API keys
- Database connection scripts with passwords

## ✅ Safe Practices:

### **1. Use Environment Variables**
```javascript
// ✅ GOOD
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ BAD
const supabaseKey = 'sb_secret_actual_key_here'
```

### **2. Use Template Files**
- Commit `.env.example` with placeholder values
- Never commit `.env.local` with real values

### **3. Scripts Should Reference Environment**
```javascript
// ✅ GOOD
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

// ❌ BAD
const supabaseKey = 'sb_secret_real_key_here'
```

## 🚨 If You Accidentally Commit Secrets:

1. **Immediately rotate/regenerate** the exposed credentials
2. **Remove from git history** or delete the files
3. **Update all environments** with new credentials
4. **Resolve GitHub security alerts**

## 🛡️ GitHub Security Features Enabled:

- ✅ Secret scanning alerts
- ✅ Dependency vulnerability alerts
- ✅ .gitignore protections

## 📋 Regular Security Checklist:

- [ ] Review commits before pushing
- [ ] Check for hardcoded credentials
- [ ] Verify .env files are ignored
- [ ] Rotate keys periodically
- [ ] Monitor GitHub security alerts

---
**Remember: When in doubt, use environment variables!** 🔐