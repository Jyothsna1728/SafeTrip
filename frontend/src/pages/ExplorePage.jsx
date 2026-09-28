import React, { useState, useEffect, useRef } from 'react';
import { useExplore } from '../context/ExploreContext';
import { useAuth } from '../context/AuthContext';
import { savedPlacesApi, tripsApi, safetyApi } from '../api';
import { placesApi } from '../api/placesApi';
import GoogleMap from '../components/map/GoogleMap';
import PlaceCard from '../components/places/PlaceCard';
import PlaceFilterBar from '../components/places/PlaceFilterBar';
import PlaceDetailsModal from '../components/places/PlaceDetailsModal';
import Modal from '../components/common/Modal';
import { PlaceCardSkeleton, MapSkeleton } from '../components/common/Skeleton';
import { Map, List, AlertCircle, RefreshCw, Plus, CheckCircle2, MapPin, Search, X, Columns } from 'lucide-react';

const CITY_AREAS_MAP = {
  hyderabad: [
    { name: 'Banjara Hills', lat: 17.4156, lon: 78.4357 },
    { name: 'Jubilee Hills', lat: 17.4319, lon: 78.4073 },
    { name: 'Hitech City', lat: 17.4435, lon: 78.3772 },
    { name: 'Gachibowli', lat: 17.4401, lon: 78.3489 },
    { name: 'Secunderabad', lat: 17.4399, lon: 78.4983 },
    { name: 'Charminar (Old City)', lat: 17.3616, lon: 78.4747 },
    { name: 'Madhapur', lat: 17.4483, lon: 78.3915 },
  ],
  vijayawada: [
    { name: 'Benz Circle', lat: 16.5019, lon: 80.6482 },
    { name: 'Governorpet', lat: 16.5147, lon: 80.6275 },
    { name: 'MG Road', lat: 16.5085, lon: 80.6415 },
    { name: 'One Town', lat: 16.5186, lon: 80.6120 },
    { name: 'Bhavanipuram', lat: 16.5312, lon: 80.5980 },
  ],
  bengaluru: [
    { name: 'Indiranagar', lat: 12.9784, lon: 77.6408 },
    { name: 'Koramangala', lat: 12.9352, lon: 77.6245 },
    { name: 'Whitefield', lat: 12.9698, lon: 77.7500 },
    { name: 'MG Road / Brigade', lat: 12.9756, lon: 77.6066 },
    { name: 'HSR Layout', lat: 12.9121, lon: 77.6446 },
    { name: 'Jayanagar', lat: 12.9308, lon: 77.5838 },
  ],
  mumbai: [
    { name: 'Colaba / Fort', lat: 18.9067, lon: 72.8147 },
    { name: 'Bandra West', lat: 19.0596, lon: 72.8295 },
    { name: 'Andheri West', lat: 19.1363, lon: 72.8277 },
    { name: 'Juhu', lat: 19.0988, lon: 72.8264 },
    { name: 'Powai', lat: 19.1197, lon: 72.9051 },
  ],
  delhi: [
    { name: 'Connaught Place', lat: 28.6315, lon: 77.2167 },
    { name: 'Hauz Khas', lat: 28.5494, lon: 77.2001 },
    { name: 'South Extension', lat: 28.5729, lon: 77.2223 },
    { name: 'Chandni Chowk (Old Delhi)', lat: 28.6506, lon: 77.2303 },
    { name: 'Saket', lat: 28.5245, lon: 77.2066 },
  ],
  chennai: [
    { name: 'T. Nagar', lat: 13.0418, lon: 80.2341 },
    { name: 'Mylapore', lat: 13.0368, lon: 80.2676 },
    { name: 'Adyar / Besant Nagar', lat: 13.0012, lon: 80.2565 },
    { name: 'Nungambakkam', lat: 13.0604, lon: 80.2376 },
  ]
};

export default function ExplorePage() {
  const {
    exploreLocation,
    selectedArea,
    setAreaRefinement,
    category,
    setCategory,
    safetyMode,
    setSafetyMode,
    places,
    loading,
    error,
    refetchPlaces,
    selectedPlace,
    setSelectedPlace,
    filters,
    setFilters,
  } = useExplore();

  const { isAuthenticated, openAuthModal } = useAuth();

  // Desktop View Layout: 'split' | 'cards' (Result Focus) | 'map' (Map Focus)
  const [layoutMode, setLayoutMode] = useState('split');
  // Mobile View Toggle: 'list' | 'map'
  const [mobileView, setMobileView] = useState('list');

  // Area Search within Destination
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaSearching, setAreaSearching] = useState(false);

  // Place Details Modal
  const [detailsPlace, setDetailsPlace] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Saved place IDs set for quick lookup
  const [savedPlaceIds, setSavedPlaceIds] = useState(new Set());
  const [reports, setReports] = useState([]);

  // Card element refs for auto-scroll synchronization
  const cardRefs = useRef({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          const saved = await savedPlacesApi.getSavedPlaces();
          setSavedPlaceIds(new Set(saved.map(p => p.id)));
        } catch (err) {
          console.error(err);
        }
      }
    };

    const fetchReports = async () => {
      try {
        const activeReports = await safetyApi.getActiveReports({
          city: exploreLocation?.name
        });
        setReports(activeReports);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
    fetchReports();
  }, [isAuthenticated, exploreLocation.lat, exploreLocation.lon, exploreLocation.name]);

  useEffect(() => {
    if (selectedPlace?.id && cardRefs.current[selectedPlace.id]) {
      cardRefs.current[selectedPlace.id].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedPlace]);

  const handleAreaSearch = async (e) => {
    e.preventDefault();
    if (!areaSearchQuery.trim()) return;

    setAreaSearching(true);
    try {
      const fullQuery = `${areaSearchQuery.trim()}, ${exploreLocation.name}`;
      const results = await placesApi.geocodeDestination(fullQuery);
      if (results.length > 0) {
        const best = results[0];
        setAreaRefinement({
          name: areaSearchQuery.trim(),
          lat: best.lat,
          lon: best.lon,
        });
        setAreaSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAreaSearching(false);
    }
  };

  const handleSaveToggle = async (place) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const isSaved = savedPlaceIds.has(place.id) || place.isSaved;

    try {
      if (isSaved) {
        await savedPlacesApi.removeSavedPlace(place.id);
        setSavedPlaceIds(prev => {
          const next = new Set(prev);
          next.delete(place.id);
          return next;
        });
      } else {
        await savedPlacesApi.savePlace({
          externalPlaceId: place.id,
          placeName: place.name,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
          imageUrl: place.imageUrl,
          phone: place.phone,
          website: place.website,
        });
        setSavedPlaceIds(prev => new Set(prev).add(place.id));
      }
    } catch (err) {
      console.error('Error toggling save place:', err);
    }
  };

  const handleViewDetails = (place) => {
    setDetailsPlace(place);
    setDetailsModalOpen(true);
  };

  // State for tracking places added to trip & floating toast notification
  const [addedPlaceIds, setAddedPlaceIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  const handleOpenAddToTrip = async (place) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      // 1. Determine the target city for this place
      let cityName = (place.city || '').trim();
      if (!cityName) {
        cityName = (exploreLocation?.name || '').trim();
      }
      if (!cityName && place.address) {
        const parts = place.address.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          cityName = parts[parts.length - 2] || parts[parts.length - 1];
        }
      }
      if (!cityName) {
        cityName = 'Explore';
      }

      // 2. Fetch current user trips
      const trips = await tripsApi.getTrips();
      let targetTrip = null;
      let isNewlyCreated = false;

      const cleanCityKey = cityName.toLowerCase().replace(/trip|itinerary|tour|vacation|visit/gi, '').trim();

      if (trips && trips.length > 0) {
        // Find existing trip for this city
        targetTrip = trips.find(t => {
          const cleanDest = (t.destination || '').toLowerCase().replace(/trip|itinerary|tour|vacation|visit/gi, '').trim();
          return (
            cleanDest === cleanCityKey || 
            (cleanDest.length >= 3 && cleanCityKey.includes(cleanDest)) ||
            (cleanCityKey.length >= 3 && cleanDest.includes(cleanCityKey))
          );
        });
      }

      // 3. If no trip exists for this city, create a new separate trip for this city
      if (!targetTrip) {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
        const tripTitle = `${cityName} Trip`;

        targetTrip = await tripsApi.createTrip({
          destination: tripTitle,
          startDate: today,
          endDate: futureDate,
          notes: `Curated places and itinerary for ${cityName}.`
        });
        isNewlyCreated = true;
      }

      // 4. Add the place into the city's trip
      await tripsApi.addPlaceToTrip(targetTrip.id, {
        id: place.id,
        name: place.name,
        category: place.category,
        latitude: place.latitude || place.lat,
        longitude: place.longitude || place.lng || place.lon,
        address: place.address || place.formattedAddress || ''
      });

      // 5. Mark place as added in local state
      setAddedPlaceIds(prev => new Set(prev).add(place.id));

      // 6. Show toast confirmation
      const toastText = isNewlyCreated
        ? `✓ Created new "${targetTrip.destination}" & added "${place.name}"!`
        : `✓ Added "${place.name}" to your "${targetTrip.destination}"!`;

      setToastMessage({
        text: toastText,
        tripId: targetTrip.id
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 4000);

    } catch (err) {
      console.error('Error adding place to trip:', err);
    }
  };

  const cityKey = (exploreLocation?.name || '').toLowerCase().trim();
  const availableAreas = Object.keys(CITY_AREAS_MAP).find(k => cityKey.includes(k))
    ? CITY_AREAS_MAP[Object.keys(CITY_AREAS_MAP).find(k => cityKey.includes(k))]
    : [];

  const filteredPlaces = places.filter((p) => {
    if (category === 'restaurants' && filters.cuisine) {
      const cuisineMatch = (p.cuisine || '').toLowerCase().includes(filters.cuisine.toLowerCase()) ||
        (p.subCategory || '').toLowerCase().includes(filters.cuisine.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(filters.cuisine.toLowerCase()));
      if (!cuisineMatch) return false;
    }
    if (category === 'hotels' && filters.accommodationType) {
      const typeMatch = (p.accommodationType || '').toLowerCase().includes(filters.accommodationType.toLowerCase()) ||
        (p.subCategory || '').toLowerCase().includes(filters.accommodationType.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(filters.accommodationType.toLowerCase()));
      if (!typeMatch) return false;
    }
    if (category === 'attractions' && filters.subCategory) {
      const subMatch = (p.subCategory || '').toLowerCase().includes(filters.subCategory.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(filters.subCategory.toLowerCase()));
      if (!subMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Destination & Area Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Exploring Destination</span>
              {selectedArea && (
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1.5">
                  <span>Area: {selectedArea.name}</span>
                  <button
                    onClick={() => setAreaRefinement(null)}
                    title="Clear Area Filter"
                    className="hover:text-red-600 font-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <MapPin className="w-6 h-6 text-teal-600 shrink-0" />
              <span>{exploreLocation.name}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{exploreLocation.formatted}</p>
          </div>

          {/* Desktop Layout Focus & Mobile Switcher */}
          <div className="flex items-center gap-2 self-start md:self-center">
            {/* Desktop Layout Mode Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  layoutMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
                title="Split View (Cards & Map)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                onClick={() => setLayoutMode('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  layoutMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
                title="Result Focus (Full width cards, No Map)"
              >
                <List className="w-3.5 h-3.5" />
                <span>Result Focus</span>
              </button>
              <button
                onClick={() => setLayoutMode('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  layoutMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
                title="Map Focus (Full screen interactive map)"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map Focus</span>
              </button>
            </div>

            {/* Mobile List | Map Switcher */}
            <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setMobileView('list')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                  mobileView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                  mobileView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Optional Explore Areas Bar + Area Search Input */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs flex-1">
            <span className="text-slate-400 font-bold shrink-0">Explore Areas:</span>
            <button
              onClick={() => setAreaRefinement(null)}
              className={`px-3.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                !selectedArea
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All {exploreLocation.name}
            </button>

            {availableAreas.map((area) => {
              const isAreaSelected = selectedArea?.name === area.name;
              return (
                <button
                  key={area.name}
                  onClick={() => setAreaRefinement(area)}
                  className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isAreaSelected
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {area.name}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAreaSearch} className="relative shrink-0 max-w-xs w-full">
            <input
              type="text"
              placeholder={`Search area in ${exploreLocation.name}...`}
              value={areaSearchQuery}
              onChange={(e) => setAreaSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>
        </div>
      </div>

      {/* Category Navigation Pills & Dynamic Filters */}
      <PlaceFilterBar
        category={category}
        onCategoryChange={setCategory}
        safetyMode={safetyMode}
        onSafetyModeToggle={setSafetyMode}
        filters={filters}
        onFilterChange={setFilters}
        totalResults={filteredPlaces.length}
      />

      {/* MAIN CONTENT LAYOUT */}
      {/* 1. RESULT FOCUS MODE (No map at all, cards expand in 3-column responsive grid) */}
      {layoutMode === 'cards' && (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-xs text-red-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Places Notice</span>
              </div>
              <p>{error}</p>
              <button
                onClick={refetchPlaces}
                className="flex items-center gap-1 font-bold text-red-800 hover:underline pt-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Search</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
              <PlaceCardSkeleton />
            </div>
          )}

          {!loading && !error && filteredPlaces.length === 0 && (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No places were found for this category in the selected area.
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try selecting "Explore All" or clear your area refinement to see places across {exploreLocation.name}.
              </p>
              <button
                onClick={() => {
                  setCategory('all');
                  setAreaRefinement(null);
                  setFilters({ minRating: null, amenity: '', cuisine: '', accommodationType: '', subCategory: '', sort: 'recommended' });
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
              >
                Reset Filters & Show All
              </button>
            </div>
          )}

          {!loading && filteredPlaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const isSaved = savedPlaceIds.has(place.id) || place.isSaved;
                const isAddedToTrip = addedPlaceIds.has(place.id);

                return (
                  <div key={place.id} ref={(el) => (cardRefs.current[place.id] = el)}>
                    <PlaceCard
                      place={place}
                      isSelected={isSelected}
                      isSaved={isSaved}
                      isAddedToTrip={isAddedToTrip}
                      onSelect={(p) => setSelectedPlace(p)}
                      onViewDetails={handleViewDetails}
                      onSaveToggle={handleSaveToggle}
                      onAddToTrip={handleOpenAddToTrip}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. MAP FOCUS MODE (Map fills full available viewport area) */}
      {layoutMode === 'map' && (
        <div className="w-full h-[calc(100vh-210px)] min-h-[500px]">
          {loading && places.length === 0 ? (
            <MapSkeleton />
          ) : (
            <GoogleMap
              places={filteredPlaces}
              reports={reports}
              exploreLocation={selectedArea ? { name: selectedArea.name, lat: selectedArea.lat, lon: selectedArea.lon } : exploreLocation}
              selectedPlace={selectedPlace}
              onSelectPlace={(p) => setSelectedPlace(p)}
              onSavePlace={handleSaveToggle}
              savedPlaceIds={savedPlaceIds}
            />
          )}
        </div>
      )}

      {/* 3. SPLIT VIEW MODE (Default desktop: cards on left, map on right) */}
      {layoutMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-280px)] min-h-[550px]">
          {/* Left Column: Result Cards */}
          <div
            className={`lg:col-span-6 xl:col-span-7 h-full flex flex-col space-y-4 overflow-y-auto pr-1 custom-scrollbar ${
              mobileView === 'list' ? 'block' : 'hidden lg:block'
            }`}
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-xs text-red-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Places Notice</span>
                </div>
                <p>{error}</p>
                <button
                  onClick={refetchPlaces}
                  className="flex items-center gap-1 font-bold text-red-800 hover:underline pt-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Search</span>
                </button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PlaceCardSkeleton />
                <PlaceCardSkeleton />
                <PlaceCardSkeleton />
                <PlaceCardSkeleton />
              </div>
            )}

            {!loading && !error && filteredPlaces.length === 0 && (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No places were found for this category in the selected area.
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try selecting "Explore All" or clear your area refinement.
                </p>
                <button
                  onClick={() => {
                    setCategory('all');
                    setAreaRefinement(null);
                    setFilters({ minRating: null, amenity: '', cuisine: '', accommodationType: '', subCategory: '', sort: 'recommended' });
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
                >
                  Reset Filters & Show All
                </button>
              </div>
            )}

            {!loading && filteredPlaces.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const isSaved = savedPlaceIds.has(place.id) || place.isSaved;
                  const isAddedToTrip = addedPlaceIds.has(place.id);

                  return (
                    <div
                      key={place.id}
                      ref={(el) => (cardRefs.current[place.id] = el)}
                    >
                      <PlaceCard
                        place={place}
                        isSelected={isSelected}
                        isSaved={isSaved}
                        isAddedToTrip={isAddedToTrip}
                        onSelect={(p) => setSelectedPlace(p)}
                        onViewDetails={handleViewDetails}
                        onSaveToggle={handleSaveToggle}
                        onAddToTrip={handleOpenAddToTrip}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Leaflet Map */}
          <div
            className={`lg:col-span-6 xl:col-span-5 h-full ${
              mobileView === 'map' ? 'block' : 'hidden lg:block'
            }`}
          >
            {loading && places.length === 0 ? (
              <MapSkeleton />
            ) : (
              <GoogleMap
                places={filteredPlaces}
                reports={reports}
                exploreLocation={selectedArea ? { name: selectedArea.name, lat: selectedArea.lat, lon: selectedArea.lon } : exploreLocation}
                selectedPlace={selectedPlace}
                onSelectPlace={(p) => setSelectedPlace(p)}
                onSavePlace={handleSaveToggle}
                savedPlaceIds={savedPlaceIds}
              />
            )}
          </div>
        </div>
      )}

      {/* Place Details Modal */}
      <PlaceDetailsModal
        place={detailsPlace}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        isSaved={detailsPlace ? savedPlaceIds.has(detailsPlace.id) || detailsPlace.isSaved : false}
        onSaveToggle={handleSaveToggle}
        onAddToTrip={handleOpenAddToTrip}
      />

      {/* Floating Instant Trip Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 backdrop-blur-md">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{toastMessage.text}</span>
            <a
              href="/trips"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 underline ml-2 shrink-0 transition-colors"
            >
              View in My Trips →
            </a>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
