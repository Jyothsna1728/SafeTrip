import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { AlertTriangle, MapPin, Loader2, CheckCircle2, ShieldAlert, Building2, Navigation } from 'lucide-react';
import { safetyApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useExplore } from '../../context/ExploreContext';

export default function CommunityReportModal({ isOpen, onClose, onReportSubmitted, onReportSuccess }) {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const { exploreLocation, requestCurrentGps } = useExplore();

  const [city, setCity] = useState(exploreLocation?.name || '');
  const [area, setArea] = useState('');
  const [exactPlace, setExactPlace] = useState('');
  const [category, setCategory] = useState('Scam');
  const [description, setDescription] = useState('');
  const [useGps, setUseGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exploreLocation?.name) {
      setCity(exploreLocation.name);
    }
  }, [exploreLocation?.name, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!city.trim()) {
      setError('Please specify the city/destination name.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }

    setLoading(true);
    setError('');

    const proceed = async (lat, lon) => {
      try {
        const fullLocationName = [exactPlace.trim(), area.trim(), city.trim()].filter(Boolean).join(', ');
        
        await safetyApi.createReport({
          latitude: lat,
          longitude: lon,
          city: city.trim(),
          area: area.trim(),
          exactPlace: exactPlace.trim(),
          locationName: fullLocationName || city.trim(),
          category,
          description: description.trim(),
        });

        setSuccess(true);
        if (onReportSubmitted) onReportSubmitted();
        if (onReportSuccess) onReportSuccess();
        
        setTimeout(() => {
          setSuccess(false);
          setDescription('');
          setArea('');
          setExactPlace('');
          onClose();
        }, 1800);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (useGps) {
      requestCurrentGps((coords) => {
        if (coords) {
          proceed(coords.lat, coords.lon);
        } else {
          proceed(exploreLocation?.lat || 17.385044, exploreLocation?.lon || 78.486671);
        }
      });
    } else {
      proceed(exploreLocation?.lat || 17.385044, exploreLocation?.lon || 78.486671);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Submit Community Safety Report" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600">
          Help fellow travelers stay safe by reporting scams, poorly lit zones, or transit hazards. Your report will display under your username <strong className="text-teal-700 font-bold">@{user?.name || 'You'}</strong> for the destination community.
        </p>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Safety report submitted! It is now visible to travelers exploring {city || 'this area'}.</span>
          </div>
        )}

        <div className="space-y-3 text-xs text-slate-700">
          {/* Location Details: City, Area, Exact Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1 text-slate-800">
                City / Destination <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad, Goa, Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-900"
                />
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-800">
                Area / Neighborhood
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Banjara Hills, Old City"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
                <MapPin className="w-3.5 h-3.5 text-teal-600 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-800">
              Exact Place / Specific Landmark
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Near Metro Gate 2, Opposite Bus Depot, Main Market"
                value={exactPlace}
                onChange={(e) => setExactPlace(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
              />
              <Navigation className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Report Category */}
          <div>
            <label className="font-bold block mb-1 text-slate-800">Hazard / Issue Category <span className="text-red-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-900"
            >
              <option value="Scam">Scam / Overcharging / Tout</option>
              <option value="Unsafe Area">Unsafe Area / Poorly Lit Zone</option>
              <option value="Road Issue">Road / Transit / Traffic Hazard</option>
              <option value="Tourist Trap">Tourist Trap / Misleading Venue</option>
              <option value="Pickpocket Alert">Pickpocket / Theft Hazard</option>
              <option value="Other">Other Safety Caution</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold block mb-1 text-slate-800">Description & Advice for Travelers <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              required
              placeholder="Describe what happened and what other travelers should watch out for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-normal leading-relaxed"
            />
          </div>

          {/* Location coordinate anchor */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="useGpsCheck"
              checked={useGps}
              onChange={(e) => setUseGps(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="useGpsCheck" className="text-slate-600 select-none cursor-pointer">
              Tag report with my exact current device GPS coordinates
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{loading ? 'Submitting Report...' : 'Submit Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
