import React from 'react';
import { Shield, MapPin, Heart, Compass, ShieldAlert, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  const supportEmail = 'jyothsnamuvvala07@gmail.com';
  const userName = isAuthenticated && user?.name ? user.name : '';
  const userEmail = isAuthenticated && user?.email ? user.email : '';

  const emailSubject = 'SafeTrip - Contact Request';
  const emailBody = `Hi SafeTrip Team,\n\nName: ${userName}\nEmail: ${userEmail}\n\nMessage:\n\n\nThank you,\n${userName || 'SafeTrip User'}`;

  // Gmail Web Compose Link (opens directly in Gmail)
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  // Standard mailto fallback
  const mailtoUrl = `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleContactClick = (e) => {
    e.preventDefault();
    // Try opening Gmail Web in a new tab first
    const newWindow = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback to mailto if popups are blocked
      window.location.href = mailtoUrl;
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">SafeTrip</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Your smart travel discovery and safety companion. Explore destinations, discover real attractions, hotels, restaurants, hospitals, and police stations, and stay prepared anywhere in the world.
            </p>
            <div className="text-xs text-slate-500 font-medium space-y-1">
              <p>• Explore real destinations worldwide</p>
              <p>• Emergency discovery powered by interactive maps</p>
              <p>• Verified contact and navigation details</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Explore & Plan</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/explore" className="hover:text-teal-400 transition-colors">Explore Destination</Link></li>
              <li><Link to="/trips" className="hover:text-teal-400 transition-colors">My Trips & Itinerary</Link></li>
              <li><Link to="/saved-places" className="hover:text-teal-400 transition-colors">Saved Places</Link></li>
              <li><Link to="/safety" className="hover:text-teal-400 transition-colors">Safety Hub</Link></li>
              <li>
                <a
                  href={gmailUrl}
                  onClick={handleContactClick}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-400 transition-colors flex items-center gap-1.5 text-teal-300 font-medium cursor-pointer"
                  title="Open Contact Form in Gmail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Us</span>
                  <ExternalLink className="w-2.5 h-2.5 text-teal-400/70" />
                </a>
              </li>
            </ul>
          </div>

          {/* Safety Principles */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Safety & Emergency</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-red-400" /> <span>Hospital Discovery</span></li>
              <li className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-400" /> <span>Police Stations</span></li>
              <li className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-400" /> <span>Community Reports</span></li>
              <li className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-teal-400" /> <span>Safety Check-ins</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SafeTrip. Explore. Travel. Stay Safe.</p>
          <div className="flex items-center gap-4">
            <a
              href={gmailUrl}
              onClick={handleContactClick}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Contact Support ({supportEmail})
            </a>
            <span>•</span>
            <p>Powered by Google Maps Platform, React & Spring Boot.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
