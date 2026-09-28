import React, { createContext, useContext, useState, useEffect } from 'react';
import { placesApi } from '../api/placesApi';

const ExploreContext = createContext();

export const DEFAULT_EXPLORE_LOCATION = {
  name: 'Hyderabad',
  formatted: 'Hyderabad, Telangana, India',
  lat: 17.385044,
  lon: 78.486671,
};

export const ExploreProvider = ({ children }) => {
  // 1. Current Physical GPS Location of browser (Separate from Explore Location)
  const [userGps, setUserGps] = useState({
    lat: null,
    lon: null,
    formatted: null,
    status: 'idle', // 'idle' | 'loading' | 'granted' | 'denied' | 'error'
    error: null,
  });

  // 2. Exploration Target Location (Default: whole destination)
  const [exploreLocation, setExploreLocation] = useState(DEFAULT_EXPLORE_LOCATION);

  // 3. Optional Area Refinement (null = entire destination)
  const [selectedArea, setSelectedArea] = useState(null);

  // 4. Active Category & Safety Mode
  const [category, setCategory] = useState('all'); // 'all' | 'attractions' | 'hotels' | 'restaurants' | 'hospitals' | 'police'
  const [safetyMode, setSafetyMode] = useState(false);

  // 5. Data states
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 6. Card <-> Marker Sync
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);

  // 7. Verified Filters
  const [filters, setFilters] = useState({
    minRating: null,
    amenity: '',
    sort: 'recommended',
  });

  // Request User's Physical GPS Location & Reverse Geocode
  const requestCurrentGps = (callback) => {
    if (!navigator.geolocation) {
      const errMsg = 'Geolocation is not supported by your browser.';
      setUserGps(prev => ({ ...prev, status: 'error', error: errMsg }));
      if (callback) callback(null, errMsg);
      return;
    }

    setUserGps(prev => ({ ...prev, status: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        let formattedName = `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        let cityName = 'My Current Location';

        try {
          const rev = await placesApi.reverseGeocode(lat, lon);
          if (rev?.formatted) {
            formattedName = rev.formatted;
            cityName = rev.city || rev.name || 'My Current Location';
          }
        } catch (ignored) {
          // If reverse geocode fails, continue with coordinates
        }

        const coords = {
          lat,
          lon,
          name: cityName,
          formatted: formattedName,
          status: 'granted',
          error: null,
        };

        setUserGps(coords);

        // When user explicitly requests GPS location, set it as Explore Location
        setExploreLocation({
          name: cityName,
          formatted: formattedName,
          lat,
          lon,
        });
        setSelectedArea(null);
        setSelectedPlace(null);

        if (callback) callback(coords, null);
      },
      (err) => {
        let errMsg = 'Location access was denied. You can search destinations manually.';
        if (err.code === 2) {
          errMsg = 'Location information is currently unavailable. Please search manually.';
        } else if (err.code === 3) {
          errMsg = 'Location request timed out. Please try again or search manually.';
        }

        const errorState = {
          lat: null,
          lon: null,
          formatted: null,
          status: 'denied',
          error: errMsg,
        };
        setUserGps(errorState);
        if (callback) callback(null, errMsg);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Set explore destination explicitly (resets area refinement)
  const setExplorationCenter = (dest) => {
    setExploreLocation({
      name: dest.city || dest.name || dest.formatted || 'Selected Location',
      formatted: dest.formatted || `${Number(dest.latitude || dest.lat).toFixed(4)}, ${Number(dest.longitude || dest.lon).toFixed(4)}`,
      lat: Number(dest.latitude || dest.lat),
      lon: Number(dest.longitude || dest.lon),
    });
    setSelectedArea(null);
    setSelectedPlace(null);
  };

  // Set optional area refinement
  const setAreaRefinement = (area) => {
    if (!area) {
      setSelectedArea(null);
      return;
    }
    setSelectedArea(area);
  };

  // Fetch places whenever exploreLocation, selectedArea, category, safetyMode, or filters change
  const fetchPlaces = async () => {
    const targetLat = selectedArea?.lat || exploreLocation?.lat;
    const targetLon = selectedArea?.lon || exploreLocation?.lon;

    if (!targetLat || !targetLon) return;

    setLoading(true);
    setError(null);

    // If safety mode is on, query hospitals and police
    let targetCategory = category;
    if (safetyMode) {
      if (category !== 'hospitals' && category !== 'police') {
        targetCategory = 'hospitals';
      }
    }

    try {
      const data = await placesApi.getNearbyPlaces({
        lat: targetLat,
        lon: targetLon,
        category: targetCategory,
        radius: selectedArea ? 5000 : 14000,
        limit: 35,
        minRating: filters.minRating,
        amenity: filters.amenity,
        sort: filters.sort,
      });
      setPlaces(data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Places are temporarily unavailable. Please try again.';
      setError(errorMsg);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [exploreLocation.lat, exploreLocation.lon, selectedArea, category, safetyMode, filters]);

  return (
    <ExploreContext.Provider
      value={{
        userGps,
        requestCurrentGps,
        exploreLocation,
        setExplorationCenter,
        selectedArea,
        setAreaRefinement,
        category,
        setCategory,
        safetyMode,
        setSafetyMode,
        places,
        loading,
        error,
        refetchPlaces: fetchPlaces,
        selectedPlace,
        setSelectedPlace,
        hoveredPlaceId,
        setHoveredPlaceId,
        filters,
        setFilters,
      }}
    >
      {children}
    </ExploreContext.Provider>
  );
};

export const useExplore = () => {
  const context = useContext(ExploreContext);
  if (!context) {
    throw new Error('useExplore must be used within an ExploreProvider');
  }
  return context;
};
