import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { studentService } from '../services/student.service';
import { StudentDetailView } from '../types';
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Activity,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { rollNumber } = useParams<{ rollNumber: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<StudentDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TOPICS' | 'SESSIONS'>('TOPICS');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!rollNumber) return;
      try {
        setIsLoading(true);
        const res = await studentService.getStudentDetails(rollNumber);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load student profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [rollNumber]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back navigation */}
        <div>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Staff Dashboard</span>
          </button>
        </div>

        {isLoading ? (
          <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading candidate records...</p>
          </div>
        ) : error || !data ? (
          <div className="glass-panel rounded-3xl p-8 border border-rose-500/30 text-center">
            <p className="text-sm font-bold text-rose-400">{error || 'Student not found.'}</p>
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="mt-4 px-4 py-2 bg-slate-800 text-xs font-semibold text-white rounded-xl"
            >
              Return to Monitoring Table
            </button>
          </div>
        ) : (
          <>
            {/* Student Profile Header Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20 shrink-0">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">{data.student.name}</h1>
                      {data.student.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Online Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          Offline
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Roll Number: <strong className="text-brand-400 font-mono">{data.student.rollNumber}</strong></span>
                      <span>•</span>
                      <span>{data.student.department}</span>
                      <span>•</span>
                      <span>Year {data.student.year}, Section {data.student.section}</span>
                      <span>•</span>
                      <span>{data.student.email}</span>
                    </div>
                  </div>
                </div>

                {/* Session telemetry summary */}
                <div className="flex flex-wrap gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-500 block font-medium">Last Login</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(data.student.lastLoginAt)}
                    </span>
                  </div>
                  <div className="w-px bg-slate-800 hidden sm:block" />
                  <div className="text-xs">
                    <span className="text-slate-500 block font-medium">Last Active</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-brand-400" />
                      {formatDate(data.student.lastSeenAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Summary Ribbon */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Overall Progress</span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5 block">{data.stats.overallProgress}%</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Topics Completed</span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5 block">{data.stats.topicsCompleted} / {data.stats.totalTopics}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Tests Completed</span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5 block">{data.stats.testsCompleted} / {data.stats.totalTests}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Questions Done</span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5 block">0 / 2160</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('TOPICS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'TOPICS'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
                }`}
              >
                All 36 Curriculum Topics & Test Readiness
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SESSIONS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'SESSIONS'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
                }`}
              >
                Recent Login Sessions ({data.recentSessions.length})
              </button>
            </div>

            {/* Tab 1: 36 Topics Checklist */}
            {activeTab === 'TOPICS' && (
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Syllabus Completion Checklist</h3>
                    <p className="text-xs text-slate-400">
                      Phase 1 baseline: all 36 topics initialized with 0% progress. Phase 2 will record Test 1, 2, 3 submissions.
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                    Phase 1: Tests Not Started
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.topics.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                              t.category === 'QUANTITATIVE'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}
                          >
                            {t.category === 'QUANTITATIVE' ? 'Quant' : 'Logical'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">#{t.displayOrder}</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800 shrink-0 mt-0.5 flex items-center justify-center">
                            {/* Empty checkbox for Phase 1 as requested in wireframe */}
                          </div>
                          <span className="text-xs font-semibold text-slate-200 line-clamp-1">{t.name}</span>
                        </div>
                      </div>

                      {/* Phase 2 Test Placeholders */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">T1: --</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">T2: --</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">T3: --</span>
                        </div>
                        <span className="font-bold text-slate-400">0%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Recent Login Sessions Audit */}
            {activeTab === 'SESSIONS' && (
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Login Session Audit Log</h3>
                  <p className="text-xs text-slate-400">
                    Audit trail showing IP address, login time, and active duration. Sensitive tokens and passwords are never displayed.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3 px-4">Session ID</th>
                        <th className="py-3 px-4">Login Timestamp</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {data.recentSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-slate-900/50">
                          <td className="py-3.5 px-4 font-mono text-slate-400">{session.id.slice(0, 8)}...</td>
                          <td className="py-3.5 px-4 text-slate-300">{formatDate(session.loginAt)}</td>
                          <td className="py-3.5 px-4 text-slate-300">{formatDate(session.lastSeenAt)}</td>
                          <td className="py-3.5 px-4">
                            {session.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Closed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{session.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
