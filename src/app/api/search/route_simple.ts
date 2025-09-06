// src/app/api/search/route.ts - Simplified working version
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple mock data for development
const mockListings = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max - Like New',
    description: 'Excellent condition iPhone 14 Pro Max 256GB Space Black. Original box and accessories included.',
    price: 180000,
    category: 'for_sale',
    photos: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
    created_at: '2025-01-15T10:00:00Z',
    status: 'active',
    user_id: '1',
    wilaya: 'Alger',
    city: 'Bab Ezzouar',
    user: {
      id: '1',
      first_name: 'Ahmed',
      last_name: 'Benali',
      avatar_url: null
    }
  },
  {
    id: '2',
    title: 'Luxury Apartment for Rent',
    description: 'Modern 3-bedroom apartment with sea view, fully furnished, high-end finishes.',
    price: 85000,
    category: 'for_rent',
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'],
    created_at: '2025-01-14T15:30:00Z',
    status: 'active',
    user_id: '2',
    wilaya: 'Alger',
    city: 'Hydra',
    user: {
      id: '2',
      first_name: 'Fatima',
      last_name: 'Kader',
      avatar_url: null
    }
  },
  {
    id: '3',
    title: 'Senior React Developer',
    description: 'Join our tech team! Remote work, competitive salary, equity options. 5+ years experience required.',
    price: 250000,
    category: 'job',
    photos: ['https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop'],
    created_at: '2025-01-13T09:15:00Z',
    status: 'active',
    user_id: '3',
    wilaya: 'Alger',
    city: 'Kouba',
    user: {
      id: '3',
      first_name: 'Karim',
      last_name: 'Boutahar',
      avatar_url: null
    }
  },
  {
    id: '4',
    title: 'Professional Photography Service',
    description: 'Wedding, events, portraits. Professional equipment, 10+ years experience.',
    price: 15000,
    category: 'service',
    photos: ['https://images.unsplash.com/photo-1554048612-b6a482b224bd?w=400&h=300&fit=crop'],
    created_at: '2025-01-12T14:20:00Z',
    status: 'active',
    user_id: '4',
    wilaya: 'Oran',
    city: 'Es Senia',
    user: {
      id: '4',
      first_name: 'Youcef',
      last_name: 'Mansouri',
      avatar_url: null
    }
  },
  {
    id: '5',
    title: 'BMW X5 2020 - Excellent Condition',
    description: 'Low mileage, full service history, leather seats, navigation system.',
    price: 4500000,
    category: 'for_sale',
    photos: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'],
    created_at: '2025-01-11T11:45:00Z',
    status: 'active',
    user_id: '5',
    wilaya: 'Constantine',
    city: 'Constantine',
    user: {
      id: '5',
      first_name: 'Salim',
      last_name: 'Cherif',
      avatar_url: null
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const urlSearchParams = request.nextUrl.searchParams;
    const query = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const minPrice = urlSearchParams.get('minPrice');
    const maxPrice = urlSearchParams.get('maxPrice');
    const sortBy = urlSearchParams.get('sortBy') || 'created_at';
    const page = parseInt(urlSearchParams.get('page') || '1');
    const limit = parseInt(urlSearchParams.get('limit') || '20');

    console.log('Search params:', { query, category, wilaya, minPrice, maxPrice, sortBy, page, limit });

    // Filter mock listings
    let filteredListings = mockListings.filter(listing => {
      // Text search
      if (query) {
        const searchText = (listing.title + ' ' + listing.description).toLowerCase();
        const searchTerms = query.toLowerCase().split(' ');
        const matches = searchTerms.some(term => searchText.includes(term));
        if (!matches) return false;
      }

      // Category filter
      if (category && listing.category !== category) return false;

      // Wilaya filter
      if (wilaya && listing.wilaya !== wilaya) return false;

      // Price filters
      if (minPrice && listing.price && listing.price < parseFloat(minPrice)) return false;
      if (maxPrice && listing.price && listing.price > parseFloat(maxPrice)) return false;

      return true;
    });

    // Sort listings
    filteredListings.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Pagination
    const totalItems = filteredListings.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedListings = filteredListings.slice(startIndex, endIndex);

    const response = {
      listings: paginatedListings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        hasCount: true
      },
      filters: {
        categories: ['for_sale', 'for_rent', 'job', 'service'],
        wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba']
      },
      metadata: {
        strategy: 'mock',
        executionTime: 5
      }
    };

    console.log('Search response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
