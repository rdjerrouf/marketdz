# MarketDZ Search API Documentation

## Overview
Production-grade search API for MarketDZ marketplace with enterprise-level performance optimizations.

## Endpoints

### 🔍 Search Listings
`GET /api/search`

Returns paginated listing results with optional metadata.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query for title/description |
| `category` | enum | - | Filter by category: `for_sale`, `job`, `service`, `for_rent` |
| `wilaya` | string | - | Filter by Algerian province (wilaya) |
| `city` | string | - | Filter by city |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |
| `sortBy` | enum | `created_at` | Sort order: `created_at`, `price_asc`, `price_desc` |
| `page` | number | 1 | Page number (max 500 for DoS protection) |
| `limit` | number | 20 | Results per page (max 100) |
| `includeCount` | boolean | false | Include total count (slower, use only when needed) |

#### Response Format
```json
{
  "listings": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "price": number,
      "category": "enum",
      "wilaya": "string",
      "city": "string",
      "photos": ["url1", "url2", "url3"], // Max 3 for performance
      "created_at": "ISO string",
      "user_id": "uuid",
      "status": "active",
      "user": {
        "id": "uuid",
        "first_name": "string",
        "last_name": "string",
        "avatar_url": "string",
        "city": "string",
        "wilaya": "string",
        "rating": number
      }
    }
  ],
  "pagination": {
    "currentPage": number,
    "totalPages": number | 0,
    "totalItems": number | 0,
    "hasNextPage": boolean,
    "hasPreviousPage": boolean,
    "hasCount": boolean
  },
  "filters": {
    "query": "string",
    "category": "string",
    "wilaya": "string", 
    "city": "string",
    "minPrice": "string",
    "maxPrice": "string",
    "sortBy": "string"
  }
}
```

#### Performance Notes
- **Default behavior**: No count calculation for maximum speed
- **Pagination**: Uses `hasNextPage` detection based on result set size
- **Caching**: 60s for non-search queries, 10s for search queries
- **Rate limiting**: 30 requests per minute per IP

---

### 📊 Count Listings
`GET /api/search/count`

Returns total count for search criteria. Use this endpoint when you need exact totals for pagination UI.

#### Query Parameters
Same as search endpoint except `page`, `limit`, `sortBy`, and `includeCount`.

#### Response Format
```json
{
  "count": number,
  "filters": {
    "query": "string",
    "category": "string",
    "wilaya": "string",
    "city": "string", 
    "minPrice": number,
    "maxPrice": number
  }
}
```

#### Performance Notes
- **Rate limiting**: 10 requests per minute per IP (lower than search)
- **Caching**: 5 minutes (counts change less frequently)
- **Optimization**: Uses `head: true` for count-only queries

---

## Rate Limiting

### Headers
All responses include rate limiting headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1640995200
```

### Limits
- **Search endpoint**: 30 requests/minute per IP
- **Count endpoint**: 10 requests/minute per IP
- **429 response** includes `Retry-After` header

---

## Search Strategies

### Current Implementation: Trigram Search
- **Performance**: Excellent with proper indexes
- **Features**: Fuzzy matching, typo tolerance
- **Indexes required**: `gin_trgm_ops` on title and description

### Upgrade Path: Full-Text Search
For even better performance with complex queries:
```sql
-- Enable when ready for FTS upgrade
CREATE INDEX idx_listings_fts ON listings 
USING GIN (to_tsvector('english', title || ' ' || description)) 
WHERE status = 'active';
```

---

## Required Database Indexes

Deploy these indexes for production performance:

```sql
-- Core performance indexes
CREATE INDEX CONCURRENTLY idx_listings_search_composite 
ON listings(status, category, location_wilaya, location_city, price, created_at DESC) 
WHERE status = 'active';

-- Text search indexes  
CREATE INDEX CONCURRENTLY idx_listings_title_trgm 
ON listings USING GIN (title gin_trgm_ops) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_listings_description_trgm 
ON listings USING GIN (description gin_trgm_ops) WHERE status = 'active';
```

See `production_indexes.sql` for complete index deployment script.

---

## Usage Examples

### Basic Search
```javascript
// Get latest listings
const response = await fetch('/api/search?limit=20');

// Search with filters
const response = await fetch('/api/search?q=laptop&category=for_sale&wilaya=Algiers&minPrice=50000');
```

### With Count (when needed)
```javascript
// Get search results without count (faster)
const listings = await fetch('/api/search?q=laptop');

// Get count separately when needed for pagination UI
const countData = await fetch('/api/search/count?q=laptop');
const { count } = await countData.json();
```

### Pagination
```javascript
// Efficient pagination without total count
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await fetch(`/api/search?page=${page}&limit=20`);
  const data = await response.json();
  
  hasMore = data.pagination.hasNextPage;
  page++;
  
  // Process data.listings...
}
```

---

## Security Features

- ✅ **SQL Injection Protection**: Parameterized queries with escape functions
- ✅ **DoS Protection**: Page limits (max 500), result limits (max 100)
- ✅ **Rate Limiting**: Multi-instance safe with Redis fallbacks
- ✅ **Input Validation**: Comprehensive parameter validation
- ✅ **Error Handling**: Generic error messages in production

---

## Performance Characteristics

| Operation | Response Time | Throughput | Cache TTL |
|-----------|---------------|------------|-----------|
| Search (no count) | ~50-100ms | 30 req/min/IP | 10s |
| Search (with count) | ~100-200ms | 30 req/min/IP | 10s |
| Count only | ~30-80ms | 10 req/min/IP | 5min |
| Browse (no search) | ~30-60ms | 30 req/min/IP | 60s |

*Performance with proper database indexes deployed*
