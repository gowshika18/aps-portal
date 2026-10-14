import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, LogOut, ShieldCheck, User as UserIcon,
  BarChart2, HelpCircle, Shield, FileSpreadsheet, FileText,
  Settings, Megaphone, X, Users
} from 'lucide-react';
import { portalService, AnnouncementItem } from '../services/admin.service';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
      if (role === 'STUDENT') {
        loadUnreadNotifications();
      }
    }
  }, [user, role]);

  const loadAnnouncements = async () => {
    try {
      const res = await portalService.getActiveAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (e) {
      // Ignore network errors on background poll
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const res = await portalService.getNotifications(true);
      if (res.data.success) {
        setUnreadNotifCount(res.data.data.length);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.student?.name || user?.staff?.name || user?.username || 'User';
  const displayIdentifier = user?.student?.rollNumber || user?.staff?.staffId || user?.username;

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.includes(a.id)
  );

  return (
    <>
      {/* Active System Announcements Banner */}
      {visibleAnnouncements.length > 0 && (
        <div className="bg-gradient-to-r from-brand-900/90 via-indigo-900/90 to-purple-900/90 border-b border-brand-500/30 text-white px-4 py-2 text-xs backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex-shrink-0 flex items-center gap-1 font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                <Megaphone className="w-3 h-3" /> Notice
              </span>
              <span className="font-semibold text-slate-100">{visibleAnnouncements[0].title}:</span>
              <span className="text-slate-300 truncate">{visibleAnnouncements[0].message}</span>
            </div>
            <button
              onClick={() => setDismissedAnnouncements((prev) => [...prev, visibleAnnouncements[0].id])}
              className="text-slate-400 hover:text-white flex-shrink-0"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">APTITUDE PORTAL</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 5 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">College Placement Training Platform</p>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          <nav className="hidden lg:flex items-center gap-1">
            {role === 'STUDENT' ? (
              <>
                <Link
                  to="/student/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/student/dashboard'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/student/analytics"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/student/analytics'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Performance Analytics
                </Link>
                <Link
                  to="/student/profile"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/student/profile'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" /> Profile & Alerts
                  {unreadNotifCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-brand-400" />
                  )}
                </Link>
              </>
            ) : role === 'STAFF' ? (
              <>
                <Link
                  to="/staff/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/staff/dashboard'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Students
                </Link>
                <Link
                  to="/staff/questions"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/questions'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Questions & Quality
                </Link>
                <Link
                  to="/staff/reports"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/reports'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Reports & CSV
                </Link>
                <Link
                  to="/staff/integrity"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/integrity'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Integrity Check
                </Link>
                <Link
                  to="/staff/audit-logs"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/audit-logs'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Audit Logs
                </Link>
                <Link
                  to="/staff/settings"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/settings'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> Settings
                </Link>
                <Link
                  to="/staff/accounts"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    location.pathname === '/staff/accounts'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Accounts
                </Link>
              </>
            ) : null}
          </nav>

          {/* Right user section */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  {role === 'STAFF' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-brand-400" />
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{displayName}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        role === 'STAFF'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-300 font-mono">{displayIdentifier}</span>
                    <span>•</span>
                    <span>{user.student ? `${user.student.department} (Yr ${user.student.year})` : user.staff?.department || 'Staff'}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Log out of session"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
