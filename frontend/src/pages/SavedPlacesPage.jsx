import React, { useState, useEffect } from 'react';
import { savedPlacesApi, tripsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Heart, MapPin, Phone, Globe, Navigation, Trash2, Bookmark, Compass, Landmark, Building2, Utensils, HeartPulse, Shield, Luggage, Plus, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedPlacesPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addedPlaceIds, setAddedPlaceIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  const tabs = [
    { id: 'all', label: 'All Places', icon: Compass },
    { id: 'attraction', label: 'Attractions', icon: Landmark },
    { id: 'hotel', label: 'Hotels', icon: Building2 },
    { id: 'restaurant', label: 'Restaurants', icon: Utensils },
    { id: 'hospital', label: 'Hospitals', icon: HeartPulse },
    { id: 'police', label: 'Police', icon: Shield },
  ];

  const fetchSavedPlaces = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await savedPlacesApi.getSavedPlaces(activeTab === 'all' ? null : activeTab);
      setSavedPlaces(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedPlaces();
    }
  }, [isAuthenticated, activeTab]);

  const handleRemove = async (externalPlaceId) => {
    try {
      await savedPlacesApi.removeSavedPlace(externalPlaceId);
      setSavedPlaces(prev => prev.filter(p => p.id !== externalPlaceId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToTrip = async (place) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      // 1. Determine city from address or place details
      let cityName = (place.city || '').trim();
      if (!cityName && place.address) {
        const parts = place.address.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          cityName = parts[parts.length - 2] || parts[parts.length - 1];
        }
      }
      if (!cityName) {
        cityName = 'My Travel';
      }

      // 2. Fetch trips
      const trips = await tripsApi.getTrips();
      let targetTrip = null;
      let isNewlyCreated = false;

      const cleanCityKey = cityName.toLowerCase().replace(/trip|itinerary|tour|vacation|visit/gi, '').trim();

      if (trips && trips.length > 0) {
        targetTrip = trips.find(t => {
          const cleanDest = (t.destination || '').toLowerCase().replace(/trip|itinerary|tour|vacation|visit/gi, '').trim();
          return (
            cleanDest === cleanCityKey || 
            (cleanDest.length >= 3 && cleanCityKey.includes(cleanDest)) ||
            (cleanCityKey.length >= 3 && cleanDest.includes(cleanCityKey))
          );
        });
      }

      // 3. Create new city trip if it doesn't exist yet
      if (!targetTrip) {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
        const tripTitle = `${cityName} Trip`;

        targetTrip = await tripsApi.createTrip({
          destination: tripTitle,
          startDate: today,
          endDate: futureDate,
          notes: `Curated saved places for ${cityName}.`
        });
        isNewlyCreated = true;
      }

      // 4. Add place to trip
      await tripsApi.addPlaceToTrip(targetTrip.id, {
        id: place.id,
        name: place.name,
        category: place.category,
        latitude: place.latitude || place.lat,
        longitude: place.longitude || place.lng || place.lon,
        address: place.address || ''
      });

      setAddedPlaceIds(prev => new Set(prev).add(place.id));

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

  const openDirections = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Saved Places</h2>
        <p className="text-xs text-slate-500">Sign in to your SafeTrip account to access and organize your saved places.</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Saved Places</h1>
          <p className="text-xs text-slate-500 mt-1">Quick access to your bookmarked destinations, safety locations, and custom itineraries.</p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-teal-600 transition-colors w-fit"
        >
          <Compass className="w-4 h-4" />
          <span>Explore More Places</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading your saved places...</div>
      ) : savedPlaces.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Saved Places in this Category</h3>
          <p className="text-xs text-slate-500">
            Browse destinations on the Explore page and click the bookmark icon to save places here for fast reference.
          </p>
          <Link
            to="/explore"
            className="inline-block px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
          >
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedPlaces.map((place) => {
            const isAdded = addedPlaceIds.has(place.id);
            return (
              <div
                key={place.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {place.category}
                    </span>
                    <button
                      onClick={() => handleRemove(place.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{place.name}</h3>

                  {place.address && (
                    <p className="text-xs text-slate-500 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{place.address}</span>
                    </p>
                  )}

                  {place.phone && (
                    <div className="flex items-center gap-1 text-xs text-teal-700 font-semibold">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`tel:${place.phone}`}>{place.phone}</a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToTrip(place)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isAdded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80'
                      }`}
                      title="Add directly to this city's trip"
                    >
                      {isAdded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Luggage className="w-3.5 h-3.5 text-teal-600" />}
                      <span>{isAdded ? 'Added' : '+ Trip'}</span>
                    </button>

                    {place.website && (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-slate-500 hover:text-teal-600 flex items-center gap-1 p-1.5"
                        title="Visit Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => openDirections(place.latitude, place.longitude)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-teal-600 transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Directions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 backdrop-blur-md">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{toastMessage.text}</span>
            <Link
              to="/trips"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 underline ml-2 shrink-0 transition-colors"
            >
              View in My Trips →
            </Link>
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
