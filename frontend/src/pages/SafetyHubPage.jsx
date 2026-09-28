import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExplore } from '../context/ExploreContext';
import { safetyApi, emergencyContactApi, placesApi } from '../api';
import SafetyCheckinModal from '../components/safety/SafetyCheckinModal';
import EmergencyContactModal from '../components/safety/EmergencyContactModal';
import EmergencyModal from '../components/safety/EmergencyModal';
import { Shield, ShieldAlert, HeartPulse, CheckCircle2, AlertTriangle, MapPin, Clock, Plus, Compass, Crosshair, Mail, Phone, Heart, Trash2, Edit3, Send, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function SafetyHubPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { exploreLocation, setExplorationCenter, setCategory, setSafetyMode, requestCurrentGps } = useExplore();
  const navigate = useNavigate();

  const [checkins, setCheckins] = useState([]);
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [emergencyContactModalOpen, setEmergencyContactModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Direct fast notify check-in state
  const [notifyingCheckin, setNotifyingCheckin] = useState(false);
  const [notifyFeedback, setNotifyFeedback] = useState({ type: '', msg: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const [userCheckins, contactData] = await Promise.all([
          safetyApi.getUserCheckins(),
          emergencyContactApi.getEmergencyContact(),
        ]);
        setCheckins(userCheckins || []);
        setEmergencyContact(contactData || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleDeleteEmergencyContact = async () => {
    if (!window.confirm('Are you sure you want to remove your emergency contact?')) return;
    try {
      await emergencyContactApi.deleteEmergencyContact();
      setEmergencyContact(null);
      setNotifyFeedback({ type: 'success', msg: 'Emergency contact removed.' });
      setTimeout(() => setNotifyFeedback({ type: '', msg: '' }), 3000);
    } catch (err) {
      setNotifyFeedback({ type: 'error', msg: 'Failed to remove emergency contact.' });
    }
  };

  const handleNotifyLatestCheckin = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!emergencyContact) {
      setEmergencyContactModalOpen(true);
      return;
    }

    setNotifyingCheckin(true);
    setNotifyFeedback({ type: '', msg: '' });

    // Request fresh physical GPS
    requestCurrentGps(async (coords) => {
      try {
        let lat = coords?.lat;
        let lon = coords?.lon;
        let locationName = null;

        if (lat && lon) {
          try {
            const reverse = await placesApi.reverseGeocode(lat, lon);
            if (reverse?.city) locationName = reverse.city;
          } catch (ignored) {}
        } else if (checkins.length > 0) {
          lat = checkins[0].latitude;
          lon = checkins[0].longitude;
          locationName = checkins[0].locationName;
        }

        const res = await safetyApi.notifyCheckinContact(checkins[0]?.id || null, {
          latitude: lat,
          longitude: lon,
          locationName: locationName,
        });

        setNotifyFeedback({ type: 'success', msg: res.message || 'Check-in notification sent to emergency contact.' });
      } catch (err) {
        setNotifyFeedback({ type: 'error', msg: err.response?.data?.message || 'Unable to send notification right now. Please try again.' });
      } finally {
        setNotifyingCheckin(false);
        setTimeout(() => setNotifyFeedback({ type: '', msg: '' }), 4000);
      }
    });
  };

  const latestCheckin = checkins.length > 0 ? checkins[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Safety & Emergency Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record physical GPS safety check-ins, manage your emergency contact, and discover emergency services.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCheckinModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ I'm Safe (Check-in)</span>
          </button>
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Mode</span>
          </button>
        </div>
      </div>

      {notifyFeedback.msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            notifyFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notifyFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{notifyFeedback.msg}</span>
        </div>
      )}

      {/* Main 3 Core Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. SAFETY CHECK-IN SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Safety Status</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                ✓ I'm Safe
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">Safety Check-in</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify and log your physical location to assure family or travel contacts of your safety.
            </p>

            {latestCheckin ? (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Last Check-in:</span>
                  <span className="font-bold text-emerald-700">{latestCheckin.status}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-semibold truncate">{latestCheckin.locationName || 'GPS Location'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{new Date(latestCheckin.checkedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 text-center">
                No check-in recorded yet today.
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setCheckinModalOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record New Check-in</span>
            </button>

            {latestCheckin && (
              <button
                onClick={handleNotifyLatestCheckin}
                disabled={notifyingCheckin}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {notifyingCheckin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-slate-500" />}
                <span>Notify Emergency Contact</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. EMERGENCY CONTACT SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Trusted Contact</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Emergency Contact</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configured recipient for your Safety Check-ins and Emergency Mode alerts.
            </p>

            {emergencyContact ? (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{emergencyContact.contactName}</span>
                  <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    {emergencyContact.relationship}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emergencyContact.email}</span>
                </div>
                {emergencyContact.phone && (
                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emergencyContact.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 text-center space-y-2">
                <p>No emergency contact configured yet.</p>
                <p className="text-[11px] text-slate-400">Add a contact to enable email safety check-ins and emergency alerts.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            {emergencyContact ? (
              <>
                <button
                  onClick={() => setEmergencyContactModalOpen(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteEmergencyContact}
                  className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                  title="Remove Emergency Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) openAuthModal('login');
                  else setEmergencyContactModalOpen(true);
                }}
                className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Emergency Contact</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. EMERGENCY ASSISTANCE SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Fast Access</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>

            <h3 className="text-lg font-black text-slate-900">Emergency Assistance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find verified hospitals and police stations around your physical location or explored destination.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  requestCurrentGps((coords) => {
                    if (coords) {
                      setExplorationCenter({
                        name: 'My Current Location (GPS)',
                        formatted: `Physical GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
                        lat: coords.lat,
                        lon: coords.lon,
                      });
                      setCategory('hospitals');
                      setSafetyMode(true);
                      navigate('/explore');
                    }
                  });
                }}
                className="w-full text-left p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-xs transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-950">Hospitals Near Me</h4>
                    <span className="text-[11px] text-rose-700">Use physical browser GPS</span>
                  </div>
                </div>
                <Crosshair className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setCategory('police');
                  setSafetyMode(true);
                  navigate('/explore');
                }}
                className="w-full text-left p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/70 border border-blue-200 text-xs transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">Police in {exploreLocation.name}</h4>
                    <span className="text-[11px] text-blue-700">Explored destination</span>
                  </div>
                </div>
                <Compass className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Open Emergency Mode</span>
            </button>
          </div>
        </div>

      </div>

      {/* Quick link banner to Community Reports module */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-slate-700/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white">Community Safety Reports & Hazard Alerts</h4>
            <p className="text-xs text-slate-300 mt-0.5">Explore traveler warnings, scams, and area alerts on the dedicated Reports page.</p>
          </div>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <span>Open Reports Module</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Modals */}
      <SafetyCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onCheckinSuccess={fetchData}
      />

      <EmergencyContactModal
        isOpen={emergencyContactModalOpen}
        onClose={() => setEmergencyContactModalOpen(false)}
        initialData={emergencyContact}
        onSaveSuccess={(saved) => setEmergencyContact(saved)}
      />

      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  );
}
