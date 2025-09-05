// src/components/search/AdvancedSearch.tsx - Production-grade search interface
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Star, Clock, TrendingUp, X, ChevronDown, Heart, Eye, Calendar } from 'lucide-react';

// Types
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

interface Category {
  value: string;
  label: string;
}

interface Wilaya {
  code: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  wilaya: string;
  city: string;
  photos: string[];
  created_at: string;
  user_id: string;
  status: string;
  view_count: number;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    city: string;
    wilaya: string;
    rating: number;
    review_count: number;
  };
}

interface SearchResult {
  listings: Listing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    hasCount: boolean;
  };
  filters: Record<string, string>;
  metadata?: {
    strategy: string;
    executionTime: number;
    cacheHit?: boolean;
  };
}

// Enhanced Search Component with real-time suggestions
interface AdvancedSearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({ 
  onSearch, 
  initialQuery = '', 
  placeholder = "Rechercher des produits, services ou emplois..." 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Suggestions error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = useCallback((searchQuery: string) => {
    onSearch(searchQuery);
    setShowSuggestions(false);
  }, [onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, query, handleSuggestionClick, handleSearch]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Effacer la recherche"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
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
  );
};

// Advanced Filters Component
interface AdvancedFiltersProps {
  filters: SearchParams;
  onFiltersChange: (filters: Record<string, string>) => void;
  categories: Category[];
  wilayas: Wilaya[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onFiltersChange, categories, wilayas }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({
    category: filters.category,
    wilaya: filters.wilaya,
    city: filters.city,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy
  });

  const updateFilter = useCallback((key: string, value: string) => {
    const newFilters: Record<string, string> = { ...localFilters };
    if (value && value !== '') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFiltersCount = Object.values(localFilters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
          activeFiltersCount > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filtres</span>
        {activeFiltersCount > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Filter Panel */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Sélectionner une catégorie"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Wilaya
              </label>
              <select
                value={localFilters.wilaya || ''}
                onChange={(e) => updateFilter('wilaya', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Sélectionner une wilaya"
              >
                <option value="">Toutes les wilayas</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.name}>
                    {wilaya.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gamme de prix (DZD)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={localFilters.sortBy || 'created_at'}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Trier par"
              >
                <option value="created_at">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="popularity">Popularité</option>
                <option value="relevance">Pertinence</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Effacer
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Listing Card with Search Highlighting
interface ListingCardProps {
  listing: Listing;
  query: string;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, query }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part: string, index: number) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'for_sale': return '🛍️';
      case 'job': return '💼';
      case 'service': return '🔧';
      case 'for_rent': return '🏠';
      default: return '📋';
    }
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

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/favorites/${listing.id}`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });
      
      if (response.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error('Favorite error:', error);
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
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white group cursor-pointer">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {listing.photos && listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getCategoryIcon(listing.category)}
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
          onClick={handleFavoriteClick}
          className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 group-hover:scale-110"
          aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart 
            className={`w-4 h-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title with Highlighting */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {highlightText(listing.title, query)}
        </h3>

        {/* Description with Highlighting */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {highlightText(listing.description, query)}
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
  );
};

// Search Results with Enhanced Display
interface SearchResultsProps {
  results: SearchResult | null;
  isLoading: boolean;
  query: string;
  onPageChange: (page: number) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, query, onPageChange }) => {
  if (isLoading) {
    return (
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
    );
  }

  if (!results?.listings || results.listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun résultat trouvé
        </h3>
        <p className="text-gray-500">
          {query ? `Aucun résultat pour "${query}"` : 'Essayez de modifier vos critères de recherche'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {results.pagination.totalItems > 0 ? (
            <span>
              {results.pagination.totalItems.toLocaleString()} résultat(s)
              {query && <span> pour "{query}"</span>}
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

      {/* Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} query={query} />
        ))}
      </div>

      {/* Pagination */}
      {results.pagination && (results.pagination.hasNextPage || results.pagination.hasPreviousPage) && (
        <SearchPagination 
          pagination={results.pagination} 
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

// Search Pagination Component
interface SearchPaginationProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange: (page: number) => void;
}

const SearchPagination: React.FC<SearchPaginationProps> = ({ pagination, onPageChange }) => {
  if (!pagination.hasNextPage && !pagination.hasPreviousPage) {
    return null;
  }

  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className={`px-4 py-2 border rounded-md ${
          hasPreviousPage 
            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Précédent
      </button>
      
      <span className="px-4 py-2 text-sm text-gray-600">
        Page {currentPage} {totalPages > 0 && `sur ${totalPages}`}
      </span>
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className={`px-4 py-2 border rounded-md ${
          hasNextPage 
            ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Suivant
      </button>
    </div>
  );
};

// Main Advanced Search Component
const AdvancedSearch = () => {
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
  
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with your actual data
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
    { code: '35', name: 'Boumerdès' },
    // Add more wilayas as needed
  ];

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
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    const newParams = { ...searchParams, query, page: 1 };
    setSearchParams(newParams);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    const newParams = { ...searchParams, ...newFilters, page: 1 };
    setSearchParams(newParams);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  const handlePageChange = useCallback((page: number) => {
    const newParams = { ...searchParams, page };
    setSearchParams(newParams);
    performSearch(newParams);
  }, [searchParams, performSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Recherche avancée
          </h1>
          <AdvancedSearchBar
            onSearch={handleSearch}
            initialQuery={searchParams.query}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <AdvancedFilters
                filters={searchParams}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                wilayas={wilayas}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results or Error */}
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4 text-4xl">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de recherche</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => performSearch(searchParams)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <SearchResults
                results={results}
                isLoading={isLoading}
                query={searchParams.query}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
