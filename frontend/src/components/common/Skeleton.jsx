import React from 'react';

export function PlaceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <div className="h-8 bg-slate-100 rounded-lg flex-1" />
        <div className="h-8 bg-slate-100 rounded-lg w-20" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 animate-pulse">
      <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">Loading Interactive Map & Places...</p>
    </div>
  );
}
