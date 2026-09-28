import React, { useState } from 'react';
import { Landmark, Building2, Utensils, HeartPulse, Shield, Star, Image as ImageIcon } from 'lucide-react';

export const getCategoryTheme = (category) => {
  const cat = (category || 'attraction').toLowerCase();
  if (cat.includes('hotel') || cat.includes('accommodation')) {
    return {
      label: 'Hotel',
      icon: Building2,
      gradient: 'from-teal-700 via-teal-800 to-emerald-900',
      badgeBg: 'bg-teal-500/20 text-teal-200 border-teal-400/30',
      accentColor: 'text-teal-400',
    };
  }
  if (cat.includes('restaurant') || cat.includes('catering') || cat.includes('cafe') || cat.includes('food')) {
    return {
      label: 'Restaurant',
      icon: Utensils,
      gradient: 'from-orange-700 via-amber-800 to-rose-900',
      badgeBg: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
      accentColor: 'text-orange-400',
    };
  }
  if (cat.includes('hospital') || cat.includes('healthcare')) {
    return {
      label: 'Hospital',
      icon: HeartPulse,
      gradient: 'from-rose-800 via-red-900 to-slate-950',
      badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
      accentColor: 'text-rose-400',
    };
  }
  if (cat.includes('police') || cat.includes('service')) {
    return {
      label: 'Police',
      icon: Shield,
      gradient: 'from-blue-800 via-indigo-900 to-slate-950',
      badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      accentColor: 'text-blue-400',
    };
  }
  return {
    label: 'Attraction',
    icon: Landmark,
    gradient: 'from-indigo-800 via-purple-900 to-slate-950',
    badgeBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
    accentColor: 'text-indigo-400',
  };
};

export default function PlaceImage({
  src,
  alt,
  category,
  subCategory,
  rating,
  className = '',
  aspectRatio = 'aspect-[16/10]',
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;

  const showRealImage = Boolean(src) && !hasError;

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      {showRealImage ? (
        <>
          {/* Subtle loading placeholder */}
          {!loaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-400 animate-pulse" />
            </div>
          )}
          <img
            src={src}
            alt={alt || 'Place image'}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </>
      ) : (
        /* SafeTrip Category Placeholder */
        <div className={`w-full h-full bg-gradient-to-tr ${theme.gradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}>
          {/* Watermark Icon */}
          <CategoryIcon className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 pointer-events-none transform -rotate-12 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />

          <div className="flex items-center justify-between z-10">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur border ${theme.badgeBg}`}>
              {subCategory || theme.label}
            </span>
            {rating != null && (
              <span className="flex items-center gap-1 text-[11px] font-bold bg-black/40 backdrop-blur text-amber-300 px-2 py-0.5 rounded-full border border-white/10">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="z-10">
            <h4 className="text-sm font-bold line-clamp-1 text-white/95">{alt}</h4>
            <span className="text-[10px] text-white/70 font-medium">SafeTrip Travel Guide</span>
          </div>
        </div>
      )}

      {/* Floating Badges when real image is shown */}
      {showRealImage && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur border ${theme.badgeBg}`}>
            {subCategory || theme.label}
          </span>
          {rating != null && (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-black/60 backdrop-blur text-amber-300 px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
