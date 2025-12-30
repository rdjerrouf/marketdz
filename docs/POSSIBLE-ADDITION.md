# Urgent/Emergency Humanitarian Category - Feature Specification

## Executive Summary

Add a dedicated "Urgent Help" category to MarketDZ to facilitate time-sensitive humanitarian assistance across Algeria. This category will support critical community needs including blood donations, medicine requests, food assistance, medical equipment, and emergency housing.

**Status**: Planning Phase
**Target Environment**: Local development first, production deployment after testing
**Implementation Approach**: Extend existing category system and leverage hot deals pattern for urgency handling

---

## Problem Statement

MarketDZ currently serves marketplace needs (sales, rentals, jobs, services) but lacks infrastructure for urgent humanitarian requests that require:
- Time-sensitive visibility
- Geographic prioritization (wilaya-based)
- Visual prominence to drive rapid community response
- Auto-expiration to prevent stale requests

---

## Goals & Objectives

### Primary Goals
1. Enable users to post time-sensitive humanitarian requests
2. Provide prominent visual treatment to maximize visibility and response rate
3. Implement auto-expiration to prevent outdated requests
4. Maintain platform integrity through appropriate moderation

### Success Metrics
- Urgent listings receive responses within 24 hours
- Zero stale requests visible after expiration period
- Positive community feedback on feature usefulness
- Minimal moderation overhead or abuse

---

## Technical Requirements

### Database Layer

**Migration**: Create new migration file following naming convention `YYYYMMDD_add_urgent_category.sql`

**Schema Changes**:
```sql
-- 1. Extend category enum
ALTER TYPE listing_category ADD VALUE 'urgent';

-- 2. Add urgency-specific columns (following hot deals pattern)
ALTER TABLE listings
  ADD COLUMN urgent_type TEXT CHECK (urgent_type IN (
    'blood_donation',
    'medicine_needed',
    'food_assistance',
    'medical_equipment',
    'emergency_housing'
  )),
  ADD COLUMN urgent_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN urgent_contact_preference TEXT; -- phone, whatsapp, both
```

**Indexes**:
```sql
-- Performance optimization for urgent listing queries
CREATE INDEX idx_listings_urgent_active
ON listings(urgent_expires_at DESC)
WHERE category = 'urgent' AND status = 'active';
```

**Auto-Expiration Function**:
```sql
-- Scheduled function to expire urgent listings (similar to hot deals)
CREATE OR REPLACE FUNCTION expire_urgent_listings()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET status = 'expired'
  WHERE category = 'urgent'
    AND urgent_expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Type System

**File**: `src/types/database.ts`

**Changes Required**:
```typescript
// Update category union type
type ListingCategory = 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent';

// Update listings table interface
interface ListingsTable {
  Row: {
    // ... existing fields
    category: ListingCategory;
    urgent_type: 'blood_donation' | 'medicine_needed' | 'food_assistance'
                | 'medical_equipment' | 'emergency_housing' | null;
    urgent_expires_at: string | null;
    urgent_contact_preference: 'phone' | 'whatsapp' | 'both' | null;
  }
}
```

### Category Configuration

**File**: `src/lib/constants/categories.ts`

**New Category Definition**:
```typescript
export const LISTING_CATEGORIES = {
  // ... existing categories
  URGENT: {
    value: 'urgent',
    label: 'Urgent Help',
    labelAr: 'مساعدة عاجلة',
    icon: 'AlertCircle',
    color: 'from-red-500 to-red-700',
    subcategories: [
      { value: 'blood_donation', label: 'Blood Donation', labelAr: 'تبرع بالدم' },
      { value: 'medicine_needed', label: 'Medicine Needed', labelAr: 'دواء مطلوب' },
      { value: 'food_assistance', label: 'Food Assistance', labelAr: 'مساعدة غذائية' },
      { value: 'medical_equipment', label: 'Medical Equipment', labelAr: 'معدات طبية' },
      { value: 'emergency_housing', label: 'Emergency Housing', labelAr: 'سكن طارئ' }
    ]
  }
};
```

### API Layer

**File**: `src/app/api/listings/route.ts`

**Validation Rules**:
```typescript
const validCategories = ['for_sale', 'job', 'service', 'for_rent', 'urgent'];

// Category-specific validation for urgent listings
if (category === 'urgent') {
  // Price is optional
  // Photos are optional
  // urgent_type is required
  // urgent_expires_at is required (default: 48h from creation)
  // Contact info is required (phone or whatsapp)

  if (!urgent_type || !['blood_donation', 'medicine_needed',
      'food_assistance', 'medical_equipment', 'emergency_housing'].includes(urgent_type)) {
    return NextResponse.json({ error: 'Invalid urgent type' }, { status: 400 });
  }

  // Set default expiration if not provided
  if (!urgent_expires_at) {
    urgent_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  }
}
```

### User Interface

#### Add Item Page
**File**: `src/app/add-item/page.tsx`

**Category Card**:
```typescript
{
  id: 'urgent',
  title: 'Urgent Help',
  description: 'Request urgent humanitarian assistance',
  subtitle: 'Blood donations, medicine, food assistance',
  icon: '🚨',
  color: 'from-red-500 to-red-700'
}
```

#### Listing Form
**File**: `src/components/listings/ListingForm.tsx`

**Urgent-Specific Fields**:
- Urgent type dropdown (required)
- Expiration time selector (default: 48h, options: 24h, 48h, 72h)
- Contact preference (phone, WhatsApp, both)
- Price field: optional
- Photos: optional (max 2)

**Validation**:
```typescript
if (formData.category === 'urgent') {
  if (!formData.urgent_type) {
    errors.urgent_type = 'Please select the type of urgent help needed';
  }
  if (!formData.urgent_contact_preference) {
    errors.urgent_contact_preference = 'Please select preferred contact method';
  }
}
```

#### Card Styling
**File**: `src/components/common/MobileListingCard.tsx`

**Visual Treatment**:
```typescript
'urgent': {
  text: 'Urgent Help',
  color: 'from-red-500 to-red-700',
  bgColor: 'bg-red-600',
  icon: AlertCircle,
  badge: '🚨 URGENT', // Prominent badge
  borderColor: 'border-red-500 border-2' // Distinct border
}
```

---

## Design Decisions

### Auto-Expiration
**Decision**: 48-hour default with user option to select 24h, 48h, or 72h

**Rationale**:
- Prevents stale requests from remaining visible
- 48 hours balances urgency with realistic response time
- User flexibility for varying urgency levels
- Automated expiration via scheduled job (similar to hot deals)

### Photo Requirements
**Decision**: Optional photos, maximum 2 images

**Rationale**:
- Some urgent requests may not have photos readily available
- Reduce friction for urgent posting
- 2 photos sufficient for verification while keeping listing lightweight

### Price Field
**Decision**: Optional

**Rationale**:
- Many humanitarian requests are free (donations, assistance)
- Some may involve compensation (e.g., paid blood donation in some contexts)
- Optional field provides flexibility

### Contact Preference
**Decision**: Required field with options (phone, WhatsApp, both)

**Rationale**:
- Critical for response - must have contact method
- WhatsApp is widely used in Algeria for quick communication
- User selects preference to reduce spam on unwanted channels

---

## Implementation Plan

### Phase 1: Database & Types (Local Development)
1. Create migration file in `supabase/migrations/`
2. Add category enum value 'urgent'
3. Add urgent-specific columns to listings table
4. Create indexes for performance
5. Implement auto-expiration function
6. Update TypeScript types in `src/types/database.ts`
7. Test migration with `npx supabase db reset`

### Phase 2: Configuration & Constants
1. Add URGENT category to `src/lib/constants/categories.ts`
2. Define subcategories with bilingual labels
3. Add category colors and icons
4. Update category helper functions

### Phase 3: API Layer
1. Update `src/app/api/listings/route.ts` validation
2. Add 'urgent' to validCategories array
3. Implement urgent-specific validation rules
4. Add default expiration logic
5. Test API endpoints with Postman/curl

### Phase 4: UI Components
1. Add urgent category card to `src/app/add-item/page.tsx`
2. Update `src/components/listings/ListingForm.tsx`:
   - Add urgent type dropdown
   - Add expiration time selector
   - Add contact preference field
   - Implement urgent-specific validation
3. Update `src/components/common/MobileListingCard.tsx`:
   - Add urgent styling configuration
   - Add prominent URGENT badge
   - Add distinct border treatment
4. Test form submission and validation

### Phase 5: Search & Filtering
1. Update search API to handle urgent category
2. Consider urgent listing priority in search results
3. Add urgent filter to browse/search UI
4. Test geographic filtering (wilaya-based)

### Phase 6: Testing & Validation
1. Create test urgent listings (each subcategory)
2. Verify auto-expiration after 48 hours
3. Test form validation edge cases
4. Verify visual styling on mobile and desktop
5. Test API error handling
6. Performance test with mock urgent listings

---

## Future Enhancements (Post-Launch)

### Push Notifications (Phase 2)
**File**: `src/lib/push.ts`

**Implementation**:
- Send push notifications to users in same wilaya when urgent post created
- Notification title: "🚨 Urgent Help Needed in [Wilaya]"
- Notification body: Brief description of need
- Deep link to listing detail page

**Benefits**:
- Significantly increase response rate
- Real-time community mobilization
- Geographic relevance improves match quality

### Priority Moderation (Phase 2)
**Options**:
1. **Priority Queue**: Urgent posts go to front of moderation queue
2. **Auto-Approve + Retroactive Review**: Immediate visibility with subsequent review
3. **Trusted User Auto-Approve**: Users with good history bypass queue

**Recommendation**: Start with priority queue, evaluate need for auto-approval based on abuse metrics

### Analytics Dashboard (Phase 3)
- Response time metrics
- Successful resolution rate
- Popular urgent types by wilaya
- Peak posting times
- Abuse/spam reports

---

## Security & Abuse Prevention

### Measures
1. **Rate Limiting**: Max 2 urgent posts per user per day
2. **Verification**: Phone number verification required
3. **Reporting**: Easy flag/report mechanism for suspicious posts
4. **Expiration**: Automatic removal prevents spam accumulation
5. **Monitoring**: Track urgent category usage patterns

### Red Flags
- Same user posting multiple urgent requests daily
- Generic/vague descriptions
- Requests for money transfer
- Suspicious contact information

---

## Testing Checklist

- [ ] Migration applies successfully on local Supabase
- [ ] TypeScript types compile without errors
- [ ] Category appears in add-item UI with correct styling
- [ ] Form validation works for all urgent subcategories
- [ ] API accepts and stores urgent listings correctly
- [ ] Urgent listings display with prominent styling
- [ ] Auto-expiration function runs successfully
- [ ] Expired urgent posts are marked as expired
- [ ] Search/filter returns urgent listings correctly
- [ ] Mobile and desktop UI rendering verified
- [ ] Error handling for invalid urgent types
- [ ] Photo upload works (optional field)
- [ ] Contact preference field saves correctly
- [ ] Performance acceptable with 100+ urgent listings

---

## Rollout Plan

### Local Development
1. Implement all features in local environment
2. Test thoroughly with mock data
3. Verify auto-expiration with accelerated timing
4. User acceptance testing

### Production Deployment
1. **DO NOT APPLY** until local testing complete
2. Create production migration (CONCURRENTLY for indexes)
3. Deploy code changes via standard deployment pipeline
4. Monitor error logs and user feedback
5. Enable auto-expiration scheduled job
6. Announce feature to user base

---

## Dependencies

- Existing category system architecture
- Hot deals pattern (for expiration handling)
- Supabase scheduled jobs (pg_cron) for auto-expiration
- Push notification infrastructure (for Phase 2)

---

## Open Questions

1. **Moderation Approach**: Priority queue, auto-approve, or standard queue?
2. **Push Notifications**: Implement in Phase 1 or defer to Phase 2?
3. **Response Tracking**: Should we track when urgent requests are fulfilled?
4. **Geographic Scope**: Wilaya-only or allow nationwide urgent requests?
5. **User Limits**: Should we limit urgent posts per user per time period?

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Status**: Awaiting stakeholder review and final design decisions
