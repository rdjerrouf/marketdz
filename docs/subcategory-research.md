# Subcategory Fields Research & Implementation Plan
**Date:** 2026-06-08  
**Context:** marketdz — Algerian classified marketplace (Next.js + Supabase/PostgreSQL)  
**Purpose:** Research-backed plan for handling subcategory-specific fields across `for_sale` and `for_rent` categories

---

## Part 1 — Competitor Analysis: Ouedkniss 

### 1.1 Top-Level Category Structure

Ouedkniss uses **18 top-level categories** on the homepage. The most important structural decision they made — and the one most relevant to this project — is:

> **Auto Parts is a completely separate top-level category from Vehicles. They are not subcategories of each other.**

A user looking for a used alternator never lands in the cars section. This is not a minor UX choice — it is a fundamental architectural decision that affects the DB schema, search filters, and listing forms.

---

### 1.2 Vehicles (سيارات ومركبات) — Full Breakdown

#### Subcategories
| Arabic | English |
|---|---|
| سيارات | Cars |
| السيارات النفعية | Commercial / Utility Vehicles |
| دراجات نارية وسكوترات | Motorcycles & Scooters |
| دراجة نارية رباعية - كواد | Quad Bikes / ATV |
| عربة نقل | Cargo Van |
| شاحنة | Truck |
| حافلة | Bus |
| آلة | Machine / Equipment |
| جرار | Tractor |

#### Search Filters for Cars
| Filter | Arabic | Type |
|---|---|---|
| Wilaya | ولاية | Dropdown |
| Price (millions DZD) | السعر مليون | Range |
| Trade/Exchange | التبادل | Toggle |
| Year | السنة | Range |
| Make / Brand | العلامة / الماركة | Select |
| Fuel Type | الطاقة | Select |
| Transmission | علبة السرعة | Select |
| Mileage | الكيلومترات | Range |
| Dealers + Private | المتاجر + الخواص | Toggle |

#### Fields on a Car Listing Detail Page
- السنة (Year)
- العلامة / الماركة (Make)
- الموديل (Model)
- النسخة (Trim/Version)
- المحرك (Engine spec — e.g. "1.6 MPi 90ch")
- الطاقة (Fuel type)
- علبة السرعة (Transmission)
- الكيلومترات (Mileage)

#### Fields on a Motorcycle Listing Detail Page
- السنة, العلامة/الماركة, الموديل, المحرك (CC — e.g. "690"), الطاقة, علبة السرعة, الكيلومترات

**Key finding:** Motorcycles use **the exact same structured fields as cars.** There is no separate `moto_type` field. The engine field naturally holds CC for motos ("690") vs displacement+power for cars ("1.6 MPi 90ch"). Body type is not a structured field on Ouedkniss — it is written in the title and description by the seller.

---

### 1.3 Auto Parts (قطع غيار) — Completely Separate Category

#### Subcategories within Car Parts
| Arabic | English |
|---|---|
| قطع غيار السيارات | Car Parts |
| قطع غيار المركبات | Vehicle/Truck Parts |
| قطع للدراجات النارية | Motorcycle Parts |
| قطع غيار القوارب | Boat Parts |
| أمن وإنذار | Security & Alarm |
| تنظيف وصيانة | Cleaning & Maintenance |
| أدوات التشخيص | Diagnostic Tools |
| مواد التشحيم | Lubricants |

#### Sub-subcategories within Car Parts
الأجزاء الداخلية (Interior), قطع هيكل السيارة (Body parts), الإضاءة (Lighting), نوافذ وزجاج أمامي (Windows/Windshield), إطارات وعجلات (Tires & Wheels), أغطية وفرش الأرض (Covers & Mats), بطاريات (Batteries)

#### Search Filters for Auto Parts
| Filter | Arabic | Note |
|---|---|---|
| Part category | الفئة | The sub-subcategory (body/lighting/tires…) |
| Wilaya | ولاية | |
| Price | السعر | |
| Exchange | التبادل | |
| Condition | الحالة | New / Used |
| Dealers + Private | المتاجر + الخواص | |
| Pre-order | طلب مسبق | Toggle |

#### Fields on an Auto Parts Listing Detail Page
- الحالة (Condition: New / Used) — **this is the only structured field**
- Compatible vehicle (make/model/year) goes in the **title and description** by the seller, NOT as a structured DB field

**Key finding:** Ouedkniss does not ask sellers to fill in structured compatibility fields (compatible_make, compatible_year). The title "Phare Audi Q5 2018" is enough. This is pragmatic and works because full-text search covers it.

---

### 1.4 Real Estate (عقارات)

#### Structure
Sale and Rent are **top-level navigation tabs**, not subcategories. Each has the same property types beneath:
شقة (Apartment), محل (Shop/Commercial), فيلا (Villa), أرض (Land), أرض فلاحية (Agricultural Land), عمارة (Building), بانجالو (Bungalow), مستودع-مصنع (Warehouse/Factory), آخر (Other)

Rent has one additional: **كراء للعطل** (Vacation Rental)

#### Search Filters — Apartment FOR SALE
| Filter | Arabic |
|---|---|
| Wilaya | ولاية |
| Price | السعر |
| Exchange | التبادل |
| Apartment type | نوع الشقة (F2/F3/F4…) |
| Rooms | الغرف |
| Surface area | المساحة |
| Floor | الطابق |
| Developer/Promoter | ترقية عقارية |
| Residence name | إقامة |
| Features | المميزات |
| Parking | موقف سيارة |
| Finishing level | التشطيب |
| Sale type | نوع البيع |
| Documents | الوثائق |
| Payment conditions | شروط الدفع |

#### Search Filters — Apartment FOR RENT
Same as sale **except:**
- المساحة (Surface area) is **removed**
- الدفع بـ (Payment frequency: monthly/quarterly/yearly) is **added**
- الوثائق, نوع البيع, شروط الدفع are **removed**

**Key finding:** Sale and Rent have **different filter sets** even for the same property type. They are not the same form.

---

### 1.5 Phones & Electronics

#### Phones (هواتف ذكية) — Search Filters
ولاية, السعر, التبادل, العلامة/الماركة (Brand), الحالة (Condition), المتاجر+الخواص, توصيل (Delivery)

#### Computers (كمبيوتر محمول) — Search Filters
الفئة (Category), ولاية, السعر, التبادل, الحالة, **الشاشة (Screen size), المعالج (Processor), RAM, القرص الصلب (Storage), بطاقة رسوميات مخصصة (Dedicated GPU toggle)**, المتاجر+الخواص, توصيل

**Key finding:** Phones and computers have **different filter sets** even though they are both "electronics." They are not grouped into a single `isElectronics` block on Ouedkniss.

---

### 1.6 What Ouedkniss Does Right — Summary

| Decision | Why it matters |
|---|---|
| Auto Parts = separate top-level category | A seller of brake pads never sees car fields. A buyer of parts never sees car listings. |
| Motorcycles share the same fields as cars | No duplication. Engine CC naturally differentiates motos from cars. |
| Construction/trucks/machinery = separate subcategories | Each gets only the fields that apply to it. |
| Compatible vehicle goes in title/description for parts | Pragmatic. Full-text search covers it. No structured compatibility DB needed. |
| Real estate sale vs rent have different filter sets | Different buyer intent → different search needs → different fields. |
| Phones and computers have different specific filters | Electronics are not one category — the subcategory drives the filters. |
| Condition (الحالة) appears on everything | Universal field across all categories. |

---

## Part 2 — How Experienced Developers Solve This Problem

### 2.1 The Four Approaches

#### Approach 1: Wide Flat Table (Sparse Columns)
Add a column for every possible attribute. Unused ones are NULL.

```sql
ALTER TABLE listings ADD COLUMN vehicle_make TEXT;
ALTER TABLE listings ADD COLUMN bedrooms SMALLINT;
ALTER TABLE listings ADD COLUMN ram_gb INT;
-- ... 50+ more nullable columns
```

**Used by:** Early-stage apps, simple classifieds, your current schema for `vehicle_*` columns.

**Breaks when:**
- 75%+ of columns are NULL per row → bloated pages, wasted I/O
- Schema migration needed every time a new subcategory is added
- Impossible to scale beyond ~10 subcategories without the table becoming unmaintainable
- Already diagnosed in your `new_db_plan.md` as the primary structural concern

---

#### Approach 2: EAV (Entity-Attribute-Value)
Three tables: entities, attribute names, attribute values. Each attribute is a row.

```sql
CREATE TABLE listing_attributes (
  listing_id  INT REFERENCES listings(id),
  attr_name   TEXT,
  attr_value  TEXT
);
```

**Used by:** Early eBay (pre-2010), legacy Oracle-era classifieds.

**The verdict:** Don't. Every major PostgreSQL expert says the same thing.
- 6.4GB vs 2GB for JSONB with the same dataset
- Filtering across multiple attributes requires self-joins
- Type enforcement is non-existent — everything is TEXT
- Queries become exponentially complex as attributes grow
- *Cybertec (PostgreSQL core contributors): "EAV design in PostgreSQL — don't do it."*

---

#### Approach 3: JSONB for All Attributes
One flexible column stores everything subcategory-specific.

```sql
ALTER TABLE listings ADD COLUMN listing_details JSONB;
-- {"bedrooms": 3, "property_type": "apartment", "ram_gb": 8}
```

**Used by:** Modern classifieds, your current `listing_details` column.

**What it solves:**
- No schema changes for new attributes — just write to the JSON
- 3× less storage than EAV
- 15,000× faster than EAV with GIN index + containment operator (`@>`)

**Where it falls short:**
- Range queries need expression indexes planned per field
- No native type enforcement (application must validate)
- Sorting on JSONB fields is less ergonomic than native columns

**Index strategy for searchable JSONB fields:**
```sql
-- Equality filter (property_type, brand, condition)
CREATE INDEX ON listings USING GIN (listing_details jsonb_path_ops);

-- Range filter / sort (bedrooms, size_sqm)
CREATE INDEX ON listings ((listing_details->>'bedrooms')::int)
  WHERE status = 'active';

CREATE INDEX ON listings ((listing_details->>'size_sqm')::numeric)
  WHERE status = 'active';
```

---

#### Approach 4: Metadata-Driven Hybrid — What Successful Platforms Build

This is the pattern used by platforms that outgrew approaches 1–3. It combines:
1. A **`category_field_definitions` table** — the single source of truth for what fields each subcategory has
2. **Hybrid storage** — dedicated columns for the 3–6 most-filtered fields, JSONB for everything else
3. **Expression indexes** — added only for fields marked `is_searchable = true`

**The `category_field_definitions` table:**

```sql
CREATE TABLE category_field_definitions (
  id              SERIAL PRIMARY KEY,
  subcategory     TEXT NOT NULL,
  field_key       TEXT NOT NULL,
  field_label_ar  TEXT,
  field_label_fr  TEXT,
  field_label_en  TEXT,
  field_type      TEXT NOT NULL,     -- 'text' | 'integer' | 'select' | 'boolean' | 'range'
  options         JSONB,             -- for selects: ["sedan","suv","hatchback"]
  is_required     BOOLEAN DEFAULT false,
  is_searchable   BOOLEAN DEFAULT false,  -- drives expression index creation
  is_range_filter BOOLEAN DEFAULT false,  -- drives min/max UI in search filters
  display_order   INT,
  storage         TEXT DEFAULT 'jsonb'    -- 'jsonb' | 'column' (for promoted fields)
);
```

This table is the **single source of truth** that drives:
1. Which fields appear in the listing creation form
2. Which filters appear in the search/browse UI
3. Which expression indexes get created on `listing_details`

Instead of `if (sub === 'Vehicles') { ... }` hardcoded in a React component, the form fetches definitions and renders them dynamically:

```typescript
const fields = await getCategoryFieldDefinitions(subcategory);
// Render each field based on field_type: text input, select, number, toggle
```

---

### 2.2 What Major Platforms Do

| Platform | Approach |
|---|---|
| **eBay** | "Category Aspects" metadata system. Field definitions stored per category leaf node, maintained by ML trained on buyer search behavior. Heavy-filter fields become structured "Item Specifics"; rest go into description. |
| **OLX / Dubizzle** | Metadata-driven attribute table per category. Category tree drives which attribute group renders in the post form and which filters show in search. |
| **Ouedkniss** | Separate category tree per top-level domain. Compatible vehicle for parts goes in title (not structured). Condition is universal. Apartments have 12+ filter fields for sale, fewer for rent. |
| **Airbnb** | Property-type-specific fields stored as structured attributes linked to listing type. Amenities stored as a tag array (JSONB). |
| **Craigslist** | Almost no structured fields — free text only. Search is terrible as a result. Do not copy. |

---

### 2.3 The Industry Consensus

From AllStarsIT, Leapcell, Cybertec, Red-gate, and eBay Engineering collectively:

> "Product attributes must function as a stable contract, not a loose collection of key-value pairs."

> "Prioritize 20–50 most-used filter attributes for first-class treatment. Maintain normalized storage while building denormalized read-optimized representations."

> "JSONB strikes a compelling balance, offering schema flexibility, efficient querying with indexing, and support for semi-structured data — making it a powerful solution for modern applications."

> "Use relational columns for core attributes that drive key queries. Use JSON for long-tail attributes. Use EAV only when you truly need an attribute-definition system and accept the query complexity."

---

## Part 3 — Recommended Plan for marketdz

### 3.1 Architecture Decision: Metadata-Driven Hybrid

Adopt the `category_field_definitions` table as the single source of truth. This eliminates the hardcoded `VEHICLE_SUBCATS`, `REAL_ESTATE_SUBCATS`, `ELECTRONICS_SUBCATS` sets in `ListingForm.tsx` and makes every form section, search filter, and index definition data-driven.

---

### 3.2 `for_sale` — Complete Field Contract

#### Cars (سيارات)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| vehicle_make | select | **column** | ✅ | Equality |
| vehicle_model | text | **column** | ✅ | Equality |
| vehicle_year | integer | **column** | ✅ | Range |
| vehicle_mileage | integer | **column** | ✅ | Range (max) |
| vehicle_transmission | select | **column** | ✅ | Equality |
| vehicle_fuel_type | select | **column** | ✅ | Equality |
| vehicle_body_type | select | **column** | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |
| engine_spec | text | jsonb | ❌ | Display only |

*No changes needed — existing `vehicle_*` columns are correct for cars.*

#### Motorcycles & Scooters (دراجات نارية)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| vehicle_make | select | **column** | ✅ | Equality |
| vehicle_model | text | **column** | ✅ | Equality |
| vehicle_year | integer | **column** | ✅ | Range |
| vehicle_mileage | integer | **column** | ✅ | Range |
| vehicle_fuel_type | select | **column** | ✅ | Equality |
| engine_cc | integer | jsonb | ✅ | Range |
| moto_type | select | jsonb | ✅ | Equality |
| vehicle_transmission | select | **column** | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

*`moto_type` options: sport, cruiser, scooter, enduro, naked, other*  
*`vehicle_body_type` is **not used** for motos — replaced by `moto_type` in `listing_details`*

#### Auto & Motorcycle Parts (قطع غيار)
**This subcategory must be split out of `VEHICLE_SUBCATS` entirely.**

| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| part_category | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

*`part_category` options: engine, electrical, body, suspension, brakes, interior, lighting, tires-wheels, exhaust, transmission, other*

*Compatible vehicle (make/model/year) → written in the **title and description** by the seller. Do not add structured compatibility fields — Ouedkniss does not do it, and full-text search handles it. This avoids a complex compatibility matrix.*

#### Construction Vehicles & Trucks (مركبات ومعدات البناء)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| vehicle_make | select | **column** | ✅ | Equality |
| vehicle_year | integer | **column** | ✅ | Range |
| vehicle_mileage | integer | **column** | ✅ | Range |
| vehicle_fuel_type | select | **column** | ✅ | Equality |
| truck_type | select | jsonb | ✅ | Equality |
| payload_capacity_kg | integer | jsonb | ✅ | Range |
| condition | select | jsonb | ✅ | Equality |

*`truck_type` options: flatbed, tipper, cement-mixer, crane-truck, refrigerated, tanker, box-truck, other*  
*`vehicle_body_type` is **not used** for trucks — replaced by `truck_type` in jsonb*

#### Heavy Equipment & Machinery (معدات ثقيلة)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| vehicle_make | select | **column** | ✅ | Equality |
| vehicle_year | integer | **column** | ✅ | Range |
| hours_used | integer | jsonb | ✅ | Range |
| equipment_type | select | jsonb | ✅ | Equality |
| engine_power_kw | integer | jsonb | ❌ | Display only |
| condition | select | jsonb | ✅ | Equality |

*`equipment_type` options: excavator, bulldozer, loader, crane, forklift, generator, compactor, grader, other*  
*`vehicle_mileage` is **not used** for heavy equipment — hours_used replaces it*

#### Construction Materials & Supplies (مواد البناء)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| material_type | select | jsonb | ✅ | Equality |
| brand | text | jsonb | ✅ | Equality |
| unit | select | jsonb | ❌ | Display only |
| quantity_available | integer | jsonb | ❌ | Display only |
| condition | select | jsonb | ✅ | Equality |

*`material_type` options: cement, steel, brick, tile, wood, paint, glass, insulation, plumbing, electrical, other*

#### Real Estate — Sale (عقارات للبيع)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| property_type | select | jsonb | ✅ | Equality |
| bedrooms | integer | jsonb | ✅ | Range |
| bathrooms | integer | jsonb | ❌ | Display only |
| size_sqm | integer | jsonb | ✅ | Range |
| floor | integer | jsonb | ✅ | Equality |
| furnished | select | jsonb | ✅ | Equality |
| parking | boolean | jsonb | ✅ | Toggle |
| finishing | select | jsonb | ✅ | Equality |
| sale_type | select | jsonb | ❌ | Display only |
| documents | select | jsonb | ❌ | Display only |
| payment_conditions | select | jsonb | ❌ | Display only |

*`property_type` options: apartment, house, villa, land, agricultural-land, building, studio, office, commercial, warehouse, bungalow, other*  
*`finishing` options: raw, semi-finished, finished, luxury*

#### Phones & Accessories (هواتف وملحقات)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | select | jsonb | ✅ | Equality |
| model_name | text | jsonb | ✅ | Equality |
| storage_gb | integer | jsonb | ✅ | Select |
| condition | select | jsonb | ✅ | Equality |
| color | text | jsonb | ❌ | Display only |

#### Electronics & Computers (إلكترونيات وحواسيب)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | select | jsonb | ✅ | Equality |
| model_name | text | jsonb | ✅ | Equality |
| screen_size | text | jsonb | ✅ | Select |
| processor | text | jsonb | ✅ | Equality |
| ram_gb | integer | jsonb | ✅ | Range |
| storage_gb | integer | jsonb | ✅ | Select |
| gpu | text | jsonb | ❌ | Display only |
| dedicated_gpu | boolean | jsonb | ✅ | Toggle |
| condition | select | jsonb | ✅ | Equality |

#### Home Appliances (أجهزة منزلية)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | select | jsonb | ✅ | Equality |
| appliance_type | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

*`appliance_type` options: fridge, washing-machine, oven, air-conditioner, television, vacuum, other*

#### Furniture & Home Decor (أثاث وديكور)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| material | text | jsonb | ❌ | Display only |
| color | text | jsonb | ❌ | Display only |
| condition | select | jsonb | ✅ | Equality |

#### Fashion & Clothing (موضة وملابس)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| size | text | jsonb | ✅ | Select |
| gender | select | jsonb | ✅ | Equality |
| color | text | jsonb | ❌ | Display only |
| material | text | jsonb | ❌ | Display only |
| condition | select | jsonb | ✅ | Equality |

#### Baby & Kids (أطفال ورضع)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| age_range | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

*`age_range` options: 0-6m, 6-12m, 1-2y, 2-4y, 4-6y, 6-8y, 8-12y, 12y+*

#### Sports & Outdoors (رياضة وأنشطة خارجية)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| sport_type | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

#### Books & Media (كتب ووسائل إعلام)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| language | select | jsonb | ✅ | Equality |
| genre | select | jsonb | ✅ | Equality |
| author | text | jsonb | ❌ | Display only |
| condition | select | jsonb | ✅ | Equality |

*`language` options: arabic, french, english, other (critical for Algeria)*

#### Tools & Equipment (أدوات ومعدات)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| tool_type | select | jsonb | ✅ | Equality |
| power_source | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

*`power_source` options: electric, battery, pneumatic, manual, fuel*

#### Agriculture (زراعة)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| brand | text | jsonb | ✅ | Equality |
| product_type | select | jsonb | ✅ | Equality |
| condition | select | jsonb | ✅ | Equality |

---

### 3.3 `for_rent` — Complete Field Contract

**Key rule:** For rent, the transaction-type fields change. Remove sale-specific fields (documents, payment conditions, sale type). Add rental-specific fields (rental_period, deposit, availability dates).

#### Apartments & Houses (شقق / منازل)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| property_type | select | jsonb | ✅ | Equality |
| bedrooms | integer | jsonb | ✅ | Range |
| bathrooms | integer | jsonb | ❌ | Display only |
| size_sqm | integer | jsonb | ✅ | Range |
| floor | integer | jsonb | ✅ | Equality |
| furnished | select | jsonb | ✅ | Equality |
| parking | boolean | jsonb | ✅ | Toggle |
| rental_period | select | jsonb | ✅ | Equality |
| available_from | date | column (existing) | ✅ | Range |

*`rental_period` options: daily, weekly, monthly, quarterly, yearly*  
*`furnished` options: yes, no, partial*  
*Note: size_sqm and available_from are dropped from the filter panel for rent (matching Ouedkniss pattern)*

#### Offices & Commercial Space (مكاتب / مساحات تجارية)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| size_sqm | integer | jsonb | ✅ | Range |
| floor | integer | jsonb | ✅ | Equality |
| usage_type | select | jsonb | ✅ | Equality |
| parking | boolean | jsonb | ✅ | Toggle |
| rental_period | select | jsonb | ✅ | Equality |
| available_from | date | column (existing) | ✅ | Range |

*`usage_type` options: office, coworking, retail, warehouse, restaurant, clinic, other*

#### Event Halls — Salle des Fêtes (قاعات مناسبات)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| capacity_persons | integer | jsonb | ✅ | Range |
| size_sqm | integer | jsonb | ❌ | Display only |
| catering_included | boolean | jsonb | ✅ | Toggle |
| parking | boolean | jsonb | ✅ | Toggle |
| rental_period | select | jsonb | ✅ | Equality |

*`rental_period` options: half-day, full-day, weekend*

#### Vehicles for Rent (مركبات للإيجار)
These are **not** described with `vehicle_*` sale columns. The intent is different.

| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| vehicle_make | select | **column** | ✅ | Equality |
| vehicle_model | text | **column** | ✅ | Equality |
| vehicle_year | integer | **column** | ✅ | Range |
| vehicle_fuel_type | select | **column** | ✅ | Equality |
| vehicle_transmission | select | **column** | ✅ | Equality |
| rate_unit | select | jsonb | ✅ | Equality |
| deposit_required | boolean | jsonb | ✅ | Toggle |
| mileage_limit_km | integer | jsonb | ❌ | Display only |
| driver_included | boolean | jsonb | ✅ | Toggle |

*`rate_unit` options: per-day, per-week, per-month*  
*Reuses existing `vehicle_*` columns since make/model/year/fuel/transmission are valid for rental vehicles too*

#### Equipment for Rent (معدات للإيجار)
| Field | Type | Storage | Searchable | Filter type |
|---|---|---|---|---|
| equipment_type | select | jsonb | ✅ | Equality |
| brand | text | jsonb | ✅ | Equality |
| rate_unit | select | jsonb | ✅ | Equality |
| deposit_required | boolean | jsonb | ✅ | Toggle |
| available_from | date | column (existing) | ✅ | Range |

---

### 3.4 Universal Fields (Apply to ALL Subcategories)

These fields are already top-level columns in `listings` and remain so:

| Field | Column | Notes |
|---|---|---|
| condition | `condition` (existing) | New / Used / Refurbished |
| price | `price` | |
| location_wilaya | `location_wilaya` | |
| location_city | `location_city` | |
| listing_type | `category` | for_sale / for_rent |
| photos | `photos` | |
| title | `title` | |
| description | `description` | |

---

### 3.5 What NOT to Build (Lessons from Research)

| Temptation | Why to resist |
|---|---|
| Structured compatibility fields for Auto Parts (compatible_make, compatible_year_from…) | Ouedkniss doesn't do it. Adds schema complexity with minimal search benefit. Sellers write it in the title — full text search finds it. |
| EAV table for attributes | 3× more storage, 15,000× slower queries, type-unsafe. No major platform recommends it in 2024+. |
| One flat `isElectronics` block showing all electronics fields | Phones and computers need different filters. Ouedkniss uses separate subcategories with separate filter sets. |
| Promoting every field to a dedicated column | Your `new_db_plan.md` already warns against wide tables. Promote only fields with heavy range-filter use. |
| Hardcoded subcategory conditions in `ListingForm.tsx` | Unmaintainable. Use the `category_field_definitions` table as the source of truth instead. |

---

### 3.6 Implementation Order

**Phase 1 ✅ — Fix what was broken (no new DB columns needed)**
- Auto & Motorcycle Parts removed from vehicle detection; own form section with `part_category` only
- Motorcycles: `moto_type` + `engine_cc` in JSONB, no `vehicle_body_type`
- Construction Trucks: make/year/mileage/fuel columns + `truck_type` + `payload_capacity_kg` in JSONB
- Heavy Equipment: make/year columns + `hours_used` + `equipment_type` in JSONB
- Browse filters restricted to subcategories that actually use vehicle columns

**Phase 2 ✅ — For-rent subcategory fields**
- Apartments/Houses, Offices/Commercial, Event Halls, Vehicles for Rent, Equipment for Rent
- Each shows only the fields that make sense for that rental type

**Phase 3 ✅ — Metadata-driven architecture**
- `src/lib/constants/subcategory-fields.ts` — 24 subcategory configs, single source of truth
- `src/components/listings/SubcategoryFields.tsx` — generic renderer, no hardcoded subcategory logic
- `ListingForm.tsx` 1,747 → 829 lines
- `category_field_definitions` DB table + 22 JSONB expression indexes (migrations 20260608000001-2)
- ~85 new translation keys in en/fr/ar

**Phase 4 ⏳ — Search filter alignment**
1. Read `getSubcategoryConfig()` in `browse/page.tsx` to show subcategory-specific JSONB filters
2. Wire JSONB filter params into `src/app/api/search/route.ts` (`@>` for equality, cast for ranges)
3. Translation keys already exist — same keys used in forms

---

### 3.7 Promoted Columns Summary (What Gets a Real DB Column vs JSONB)

| Column | Already exists? | Used by subcategories |
|---|---|---|
| `vehicle_make` | ✅ | Cars, Motos, Construction Vehicles, Heavy Equipment, Vehicles for Rent |
| `vehicle_model` | ✅ | Cars, Motos, Vehicles for Rent |
| `vehicle_year` | ✅ | Cars, Motos, Construction Vehicles, Heavy Equipment, Vehicles for Rent |
| `vehicle_mileage` | ✅ | Cars, Motos, Construction Vehicles |
| `vehicle_transmission` | ✅ | Cars, Motos, Vehicles for Rent |
| `vehicle_fuel_type` | ✅ | Cars, Motos, Construction Vehicles, Vehicles for Rent |
| `vehicle_body_type` | ✅ | Cars only (motos use `moto_type` in JSONB) |
| `available_from` | ✅ | Apartments/Houses for Rent, Offices, Equipment Rental |
| `condition` | ✅ (top-level) | All for_sale subcategories |
| `listing_details` | ✅ | All non-vehicle subcategory-specific fields |

**No new dedicated columns needed.** All new subcategory fields go into `listing_details` JSONB with targeted expression indexes for `is_searchable = true` fields.

---

*Document generated from: browser analysis of ouedkniss.com + research across Cybertec, Leapcell, AllStarsIT, Red-gate, eBay Engineering, and coussej.github.io*
