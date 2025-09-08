// src/app/api/search/suggestions/route.ts - Autocomplete Suggestions API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SearchSuggestionEngine } from '@/lib/search/enhanced-utils';
import { smartRateLimit } from '@/lib/rate-limit/database';
import { normalizeSearchQuery } from '@/lib/search/utils';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for suggestions
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    const rateLimitResult = await smartRateLimit(ip, 60, 60000); // 60 requests per minute for suggestions
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const normalizedQuery = normalizeSearchQuery(query);
    const supabase = await createServerSupabaseClient();
    
    // Initialize suggestion engine
    const suggestionEngine = new SearchSuggestionEngine(supabase);

    // Get autocomplete suggestions from multiple sources
    const suggestions = new Set<string>();

    // 1. Title-based suggestions from listings
    const autocompleteSuggestions = await suggestionEngine.getAutocompleteSuggestions(normalizedQuery, limit);
    autocompleteSuggestions.forEach(suggestion => suggestions.add(suggestion));

    // 2. Category-specific suggestions
    if (category) {
      const categorySuggestions = getCategorySuggestions(category, normalizedQuery);
      categorySuggestions.forEach(suggestion => suggestions.add(suggestion));
    }

    // 3. Trending searches for the category
    const trending = suggestionEngine.getTrendingSearches(category);
    trending.forEach(search => {
      if (search.toLowerCase().includes(normalizedQuery.toLowerCase())) {
        suggestions.add(search);
      }
    });

    // Convert to array and sort by relevance
    const suggestionArray = Array.from(suggestions)
      .filter(s => s.length >= 3)
      .sort((a, b) => {
        // Prioritize exact prefix matches
        const aStartsWith = a.toLowerCase().startsWith(normalizedQuery.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(normalizedQuery.toLowerCase());
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then by length (shorter is better)
        return a.length - b.length;
      })
      .slice(0, limit);

    const response = NextResponse.json({
      suggestions: suggestionArray,
      query: normalizedQuery
    });

    // Cache suggestions for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    return response;

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

function getCategorySuggestions(category: string, query: string): string[] {
  const suggestions: Record<string, string[]> = {
    'for_sale': [
      'smartphone', 'laptop', 'voiture', 'appartement', 'meuble',
      'télévision', 'ordinateur', 'tablette', 'vêtements', 'chaussures'
    ],
    'job': [
      'développeur', 'manager', 'professeur', 'chauffeur', 'ingénieur',
      'commercial', 'comptable', 'médecin', 'architecte', 'technicien'
    ],
    'service': [
      'nettoyage', 'réparation', 'cours', 'design', 'photographie',
      'plomberie', 'électricité', 'jardinage', 'peinture', 'massage'
    ],
    'for_rent': [
      'appartement', 'maison', 'voiture', 'bureau', 'équipement',
      'villa', 'studio', 'garage', 'magasin', 'terrain'
    ]
  };

  return (suggestions[category] || [])
    .filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(suggestion.toLowerCase())
    );
}
