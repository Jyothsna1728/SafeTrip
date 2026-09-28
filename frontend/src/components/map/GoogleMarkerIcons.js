// Generates category-specific SVG icon data URIs for Google Maps Markers

export const getGoogleCategoryIcon = (category, isSelected = false) => {
  const cat = (category || 'attraction').toLowerCase();

  let badgeColor = '#6366f1'; // Indigo
  let iconSvg = '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6"/>'; // Monument

  if (cat.includes('hotel') || cat.includes('accommodation')) {
    badgeColor = '#0d9488'; // Teal
    iconSvg = '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>'; // Bed
  } else if (cat.includes('restaurant') || cat.includes('catering') || cat.includes('food') || cat.includes('cafe')) {
    badgeColor = '#ea580c'; // Orange
    iconSvg = '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M5 2v20M5 7h4"/>'; // Cutlery
  } else if (cat.includes('hospital') || cat.includes('healthcare')) {
    badgeColor = '#e11d48'; // Rose
    iconSvg = '<path d="M12 6v12M6 12h12M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>'; // Cross
  } else if (cat.includes('police') || cat.includes('service')) {
    badgeColor = '#2563eb'; // Blue
    iconSvg = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'; // Shield
  }

  const scale = isSelected ? 1.25 : 1.0;
  const strokeColor = isSelected ? '#ffffff' : '#ffffff';
  const strokeWidth = isSelected ? 3 : 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(40 * scale)}" height="${Math.round(48 * scale)}" viewBox="0 0 40 48" fill="none">
      <defs>
        <filter id="shadow" x="0" y="0" width="40" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M20 44C20 44 34 29 34 18C34 10.268 27.732 4 20 4C12.268 4 6 10.268 6 18C6 29 20 44 20 44Z" fill="${badgeColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <circle cx="20" cy="18" r="10" fill="white"/>
        <g transform="translate(10, 8) scale(0.85)" stroke="${badgeColor}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </g>
      </g>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim()),
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(Math.round(40 * scale), Math.round(48 * scale))
      : null,
    anchor: window.google?.maps?.Point
      ? new window.google.maps.Point(Math.round(20 * scale), Math.round(44 * scale))
      : null,
  };
};

export const getGoogleReportIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" fill="none">
      <defs>
        <filter id="shadow" x="0" y="0" width="36" height="42" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M18 38C18 38 30 25 30 16C30 9.37258 24.6274 4 18 4C11.3726 4 6 9.37258 6 16C6 25 18 38 18 38Z" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <circle cx="18" cy="16" r="9" fill="#ffffff"/>
        <g transform="translate(10, 8) scale(0.7)" stroke="#d97706" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </g>
      </g>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim()),
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(36, 42)
      : null,
    anchor: window.google?.maps?.Point
      ? new window.google.maps.Point(18, 38)
      : null,
  };
};

export const getGoogleDestinationIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" fill="#0d9488" fill-opacity="0.25"/>
      <circle cx="18" cy="18" r="8" fill="#0d9488" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="18" cy="18" r="3" fill="#ffffff"/>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim()),
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(36, 36)
      : null,
    anchor: window.google?.maps?.Point
      ? new window.google.maps.Point(18, 18)
      : null,
  };
};
