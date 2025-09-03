// src/components/search/LocationFilter.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria';

interface LocationFilterProps {
  selectedWilaya: string;
  selectedCity: string;
  onWilayaChange: (wilaya: string) => void;
  onCityChange: (city: string) => void;
  className?: string;
}

export function LocationFilter({
  selectedWilaya,
  selectedCity,
  onWilayaChange,
  onCityChange,
  className = ''
}: LocationFilterProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedWilaya) {
      const wilayaData = ALGERIA_WILAYAS.find((w: { name: string; cities: string[] }) => w.name === selectedWilaya);
      setAvailableCities(wilayaData?.cities || []);
      // Reset city if it's not available in the new wilaya
      if (selectedCity && !wilayaData?.cities.includes(selectedCity)) {
        onCityChange('');
      }
    } else {
      setAvailableCities([]);
      onCityChange('');
    }
  }, [selectedWilaya, selectedCity, onCityChange]);

  const handleWilayaChange = (wilaya: string) => {
    onWilayaChange(wilaya);
    if (!wilaya) {
      onCityChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Wilaya Selection */}
      <div className="space-y-2">
        <label htmlFor="wilaya-select" className="block text-sm font-medium text-gray-700">
          Wilaya
        </label>
        <select
          id="wilaya-select"
          value={selectedWilaya}
          onChange={(e) => handleWilayaChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">All Wilayas</option>
          {ALGERIA_WILAYAS.map((wilaya: { code: string; name: string }) => (
            <option key={wilaya.code} value={wilaya.name}>
              {wilaya.code} - {wilaya.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Selection */}
      {selectedWilaya && availableCities.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="city-select" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Location Links */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Popular Locations</p>
        <div className="flex flex-wrap gap-2">
          {['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida'].map((popularWilaya) => (
            <button
              key={popularWilaya}
              onClick={() => handleWilayaChange(popularWilaya)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedWilaya === popularWilaya
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {popularWilaya}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Location */}
      {(selectedWilaya || selectedCity) && (
        <button
          onClick={() => {
            handleWilayaChange('');
            onCityChange('');
          }}
          className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Location Filter
        </button>
      )}
    </div>
  );
}

// If you want to use EnhancedSearch, move it to its own file to avoid duplicate imports and naming conflicts.