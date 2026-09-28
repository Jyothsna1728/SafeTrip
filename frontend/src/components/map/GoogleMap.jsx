import React, { useEffect, useRef, useState } from 'react';
import { getGoogleCategoryIcon, getGoogleReportIcon, getGoogleDestinationIcon } from './GoogleMarkerIcons';
import { AlertCircle, MapPin, Compass } from 'lucide-react';

let googleMapsScriptLoadingPromise = null;

function loadGoogleMapsScript(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsScriptLoadingPromise) {
    return googleMapsScriptLoadingPromise;
  }

  googleMapsScriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      reject(new Error('Google Maps API Key is not configured.'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsScriptLoadingPromise;
}

export default function GoogleMap({
  places = [],
  reports = [],
  exploreLocation,
  selectedPlace,
  onSelectPlace,
  onSavePlace,
  savedPlaceIds = new Set(),
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const reportMarkersRef = useRef([]);
  const destinationMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_MAPS_API_KEY || '';

  // 1. Load Google Maps API Script & Listen for Auth/Activation Errors
  useEffect(() => {
    let isMounted = true;

    // Listen for Google Maps auth errors (e.g. API not activated, billing required, referrer restriction)
    window.gm_authFailure = () => {
      if (isMounted) {
        console.warn('Google Maps Authentication Notice: Key may require enabling Maps JavaScript API or billing in Google Cloud Console.');
        setLoadError('Google Maps JavaScript API is not enabled or requires billing in Google Cloud Console.');
        setMapsLoaded(false);
      }
    };

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (isMounted) {
          setMapsLoaded(true);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Google Maps Script load notice:', err.message);
          setLoadError(err.message || 'Google Maps API key not set or invalid.');
          setMapsLoaded(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = exploreLocation?.lat || 17.385044;
    const initialLng = exploreLocation?.lon || 78.486671;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    infoWindowRef.current = new window.google.maps.InfoWindow({
      maxWidth: 320,
    });

    mapInstanceRef.current = map;
  }, [mapsLoaded, exploreLocation?.lat, exploreLocation?.lon]);

  // 3. Update Map Center when exploreLocation or selectedPlace changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;
    const map = mapInstanceRef.current;

    if (selectedPlace?.latitude && selectedPlace?.longitude) {
      map.panTo({ lat: selectedPlace.latitude, lng: selectedPlace.longitude });
      if (map.getZoom() < 15) {
        map.setZoom(15);
      }
    } else if (exploreLocation?.lat && exploreLocation?.lon) {
      map.panTo({ lat: exploreLocation.lat, lng: exploreLocation.lon });
    }
  }, [exploreLocation?.lat, exploreLocation?.lon, selectedPlace, mapsLoaded]);

  // 4. Update Destination Center Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    if (exploreLocation?.lat && exploreLocation?.lon) {
      const marker = new window.google.maps.Marker({
        position: { lat: exploreLocation.lat, lng: exploreLocation.lon },
        map: mapInstanceRef.current,
        title: exploreLocation.name || 'Destination Center',
        icon: getGoogleDestinationIcon(),
        zIndex: 10,
      });
      destinationMarkerRef.current = marker;
    }
  }, [exploreLocation?.lat, exploreLocation?.lon, exploreLocation?.name, mapsLoaded]);

  // 5. Update Place Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    const map = mapInstanceRef.current;
    const existingMarkers = markersRef.current;
    const currentPlaceIds = new Set(places.map((p) => p.id));

    // Remove obsolete markers
    Object.keys(existingMarkers).forEach((id) => {
      if (!currentPlaceIds.has(id)) {
        existingMarkers[id].setMap(null);
        delete existingMarkers[id];
      }
    });

    // Create / Update markers
    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return;

      const isSelected = selectedPlace?.id === place.id;
      const isSaved = place.isSaved || savedPlaceIds.has(place.id);

      if (existingMarkers[place.id]) {
        // Update marker icon if selection changed
        existingMarkers[place.id].setIcon(getGoogleCategoryIcon(place.category, isSelected));
        existingMarkers[place.id].setZIndex(isSelected ? 100 : 20);
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: place.latitude, lng: place.longitude },
          map: map,
          title: place.name,
          icon: getGoogleCategoryIcon(place.category, isSelected),
          zIndex: isSelected ? 100 : 20,
        });

        marker.addListener('click', () => {
          if (onSelectPlace) {
            onSelectPlace(place);
          }
          openPlaceInfoWindow(marker, place, isSaved);
        });

        existingMarkers[place.id] = marker;
      }
    });

    // Automatically trigger infoWindow if selectedPlace changed
    if (selectedPlace?.id && existingMarkers[selectedPlace.id]) {
      const isSaved = selectedPlace.isSaved || savedPlaceIds.has(selectedPlace.id);
      openPlaceInfoWindow(existingMarkers[selectedPlace.id], selectedPlace, isSaved);
    }
  }, [places, selectedPlace, savedPlaceIds, mapsLoaded, onSelectPlace]);

  // 6. Update Safety Report Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    reportMarkersRef.current.forEach((m) => m.setMap(null));
    reportMarkersRef.current = [];

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: report.latitude, lng: report.longitude },
        map: mapInstanceRef.current,
        title: report.category || 'Safety Hazard',
        icon: getGoogleReportIcon(),
        zIndex: 50,
      });

      marker.addListener('click', () => {
        const author = report.username || report.userFullName || 'SafeTrip Explorer';
        const locationDetails = [report.exactPlace, report.area, report.city].filter(Boolean).join(', ') || report.locationName || '';

        const content = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; max-width: 260px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; background-color: #fef3c7; padding: 2px 8px; border-radius: 9999px;">
                ⚠️ ${report.category || 'Hazard'}
              </span>
              <span style="font-size: 10px; color: #64748b;">
                ${report.createdAt ? new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
            
            <div style="font-size: 11px; font-weight: 700; color: #0d9488; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span>👤 @${author}</span>
            </div>

            ${locationDetails ? `
              <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 4px;">
                📍 ${locationDetails}
              </div>
            ` : ''}

            <p style="font-size: 12px; color: #475569; line-height: 1.4; margin: 0; background-color: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #f1f5f9;">
              ${report.description || 'Community reported safety incident.'}
            </p>
          </div>
        `;
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      reportMarkersRef.current.push(marker);
    });
  }, [reports, mapsLoaded]);

  // Helper to open Place Info Window with directions and interactive save button
  const openPlaceInfoWindow = (marker, place, isSaved) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const ratingHtml = place.rating
      ? `<div style="display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; color: #d97706; margin-top: 4px;">
           <span>★</span>
           <span>${place.rating.toFixed(1)}</span>
         </div>`
      : '';

    const addressHtml = place.address
      ? `<p style="font-size: 11px; color: #64748b; margin: 4px 0 6px 0; line-height: 1.35;">${place.address}</p>`
      : '';

    const phoneHtml = place.phone
      ? `<div style="font-size: 11px; color: #334155; margin-bottom: 2px;">
           <span style="color: #0d9488; font-weight: 600;">📞 ${place.phone}</span>
         </div>`
      : '';

    const websiteHtml = place.website
      ? `<div style="font-size: 11px; margin-bottom: 6px;">
           <a href="${place.website}" target="_blank" rel="noreferrer" style="color: #0d9488; text-decoration: underline; font-weight: 600;">🌐 Official Website</a>
         </div>`
      : '';

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

    const content = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; max-width: 280px; min-width: 220px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 9999px; background-color: #f1f5f9; color: #334155;">
            ${place.subCategory || place.category || 'Location'}
          </span>
          ${ratingHtml}
        </div>
        <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 6px 0 2px 0; line-height: 1.3;">
          ${place.name}
        </h4>
        ${addressHtml}
        ${phoneHtml}
        ${websiteHtml}
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
          <a href="${directionsUrl}" target="_blank" rel="noreferrer" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #0f172a; border-radius: 8px; text-decoration: none;">
            <span>🧭 Directions</span>
          </a>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  // Render Fallback if Google Maps fails to load or Key is not configured
  if (loadError && !mapsLoaded) {
    return (
      <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-slate-200 min-h-[450px] bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h3 className="text-lg font-black tracking-tight mb-1">Google Maps Platform</h3>
        <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
          Interactive map initialized for <strong className="text-teal-400">{exploreLocation?.name || 'Selected Location'}</strong>.
        </p>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 max-w-md text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-teal-300">
            <AlertCircle className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Google Maps Configuration</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            To enable the live interactive Google Map on the frontend, add your Google Maps Platform JavaScript API key to <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded">frontend/.env</code> as:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-teal-300 select-all border border-slate-800">
            VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
          </div>
          <p className="text-slate-400 text-[10px]">
            All place search, verified attraction filtering, cards, modals, and saved places continue working seamlessly via the SafeTrip backend!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-slate-200 min-h-[450px]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" style={{ minHeight: '100%', height: '100%', width: '100%' }} />
    </div>
  );
}
