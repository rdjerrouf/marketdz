# MarketDZ - 100% Arabic Version Implementation Plan

**Document Version:** 1.0
**Date Created:** October 19, 2025
**Status:** Planning Phase
**Estimated Timeline:** 19-28 days (3-6 weeks)
**Complexity:** Medium-High 🟡

---

## Executive Summary

This document outlines the complete plan for implementing a fully localized Arabic version of MarketDZ, including Right-to-Left (RTL) layout support, Arabic typography, and bilingual content management. The implementation is divided into two phases to enable faster time-to-market for core user-facing features.

---

## Current State Analysis

### Infrastructure
- ❌ **No i18n framework installed** (no next-intl, react-i18next, etc.)
- ❌ **All text hardcoded in English** throughout the application
- ✅ **Database supports Arabic content** (test data includes AR/FR/EN mix)
- ✅ **Arabic full-text search already implemented**
- ⚠️ **PWA manifest is English-only**

### Code Inventory
- **31 pages** requiring translation
- **33 components** requiring translation
- **~600+ text strings** estimated (buttons, labels, placeholders, messages, etc.)
- **31 API routes** with error messages
- **10+ form validation messages**
- **5 PWA shortcuts** in manifest

### Pages Requiring Translation
```
Public Pages:
- / (home)
- /browse
- /browse/[id] (listing details)
- /search-advanced
- /terms
- /privacy

User Pages:
- /profile
- /profile/[id]
- /messages
- /chat/[conversationId]
- /notifications
- /favorites
- /add-item
- /my-listings

Admin Pages:
- /admin (dashboard)
- /admin/users
- /admin/admins
- /admin/analytics
- /admin/logs
- /admin/notifications
- /admin/listings
- /admin/settings
```

---

## Phase 1: Core User Features (MVP)
**Timeline:** 10-14 days
**Priority:** HIGH

### 1.1 Setup & Infrastructure (2-3 days)

#### Install Dependencies
```bash
npm install next-intl
```

#### Project Structure
```
/src
  /i18n
    /locales
      en.json
      ar.json
    config.ts
    request.ts
  /middleware.ts (update for locale detection)
```

#### Configuration Files

**`src/i18n/config.ts`**
```typescript
export const locales = ['en', 'ar'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar' // Algeria default
```

**`src/i18n/request.ts`**
```typescript
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from './config'

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound()

  return {
    messages: (await import(`./locales/${locale}.json`)).default
  }
})
```

**Update `next.config.ts`**
```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl({
  // existing config
})
```

#### Middleware Update
```typescript
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // /ar/browse or /browse (auto-detect)
})

export const config = {
  matcher: ['/', '/(ar|en)/:path*']
}
```

### 1.2 Translation Files Structure (5-7 days)

#### Core Translation Keys (Priority Order)

**`locales/ar.json` - Common Keys**
```json
{
  "common": {
    "app_name": "ماركت دي زد",
    "search": "بحث",
    "browse": "تصفح",
    "login": "تسجيل الدخول",
    "signup": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "submit": "إرسال",
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "success": "تم بنجاح"
  },
  "categories": {
    "for_sale": "للبيع",
    "for_rent": "للإيجار",
    "job": "وظائف",
    "service": "خدمات"
  },
  "home": {
    "hero_title": "سوق الجزائر الإلكتروني",
    "hero_subtitle": "اشترِ، بع، أجّر أو ابحث عن وظيفة",
    "search_placeholder": "ابحث عن أي شيء...",
    "featured_listings": "إعلانات مميزة",
    "hot_deals": "عروض ساخنة",
    "browse_all": "تصفح الكل"
  },
  "listing": {
    "title": "العنوان",
    "description": "الوصف",
    "price": "السعر",
    "location": "الموقع",
    "category": "الفئة",
    "subcategory": "الفئة الفرعية",
    "condition": "الحالة",
    "contact_seller": "اتصل بالبائع",
    "add_to_favorites": "أضف للمفضلة",
    "share": "مشاركة",
    "report": "إبلاغ"
  },
  "profile": {
    "my_profile": "ملفي الشخصي",
    "my_listings": "إعلاناتي",
    "favorites": "المفضلة",
    "messages": "الرسائل",
    "notifications": "الإشعارات",
    "settings": "الإعدادات"
  },
  "auth": {
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "confirm_password": "تأكيد كلمة المرور",
    "forgot_password": "نسيت كلمة المرور؟",
    "no_account": "ليس لديك حساب؟",
    "have_account": "لديك حساب بالفعل؟"
  }
}
```

#### Subcategories Translation Mapping
```json
{
  "subcategories": {
    "for_sale": {
      "electronics": "إلكترونيات",
      "furniture": "أثاث",
      "vehicles": "مركبات",
      "home_appliances": "أجهزة منزلية",
      "sports": "رياضة",
      "clothing": "ملابس"
    },
    "for_rent": {
      "apartments": "شقق",
      "houses": "منازل",
      "commercial": "تجاري",
      "land": "أراضي",
      "rooms": "غرف"
    },
    "job": {
      "technology": "تكنولوجيا",
      "sales": "مبيعات",
      "education": "تعليم",
      "engineering": "هندسة",
      "hospitality": "ضيافة",
      "construction": "بناء"
    },
    "service": {
      "home_services": "خدمات منزلية",
      "technology": "تكنولوجيا",
      "education": "تعليم",
      "transportation": "نقل",
      "events": "فعاليات"
    }
  }
}
```

### 1.3 Component Updates (3-4 days)

#### Language Switcher Component
**Create `/src/components/LanguageSwitcher.tsx`**
```typescript
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <button
      onClick={() => switchLocale(locale === 'ar' ? 'en' : 'ar')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
    >
      <Globe size={20} />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  )
}
```

#### Update Pages to Use Translations
**Example: `/src/app/[locale]/page.tsx`**
```typescript
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div>
      <h1>{t('hero_title')}</h1>
      <p>{t('hero_subtitle')}</p>
      {/* ... */}
    </div>
  )
}
```

### 1.4 RTL Layout Support (3-4 days)

#### Global CSS for RTL
**`src/app/globals.css`**
```css
/* RTL Support */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .rtl\:mirror {
  transform: scaleX(-1);
}

/* Tailwind RTL Variants - already supported with rtl: prefix */
/* Example: ml-4 rtl:mr-4 rtl:ml-0 */
```

#### Update Layout to Set Direction
**`src/app/[locale]/layout.tsx`**
```typescript
export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
```

#### Component RTL Fixes Checklist
- [ ] Navigation menu (reverse order)
- [ ] Search bar icons (flip magnifier position)
- [ ] Dropdown menus (align right)
- [ ] Form inputs (text alignment)
- [ ] Chat bubbles (sender right, receiver left)
- [ ] Image galleries (RTL carousel)
- [ ] Breadcrumbs (reverse separators)
- [ ] Pagination arrows (flip direction)
- [ ] Modal close buttons (move to left)
- [ ] Icons: `ChevronRight` ↔ `ChevronLeft`

#### Tailwind RTL Pattern
```typescript
// Before
<div className="ml-4 text-left">

// After
<div className="ml-4 rtl:mr-4 rtl:ml-0 text-left rtl:text-right">
```

### 1.5 Arabic Typography (1-2 days)

#### Font Integration
**Update `next.config.ts`**
```typescript
import { NextFont } from 'next/font/google'
import { Cairo } from 'next/font/google'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo',
  display: 'swap'
})

// Apply in layout
<body className={cairo.variable}>
```

#### CSS Font Settings
```css
:root {
  --font-sans: var(--font-cairo), system-ui, sans-serif;
}

[lang="ar"] {
  font-family: var(--font-cairo), 'Cairo', 'Segoe UI', Tahoma, sans-serif;
  font-size: 1.05em; /* Arabic typically needs slightly larger sizing */
  line-height: 1.7; /* Better readability for Arabic */
}
```

#### Recommended Arabic Fonts
1. **Cairo** - Modern, clean (recommended)
2. **Tajawal** - Professional, readable
3. **Almarai** - Elegant, lightweight
4. **Amiri** - Traditional, formal

---

## Phase 2: Admin Panel & Advanced Features
**Timeline:** 9-14 days
**Priority:** MEDIUM

### 2.1 Admin Panel Translation (4-5 days)

#### Admin-Specific Translation Keys
```json
{
  "admin": {
    "dashboard": "لوحة التحكم",
    "users": "المستخدمين",
    "listings": "الإعلانات",
    "analytics": "التحليلات",
    "logs": "السجلات",
    "settings": "الإعدادات",
    "total_users": "إجمالي المستخدمين",
    "active_listings": "الإعلانات النشطة",
    "revenue": "الإيرادات"
  }
}
```

### 2.2 API Error Messages Localization (2-3 days)

#### Backend Locale Detection
```typescript
// src/app/api/middleware/locale.ts
export function getLocaleFromRequest(request: Request): string {
  const acceptLanguage = request.headers.get('accept-language')
  const locale = acceptLanguage?.includes('ar') ? 'ar' : 'en'
  return locale
}
```

#### Localized Error Responses
```typescript
const errorMessages = {
  en: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    VALIDATION_ERROR: 'Validation failed'
  },
  ar: {
    NOT_FOUND: 'المورد غير موجود',
    UNAUTHORIZED: 'وصول غير مصرح به',
    VALIDATION_ERROR: 'فشل التحقق من الصحة'
  }
}
```

### 2.3 Form Validation Localization (1-2 days)

#### Zod Schema with i18n
```typescript
import { z } from 'zod'
import { useTranslations } from 'next-intl'

const createListingSchema = (t: any) => z.object({
  title: z.string().min(5, t('validation.title_too_short')),
  price: z.number().positive(t('validation.price_positive')),
  description: z.string().min(20, t('validation.description_too_short'))
})
```

### 2.4 PWA Manifest Localization (1 day)

#### Create Locale-Specific Manifests
**`/public/manifest-ar.json`**
```json
{
  "name": "ماركت دي زد - سوق الجزائر",
  "short_name": "ماركت دي زد",
  "description": "سوق الجزائر الأول للبيع والشراء والوظائف والخدمات والإيجارات",
  "lang": "ar",
  "dir": "rtl",
  "shortcuts": [
    {
      "name": "تصفح الإعلانات",
      "short_name": "تصفح",
      "url": "/ar/browse"
    },
    {
      "name": "إنشاء إعلان",
      "short_name": "بيع",
      "url": "/ar/add-item"
    },
    {
      "name": "المفضلة",
      "short_name": "المفضلة",
      "url": "/ar/favorites"
    },
    {
      "name": "الرسائل",
      "short_name": "رسائل",
      "url": "/ar/messages"
    }
  ]
}
```

#### Dynamic Manifest Link
```typescript
// src/app/[locale]/layout.tsx
<link
  rel="manifest"
  href={locale === 'ar' ? '/manifest-ar.json' : '/manifest.json'}
/>
```

### 2.5 Database Content Localization (2-3 days)

#### Category Translation Table
```sql
-- Migration: Add translations table
CREATE TABLE category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  subcategory TEXT,
  locale TEXT NOT NULL,
  translated_name TEXT NOT NULL,
  UNIQUE(category, subcategory, locale)
);

-- Seed data
INSERT INTO category_translations (category, subcategory, locale, translated_name) VALUES
('for_sale', NULL, 'ar', 'للبيع'),
('for_sale', 'electronics', 'ar', 'إلكترونيات'),
('for_sale', 'furniture', 'ar', 'أثاث');
```

#### API Updates for Localized Categories
```typescript
// src/app/api/categories/route.ts
export async function GET(request: Request) {
  const locale = getLocaleFromRequest(request)

  const { data } = await supabase
    .from('category_translations')
    .select('*')
    .eq('locale', locale)

  return Response.json(data)
}
```

---

## Phase 3: Testing & Quality Assurance
**Timeline:** 3-4 days

### 3.1 Manual Testing Checklist

#### Functional Testing
- [ ] Language switcher works on all pages
- [ ] Translations appear correctly (no missing keys)
- [ ] RTL layout renders properly on all screen sizes
- [ ] Forms submit correctly in both languages
- [ ] Search works with Arabic queries
- [ ] Date/time formatting is correct
- [ ] Currency formatting is correct
- [ ] PWA installs with correct language

#### Visual Testing
- [ ] Text doesn't overflow containers
- [ ] Icons are in correct positions
- [ ] Spacing is consistent in RTL
- [ ] Modals center properly
- [ ] Dropdowns align correctly
- [ ] Chat bubbles flip correctly
- [ ] Image galleries work in RTL

#### Browser Testing Matrix
| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✓       | ✓      |
| Safari  | ✓       | ✓      |
| Firefox | ✓       | ✓      |
| Edge    | ✓       | N/A    |

### 3.2 Automated Testing

#### E2E Tests with Playwright
```typescript
// tests/i18n.spec.ts
import { test, expect } from '@playwright/test'

test('Language switcher changes content', async ({ page }) => {
  await page.goto('/ar')
  await expect(page.locator('h1')).toContainText('ماركت دي زد')

  await page.click('[data-testid="language-switcher"]')
  await expect(page.locator('h1')).toContainText('MarketDZ')
})

test('RTL layout applies correctly', async ({ page }) => {
  await page.goto('/ar')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('dir', 'rtl')
})
```

### 3.3 Accessibility Testing

#### RTL Screen Reader Support
- [ ] VoiceOver (iOS/Mac) reads Arabic correctly
- [ ] TalkBack (Android) navigates properly in RTL
- [ ] ARIA labels are translated
- [ ] Focus order follows RTL flow

#### Tools
- axe DevTools
- WAVE browser extension
- Lighthouse accessibility audit

---

## Technical Specifications

### Number Formatting

#### Western vs Eastern Arabic Numerals
```typescript
// Western (Algeria standard): 0123456789
// Eastern Arabic: ٠١٢٣٤٥٦٧٨٩

const formatNumber = (num: number, locale: string) => {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'en-US').format(num)
}

// Output examples:
// en: 1,234.56
// ar: ١٬٢٣٤٫٥٦ or 1,234.56 (depends on ar-DZ locale settings)
```

**Note:** Algeria typically uses Western numerals, but support both.

### Date Formatting
```typescript
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-DZ' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  ).format(date)
}

// Output examples:
// en: January 15, 2025
// ar: ١٥ يناير ٢٠٢٥
```

### Currency Formatting
```typescript
const formatPrice = (price: number, locale: string) => {
  return new Intl.NumberFormat(
    locale === 'ar' ? 'ar-DZ' : 'en-US',
    {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }
  ).format(price)
}

// Output examples:
// en: DZD 50,000
// ar: ٥٠٬٠٠٠ د.ج.
```

---

## Resources & References

### Translation Services
1. **Professional:** Upwork/Fiverr (native Algerian Arabic speakers)
2. **AI-Assisted:** DeepL + human review
3. **Community:** Crowdin for open-source translation
4. **Budget:** $300-800 for professional translation

### Documentation
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind RTL Plugin](https://tailwindcss.com/docs/plugins#rtl-support)
- [MDN: Building RTL-Aware Web Apps](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [Google Fonts Arabic Collection](https://fonts.google.com/?subset=arabic)

### Tools
- **i18n Ally** (VS Code extension) - Visual translation editor
- **BabelEdit** - Translation file manager
- **Pontoon** - Mozilla's localization platform

---

## Cost Breakdown

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Developer Time (100-150h @ $50/h) | $5,000-7,500 | Your time or contractor |
| Professional Translation | $300-800 | ~600 strings |
| Arabic Fonts (if premium) | $0-200 | Google Fonts are free |
| QA/Testing | $500-1,000 | Or internal time |
| **Total** | **$5,800-9,500** | Full implementation |

### DIY Approach (Self Translation)
- **Cost:** $0 (your time)
- **Time:** Add +3-5 days for translation work
- **Risk:** May need native speaker review

---

## Migration Strategy

### Gradual Rollout
1. **Week 1-2:** Setup infrastructure + core pages
2. **Week 3:** Test with beta users (friends/family)
3. **Week 4:** Admin panel + polish
4. **Week 5:** Public launch with language toggle

### Feature Flags
```typescript
// .env.local
NEXT_PUBLIC_ENABLE_ARABIC=true
NEXT_PUBLIC_DEFAULT_LOCALE=ar // ar or en
```

### URL Structure Options

#### Option A: Subdirectory (Recommended)
```
example.com/ar/browse    (Arabic)
example.com/en/browse    (English)
example.com/browse       (Auto-detect, defaults to ar)
```

#### Option B: Subdomain
```
ar.example.com/browse    (Arabic)
en.example.com/browse    (English)
example.com/browse       (Auto-detect)
```

#### Option C: Cookie-Based (No URL change)
```
example.com/browse       (Language stored in cookie)
```

**Recommendation:** Option A (subdirectory) for SEO benefits.

---

## SEO Considerations

### hreflang Tags
```html
<link rel="alternate" hreflang="ar" href="https://example.com/ar/browse" />
<link rel="alternate" hreflang="en" href="https://example.com/en/browse" />
<link rel="alternate" hreflang="x-default" href="https://example.com/browse" />
```

### Localized Meta Tags
```typescript
export const metadata = {
  title: locale === 'ar' ? 'ماركت دي زد' : 'MarketDZ',
  description: locale === 'ar'
    ? 'سوق الجزائر الأول للبيع والشراء'
    : 'Algeria\'s premier marketplace',
  openGraph: {
    locale: locale === 'ar' ? 'ar_DZ' : 'en_US'
  }
}
```

---

## Success Metrics

### KPIs to Track
- [ ] % of users choosing Arabic vs English
- [ ] Session duration by language
- [ ] Conversion rate by language
- [ ] Bounce rate comparison
- [ ] User feedback on translation quality
- [ ] Arabic search query volume

### Analytics Implementation
```typescript
// Track language preference
analytics.track('language_changed', {
  from: 'en',
  to: 'ar',
  timestamp: new Date()
})
```

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor translation quality | High | Use native speaker + review |
| RTL layout breaks | Medium | Extensive testing on mobile |
| Font loading slow | Low | Use font-display: swap |
| Missing translations | Medium | Fallback to English gracefully |
| SEO duplicate content | High | Proper hreflang implementation |

---

## Post-Launch Maintenance

### Ongoing Work
- [ ] Add new translations when adding features
- [ ] Monitor user feedback on translations
- [ ] Update category translations as needed
- [ ] Maintain both manifest files
- [ ] Keep i18n library updated

### Translation Workflow
1. Developer adds English string with key
2. Add key to `locales/ar.json` (placeholder or English)
3. Flag for translation review
4. Professional translator updates
5. Deploy update

---

## Decision Points

### Before Starting
- [ ] Confirm target locale: Algerian Arabic (ar-DZ) or MSA?
- [ ] Decide on default language for new users
- [ ] Choose translation approach (professional vs DIY)
- [ ] Determine budget and timeline
- [ ] Select URL structure (subdirectory recommended)

### During Implementation
- [ ] Phase 1 completion review before Phase 2
- [ ] Beta testing with native speakers
- [ ] Performance benchmarking (font loading)
- [ ] Mobile app testing (PWA)

### Post-Launch
- [ ] A/B test default language for visitors
- [ ] Gather user feedback
- [ ] Monitor analytics
- [ ] Plan for other languages (French full support?)

---

## Quick Start Commands

```bash
# Install dependencies
npm install next-intl

# Create directory structure
mkdir -p src/i18n/locales
touch src/i18n/locales/en.json
touch src/i18n/locales/ar.json
touch src/i18n/config.ts
touch src/i18n/request.ts

# Create language switcher component
touch src/components/LanguageSwitcher.tsx

# Create additional manifest
cp public/manifest.json public/manifest-ar.json

# Run development server
npm run dev
```

---

## Contact for Implementation

If you decide to proceed, you can:
1. Implement yourself following this guide
2. Hire a contractor familiar with next-intl + RTL
3. Use this as a specification for a development agency

**Estimated Budget Range:**
- DIY: $0-1,000 (your time + translation)
- Freelancer: $2,000-4,000
- Agency: $5,000-10,000

---

## Appendix: Common Arabic Translations

### UI Elements
| English | Arabic |
|---------|--------|
| Home | الرئيسية |
| Browse | تصفح |
| Search | بحث |
| Categories | الفئات |
| Filters | تصفية |
| Sort By | ترتيب حسب |
| Newest | الأحدث |
| Oldest | الأقدم |
| Price: Low to High | السعر: من الأقل للأعلى |
| Price: High to Low | السعر: من الأعلى للأقل |
| Sign In | تسجيل الدخول |
| Sign Up | إنشاء حساب |
| Logout | تسجيل الخروج |
| Profile | الملف الشخصي |
| Settings | الإعدادات |
| Notifications | الإشعارات |
| Messages | الرسائل |
| Favorites | المفضلة |
| My Listings | إعلاناتي |
| Create Listing | إنشاء إعلان |
| Edit | تعديل |
| Delete | حذف |
| Save | حفظ |
| Cancel | إلغاء |
| Submit | إرسال |
| Continue | متابعة |
| Back | رجوع |
| Next | التالي |
| Previous | السابق |
| View More | عرض المزيد |
| Show Less | عرض أقل |
| Loading... | جاري التحميل... |
| Error | خطأ |
| Success | نجح |
| Warning | تحذير |
| Info | معلومة |

### Marketplace Specific
| English | Arabic |
|---------|--------|
| For Sale | للبيع |
| For Rent | للإيجار |
| Jobs | وظائف |
| Services | خدمات |
| Price | السعر |
| Location | الموقع |
| Condition | الحالة |
| New | جديد |
| Used | مستعمل |
| Like New | شبه جديد |
| Contact Seller | اتصل بالبائع |
| Report Listing | إبلاغ عن الإعلان |
| Share | مشاركة |
| Add to Favorites | أضف للمفضلة |
| Description | الوصف |
| Photos | الصور |
| Upload | رفع |
| Posted | نُشر |
| Updated | تم التحديث |
| Views | المشاهدات |
| Featured | مميز |
| Hot Deal | عرض ساخن |

---

**Document End**

*Last Updated: October 19, 2025*
*Next Review: When implementation begins*
