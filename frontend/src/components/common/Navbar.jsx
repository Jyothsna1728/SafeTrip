import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, MapPin, Compass, Heart, Luggage, AlertTriangle, User, LogOut, Sparkles, Menu, X, Home, UserCheck, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useExplore } from '../../context/ExploreContext';
import { placesApi } from '../../api/placesApi';

export default function Navbar({ onOpenEmergency, onOpenAssistant }) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { exploreLocation, setExplorationCenter } = useExplore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await placesApi.geocodeDestination(searchQuery.trim());
      setSearchResults(results);
      if (results.length > 0) {
        setExplorationCenter(results[0]);
        setSearchResults([]);
        setSearchQuery('');
        if (location.pathname !== '/explore') {
          navigate('/explore');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    setExplorationCenter(item);
    setSearchResults([]);
    setSearchQuery('');
    if (location.pathname !== '/explore') {
      navigate('/explore');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Safety Hub', path: '/safety', icon: Shield },
    { name: 'Reports', path: '/reports', icon: ShieldAlert },
    { name: 'My Trips', path: '/trips', icon: Luggage, protected: true },
    { name: 'Saved Places', path: '/saved-places', icon: Heart, protected: true },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Explorer';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* SafeTrip Brand Logo -> Navigates to Home */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-0.5">
                Safe<span className="text-teal-600">Trip</span>
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest font-bold text-slate-400 -mt-1">
                Explore • Travel • Stay Safe
              </span>
            </div>
          </Link>

          {/* Quick Destination Search & Active Explore City Indicator */}
          <div className="relative hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder={`Exploring ${exploreLocation.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/90 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 font-medium"
              />
              <MapPin className="w-3.5 h-3.5 text-teal-600 absolute left-3 top-2.5" />
            </form>

            {/* Geocode Search Autocomplete dropdown */}
            {searchResults.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase">Select Destination</div>
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{res.formatted}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              if (link.protected && !isAuthenticated) {
                return (
                  <button
                    key={link.name}
                    onClick={() => openAuthModal('login')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-teal-600 hover:bg-slate-50 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {link.name}
                  </button>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                    isActive
                      ? 'text-teal-700 bg-teal-50/80'
                      : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons: AI Assistant + Emergency SOS + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Assistant button */}
            <button
              onClick={onOpenAssistant}
              title="SafeTrip AI Assistant"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">AI Travel Assistant</span>
            </button>

            {/* Emergency Mode Button */}
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white rounded-full bg-red-600 hover:bg-red-700 active:scale-95 shadow-md shadow-red-600/25 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency</span>
            </button>

            {/* User Profile / Auth with Personalized Name & Letter */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    {userInitial}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 pr-1">
                    Hi, {firstName}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/reports?tab=my"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>My Reports</span>
                    </Link>

                    <Link
                      to="/reports"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
                      <span>Community Reports</span>
                    </Link>

                    <Link
                      to="/trips"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <Luggage className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Trips</span>
                    </Link>

                    <Link
                      to="/saved-places"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <span>Saved Places</span>
                    </Link>

                    <Link
                      to="/safety"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Safety Hub</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left border-t border-slate-100 mt-1 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-full border border-teal-200 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 space-y-1">
            <div className="px-2 pb-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search city/destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <MapPin className="w-3.5 h-3.5 text-teal-600 absolute left-3 top-3" />
              </form>
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-700 text-xs font-bold"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  {link.name}
                </Link>
              );
            })}
            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-700 text-xs font-bold border-t border-slate-100"
                >
                  <User className="w-4 h-4 text-teal-600" />
                  <span>My Profile ({user?.name})</span>
                </Link>
                <Link
                  to="/reports?tab=my"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-700 text-xs font-bold"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>My Reports</span>
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-700 text-xs font-bold"
                >
                  <ShieldAlert className="w-4 h-4 text-teal-600" />
                  <span>Community Reports</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
