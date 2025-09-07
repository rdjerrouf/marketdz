# User Rating System Implementation Guide

## Overview
Your marketplace now has a comprehensive user rating system that allows users to rate and review each other. This creates trust and accountability in your marketplace.

## Features Implemented

### 1. Database Structure
- **Reviews Table**: Stores user reviews with ratings (1-5 stars) and comments
- **Automatic Rating Calculation**: User profiles automatically calculate average ratings
- **Review Count Tracking**: Tracks total number of reviews received
- **Triggers**: Database automatically updates user ratings when reviews are added/updated/deleted

### 2. UI Components

#### StarRating Component (`src/components/common/StarRating.tsx`)
- Interactive star rating (1-5 stars)
- Read-only mode for displaying ratings
- Hover effects for better UX
- Multiple sizes (sm, md, lg)
- Shows numerical rating value

#### ReviewCard Component (`src/components/common/ReviewCard.tsx`)
- Displays individual reviews
- Shows reviewer info and avatar
- Displays rating with stars
- Shows review date
- Edit/delete options for review authors
- Links to associated listings

#### ReviewForm Component (`src/components/common/ReviewForm.tsx`)
- Form for creating new reviews
- Star rating selector
- Comment text area with validation
- Loading states
- Error handling

### 3. API Endpoints

#### GET /api/reviews
- Fetch reviews with filtering options
- Supports pagination
- Can filter by reviewed_id, reviewer_id, listing_id
- Returns formatted review data with user profiles

#### POST /api/reviews
- Create new reviews
- Validates rating (1-5)
- Prevents self-reviews
- Prevents duplicate reviews for same listing
- Rate limiting protection

### 4. React Hooks

#### useReviews()
- Fetch reviews with filtering and pagination
- Loading and error states
- Automatic refetching

#### useCreateReview()
- Create new reviews
- Loading and error handling
- Authentication integration

#### useUserRating()
- Get user's average rating and review count
- Real-time updates from database

### 5. User Profile Pages

#### Profile Page (`src/app/profile/[id]/page.tsx`)
- Complete user profile view
- Shows average rating and review count
- Lists all reviews for the user
- Review form for authenticated users
- Prevents self-reviews

## How Users Rate Each Other

### 1. **Access User Profiles**
Users can click on any user's name in:
- Listing cards (browse page)
- Favorites page
- Message threads
- Search results

### 2. **Leave Reviews**
On any user's profile page:
- Click "Laisser un avis" button
- Select star rating (1-5)
- Write detailed comment
- Submit review

### 3. **View Ratings**
Ratings are displayed:
- On user profile pages
- In listing cards (shows seller rating)
- In search results
- In favorites
- In messages

## Usage Examples

### Display User Rating
```tsx
import StarRating from '@/components/common/StarRating'
import { useUserRating } from '@/hooks/useReviews'

function UserCard({ userId }) {
  const { rating, reviewCount } = useUserRating(userId)
  
  return (
    <div>
      <StarRating rating={rating} readonly showValue />
      <span>({reviewCount} avis)</span>
    </div>
  )
}
```

### Create Review Form
```tsx
import ReviewForm from '@/components/common/ReviewForm'
import { useCreateReview } from '@/hooks/useReviews'

function ReviewSection({ userId, listingId }) {
  const { createReview } = useCreateReview()
  
  const handleSubmit = async (reviewData) => {
    await createReview(reviewData)
    // Handle success
  }
  
  return (
    <ReviewForm
      reviewedUserId={userId}
      listingId={listingId}
      onSubmit={handleSubmit}
      onCancel={() => setShowForm(false)}
    />
  )
}
```

### Display Reviews List
```tsx
import { useReviews } from '@/hooks/useReviews'
import ReviewCard from '@/components/common/ReviewCard'

function ReviewsList({ userId }) {
  const { data, loading } = useReviews({ reviewedId: userId })
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {data?.reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
```

## Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(reviewer_id, reviewed_id, listing_id)
);
```

### Profiles Table (with rating fields)
- `rating`: Average rating (calculated automatically)
- `review_count`: Total number of reviews received

## Rate Limiting
- Review fetching: 60 requests per minute
- Review creation: 5 reviews per 5 minutes
- Prevents spam and abuse

## Security Features
- Authentication required for creating reviews
- Users cannot review themselves
- One review per listing per user pair
- Input validation and sanitization
- Rate limiting protection

## Benefits for Your Marketplace

1. **Trust Building**: Users can see ratings before transactions
2. **Quality Control**: Poor performers get lower ratings
3. **Incentives**: Users strive for better ratings
4. **Transparency**: Public review system builds confidence
5. **Community**: Encourages positive interactions

## Next Steps

1. Test the rating system with different user accounts
2. Add rating filters to search/browse pages
3. Consider notification system for new reviews
4. Add rating requirements for certain actions
5. Monitor and moderate inappropriate reviews

Your marketplace now has a full-featured rating system that will help build trust and improve user experience!
