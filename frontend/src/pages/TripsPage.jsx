import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Luggage, Plus, Calendar, MapPin, Trash2, ArrowRight, ShieldCheck, Loader2, Sparkles, FileText } from 'lucide-react';
import Modal from '../components/common/Modal';

export default function TripsPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Trip Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTrips = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await tripsApi.getTrips();
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    }
  }, [isAuthenticated]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setCreating(true);
    try {
      const formattedNotes = tripName.trim()
        ? `[${tripName.trim()}] ${notes.trim()}`
        : notes.trim();

      const newTrip = await tripsApi.createTrip({
        destination: destination.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        notes: formattedNotes,
      });
      setTrips(prev => [newTrip, ...prev]);
      setCreateModalOpen(false);
      setDestination('');
      setTripName('');
      setStartDate('');
      setEndDate('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTrip = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip itinerary?')) return;
    try {
      await tripsApi.deleteTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
          <Luggage className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">My Travel Itineraries</h2>
        <p className="text-xs text-slate-500">Sign in to organize trip itineraries, save places, and log timestamped safety check-ins.</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
        >
          Sign In to SafeTrip
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Trips & Itineraries</h1>
          <p className="text-xs text-slate-500 mt-1">Plan your upcoming journeys, attach discovered places, and record travel memories</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Trip</span>
        </button>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-semibold">Loading your itineraries...</div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Luggage className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Trips Created Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create your first destination trip to organize itinerary sights, hotels, restaurants, and safety check-ins.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-md"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            // Parse custom trip title if stored in bracket format
            let displayTitle = `Trip to ${trip.destination}`;
            let displayNotes = trip.notes || '';
            if (displayNotes.startsWith('[') && displayNotes.includes(']')) {
              const closeIdx = displayNotes.indexOf(']');
              displayTitle = displayNotes.substring(1, closeIdx);
              displayNotes = displayNotes.substring(closeIdx + 1).trim();
            }

            return (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {trip.destination}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors mt-1">
                          {displayTitle}
                        </h3>
                        {(trip.startDate || trip.endDate) && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      title="Delete trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {displayNotes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl line-clamp-2 leading-relaxed">
                      {displayNotes}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">
                    {trip.places?.length || 0} places saved
                  </span>
                  <span className="font-bold text-teal-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Open Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Trip Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Plan a New Journey" maxWidth="max-w-md">
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name</label>
            <input
              type="text"
              placeholder="e.g. Hyderabad Weekend, Goa Roadtrip..."
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City / Region *</label>
            <input
              type="text"
              required
              placeholder="e.g. Hyderabad, Vijayawada, Bengaluru, Mumbai..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Description & Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Explore historic sights, local culinary spots, and popular attractions over two days."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save & Plan Trip</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
