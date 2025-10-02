// src/components/search/SimpleAdvancedSearch.tsx - Simplified production-grade search interface
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Star, X, ChevronDown, Heart, Eye, Calendar } from 'lucide-react';
import { fixPhotoUrl } from '@/lib/storage';

// Type definitions
interface SearchParams {
  query: string;
  category: string;
  wilaya: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  page: number;
  limit: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  wilaya: string;
  created_at: string;
  photos?: string[];
  view_count: number;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    rating: number;
    review_count: number;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchResults {
  listings: Listing[];
  pagination: Pagination;
  metadata?: {
    executionTime: number;
    strategy: string;
  };
}

interface Category {
  value: string;
  label: string;
}

interface Wilaya {
  code: string;
  name: string;
}

// Main Advanced Search Component
const SimpleAdvancedSearch = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    category: '',
    wilaya: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    page: 1,
    limit: 20
  });
  
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Mock data
  const categories: Category[] = [
    { value: 'for_sale', label: 'À vendre' },
    { value: 'job', label: 'Emplois' },
    { value: 'service', label: 'Services' },
    { value: 'for_rent', label: 'À louer' }
  ];

  const wilayas: Wilaya[] = [
    { code: '16', name: 'Alger' },
    { code: '31', name: 'Oran' },
    { code: '25', name: 'Constantine' },
    { code: '09', name: 'Blida' },
    { code: '35', name: 'Boumerdès' }
  ];

  // Debounced suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchParams.query.length >= 2) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchParams.query)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Suggestions error:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchParams.query]);

  const performSearch = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== '' && value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString();
      
      const response = await fetch(`/api/search?${queryString}&includeCount=true`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred during search');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    const newParams = { ...searchParams, query, page: 1 };
    setSearchParams(newParams);
    setShowSuggestions(false);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  const handleFiltersChange = useCallback((newFilters: Partial<SearchParams>) => {
    const newParams = { ...searchParams, ...newFilters, page: 1 };
    setSearchParams(newParams);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  const handlePageChange = useCallback((page: number) => {
    const newParams = { ...searchParams, page };
    setSearchParams(newParams);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'for_sale': return 'À vendre';
      case 'job': return 'Emploi';
      case 'service': return 'Service';
      case 'for_rent': return 'À louer';
      default: return category;
    }
  };

  const timeAgo = (date: string): string => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return posted.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Advanced Search
          </h1>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchParams.query}
                onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchParams.query);
                  }
                }}
                placeholder="Search for products, services or jobs..."
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
              />
              {searchParams.query && (
                <button
                  onClick={() => {
                    setSearchParams({ ...searchParams, query: '' });
                    setShowSuggestions(false);
                  }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSearch(searchParams.query)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
                aria-label="Search"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchParams({ ...searchParams, query: suggestion });
                      handleSearch(suggestion);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <select
            value={searchParams.category}
            onChange={(e) => handleFiltersChange({ category: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sélectionner une catégorie"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={searchParams.wilaya}
            onChange={(e) => handleFiltersChange({ wilaya: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sélectionner une wilaya"
          >
            <option value="">Toutes les wilayas</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.name}>
                {wilaya.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Prix min"
            value={searchParams.minPrice}
            onChange={(e) => handleFiltersChange({ minPrice: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            aria-label="Prix minimum"
          />

          <input
            type="number"
            placeholder="Prix max"
            value={searchParams.maxPrice}
            onChange={(e) => handleFiltersChange({ maxPrice: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            aria-label="Prix maximum"
          />

          <select
            value={searchParams.sortBy}
            onChange={(e) => handleFiltersChange({ sortBy: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sort by"
          >
            <option value="created_at">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="popularity">Popularité</option>
            <option value="relevance">Pertinence</option>
          </select>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          {results && !isLoading && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {results.pagination?.totalItems > 0 ? (
                  <span>
                    {results.pagination.totalItems.toLocaleString()} résultat(s)
                    {searchParams.query && <span> pour "{searchParams.query}"</span>}
                    {results.metadata?.executionTime && (
                      <span className="text-gray-400 ml-2">
                        ({results.metadata.executionTime}ms)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Aucun résultat</span>
                )}
              </div>
              
              {/* Search Strategy Indicator (dev mode) */}
              {process.env.NODE_ENV === 'development' && results.metadata?.strategy && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Strategy: {results.metadata.strategy}
                </span>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-md mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4 text-4xl">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => performSearch(searchParams)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* No Results State */}
          {results && !isLoading && (!results.listings || results.listings.length === 0) && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-500">
                {searchParams.query ? `No results for "${searchParams.query}"` : 'Try modifying your search criteria'}
              </p>
            </div>
          )}

          {/* Results Grid */}
          {results && !isLoading && results.listings && results.listings.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.listings.map((listing) => (
                <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white group cursor-pointer">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img
                        src={fixPhotoUrl(listing.photos[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {listing.category === 'for_sale' ? '🛍️' : listing.category === 'job' ? '💼' : listing.category === 'service' ? '🔧' : '🏠'}
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                        {getCategoryLabel(listing.category)}
                      </span>
                    </div>

                    {/* View Count */}
                    {listing.view_count > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{listing.view_count}</span>
                        </span>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle favorite logic here
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 group-hover:scale-110"
                      aria-label="Add to favorites"
                      title="Add to favorites"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {listing.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(listing.price)}
                      </span>
                      
                      {/* Time Posted */}
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{timeAgo(listing.created_at)}</span>
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{listing.city}, {listing.wilaya}</span>
                    </div>

                    {/* User Info */}
                    {listing.user && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {listing.user.avatar_url ? (
                            <img
                              src={listing.user.avatar_url}
                              alt={`${listing.user.first_name} ${listing.user.last_name}`}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {listing.user.first_name?.[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-600">
                            {listing.user.first_name} {listing.user.last_name}
                          </span>
                        </div>
                        
                        {/* User Rating */}
                        {listing.user.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {listing.user.rating.toFixed(1)}
                            </span>
                            {listing.user.review_count > 0 && (
                              <span className="text-xs text-gray-500">
                                ({listing.user.review_count})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {results && results.pagination && (results.pagination.hasNextPage || results.pagination.hasPreviousPage) && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(results.pagination.currentPage - 1)}
                disabled={!results.pagination.hasPreviousPage}
                className={`px-4 py-2 border rounded-md ${
                  results.pagination.hasPreviousPage 
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Précédent
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {results.pagination.currentPage} {results.pagination.totalPages > 0 && `sur ${results.pagination.totalPages}`}
              </span>
              
              <button
                onClick={() => handlePageChange(results.pagination.currentPage + 1)}
                disabled={!results.pagination.hasNextPage}
                className={`px-4 py-2 border rounded-md ${
                  results.pagination.hasNextPage 
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleAdvancedSearch;
