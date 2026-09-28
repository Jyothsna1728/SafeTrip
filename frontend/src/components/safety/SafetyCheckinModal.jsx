import React, { useState } from 'react';
import Modal from '../common/Modal';
import { CheckCircle2, ShieldCheck, MapPin, Loader2, Clock, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { safetyApi, placesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function SafetyCheckinModal({ isOpen, onClose, tripId, onCheckinSuccess }) {
  const { isAuthenticated, openAuthModal } = useAuth();

  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');

  // Checkin state
  const [savedCheckin, setSavedCheckin] = useState(null);

  const getCurrentGpsPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission is required to record your current physical GPS check-in.'));
          } else {
            reject(new Error('Unable to retrieve current physical GPS coordinates. Please try again.'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handlePerformCheckin = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setLoading(true);
    setGpsError('');
    setErrorMsg('');
    setNotifyMsg('');

    try {
      // 1. Obtain browser physical GPS coordinates
      const coords = await getCurrentGpsPosition();

      // 2. Reverse geocode to get real place/city name if available
      let resolvedLocationName = `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
      try {
        const reverseData = await placesApi.reverseGeocode(coords.lat, coords.lon);
        if (reverseData && reverseData.city) {
          resolvedLocationName = reverseData.city + (reverseData.state ? `, ${reverseData.state}` : '');
        } else if (reverseData && reverseData.formatted) {
          resolvedLocationName = reverseData.formatted;
        }
      } catch (err) {
        // Fallback to coordinates
      }

      // 3. Save check-in with status SAFE
      const checkinRes = await safetyApi.createCheckin({
        tripId: tripId || null,
        latitude: coords.lat,
        longitude: coords.lon,
        locationName: resolvedLocationName,
        status: 'SAFE',
      });

      setSavedCheckin({
        id: checkinRes.id,
        latitude: coords.lat,
        longitude: coords.lon,
        locationName: resolvedLocationName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      if (onCheckinSuccess) onCheckinSuccess();
    } catch (err) {
      setGpsError(err.message || 'Failed to complete safety check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyContact = async () => {
    if (!savedCheckin) return;
    setNotifying(true);
    setErrorMsg('');
    setNotifyMsg('');

    try {
      // Obtain fresh GPS coordinates when notifying
      let freshLat = savedCheckin.latitude;
      let freshLon = savedCheckin.longitude;
      let freshLocName = savedCheckin.locationName;

      try {
        const freshCoords = await getCurrentGpsPosition();
        freshLat = freshCoords.lat;
        freshLon = freshCoords.lon;
      } catch (ignored) {
        // Use saved checkin coords if fresh GPS unavailable
      }

      const res = await safetyApi.notifyCheckinContact(savedCheckin.id, {
        latitude: freshLat,
        longitude: freshLon,
        locationName: freshLocName,
      });

      setNotifyMsg(res.message || 'Safety Check-in notification sent to your emergency contact.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to send the notification right now. Please try again.');
    } finally {
      setNotifying(false);
    }
  };

  const handleModalClose = () => {
    setSavedCheckin(null);
    setGpsError('');
    setErrorMsg('');
    setNotifyMsg('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Safety Check-in" maxWidth="max-w-md">
      <div className="space-y-4 py-1">
        {!savedCheckin ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">Confirm Your Safety Status</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Records your verified current physical GPS location and timestamp as <strong>SAFE</strong>.
              </p>
            </div>

            {gpsError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            <button
              onClick={handlePerformCheckin}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Obtaining Current GPS & Checking In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ I'm Safe (Record Check-in)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success Check-in Summary */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-emerald-950">✓ I'm Safe</h3>
              <div className="text-xs text-emerald-800 space-y-1 font-medium pt-1">
                <p>
                  <strong>Checked in at:</strong> {savedCheckin.locationName}
                </p>
                <p>
                  <strong>Coordinates:</strong> {savedCheckin.latitude.toFixed(4)}, {savedCheckin.longitude.toFixed(4)}
                </p>
                <p>
                  <strong>Time:</strong> {savedCheckin.time}
                </p>
              </div>
            </div>

            {notifyMsg && (
              <div className="p-3 bg-teal-50 text-teal-800 border border-teal-200 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{notifyMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleNotifyContact}
                disabled={notifying}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {notifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Notify Emergency Contact</span>
              </button>

              <button
                onClick={handleModalClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
