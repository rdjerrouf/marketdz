// src/app/search-advanced/page.tsx - Advanced Search Page
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, X, Eye, Calendar } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  wilaya: string;
  created_at: string;
  view_count: number;
  photos?: string[];
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    rating: number;
  };
}

interface SearchResponse {
  listings: Listing[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  metadata: {
    executionTime: number;
    strategy: string;
  };
}

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = [
    { value: 'for_sale', label: 'À vendre' },
    { value: 'job', label: 'Emplois' },
    { value: 'service', label: 'Services' },
    { value: 'for_rent', label: 'À louer' }
  ];

  const wilayas = [
    { code: '16', name: 'Alger' },
    { code: '31', name: 'Oran' },
    { code: '25', name: 'Constantine' },
    { code: '09', name: 'Blida' },
    { code: '35', name: 'Boumerdès' }
  ];

  // Fetch suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
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
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);
      if (wilaya) params.append('wilaya', wilaya);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('includeCount', 'true');
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    performSearch();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'for_sale': return 'À vendre';
      case 'job': return 'Emploi';
      case 'service': return 'Service';
      case 'for_rent': return 'À louer';
      default: return category;
    }
  };

  const timeAgo = (date: string) => {
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Recherche Avancée
          </h1>
          <p className="text-lg text-gray-600">
            Trouvez exactement ce que vous cherchez avec nos filtres avancés
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Rechercher des produits, services ou emplois..."
              className="w-full pl-10 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
              title="Lancer la recherche"
              aria-label="Lancer la recherche"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres de recherche</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wilaya-select" className="block text-sm font-medium text-gray-700 mb-2">
                Wilaya
              </label>
              <select
                id="wilaya-select"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les wilayas</option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix minimum (DZD)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix maximum (DZD)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="∞"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="popularity">Popularité</option>
                <option value="relevance">Pertinence</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Search className="w-5 h-5" />
              <span>Rechercher</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(results || isLoading) && (
          <div className="space-y-6">
            {/* Results Header */}
            {results && !isLoading && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {results.pagination?.totalItems > 0 ? (
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
                    <span>Aucun résultat trouvé</span>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            {/* No Results */}
            {results && !isLoading && (!results.listings || results.listings.length === 0) && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-500 mb-6">
                  {query ? `Aucun résultat pour "${query}"` : 'Essayez de modifier vos critères de recherche'}
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Vérifiez l'orthographe de vos mots-clés</p>
                  <p>• Essayez des termes plus généraux</p>
                  <p>• Réduisez le nombre de filtres appliqués</p>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {results && !isLoading && results.listings && results.listings.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.listings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white group">
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {listing.category === 'for_sale' ? '🛍️' : 
                           listing.category === 'job' ? '💼' : 
                           listing.category === 'service' ? '🔧' : '🏠'}
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

                      {/* Price and Time */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(listing.price)}
                        </span>
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
