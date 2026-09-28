import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, MapPin, Compass, Search, Crosshair, ArrowRight, Landmark, Building2, Utensils, HeartPulse, ShieldAlert, Sparkles, CheckCircle2, Bookmark, Luggage, Bot, AlertTriangle, Navigation, Star, Phone, Globe, Layers, Users } from 'lucide-react';
import { useExplore } from '../context/ExploreContext';
import { placesApi } from '../api/placesApi';

export default function HomePage({ onOpenEmergency, onOpenAssistant }) {
  const { setExplorationCenter, requestCurrentGps, setCategory, setSafetyMode } = useExplore();
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const navigate = useNavigate();

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setSearching(true);
    setGpsError('');
    try {
      const results = await placesApi.geocodeDestination(searchInput.trim());
      setSearchResults(results);
      if (results.length > 0) {
        setExplorationCenter(results[0]);
        setSearchResults([]);
        navigate('/explore');
      } else {
        setGpsError(`Could not find coordinates for "${searchInput}". Try searching a city name.`);
      }
    } catch (err) {
      setGpsError('Destination search service temporarily unavailable. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCity = (cityObj) => {
    setExplorationCenter(cityObj);
    navigate('/explore');
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    setGpsError('');
    requestCurrentGps((coords, error) => {
      setLocating(false);
      if (coords) {
        navigate('/explore');
      } else {
        setGpsError(error || 'Location access was denied or unavailable. Please search manually.');
      }
    });
  };

  const popularDestinations = [
    { name: 'Hyderabad', formatted: 'Hyderabad, Telangana, India', lat: 17.385044, lon: 78.486671, tag: 'City of Pearls', bg: 'from-amber-600 to-rose-700' },
    { name: 'Vijayawada', formatted: 'Vijayawada, Andhra Pradesh, India', lat: 16.506174, lon: 80.648015, tag: 'Cultural Hub', bg: 'from-teal-600 to-cyan-700' },
    { name: 'Bengaluru', formatted: 'Bengaluru, Karnataka, India', lat: 12.971599, lon: 77.594563, tag: 'Garden City', bg: 'from-emerald-600 to-teal-800' },
    { name: 'Chennai', formatted: 'Chennai, Tamil Nadu, India', lat: 13.082680, lon: 80.270718, tag: 'Coastal Heritage', bg: 'from-blue-600 to-indigo-800' },
    { name: 'Mumbai', formatted: 'Mumbai, Maharashtra, India', lat: 19.075984, lon: 72.877656, tag: 'Financial Capital', bg: 'from-purple-600 to-slate-800' },
    { name: 'Delhi', formatted: 'Delhi, India', lat: 28.613939, lon: 77.209021, tag: 'Historic Capital', bg: 'from-red-600 to-amber-800' },
    { name: 'Jaipur', formatted: 'Jaipur, Rajasthan, India', lat: 26.912434, lon: 75.787271, tag: 'Pink City', bg: 'from-pink-600 to-rose-800' },
    { name: 'Goa', formatted: 'Panaji, Goa, India', lat: 15.490930, lon: 73.827850, tag: 'Beaches & Sunshine', bg: 'from-cyan-600 to-blue-800' },
  ];

  const categories = [
    { id: 'attractions', label: 'Attractions', desc: 'Monuments, heritage landmarks, sights & museums', icon: Landmark, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'hotels', label: 'Hotels', desc: 'Verified hotels, guest houses & accommodations', icon: Building2, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'restaurants', label: 'Restaurants', desc: 'Local culinary dining, cafes & food stops', icon: Utensils, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'hospitals', label: 'Hospitals', desc: 'Medical emergency centers & hospitals', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'police', label: 'Police Stations', desc: 'Official law enforcement assistance & safety outposts', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  const workflowSteps = [
    { num: '01', title: 'Choose a Destination', desc: 'Search any supported city or click "Use My Current Location" to anchor the exploration center.', icon: MapPin },
    { num: '02', title: 'Discover Real Places', desc: 'Instantly view verified attractions, hotels, dining, hospitals, and police stations on the interactive map.', icon: Compass },
    { num: '03', title: 'Plan Your Trip', desc: 'Save your favorite spots into custom trip itineraries and access external directions with one click.', icon: Bookmark },
    { num: '04', title: 'Stay Prepared', desc: 'Log safety check-ins with GPS timestamps and discover nearby emergency help wherever you travel.', icon: ShieldAlert },
  ];

  const coreFeatures = [
    { title: 'Interactive Google Map', desc: 'Real Google Maps Platform with custom category markers, place details, and seamless synchronization.', icon: Layers },
    { title: 'Real Place Discovery', desc: 'Authentic POI data powered by verified places endpoints with real contact details and addresses.', icon: Compass },
    { title: 'Personal Trip Planner', desc: 'Create destination itineraries, attach bookmarked places, and organize your journey effortlessly.', icon: Luggage },
    { title: 'Safety Mode', desc: 'One-click filter switch prioritizing hospitals and police stations without fake safety ratings.', icon: HeartPulse },
    { title: 'Emergency Assistance', desc: 'Emergency hub offering both destination-based and current GPS-based rapid hospital and police discovery.', icon: AlertTriangle },
    { title: 'Community Hazard Reports', desc: 'Crowdsourced travel alerts for scams, road issues, and unsafe areas to keep everyone safe.', icon: Users },
    { title: '✓ I\'m Safe Check-in', desc: 'One-click safety status logging with timestamped coordinates attached to your trips.', icon: CheckCircle2 },
    { title: 'AI Travel Assistant (Groq)', desc: 'AI-assisted packing advice, itinerary frameworks, and safety guidelines grounded strictly in real safety practices.', icon: Sparkles },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-950 via-slate-900 to-slate-950 text-white rounded-b-[3rem] shadow-2xl overflow-hidden">
        {/* Background glow aesthetics */}
        <div className="absolute top-0 right-1/4 w-[32rem] h-[32rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[32rem] h-[32rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Smart Travel Discovery & Safety Companion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Explore the world. <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              Travel prepared.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Discover verified attractions, hotels, authentic restaurants, and essential emergency services like hospitals and police stations on a real interactive map.
          </p>

          {/* Search Box Card */}
          <div className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-slate-100 text-slate-900 text-left mt-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Where do you want to explore? (e.g. Hyderabad, Vijayawada...)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base font-medium rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchInput.trim()}
                  className="px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? 'Searching...' : 'Explore'}</span>
                </button>
              </div>
            </form>

            {/* Error notice if location or geocoding fails */}
            {gpsError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Geocode Autocomplete results */}
            {searchResults.length > 1 && (
              <div className="mt-3 bg-slate-50 rounded-2xl p-2 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase">Matches Found</div>
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectCity(res)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-teal-50 hover:text-teal-700 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate font-medium">{res.formatted}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Use My Current Location Action Button */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-500 font-medium">Or explore around your physical location:</span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold border border-slate-200 transition-colors"
              >
                <Crosshair className={`w-4 h-4 text-teal-600 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting Live GPS...' : '📍 Use My Current Location'}</span>
              </button>
            </div>
          </div>

          {/* Quick Destination Chips */}
          <div className="pt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400">Popular Quick Picks:</span>
            {popularDestinations.slice(0, 6).map((dest) => (
              <button
                key={dest.name}
                onClick={() => handleSelectCity(dest)}
                className="px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-teal-600 text-slate-200 hover:text-white border border-slate-700/80 transition-colors font-semibold"
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. POPULAR DESTINATIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Featured Cities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Popular Destinations</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Click any destination to view real attractions, accommodations, restaurants, and safety facilities across the city.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularDestinations.map((dest) => (
            <div
              key={dest.name}
              onClick={() => handleSelectCity(dest)}
              className="group relative bg-white rounded-3xl p-5 border border-slate-200 hover:border-teal-400 shadow-sm hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${dest.bg} text-white flex items-center justify-center font-bold shadow-md`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {dest.tag}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors mt-2">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{dest.formatted}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                <span>Explore {dest.name}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. EXPLORE BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Tailored Exploration</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Explore by Category</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Switch smoothly between cultural sights, verified accommodations, dining spots, or immediate medical and police assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  navigate('/explore');
                }}
                className="group bg-white rounded-3xl p-5 border border-slate-200 hover:border-teal-400 shadow-sm hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                  <span>View {cat.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. HOW SAFETRIP WORKS */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Step-by-Step Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">How SafeTrip Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From discovering hidden gems to staying safe in unfamiliar cities, SafeTrip handles your journey seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-400 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 font-mono">{step.num}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TRAVEL + SAFETY PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-teal-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">The SafeTrip Philosophy</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                Travel discovery combined with verified emergency access.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                SafeTrip is not a Google Maps replacement and not a booking engine. We believe true travel confidence comes from discovering amazing places while knowing verified medical and law enforcement facilities are just one click away.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Fake Data:</strong> Real API points of interest only.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>No Made-up Scores:</strong> Safety access via real hospitals and police.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Independent GPS:</strong> Accurate destination vs physical location.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Private Itineraries:</strong> Isolated secure user data in MySQL.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Safety Mode Instant Switch</h4>
                  <p className="text-xs text-slate-400">Emergency facilities prioritized immediately</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Toggle Safety Mode on any search to filter the interactive map directly to emergency hospitals and police stations with instant external directions.
              </p>
              <button
                onClick={() => {
                  setCategory('hospitals');
                  setSafetyMode(true);
                  navigate('/explore');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Try Safety Mode Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPREHENSIVE FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Built for Modern Travelers</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Complete Feature Suite</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Everything you need to discover, plan, coordinate, and stay safe on every journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {coreFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 hover:shadow-card transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. SAFETY & EMERGENCY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emergency Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                In an emergency? We've got your back.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Access emergency hospital and police station discovery around your explored destination or detect your live GPS location for immediate nearby help.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
              <button
                onClick={onOpenEmergency}
                className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>Open Emergency Hub</span>
              </button>
              <Link
                to="/safety"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Visit Safety Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Ready to explore?
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Start discovering verified places, planning personal itineraries, and traveling with full safety preparedness today.
        </p>
        <div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-lg shadow-teal-600/30 transition-all hover:scale-105"
          >
            <span>Start Exploring Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
