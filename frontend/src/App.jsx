import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthModal from './components/auth/AuthModal';
import EmergencyModal from './components/safety/EmergencyModal';
import AssistantDrawer from './components/assistant/AssistantDrawer';
import { Sparkles, Bot } from 'lucide-react';

import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import TripsPage from './pages/TripsPage';
import TripDetailsPage from './pages/TripDetailsPage';
import SafetyHubPage from './pages/SafetyHubPage';
import CommunityReportsPage from './pages/CommunityReportsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [assistantDrawerOpen, setAssistantDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onOpenAssistant={() => setAssistantDrawerOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onOpenEmergency={() => setEmergencyModalOpen(true)}
                onOpenAssistant={() => setAssistantDrawerOpen(true)}
              />
            }
          />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/saved-places" element={<SavedPlacesPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:id" element={<TripDetailsPage />} />
          <Route
            path="/safety"
            element={
              <SafetyHubPage
                onOpenEmergency={() => setEmergencyModalOpen(true)}
              />
            }
          />
          <Route path="/reports" element={<CommunityReportsPage />} />
          <Route path="/community-reports" element={<CommunityReportsPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Floating AI Chatbot Button in Bottom Right Corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAssistantDrawerOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-white shadow-2xl hover:shadow-teal-500/30 border border-slate-700/80 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105 active:scale-95"
          title="Ask SafeTrip AI (Itineraries, Foods, Safety & Weather)"
        >
          {/* Glowing pulse ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 opacity-60 group-hover:opacity-100 blur-sm transition duration-300 group-hover:duration-200 animate-pulse pointer-events-none" />

          {/* Inner Content */}
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className="font-black text-xs tracking-tight text-white flex items-center gap-1">
                Ask AI <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-[9px] text-teal-300 font-medium">Assistant</span>
            </div>
          </div>
        </button>
      </div>

      {/* Global Modals & Drawers */}
      <AuthModal />

      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      <AssistantDrawer
        isOpen={assistantDrawerOpen}
        onClose={() => setAssistantDrawerOpen(false)}
      />
    </div>
  );
}
