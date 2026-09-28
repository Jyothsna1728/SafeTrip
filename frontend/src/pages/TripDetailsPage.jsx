import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useExplore } from '../context/ExploreContext';
import GoogleMap from '../components/map/GoogleMap';
import SafetyCheckinModal from '../components/safety/SafetyCheckinModal';
import { MapPin, Calendar, Trash2, Navigation, ArrowLeft, ShieldCheck, Plus, Compass, Luggage, Star, Phone, Globe, ExternalLink, CheckCircle2, Loader2, X } from 'lucide-react';

export default function TripDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { setExplorationCenter } = useExplore();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [removingPlaceId, setRemovingPlaceId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchTrip = async () => {
    try {
      const data = await tripsApi.getTripById(id);
      setTrip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrip();
    }
  }, [id, isAuthenticated]);

  const handleRemovePlace = async (place, e) => {
    if (e) e.stopPropagation();
    if (!place?.id) return;

    setRemovingPlaceId(place.id);
    try {
      const updated = await tripsApi.removePlaceFromTrip(id, place.id);
      setTrip(updated);
      if (selectedPlace?.id === place.id) {
        setSelectedPlace(null);
      }
      setToastMessage(`✓ Removed "${place.placeName || place.name || 'Place'}" from itinerary.`);
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to remove place from trip:', err);
    } finally {
      setRemovingPlaceId(null);
    }
  };

  const openDirections = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <div className="text-center py-24 text-xs font-semibold text-slate-400">Loading trip itinerary...</div>;
  }

  if (!trip) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Trip Not Found</h2>
        <p className="text-xs text-slate-500">The requested trip could not be found or has been removed.</p>
        <Link to="/trips" className="inline-block px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md">
          Back to My Trips
        </Link>
      </div>
    );
  }

  // Parse title and notes
  let displayTitle = `Trip to ${trip.destination}`;
  let displayNotes = trip.notes || '';
  if (displayNotes.startsWith('[') && displayNotes.includes(']')) {
    const closeIdx = displayNotes.indexOf(']');
    displayTitle = displayNotes.substring(1, closeIdx);
    displayNotes = displayNotes.substring(closeIdx + 1).trim();
  }

  const tripExploreCenter = {
    name: trip.destination,
    formatted: trip.destination,
    lat: trip.places && trip.places.length > 0 ? trip.places[0].latitude : 17.385044,
    lon: trip.places && trip.places.length > 0 ? trip.places[0].longitude : 78.486671,
  };

  const mappedPlaces = (trip.places || []).map(p => ({
    id: p.id,
    name: p.placeName || p.name,
    category: p.category,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    imageUrl: p.imageUrl,
    phone: p.phone,
    website: p.website,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1.5">
          <Link to="/trips" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Trips
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-teal-600 shrink-0" />
            <span>{displayTitle}</span>
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {trip.destination}
            </span>
            {(trip.startDate || trip.endDate) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Safety Check-in trigger */}
          <button
            onClick={() => setCheckinModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>✓ Check In (I'm Safe)</span>
          </button>

          <Link
            to="/explore"
            onClick={() => setExplorationCenter(tripExploreCenter)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Find Places in {trip.destination}</span>
          </Link>
        </div>
      </div>

      {/* Description / Notes Banner */}
      {displayNotes && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Trip Description & Notes</span>
          <p className="leading-relaxed">{displayNotes}</p>
        </div>
      )}

      {/* Itinerary Places List with Journey Route Path & Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-320px)] min-h-[500px]">
        {/* Left Column: Itinerary Stops Timeline */}
        <div className="lg:col-span-5 h-full flex flex-col space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-900">
              Trip Itinerary Stops ({trip.places?.length || 0})
            </h3>
          </div>

          {(!trip.places || trip.places.length === 0) ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 my-auto">
              <Luggage className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                No places added to this trip yet. Browse the Explore page and click "Add to Trip" on any attraction, hotel, or restaurant.
              </p>
              <Link
                to="/explore"
                onClick={() => setExplorationCenter(tripExploreCenter)}
                className="inline-block px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Explore Places to Add
              </Link>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:via-teal-400 before:to-emerald-500 before:border-l before:border-dashed before:border-teal-400">
              {trip.places.map((place, idx) => {
                const isRemoving = removingPlaceId === place.id;
                return (
                  <div
                    key={place.id || idx}
                    onClick={() => setSelectedPlace(place)}
                    className={`relative group bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                      selectedPlace?.id === place.id
                        ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md bg-teal-50/10'
                        : 'border-slate-200 hover:border-teal-300 shadow-sm'
                    }`}
                  >
                    {/* Timeline Node Badge */}
                    <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-md ring-4 ring-white">
                      {idx + 1}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {place.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug truncate">
                          {place.placeName || place.name}
                        </h4>
                      </div>

                      {/* Explicit Remove Button with Icon & Label */}
                      <button
                        onClick={(e) => handleRemovePlace(place, e)}
                        disabled={isRemoving}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shrink-0 disabled:opacity-50"
                        title="Remove place from this trip"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">Remove</span>
                      </button>
                    </div>

                    {place.address && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{place.address}</p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Stop #{idx + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirections(place.latitude, place.longitude);
                        }}
                        className="flex items-center gap-1 font-bold text-teal-600 hover:underline"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Get Directions</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map of Trip Places */}
        <div className="lg:col-span-7 h-full">
          <GoogleMap
            places={mappedPlaces}
            reports={[]}
            exploreLocation={tripExploreCenter}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
          />
        </div>
      </div>

      {/* Safety Checkin Modal */}
      <SafetyCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        tripId={trip.id}
        onCheckinSuccess={fetchTrip}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 backdrop-blur-md">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
