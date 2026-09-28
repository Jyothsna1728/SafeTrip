import L from 'leaflet';

// Generate modern SVG DivIcon with category-specific colors and symbols
export const createCategoryIcon = (category, isSelected = false) => {
  const cat = (category || 'attraction').toLowerCase();

  let bgGradient = 'from-indigo-600 to-violet-600';
  let iconSvg = `<path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6"/>`; // default monument/attraction
  let badgeColor = '#6366f1';

  if (cat.includes('hotel') || cat.includes('accommodation')) {
    bgGradient = 'from-teal-600 to-emerald-600';
    badgeColor = '#0d9488';
    iconSvg = `<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>`; // bed
  } else if (cat.includes('restaurant') || cat.includes('catering') || cat.includes('food') || cat.includes('cafe')) {
    bgGradient = 'from-orange-500 to-amber-600';
    badgeColor = '#ea580c';
    iconSvg = `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M5 2v20M5 7h4"/>`; // cutlery
  } else if (cat.includes('hospital') || cat.includes('healthcare')) {
    bgGradient = 'from-rose-600 to-red-600';
    badgeColor = '#e11d48';
    iconSvg = `<path d="M12 6v12M6 12h12M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>`; // medical cross
  } else if (cat.includes('police') || cat.includes('service')) {
    bgGradient = 'from-blue-600 to-indigo-700';
    badgeColor = '#2563eb';
    iconSvg = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`; // shield/badge
  }

  const selectedRing = isSelected
    ? 'ring-4 ring-white shadow-2xl scale-125 z-50 animate-bounce'
    : 'shadow-lg hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform duration-200 ${selectedRing}" style="width: 38px; height: 38px;">
      <div style="background-color: ${badgeColor};" class="w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
      <div style="border-top-color: ${badgeColor};" class="absolute -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [38, 44],
    iconAnchor: [19, 44],
    popupAnchor: [0, -42],
  });
};

// Community Safety Report Marker Icon
export const createReportIcon = (category) => {
  const html = `
    <div class="relative flex items-center justify-center hover:scale-110 transition-transform" style="width: 32px; height: 32px;">
      <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-report-marker',
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -34],
  });
};
