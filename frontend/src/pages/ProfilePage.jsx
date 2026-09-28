import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, tripsApi, savedPlacesApi, safetyApi, emergencyContactApi } from '../api';
import { User, Mail, Phone, Shield, ShieldCheck, Heart, Luggage, Lock, Edit3, CheckCircle2, AlertCircle, Loader2, ArrowRight, LogOut, Key, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import EmergencyContactModal from '../components/safety/EmergencyContactModal';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateUserProfile, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState({ savedCount: 0, tripsCount: 0, checkinsCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [emergencyContactModalOpen, setEmergencyContactModalOpen] = useState(false);

  // Edit Profile State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Change Password State
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoadingStats(true);
    try {
      const [saved, trips, checkins, contact] = await Promise.allSettled([
        savedPlacesApi.getSavedPlaces(),
        tripsApi.getTrips(),
        safetyApi.getUserCheckins(),
        emergencyContactApi.getEmergencyContact(),
      ]);

      setStats({
        savedCount: saved.status === 'fulfilled' ? saved.value.length : 0,
        tripsCount: trips.status === 'fulfilled' ? trips.value.length : 0,
        checkinsCount: checkins.status === 'fulfilled' ? checkins.value.length : 0,
      });

      if (contact.status === 'fulfilled') {
        setEmergencyContact(contact.value || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your SafeTrip Profile</h2>
        <p className="text-xs text-slate-500">Sign in to view your profile details, travel itineraries, and manage security settings.</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      const updated = await authApi.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      if (updateUserProfile) {
        updateUserProfile(updated);
      }
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setProfileSuccessMsg('');
        setEditModalOpen(false);
      }, 1500);
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMsg('Password changed successfully!');
      setTimeout(() => {
        setPasswordSuccessMsg('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setChangePasswordModalOpen(false);
      }, 1500);
    } catch (err) {
      setPasswordErrorMsg(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteEmergencyContact = async () => {
    if (!window.confirm('Are you sure you want to remove your emergency contact?')) return;
    try {
      await emergencyContactApi.deleteEmergencyContact();
      setEmergencyContact(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md border-2 border-white/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{user?.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                SafeTrip Explorer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setChangePasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Account Stats Activity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/trips"
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-400 hover:shadow-card transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">My Itineraries</span>
            <div className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
              {loadingStats ? '-' : stats.tripsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Luggage className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/saved-places"
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-400 hover:shadow-card transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Saved Places</span>
            <div className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
              {loadingStats ? '-' : stats.savedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/safety"
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-400 hover:shadow-card transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Safety Check-ins</span>
            <div className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
              {loadingStats ? '-' : stats.checkinsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Personal Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>Personal Information</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 block mb-0.5">FULL NAME</span>
              <span className="font-semibold text-slate-800 text-sm">{user?.name}</span>
            </div>

            <div>
              <span className="font-bold text-slate-400 block mb-0.5">EMAIL ADDRESS (ACCOUNT ID)</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">{user?.email}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Read-only
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-400 block mb-0.5">PHONE NUMBER</span>
              <span className="font-semibold text-slate-800 text-sm">
                {user?.phone || 'No phone number provided'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Emergency Contact */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Emergency Contact</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              SafeTrip notifies this contact when you send a Safety Check-in or Emergency Alert email.
            </p>

            {emergencyContact ? (
              <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">CONTACT NAME</span>
                  <span className="font-semibold text-slate-800 text-sm">{emergencyContact.contactName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">RELATIONSHIP</span>
                  <span className="font-semibold text-slate-800">{emergencyContact.relationship}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">EMAIL ADDRESS</span>
                  <span className="font-semibold text-slate-800">{emergencyContact.email}</span>
                </div>
                {emergencyContact.phone && (
                  <div>
                    <span className="font-bold text-slate-400 block mb-0.5">PHONE</span>
                    <span className="font-semibold text-slate-800">{emergencyContact.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 text-center">
                No emergency contact configured yet.
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
                  <span>Edit Contact</span>
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
                onClick={() => setEmergencyContactModalOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Emergency Contact</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Security & Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-900">Session & Security</h4>
          <p className="text-xs text-slate-500">Sign out of your active session on this browser.</p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 1. Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile Details" maxWidth="max-w-md">
        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          {profileErrorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Change Password Modal */}
      <Modal isOpen={changePasswordModalOpen} onClose={() => setChangePasswordModalOpen(false)} title="Change Password" maxWidth="max-w-md">
        <form onSubmit={handleChangePassword} className="space-y-3.5">
          {passwordErrorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          {passwordSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setChangePasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Emergency Contact Modal */}
      <EmergencyContactModal
        isOpen={emergencyContactModalOpen}
        onClose={() => setEmergencyContactModalOpen(false)}
        initialData={emergencyContact}
        onSaveSuccess={(saved) => setEmergencyContact(saved)}
      />
    </div>
  );
}
