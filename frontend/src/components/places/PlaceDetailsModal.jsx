import React, { useState } from 'react';
import Modal from '../common/Modal';
import { MapPin, Phone, Globe, Clock, Star, Navigation, Bookmark, BookmarkCheck, Plus, Shield, Utensils, Building2, Landmark, HeartPulse, ExternalLink, ShieldAlert } from 'lucide-react';

export default function PlaceDetailsModal({
  place,
  isOpen,
  onClose,
  isSaved,
  onSaveToggle,
  onAddToTrip,
}) {
  const [imgError, setImgError] = useState(false);

  if (!place) return null;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryMeta = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('hotel')) return { label: 'Hotel', icon: Building2, gradient: 'from-teal-600 to-emerald-800' };
    if (c.includes('restaurant') || c.includes('cafe')) return { label: 'Restaurant', icon: Utensils, gradient: 'from-orange-600 to-amber-800' };
    if (c.includes('hospital')) return { label: 'Hospital & Healthcare', icon: HeartPulse, gradient: 'from-rose-600 to-red-800' };
    if (c.includes('police')) return { label: 'Police Station', icon: Shield, gradient: 'from-blue-600 to-indigo-800' };
    return { label: 'Attraction / Sights', icon: Landmark, gradient: 'from-indigo-600 to-purple-800' };
  };

  const meta = getCategoryMeta(place.category);
  const CategoryIcon = meta.icon;
  const hasRealImage = place.imageUrl && !imgError;
  const isEmergencyFacility = (place.category || '').toLowerCase().includes('hospital') || (place.category || '').toLowerCase().includes('police');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={place.name} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Top Visual Image Banner */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100">
          {hasRealImage ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-tr ${meta.gradient} p-5 flex flex-col justify-between text-white relative overflow-hidden`}>
              <CategoryIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 pointer-events-none transform -rotate-12" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/30 backdrop-blur border border-white/20">
                  {meta.label}
                </span>
                {place.rating != null && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-white text-slate-900 px-2.5 py-1 rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{place.rating.toFixed(1)}</span>
                  </span>
                )}
              </div>
              <div className="z-10">
                <h2 className="text-xl font-black">{place.name}</h2>
                <p className="text-xs text-white/80">{place.city || 'Verified Location'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rating and Category Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {place.subCategory || place.category}
            </span>
            {place.cuisine && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {place.cuisine}
              </span>
            )}
          </div>
          {place.rating != null && (
            <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{place.rating.toFixed(1)} / 5.0</span>
            </div>
          )}
        </div>

        {/* Real description / About this place */}
        {place.description && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">About this place</span>
            <p className="leading-relaxed">{place.description}</p>
            {place.wikipediaUrl && (
              <div className="pt-1.5">
                <a
                  href={place.wikipediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline"
                >
                  <span>Read more on Wikipedia</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Wikipedia source if description not present */}
        {!place.description && place.wikipediaUrl && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-700">Encyclopedia Reference</span>
            <a
              href={place.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline"
            >
              <span>View Wikipedia Article</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Address */}
        {place.address && (
          <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Address</span>
              <span>{place.address}</span>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {place.phone && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Phone Number</span>
              <a href={`tel:${place.phone}`} className="text-teal-700 font-bold flex items-center gap-1.5 hover:underline">
                <Phone className="w-3.5 h-3.5" />
                <span>{place.phone}</span>
              </a>
            </div>
          )}

          {place.website && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Website</span>
              <a href={place.website} target="_blank" rel="noreferrer" className="text-teal-700 font-bold flex items-center gap-1.5 hover:underline truncate">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Visit Official Site</span>
              </a>
            </div>
          )}
        </div>

        {/* Opening Hours */}
        {place.openingHours && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Opening Hours</span>
            </div>
            <p className="text-slate-600">{place.openingHours}</p>
          </div>
        )}

        {/* Verified Amenities */}
        {place.amenities && place.amenities.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Amenities</span>
            <div className="flex flex-wrap gap-1.5">
              {place.amenities.map((am, idx) => (
                <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                  {am}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveToggle(place)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isSaved
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-teal-600" /> : <Bookmark className="w-4 h-4" />}
              <span>{isSaved ? 'Saved' : 'Save Place'}</span>
            </button>

            {onAddToTrip && (
              <button
                onClick={() => {
                  onAddToTrip(place);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Trip</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEmergencyFacility && place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            )}

            <button
              onClick={openDirections}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-teal-600 transition-colors shadow-md"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
