# Semgrep Security Findings

**Scan date**: 2026-03-12
**Files scanned**: 130+ files in `src/`
**Total findings**: 5

---

## ERROR (2) — Broken Cryptography

**File**: `src/lib/admin/mfa.ts`
**Rule**: `javascript.node-crypto.security.create-de-cipher-no-iv.create-de-cipher-no-iv`

| Line | Issue |
|------|-------|
| 293 | `createCipher` used — generates a static IV every time |
| 311 | `createDecipher` used — generates a static IV every time |

**Impact**: For counter modes (CTR, GCM, CCM), a static IV completely breaks both confidentiality and integrity when the same key is reused. Other modes are also weakened.

**Fix**: Replace with `createCipheriv` / `createDecipheriv` and generate a cryptographically random IV per encryption operation:

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const iv = randomBytes(16)
const cipher = createCipheriv('aes-256-cbc', key, iv)
```

---

## WARNING (1) — ReDoS via User-Controlled RegExp

**File**: `src/components/search/AdvancedSearch.tsx`
**Rule**: `javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp`

| Line | Issue |
|------|-------|
| 401 | `new RegExp(query)` called with user-controlled `query` argument |

**Impact**: An attacker can craft a malicious input that causes catastrophic backtracking, blocking the main thread (Regular Expression Denial-of-Service).

**Fix**: Escape special regex characters from user input before passing to `RegExp`:

```typescript
const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const regex = new RegExp(escaped)
```

---

## INFO (2) — Log Injection via String Concatenation

**Rule**: `javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring`

| File | Line | Issue |
|------|------|-------|
| `src/lib/notifications/push.ts` | 109 | String concatenation with non-literal variable in `console.log` |
| `src/lib/storage.ts` | 366 | String concatenation with non-literal variable in `console.log` |

**Impact**: If attacker-controlled data reaches the log, they could forge or corrupt log messages.

**Fix**: Use structured logging or pass variables as separate arguments:

```typescript
// Instead of: console.log('Error: ' + userInput)
console.log('Error:', userInput)  // pass as separate argument
```

---

## Summary

| Severity | Count | Files Affected |
|----------|-------|---------------|
| ERROR    | 2     | `src/lib/admin/mfa.ts` |
| WARNING  | 1     | `src/components/search/AdvancedSearch.tsx` |
| INFO     | 2     | `src/lib/notifications/push.ts`, `src/lib/storage.ts` |

## Recommended Fix Order

1. **`mfa.ts`** — Cryptographic flaw; fix immediately before any MFA data is compromised
2. **`AdvancedSearch.tsx`** — ReDoS can be triggered by any user with search access
3. **`push.ts` / `storage.ts`** — Low risk, fix when convenient
