import React from 'react';
import { Compass, Landmark, Building2, Utensils, HeartPulse, Shield, ShieldAlert, SlidersHorizontal, ArrowUpDown, X, RotateCcw, UtensilsCrossed, Hotel, MapPin } from 'lucide-react';

export default function PlaceFilterBar({
  category,
  onCategoryChange,
  safetyMode,
  onSafetyModeToggle,
  filters,
  onFilterChange,
  totalResults = 0,
}) {
  const categories = [
    { id: 'all', label: 'Explore All', icon: Compass },
    { id: 'attractions', label: 'Attractions', icon: Landmark },
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'hospitals', label: 'Hospitals', icon: HeartPulse },
    { id: 'police', label: 'Police', icon: Shield },
  ];

  const restaurantCuisines = [
    { value: '', label: 'All Cuisines' },
    { value: 'indian', label: 'Indian' },
    { value: 'south_indian', label: 'South Indian' },
    { value: 'north_indian', label: 'North Indian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'italian', label: 'Italian' },
    { value: 'continental', label: 'Continental' },
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'cafe', label: 'Cafe / Bakery' },
  ];

  const hotelTypes = [
    { value: '', label: 'All Accommodations' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'resort', label: 'Resorts' },
    { value: 'hostel', label: 'Hostels' },
    { value: 'guest_house', label: 'Guest Houses' },
    { value: 'motel', label: 'Motels' },
  ];

  const attractionTypes = [
    { value: '', label: 'All Attractions' },
    { value: 'museum', label: 'Museums' },
    { value: 'heritage', label: 'Heritage Sites' },
    { value: 'religious', label: 'Religious Places' },
    { value: 'monument', label: 'Monuments / Forts' },
    { value: 'park', label: 'Parks & Nature' },
    { value: 'viewpoint', label: 'Viewpoints' },
  ];

  const hasActiveFilters =
    filters.minRating ||
    filters.cuisine ||
    filters.accommodationType ||
    filters.subCategory ||
    filters.amenity ||
    (filters.sort && filters.sort !== 'recommended');

  const handleResetFilters = () => {
    onFilterChange({
      minRating: null,
      amenity: '',
      cuisine: '',
      accommodationType: '',
      subCategory: '',
      sort: 'recommended',
    });
  };

  return (
    <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3">
      {/* Category Pills & Safety Mode Toggle */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto custom-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id && !safetyMode;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (safetyMode) onSafetyModeToggle(false);
                  onCategoryChange(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm scale-100'
                    : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Safety Mode Switch */}
        <button
          onClick={() => onSafetyModeToggle(!safetyMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
            safetyMode
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20 ring-2 ring-rose-200'
              : 'bg-rose-50/80 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{safetyMode ? 'Safety Mode: Active' : 'Safety Mode (Hospitals & Police)'}</span>
        </button>
      </div>

      {/* Dynamic Category-Specific Filter Controls */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 text-slate-500 font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Filters:</span>
          </div>

          {/* 1. RESTAURANT-SPECIFIC FILTERS */}
          {category === 'restaurants' && (
            <select
              value={filters.cuisine || ''}
              onChange={(e) => onFilterChange({ ...filters, cuisine: e.target.value })}
              className="bg-orange-50/80 border border-orange-200 rounded-xl px-2.5 py-1 text-orange-950 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
            >
              {restaurantCuisines.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          )}

          {/* 2. HOTEL-SPECIFIC FILTERS */}
          {category === 'hotels' && (
            <select
              value={filters.accommodationType || ''}
              onChange={(e) => onFilterChange({ ...filters, accommodationType: e.target.value })}
              className="bg-teal-50/80 border border-teal-200 rounded-xl px-2.5 py-1 text-teal-950 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {hotelTypes.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          )}

          {/* 3. ATTRACTION-SPECIFIC FILTERS */}
          {category === 'attractions' && (
            <select
              value={filters.subCategory || ''}
              onChange={(e) => onFilterChange({ ...filters, subCategory: e.target.value })}
              className="bg-indigo-50/80 border border-indigo-200 rounded-xl px-2.5 py-1 text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {attractionTypes.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          )}

          {/* Verified Rating filter */}
          <select
            value={filters.minRating || ''}
            onChange={(e) => onFilterChange({ ...filters, minRating: e.target.value ? Number(e.target.value) : null })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">Any Rating</option>
            <option value="4.5">★ 4.5 & above</option>
            <option value="4.0">★ 4.0 & above</option>
            <option value="3.5">★ 3.5 & above</option>
          </select>

          {/* Sort selection */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={filters.sort || 'recommended'}
              onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Reset Filters button if any filter is active */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Counter Badge */}
        <div className="text-slate-500 text-xs font-semibold">
          Showing <span className="font-bold text-slate-900">{totalResults}</span> places
        </div>
      </div>
    </div>
  );
}
