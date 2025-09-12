# 🔒 Security Guide

## 🚨 CRITICAL: Sensitive Data Protection

### **Environment Variables**

**✅ SAFE TO COMMIT:**
```bash
# These files are templates with placeholders
.env.docker.example
docker-compose.yml (with ${VARIABLES})
Dockerfile.optimized.template
```

**❌ NEVER COMMIT:**
```bash
# These contain real API keys
.env.docker
.env.local
docker-compose.dev.yml (with hardcoded keys)
Dockerfile.optimized (with hardcoded keys)
```

### **Setup Instructions**

1. **Create your local environment file:**
   ```bash
   cp .env.docker.example .env.docker
   ```

2. **Get your Supabase keys:**
   ```bash
   npx supabase status
   ```

3. **Fill in .env.docker with real values:**
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

4. **Use environment file with Docker:**
   ```bash
   docker-compose --env-file .env.docker up -d
   ```

### **Current Issues Fixed:**

✅ Added `.env.docker` to `.gitignore`
✅ Created secure templates with placeholders
✅ Updated docker-compose.yml to use variables
✅ Documented secure setup process

### **Files That Were Secured:**

- `docker-compose.yml` - Now uses `${VARIABLES}`
- `Dockerfile.optimized` - Moved to `.template` (git ignored)
- `docker-compose.dev.yml` - Moved to `.template` (git ignored)

### **Verification:**

Check what will be committed:
```bash
git status
git diff --cached
```

**Before committing, ensure:**
- No files contain `eyJhbGciOiJIUzI1NiIs`
- All sensitive files are in `.gitignore`
- Only template files with placeholders are tracked

### **Emergency Response:**

If you accidentally committed keys:
```bash
# Remove from history (if not pushed)
git reset --soft HEAD~1
git reset HEAD .

# If already pushed (more complex)
# Contact team to rotate keys immediately
# Use git-filter-branch or BFG to clean history
```

---

**Remember:** API keys in git history are permanent until cleaned. Prevention is critical!