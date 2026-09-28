import React, { useState } from 'react';
import Modal from '../common/Modal';
import { HeartPulse, Shield, Navigation, MapPin, Phone, CheckCircle2, Crosshair, AlertCircle, Send, Loader2, Compass } from 'lucide-react';
import { useExplore } from '../../context/ExploreContext';
import { useAuth } from '../../context/AuthContext';
import { safetyApi } from '../../api';
import { useNavigate } from 'react-router-dom';

export default function EmergencyModal({ isOpen, onClose }) {
  const { exploreLocation, setExplorationCenter, setCategory, setSafetyMode, requestCurrentGps } = useExplore();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [modeType, setModeType] = useState('CURRENT_GPS'); // 'CURRENT_GPS' | 'EXPLORE_DESTINATION'
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState('');
  const [notifyError, setNotifyError] = useState('');

  // 1. Current GPS Location Emergency Discovery
  const handleCurrentLocationSearch = () => {
    setLocatingGps(true);
    setGpsError('');
    requestCurrentGps((coords) => {
      setLocatingGps(false);
      if (coords) {
        setExplorationCenter({
          name: 'My Current Location (GPS)',
          formatted: `Physical GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
          lat: coords.lat,
          lon: coords.lon,
        });
        setCategory('hospitals');
        setSafetyMode(true);
        onClose();
        navigate('/explore');
      } else {
        setGpsError('Location permission is required to use your current location. Please grant permission or search a destination.');
      }
    });
  };

  // 2. Destination Emergency Discovery
  const handleDestinationSearch = (targetCategory = 'hospitals') => {
    setCategory(targetCategory);
    setSafetyMode(true);
    onClose();
    navigate('/explore');
  };

  // 3. Notify Emergency Contact
  const handleNotifyEmergencyContact = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setNotifying(true);
    setNotifyError('');
    setNotifySuccess('');

    try {
      if (modeType === 'CURRENT_GPS') {
        // Request fresh physical GPS
        requestCurrentGps(async (coords) => {
          if (!coords) {
            setNotifying(false);
            setNotifyError('Location permission is required to send your current physical GPS coordinates.');
            return;
          }

          try {
            const res = await safetyApi.notifyEmergencyAlert({
              locationType: 'CURRENT_GPS',
              latitude: coords.lat,
              longitude: coords.lon,
              locationName: `GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
            });
            setNotifySuccess(res.message || 'Emergency notification sent to your emergency contact.');
          } catch (err) {
            setNotifyError(err.response?.data?.message || 'Unable to send the notification right now. Please try again.');
          } finally {
            setNotifying(false);
          }
        });
      } else {
        // Explore Destination notification
        const res = await safetyApi.notifyEmergencyAlert({
          locationType: 'EXPLORE_DESTINATION',
          destination: exploreLocation.name,
          latitude: exploreLocation.lat,
          longitude: exploreLocation.lon,
        });
        setNotifySuccess(res.message || 'Emergency notification sent to your emergency contact.');
        setNotifying(false);
      }
    } catch (err) {
      setNotifyError(err.response?.data?.message || 'Unable to send the notification right now. Please try again.');
      setNotifying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Emergency Mode" maxWidth="max-w-xl">
      <div className="space-y-5">
        <p className="text-xs text-slate-600 leading-relaxed">
          Locate nearby hospitals and police stations or notify your registered emergency contact with verified location details.
        </p>

        {/* Location Selection Tabs: Current Location vs Explore Destination */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setModeType('CURRENT_GPS')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              modeType === 'CURRENT_GPS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-teal-600" />
            <span>Use My Current Location</span>
          </button>
          <button
            type="button"
            onClick={() => setModeType('EXPLORE_DESTINATION')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              modeType === 'EXPLORE_DESTINATION' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-slate-700" />
            <span>Explore a Destination ({exploreLocation.name})</span>
          </button>
        </div>

        {gpsError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {notifySuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notifySuccess}</span>
          </div>
        )}

        {notifyError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{notifyError}</span>
          </div>
        )}

        {/* Action Options: Hospital & Police Discovery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modeType === 'CURRENT_GPS' ? (
            <>
              <button
                onClick={handleCurrentLocationSearch}
                disabled={locatingGps}
                className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left hover:bg-rose-100/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">Hospitals Near Me</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Find medical facilities near your physical GPS coordinates.
                  </p>
                </div>
              </button>

              <button
                onClick={handleCurrentLocationSearch}
                disabled={locatingGps}
                className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left hover:bg-blue-100/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Police Near Me</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Find police stations near your physical GPS coordinates.
                  </p>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleDestinationSearch('hospitals')}
                className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left hover:bg-rose-100/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">Hospitals in {exploreLocation.name}</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Discover medical centers around explored destination.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleDestinationSearch('police')}
                className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left hover:bg-blue-100/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Police in {exploreLocation.name}</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Discover police stations around explored destination.
                  </p>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Notify Emergency Contact Section */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {modeType === 'CURRENT_GPS' ? (
              <span>Sends emergency alert email with your exact physical GPS location.</span>
            ) : (
              <span>Sends emergency alert email specifying explored destination ({exploreLocation.name}).</span>
            )}
          </div>

          <button
            onClick={handleNotifyEmergencyContact}
            disabled={notifying}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
          >
            {notifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Notify Emergency Contact</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
