import React from 'react';
import { MapPin, Phone, Globe, Clock, Star, Navigation, Bookmark, BookmarkCheck, Plus, Check, Info, ExternalLink } from 'lucide-react';
import PlaceImage from '../common/PlaceImage';

export default function PlaceCard({
  place,
  isSelected,
  isSaved,
  isAddedToTrip,
  onSelect,
  onViewDetails,
  onSaveToggle,
  onAddToTrip,
}) {
  const openDirections = (e) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onSelect(place)}
      className={`group relative bg-white rounded-3xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/25 shadow-card-hover bg-teal-50/5'
          : 'border-slate-200/90 hover:border-teal-300 hover:shadow-card shadow-sm'
      }`}
    >
      {/* Reusable Visual Image Area with Lazy Loading & Fallback */}
      <div className="relative p-2.5 pb-0">
        <PlaceImage
          src={place.imageUrl}
          alt={place.name}
          category={place.category}
          subCategory={place.subCategory}
          rating={place.rating}
          aspectRatio="aspect-[16/10]"
        />

        {/* Quick Bookmark Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(place);
          }}
          className={`absolute top-5 right-5 p-2 rounded-full backdrop-blur border transition-all shadow-md z-20 ${
            isSaved
              ? 'bg-teal-600 border-teal-700 text-white'
              : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-white hover:text-teal-600'
          }`}
          title={isSaved ? 'Saved in Bookmarks' : 'Save Place'}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-1">
              {place.name}
            </h3>
          </div>

          {/* Real Address */}
          {place.address && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>{place.address}</span>
            </div>
          )}

          {/* Genuine Description / Wikipedia Excerpt if available */}
          {place.description && (
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
              {place.description}
            </p>
          )}

          {/* Real Contact Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
            {place.cuisine && (
              <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                {place.cuisine}
              </span>
            )}
            {place.phone && (
              <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{place.phone}</span>
              </span>
            )}
            {place.openingHours && (
              <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{place.openingHours}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(place);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Info className="w-3 h-3 text-slate-500" />
              <span>Details</span>
            </button>

            {onAddToTrip && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToTrip(place);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isAddedToTrip
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 ring-1 ring-emerald-400/30'
                    : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300'
                }`}
                title={isAddedToTrip ? 'Added to My Trips' : 'Add directly to My Trips'}
              >
                {isAddedToTrip ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3" />}
                <span>{isAddedToTrip ? 'In Trip' : 'Trip'}</span>
              </button>
            )}
          </div>

          <button
            onClick={openDirections}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Navigation className="w-3 h-3" />
            <span>Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
