import React, { useState, useEffect } from 'react';
import {
  Shield, BookOpen, Clock, Bell,
  Award, BarChart2, Target, CheckCheck
} from 'lucide-react';
import { portalService, StudentProfileData, NotificationItem } from '../services/admin.service';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileAndNotifications();
  }, []);

  const loadProfileAndNotifications = async () => {
    setLoading(true);
    try {
      const [profRes, notifRes] = await Promise.all([
        portalService.getMyProfile(),
        portalService.getNotifications(false),
      ]);
      if (profRes.data.success) {
        setProfile(profRes.data.data);
      }
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await portalService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await portalService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-center text-slate-400">
        Profile could not be loaded.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header Profile Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-brand-500/20">
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    STUDENT
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="font-mono text-slate-300 font-semibold">{profile.rollNumber}</span>
                  <span>•</span>
                  <span>{profile.department}</span>
                  <span>•</span>
                  <span>Year {profile.year} (Section {profile.section})</span>
                </div>
              </div>
            </div>

            {/* Academic Identifier Notice */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Academic credentials verified by Institute Registrar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-2">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{profile.stats.overallScore}</div>
            <div className="text-xs text-slate-400 mt-0.5">Overall Score</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{profile.stats.overallAccuracy}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Overall Accuracy</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{profile.stats.topicsCompleted} / 36</div>
            <div className="text-xs text-slate-400 mt-0.5">Topics Mastered</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{profile.stats.testsCompleted} / 108</div>
            <div className="text-xs text-slate-400 mt-0.5">Tests Completed</div>
          </div>
        </div>

        {/* 2-Column Section: Notifications + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Notifications Inbox (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-400" />
                  <h3 className="text-base font-bold text-white">Notifications & Alerts</h3>
                </div>
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No new notifications in inbox.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        n.isRead
                          ? 'bg-slate-950/40 border-slate-900 text-slate-400'
                          : 'bg-slate-950 border-brand-500/30 text-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-200">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                      <span className="text-[10px] text-slate-500 block mt-2">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Log (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Recent Test Activity</h3>
              </div>

              <div className="space-y-2.5">
                {profile.recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No test attempts recorded yet.
                  </div>
                ) : (
                  profile.recentActivity.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{act.testTitle}</div>
                        <div className="text-[11px] text-slate-400">{act.topicName}</div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-bold text-emerald-400 font-mono">{act.accuracy}% Acc</div>
                          <div className="text-[10px] text-slate-400">{act.score} pts</div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                          {new Date(act.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
