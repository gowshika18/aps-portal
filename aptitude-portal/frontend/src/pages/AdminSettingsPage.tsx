import React, { useState, useEffect } from 'react';
import {
  Settings, Megaphone, Plus, Trash2, CheckCircle2, AlertTriangle,
  Sliders, Save, X
} from 'lucide-react';
import { adminService, AnnouncementItem } from '../services/admin.service';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    WEEKEND_TESTING_ENABLED: 'true',
    WEEKLY_TOPIC_TARGET: '1',
    DEFAULT_TEST_DURATION_MINUTES: '30',
    LOW_ACCURACY_THRESHOLD: '60',
    LOW_COMPLETION_THRESHOLD: '100',
    ACTIVITY_TIMEOUT_MINUTES: '15',
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Announcement state
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settRes, annRes] = await Promise.all([
        adminService.getSettings(),
        adminService.getAnnouncements(),
      ]);
      if (settRes.data.success) {
        setSettings(settRes.data.data);
      }
      if (annRes.data.success) {
        setAnnouncements(annRes.data.data);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to load system settings.' });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.updateSettings(settings);
      if (res.data.success) {
        setNotification({ type: 'success', message: 'System settings saved and applied successfully.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.createAnnouncement({
        ...announcementForm,
        startDate: new Date(announcementForm.startDate).toISOString(),
        endDate: new Date(announcementForm.endDate).toISOString(),
      });
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Announcement published successfully!' });
        setShowAddAnnouncement(false);
        setAnnouncementForm({
          title: '',
          message: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          isActive: true,
        });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to create announcement' });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await adminService.deleteAnnouncement(id);
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Announcement removed.' });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to remove announcement.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Announcements</h1>
              <p className="text-sm text-slate-400">Platform thresholds, weekend testing rules, activity windows, and student broadcast announcements</p>
            </div>
          </div>

          {notification && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: SYSTEM SETTINGS FORM */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-400" /> Platform Configuration
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Weekend Testing Toggle */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Weekend Testing Restriction</label>
                  <p className="text-xs text-slate-400 mt-0.5">Enforce testing only on Saturdays and Sundays (Asia/Kolkata)</p>
                </div>
                <select
                  value={settings.WEEKEND_TESTING_ENABLED}
                  onChange={(e) => setSettings({ ...settings, WEEKEND_TESTING_ENABLED: e.target.value })}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
                >
                  <option value="true">Enforced (Sat/Sun Only)</option>
                  <option value="false">Disabled (All Days Allowed)</option>
                </select>
              </div>

              {/* Weekly Topic Target */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Weekly Topic Target</label>
                  <p className="text-xs text-slate-400 mt-0.5">Target number of topics to complete each weekend cycle</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.WEEKLY_TOPIC_TARGET}
                  onChange={(e) => setSettings({ ...settings, WEEKLY_TOPIC_TARGET: e.target.value })}
                  className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 text-center"
                />
              </div>

              {/* Default Test Duration */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Default Test Duration</label>
                  <p className="text-xs text-slate-400 mt-0.5">Standard countdown timer length in minutes (e.g., 30 mins)</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={settings.DEFAULT_TEST_DURATION_MINUTES}
                    onChange={(e) => setSettings({ ...settings, DEFAULT_TEST_DURATION_MINUTES: e.target.value })}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 text-center"
                  />
                  <span className="text-xs text-slate-400">m</span>
                </div>
              </div>

              {/* Low Accuracy Threshold */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Low Accuracy Weak-Area Threshold</label>
                  <p className="text-xs text-slate-400 mt-0.5">Topics below this accuracy % are flagged as Needs Practice</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={settings.LOW_ACCURACY_THRESHOLD}
                    onChange={(e) => setSettings({ ...settings, LOW_ACCURACY_THRESHOLD: e.target.value })}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-amber-400 text-center"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Low Completion Threshold */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Topic Completion Requirement</label>
                  <p className="text-xs text-slate-400 mt-0.5">Threshold % for marking topic as fully mastered</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={settings.LOW_COMPLETION_THRESHOLD}
                    onChange={(e) => setSettings({ ...settings, LOW_COMPLETION_THRESHOLD: e.target.value })}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 text-center"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Activity Timeout */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">Idle Auto-Save Window</label>
                  <p className="text-xs text-slate-400 mt-0.5">Heartbeat synchronization timeout in minutes</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.ACTIVITY_TIMEOUT_MINUTES}
                    onChange={(e) => setSettings({ ...settings, ACTIVITY_TIMEOUT_MINUTES: e.target.value })}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 text-center"
                  />
                  <span className="text-xs text-slate-400">m</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save System Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: SYSTEM ANNOUNCEMENTS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" /> Broadcast Announcements
              </h2>
              <button
                onClick={() => setShowAddAnnouncement(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" /> Publish New
              </button>
            </div>

            {/* Announcements List */}
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                  No broadcast announcements active.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      ann.isActive
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-200 text-sm">{ann.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ann.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {ann.isActive ? 'ACTIVE' : 'EXPIRED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{ann.message}</p>
                        <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-3">
                          <span>Start: {new Date(ann.startDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>End: {new Date(ann.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAddAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" /> New Broadcast Announcement
              </h3>
              <button onClick={() => setShowAddAnnouncement(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weekend Placement Aptitude Mock Test 12"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter notice details for students..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={announcementForm.startDate}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={announcementForm.endDate}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncement(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
