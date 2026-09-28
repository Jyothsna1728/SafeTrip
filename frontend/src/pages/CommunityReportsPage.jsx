import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExplore } from '../context/ExploreContext';
import { safetyApi } from '../api';
import CommunityReportModal from '../components/safety/CommunityReportModal';
import { 
  ShieldAlert, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Building2, 
  Navigation, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Compass, 
  Share2,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const CATEGORY_STYLES = {
  'Scam': { bg: 'bg-amber-100 text-amber-900 border-amber-200', icon: '⚠️' },
  'Unsafe Area': { bg: 'bg-red-100 text-red-900 border-red-200', icon: '⛔' },
  'Road Issue': { bg: 'bg-orange-100 text-orange-900 border-orange-200', icon: '🚧' },
  'Tourist Trap': { bg: 'bg-purple-100 text-purple-900 border-purple-200', icon: '🪤' },
  'Pickpocket Alert': { bg: 'bg-rose-100 text-rose-900 border-rose-200', icon: '🚨' },
  'Other': { bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: 'ℹ️' },
};

export default function CommunityReportsPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { exploreLocation } = useExplore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'all' | 'destination' | 'my'
  const initialTab = searchParams.get('tab') === 'my' || searchParams.get('tab') === 'my-reports' ? 'my' : 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals & Feedback
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'my' || tabParam === 'my-reports') {
      setActiveTab('my');
    }
  }, [searchParams]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [allCommunity, myReps] = await Promise.all([
        safetyApi.getActiveReports(),
        isAuthenticated ? safetyApi.getUserReports().catch(() => []) : Promise.resolve([]),
      ]);
      setReports(allCommunity || []);
      setUserReports(myReps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [isAuthenticated]);

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    setDeletingId(reportId);
    try {
      await safetyApi.deleteReport(reportId);
      setFeedback({ type: 'success', msg: 'Report deleted successfully.' });
      setUserReports((prev) => prev.filter((r) => r.id !== reportId));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to delete report.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyReport = (report) => {
    const text = `⚠️ SafeTrip Safety Alert: ${report.category}\n👤 Reported by @${report.username || 'Traveler'}\n📍 ${[report.exactPlace, report.area, report.city].filter(Boolean).join(', ')}\n${report.description}`;
    navigator.clipboard.writeText(text);
    setFeedback({ type: 'success', msg: 'Report summary copied to clipboard!' });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 2500);
  };

  // Filter logic
  const currentCityName = exploreLocation?.name || '';

  const getSourceList = () => {
    if (activeTab === 'my') return userReports;
    if (activeTab === 'destination' && currentCityName) {
      const c = currentCityName.toLowerCase();
      return reports.filter((r) => 
        (r.city && r.city.toLowerCase().includes(c)) ||
        (r.locationName && r.locationName.toLowerCase().includes(c)) ||
        (r.area && r.area.toLowerCase().includes(c))
      );
    }
    return reports;
  };

  const filteredReports = getSourceList().filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.userFullName && r.userFullName.toLowerCase().includes(q)) ||
      (r.city && r.city.toLowerCase().includes(q)) ||
      (r.area && r.area.toLowerCase().includes(q)) ||
      (r.exactPlace && r.exactPlace.toLowerCase().includes(q))
    );
  });

  const categoriesList = ['ALL', 'Scam', 'Unsafe Area', 'Road Issue', 'Tourist Trap', 'Pickpocket Alert', 'Other'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Crowdsourced Safety Intelligence</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Community Safety Reports
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time hazard alerts, scams, tourist traps, and safe travel notices shared by travelers and local explorers worldwide.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal('login');
                else setReportModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Report</span>
            </button>
            
            <Link
              to="/safety"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur transition-all border border-white/10"
            >
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Safety Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.msg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchParams({});
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>All Reports</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-slate-800 text-teal-300' : 'bg-slate-200 text-slate-700'}`}>
              {reports.length}
            </span>
          </button>

          {currentCityName && (
            <button
              onClick={() => {
                setActiveTab('destination');
                setSearchParams({ destination: currentCityName });
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'destination'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-teal-300" />
              <span>In {currentCityName}</span>
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={() => {
                setActiveTab('my');
                setSearchParams({ tab: 'my' });
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'my'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Reports</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'my' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {userReports.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by keyword, @username, or place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading community reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">
              {activeTab === 'my'
                ? "You haven't posted any reports yet."
                : "No matching community safety reports found."}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {activeTab === 'my'
                ? "Help keep other travelers safe! Notice a scam, overcharging tout, or hazard? Post a report below."
                : "Try clearing your search filters or submit the first safety report for this area."}
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal('login');
              else setReportModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post Safety Report</span>
          </button>
        </div>
      ) : (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const author = report.username || report.userFullName || 'SafeTrip Explorer';
            const authorInitial = author.charAt(0).toUpperCase();
            const isOwner = user && (report.userId === user.id || report.username === user.username || report.username === user.email);
            const style = CATEGORY_STYLES[report.category] || CATEGORY_STYLES['Other'];

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group relative"
              >
                <div className="space-y-3">
                  
                  {/* Submitter User Profile Attribution Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                        {authorInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-900 truncate">
                            @{author}
                          </span>
                          {isOwner && (
                            <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded border border-teal-200 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>
                            {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hazard Category Badge */}
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${style.bg}`}>
                      <span>{style.icon}</span>
                      <span>{report.category}</span>
                    </span>
                  </div>

                  {/* Location Hierarchical Pills */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                    {report.exactPlace && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                        <Navigation className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{report.exactPlace}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                      {report.area && (
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{report.area}</span>
                        </div>
                      )}
                      
                      {report.city && (
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-500">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{report.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {report.description}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleCopyReport(report)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-teal-700 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Details</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={deletingId === report.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors"
                      title="Delete your report"
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Delete</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Community Report Submission Modal */}
      <CommunityReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onReportSuccess={fetchReports}
      />

    </div>
  );
}
