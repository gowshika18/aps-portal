import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { TopicCard } from '../components/TopicCard';
import { TopicModal } from '../components/TopicModal';
import { testService } from '../services/test.service';
import { Topic, StudentDashboardMetrics, MonthlyActivityData } from '../types';
import {
  TrendingUp,
  CheckCircle2,
  Award,
  Layers,
  Search,
  Lock,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Check,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [metrics, setMetrics] = useState<StudentDashboardMetrics | null>(null);
  const [portalStatus, setPortalStatus] = useState<{ isOpen: boolean; message: string } | null>(null);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivityData | null>(null);

  // Month navigation state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'QUANTITATIVE' | 'LOGICAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [topicsData, metricsData, statusData, activityData] = await Promise.all([
        testService.getTopics(),
        testService.getDashboardMetrics(),
        testService.getPortalStatus().catch(() => ({ isOpen: true, message: '' })),
        testService.getMonthlyActivity(selectedYear, selectedMonth).catch(() => null),
      ]);
      setTopics(topicsData);
      setMetrics(metricsData);
      setPortalStatus(statusData);
      setMonthlyActivity(activityData);
    } catch (err: any) {
      setError(err.message || 'Failed to load aptitude test data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load monthly activity on month switch
  const handleMonthChange = async (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setActivityLoading(true);
    try {
      const data = await testService.getMonthlyActivity(year, month);
      setMonthlyActivity(data);
    } catch (err) {
      console.error('Failed to change month activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      handleMonthChange(selectedYear - 1, 12);
    } else {
      handleMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      handleMonthChange(selectedYear + 1, 1);
    } else {
      handleMonthChange(selectedYear, selectedMonth + 1);
    }
  };

  const studentName = user?.student?.name || user?.username || 'Candidate';

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesCategory =
        categoryFilter === 'ALL' ? true : topic.category === categoryFilter;

      const isCompleted = topic.progress === 100;
      const isInProgress = topic.progress > 0 && topic.progress < 100;
      const isNotStarted = topic.progress === 0;

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'COMPLETED'
          ? isCompleted
          : statusFilter === 'IN_PROGRESS'
          ? isInProgress
          : isNotStarted;

      const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [topics, categoryFilter, statusFilter, searchQuery]);

  const quantCount = topics.filter((t) => t.category === 'QUANTITATIVE').length;
  const logicalCount = topics.filter((t) => t.category === 'LOGICAL').length;
  const completedTopicsCount = topics.filter((t) => t.progress === 100).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Candidate Portal
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {user?.student?.rollNumber} • {user?.student?.department} (Year {user?.student?.year}, Sec {user?.student?.section})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {studentName}
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Placement Aptitude Training Curriculum: {topics.length} topics • {metrics?.totalTests ?? 105} tests • {metrics?.totalQuestions ?? 2100} questions.
              </p>
            </div>

            <div className="sm:text-right shrink-0 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Placement Batch</span>
              <span className="text-sm font-bold text-brand-400 font-mono">Class of 2026</span>
            </div>
          </div>

          {/* Portal Availability Alert Banner */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs">
              {error}
            </div>
          )}

          {portalStatus && (
            <div
              className={`mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs rounded-2xl p-3 px-4 ${
                portalStatus.isOpen
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {portalStatus.isOpen ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>
                  <strong>{portalStatus.isOpen ? '🟢 TEST PORTAL OPEN' : '🔒 TEST PORTAL CLOSED'}:</strong>{' '}
                  {portalStatus.message ||
                    (portalStatus.isOpen
                      ? 'You can attend your aptitude tests today.'
                      : 'Tests are available only on Saturday and Sunday (Asia/Kolkata).')}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60 shrink-0">
                Asia/Kolkata Timezone
              </span>
            </div>
          )}
        </div>

        {/* Top 6 Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Overall Progress"
            value={`${metrics?.overallProgress ?? 0}%`}
            subtitle={`${metrics?.questionsAttempted ?? 0} / ${metrics?.totalQuestions ?? 2100} questions`}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Questions Solved"
            value={String(metrics?.questionsAttempted ?? 0)}
            subtitle={`${metrics?.questionsRemaining ?? 2100} remaining`}
            icon={Award}
            color="purple"
          />
          <StatCard
            title="Tests Completed"
            value={`${metrics?.testsCompleted ?? 0} / ${metrics?.totalTests ?? 105}`}
            subtitle={`${metrics?.testsRemaining ?? 105} remaining`}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Topics Mastered"
            value={`${metrics?.topicsCompleted ?? 0} / ${metrics?.totalTopics ?? 35}`}
            subtitle={`${metrics?.topicsRemaining ?? 35} remaining`}
            icon={BookOpen}
            color="indigo"
          />
          <StatCard
            title="Avg Accuracy"
            value={`${metrics?.overallAccuracy ?? 0}%`}
            subtitle="Correct / Attempted"
            icon={Zap}
            color="amber"
          />
          <StatCard
            title="Weekend Attendance"
            value={`${monthlyActivity?.participationPercentage ?? 0}%`}
            subtitle={`${monthlyActivity?.attendedWeekendDays ?? 0} / ${monthlyActivity?.availableWeekendDays ?? 0} days`}
            icon={Calendar}
            color="rose"
          />
        </div>

        {/* Current Weekend Target Banner (Phase 4 Requirement 10) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                  Target: 1 Topic / Week (3 Tests = 60 Questions)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (monthlyActivity?.attendedWeekendDays ?? 0) > 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {(monthlyActivity?.attendedWeekendDays ?? 0) > 0 ? 'ON TRACK' : 'NEEDS PRACTICE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete at least one full topic (3 tests) each weekend to finish the {topics.length}-topic curriculum before placement drives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-xs text-slate-400">Completed Topics</div>
              <div className="text-base font-bold text-white font-mono">
                {completedTopicsCount} / {topics.length} Topics
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
            <div className="text-right">
              <div className="text-xs text-slate-400">Curriculum Coverage</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {metrics?.overallProgress ?? 0}%
              </div>
            </div>
          </div>
        </div>

        {/* WEEKEND ACTIVITY & MONTHLY CALENDAR (Phase 4 Requirements 11 & 12) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <span>Weekend Attendance & Test History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Activity is counted only when actual tests are submitted on Saturday & Sunday (Asia/Kolkata).
              </p>
            </div>

            {/* Month Navigation Control (< October 2026 >) */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={activityLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-200 min-w-32 text-center">
                {monthlyActivity?.monthName || `${selectedMonth}/${selectedYear}`}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={activityLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block">Weekend Participation</span>
              <span className="text-base font-bold text-brand-400 font-mono mt-0.5 block">
                {monthlyActivity?.participationPercentage ?? 0}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block">Days Attended</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {monthlyActivity?.attendedWeekendDays ?? 0} / {monthlyActivity?.totalWeekendDays ?? 0} days
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block">Tests Finished</span>
              <span className="text-base font-bold text-purple-400 font-mono mt-0.5 block">
                {monthlyActivity?.testsCompletedInMonth ?? 0} tests
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block">Questions Solved</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                {monthlyActivity?.questionsAttemptedInMonth ?? 0} Qs
              </span>
            </div>
          </div>

          {/* Weekend Calendar Grid (Saturdays & Sundays) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Weekend Schedule ({monthlyActivity?.monthName})</span>
              <div className="flex items-center gap-3 text-[11px] normal-case font-medium">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Attended
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Missed
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-600" /> Upcoming
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {monthlyActivity?.weekendDays.map((w) => (
                <div
                  key={w.date}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                    w.status === 'ATTENDED'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : w.status === 'MISSED'
                      ? 'bg-slate-900/80 border-amber-500/30'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">
                        {w.dayOfWeek}, {monthlyActivity.monthName.split(' ')[0].slice(0, 3)} {w.dayOfMonth}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.date}</div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        w.status === 'ATTENDED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : w.status === 'MISSED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {w.status === 'ATTENDED' && <Check className="w-3 h-3" />}
                      {w.status}
                    </span>
                  </div>

                  {w.status === 'ATTENDED' ? (
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-emerald-500/20 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tests Completed:</span>
                        <span className="font-bold text-white">{w.testsAttempted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Score & Accuracy:</span>
                        <span className="font-mono text-emerald-400">
                          {w.score} pts ({w.accuracy}%)
                        </span>
                      </div>
                    </div>
                  ) : w.status === 'MISSED' ? (
                    <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400">
                      No test attempts submitted during this weekend window.
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-500">
                      Scheduled weekend testing window.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 36-TOPIC CURRICULUM GRID */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                <span>{topics.length}-Topic Placement Curriculum</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select any topic to view syllabus tests, review past solutions, or start a new test.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    categoryFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({topics.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('QUANTITATIVE')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    categoryFilter === 'QUANTITATIVE'
                      ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Quant ({quantCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('LOGICAL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    categoryFilter === 'LOGICAL'
                      ? 'bg-purple-500/20 text-purple-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Logical ({logicalCount})
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed (100%)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NOT_STARTED">Not Started</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-44"
                />
              </div>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
                />
              ))
            ) : filteredTopics.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                No topics matched your search criteria.
              </div>
            ) : (
              filteredTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => setSelectedTopic(topic)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Topic Details / 3-Test Modal */}
      {selectedTopic && (
        <TopicModal
          topic={selectedTopic}
          onClose={() => {
            setSelectedTopic(null);
            loadData(); // Refresh metrics after closing modal
          }}
          isPortalOpen={portalStatus?.isOpen ?? true}
        />
      )}
    </div>
  );
};
