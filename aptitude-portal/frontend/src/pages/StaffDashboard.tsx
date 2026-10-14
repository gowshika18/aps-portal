import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { studentService } from '../services/student.service';
import {
  StaffDashboardStats,
  StudentListItem,
  StudentDetailView,
  BatchAnalyticsData,
  LiveMonitoringData,
  PortalControlData,
} from '../types';
import {
  Users,
  Radio,
  FileCheck,
  Percent,
  Search,
  RefreshCw,
  ChevronRight,
  Shield,
  Clock,
  BarChart3,
  Activity,
  Layers,
  Sliders,
  Download,
  Lock,
  Unlock,
  Calendar,
  X,
  Zap,
  BookOpen,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ANALYTICS' | 'MONITORING'>('STUDENTS');
  const [stats, setStats] = useState<StaffDashboardStats>({
    totalStudents: 0,
    activeNow: 0,
    testsAttempted: 0,
    averageScore: 0,
    averageAccuracy: 0,
  });
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [analytics, setAnalytics] = useState<BatchAnalyticsData | null>(null);
  const [monitoring, setMonitoring] = useState<LiveMonitoringData | null>(null);
  const [portalConfig, setPortalConfig] = useState<PortalControlData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search for Students Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modal States
  const [selectedStudentRoll, setSelectedStudentRoll] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailView | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showPortalModal, setShowPortalModal] = useState(false);
  const [selectedPortalMode, setSelectedPortalMode] = useState<
    'AUTOMATIC_WEEKEND' | 'MANUAL_OPEN' | 'MANUAL_CLOSED'
  >('AUTOMATIC_WEEKEND');
  const [portalNote, setPortalNote] = useState('');
  const [savingPortalMode, setSavingPortalMode] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, studentsData, analyticsData, monitoringData, portalData] = await Promise.all([
        studentService.getStaffStats(),
        studentService.getAllStudents(),
        studentService.getBatchAnalytics(),
        studentService.getLiveMonitoring(),
        studentService.getPortalControl(),
      ]);
      setStats(statsData);
      setStudents(studentsData);
      setAnalytics(analyticsData);
      setMonitoring(monitoringData);
      setPortalConfig(portalData);
      setSelectedPortalMode(portalData.mode);
      setPortalNote(portalData.note || '');
    } catch (err) {
      console.error('Failed to load staff dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-poll every 20 seconds for live monitoring updates
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleOpenStudentModal = async (rollNumber: string) => {
    setSelectedStudentRoll(rollNumber);
    setLoadingDetail(true);
    try {
      const detail = await studentService.getStudentDetails(rollNumber);
      setStudentDetail(detail);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseStudentModal = () => {
    setSelectedStudentRoll(null);
    setStudentDetail(null);
  };

  const handleSavePortalControl = async () => {
    setSavingPortalMode(true);
    try {
      const updated = await studentService.updatePortalControl(selectedPortalMode, portalNote);
      setPortalConfig(updated);
      setShowPortalModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to update portal mode:', err);
    } finally {
      setSavingPortalMode(false);
    }
  };

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : statusFilter === 'ONLINE' ? s.isOnline : !s.isOnline;
      const matchesDept = deptFilter === 'ALL' ? true : s.department === deptFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q);
      return matchesStatus && matchesDept && matchesSearch;
    });
  }, [students, statusFilter, deptFilter, searchQuery]);

  // CSV Export for Candidates
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Name',
      'Department',
      'Year',
      'Section',
      'Status',
      'Tests Completed',
      'Topics Completed',
      'Questions Attempted',
      'Accuracy (%)',
      'Average Score (%)',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      s.year,
      `"${s.section}"`,
      s.status,
      s.testsCompleted,
      s.topicsCompleted,
      s.questionsAttempted,
      s.accuracy,
      s.averageScore,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aptitude_portal_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const staffName = user?.staff?.name || user?.username || 'Staff Member';

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Portal Control Panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Staff Authority
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {user?.staff?.staffId} • {user?.staff?.department}
                </span>

                {/* Portal Status Pill */}
                {portalConfig && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                      portalConfig.isOpen
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {portalConfig.isOpen ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-400" /> Tests Accessible
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-400" /> Tests Locked
                      </>
                    )}
                    <span className="text-[10px] opacity-75 font-mono">
                      ({portalConfig.mode === 'AUTOMATIC_WEEKEND' ? 'Auto Weekend' : portalConfig.mode === 'MANUAL_OPEN' ? 'Manual Open' : 'Manual Closed'})
                    </span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Staff Control & Analytics Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Welcome back, {staffName}. Real-time oversight for batch performance across 36 topics, active test sessions, and portal access configuration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Portal Mode Configuration Button */}
              <button
                type="button"
                onClick={() => setShowPortalModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-brand-500/20"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Portal Access</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top 4 Real-Time Aggregate Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Candidates"
            value={stats.totalStudents}
            subtitle="Registered for placements"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Now"
            value={stats.activeNow}
            subtitle="Online past 10 minutes"
            icon={Radio}
            color="emerald"
          />
          <StatCard
            title="Tests Completed"
            value={stats.testsAttempted}
            subtitle="Submitted across 36 topics"
            icon={FileCheck}
            color="purple"
          />
          <StatCard
            title="Batch Avg Score"
            value={`${stats.averageScore}%`}
            subtitle={`Avg Accuracy: ${stats.averageAccuracy ?? 0}%`}
            icon={Percent}
            color="amber"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'STUDENTS'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Registry ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Batch Analytics & Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MONITORING')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'MONITORING'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Test Proctoring ({monitoring?.activeTestsCount ?? 0})</span>
            {(monitoring?.activeTestsCount ?? 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: Candidate Registry */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Roll No, Name, or Department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Department Filter */}
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ONLINE')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('OFFLINE')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'OFFLINE' ? 'bg-slate-800 text-slate-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Offline
                  </button>
                </div>

                {/* CSV Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold transition-all"
                  title="Export filtered list to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                      <th className="py-3.5 px-4">Dept & Batch</th>
                      <th className="py-3.5 px-4">Session Status</th>
                      <th className="py-3.5 px-4 text-center">Tests Finished</th>
                      <th className="py-3.5 px-4">Syllabus Progress</th>
                      <th className="py-3.5 px-4 text-right">Avg Score</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
                          Loading candidate database...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No candidates matched your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenStudentModal(s.rollNumber)}
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-semibold text-white group-hover:text-brand-300 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {s.rollNumber} • {s.email}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-200">{s.department}</div>
                            <div className="text-[11px] text-slate-500">
                              Year {s.year} • Sec {s.section}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {s.isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {formatRelativeTime(s.lastSeenAt)}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-white">{s.testsCompleted}</span>
                            <span className="text-slate-500 text-[11px]"> / 108</span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {s.topicsCompleted} / 36 topics
                            </div>
                          </td>

                          <td className="py-4 px-4 w-44">
                            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                              <span className="text-slate-400">{s.questionsAttempted} / 2160 Qs</span>
                              <span className="font-semibold text-brand-400">{s.overallProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, s.overallProgress)}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="font-bold text-white">{s.averageScore}%</div>
                            <div className="text-[10px] text-slate-400">
                              Acc: <span className="text-emerald-400 font-mono">{s.accuracy}%</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentModal(s.rollNumber);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-brand-600/30 text-slate-400 hover:text-brand-300 border border-slate-700/60 transition-all inline-flex items-center gap-1"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Batch Analytics & 36-Topic Heatmap */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div className="space-y-8">
            {/* Category Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Quantitative Aptitude</h3>
                      <p className="text-xs text-slate-400">20 Topics • 60 Tests • 1,200 Questions</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-blue-400">
                    {analytics.categoryStats.quantitative.averageScore}%
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Total Attempts Recorded:</span>
                    <span className="font-semibold text-white">
                      {analytics.categoryStats.quantitative.attemptsCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Average Performance Benchmark:</span>
                    <span className="font-semibold text-blue-300">
                      {analytics.categoryStats.quantitative.averageScore}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Logical Reasoning</h3>
                      <p className="text-xs text-slate-400">16 Topics • 48 Tests • 960 Questions</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-purple-400">
                    {analytics.categoryStats.logical.averageScore}%
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Total Attempts Recorded:</span>
                    <span className="font-semibold text-white">
                      {analytics.categoryStats.logical.attemptsCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Average Performance Benchmark:</span>
                    <span className="font-semibold text-purple-300">
                      {analytics.categoryStats.logical.averageScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Comparison Grid */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <span>Departmental Participation & Performance</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.departmentStats.map((d) => (
                  <div
                    key={d.department}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{d.department}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {d.averageScore}% Avg
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Candidates:</span>
                        <span className="text-slate-200 font-semibold">{d.totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Participants:</span>
                        <span className="text-slate-200 font-semibold">{d.participatingStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tests Submitted:</span>
                        <span className="text-slate-200 font-semibold">{d.totalAttempts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 36 Topics Matrix Heatmap */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>36-Topic Performance Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aggregated scores and attempt density across the entire aptitude curriculum
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {analytics.topicMatrix.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-snug line-clamp-1">
                        {t.name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          t.averageScore >= 75
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : t.averageScore >= 50
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : t.averageScore > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/40'
                        }`}
                      >
                        {t.averageScore > 0 ? `${t.averageScore}%` : 'Unattempted'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{t.category === 'QUANTITATIVE' ? 'Quant' : 'Logical'}</span>
                      <span>{t.attemptsCount} attempts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Live Test Monitoring & Proctoring */}
        {activeTab === 'MONITORING' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Active Test Sessions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live telemetry for candidates currently writing aptitude tests
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {monitoring?.activeTestsCount ?? 0} In Progress
                </span>
              </div>

              {!monitoring || monitoring.activeTests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No active test sessions in progress at this moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monitoring.activeTests.map((act) => (
                    <div
                      key={act.attemptId}
                      className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{act.studentName}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {act.rollNumber} • {act.department}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(act.remainingSeconds / 60)}m {act.remainingSeconds % 60}s
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-400">Topic & Test:</span>
                          <span className="text-brand-300">
                            {act.topicName} – Test {act.testNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Answered Questions:</span>
                          <span className="text-slate-200 font-semibold font-mono">
                            {act.answeredCount} / {act.totalQuestions}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Currently Online Candidates */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Online Candidates Past 10 Minutes ({monitoring?.onlineCount ?? 0})</span>
              </h3>

              {!monitoring || monitoring.onlineStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No online candidate sessions recorded in the last 10 minutes.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {monitoring.onlineStudents.map((stu) => (
                    <div
                      key={stu.rollNumber}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">{stu.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {stu.rollNumber} • {stu.department}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentRoll && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {studentDetail?.student.name || 'Candidate Portfolio'}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {studentDetail?.student.rollNumber} • {studentDetail?.student.department} • Year{' '}
                  {studentDetail?.student.year} Sec {studentDetail?.student.section}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseStudentModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" />
                  Fetching full candidate records...
                </div>
              ) : !studentDetail ? (
                <div className="py-16 text-center text-rose-400">Failed to load student portfolio.</div>
              ) : (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400">Tests Completed</div>
                      <div className="text-lg font-bold text-white mt-1">
                        {studentDetail.stats.testsCompleted} / {studentDetail.stats.totalTests}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400">Topics Mastered</div>
                      <div className="text-lg font-bold text-brand-400 mt-1">
                        {studentDetail.stats.topicsCompleted} / {studentDetail.stats.totalTopics}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400">Questions Attempted</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">
                        {studentDetail.stats.questionsAttempted} / 2160
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400">Overall Accuracy</div>
                      <div className="text-lg font-bold text-amber-400 mt-1">
                        {studentDetail.stats.overallAccuracy}%
                      </div>
                    </div>
                  </div>

                  {/* 36 Topics Progress Breakdown */}
                  <div>
                    <h4 className="font-bold text-white text-sm mb-3">Topic-Wise Test Records</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {studentDetail.topics.map((top) => (
                        <div
                          key={top.id}
                          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{top.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                top.isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {top.completedTestsCount}/3 Tests
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                            {top.tests.map((t) => (
                              <div
                                key={t.id}
                                className={`p-1.5 rounded border ${
                                  t.isSubmitted
                                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                                }`}
                              >
                                <div>Test {t.testNumber}</div>
                                <div className="font-bold mt-0.5">
                                  {t.isSubmitted ? `${t.score}/20` : '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PORTAL ACCESS CONTROL MODAL */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-400" />
                <span>Portal Accessibility Configuration</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Choose the operating schedule for aptitude tests across all 36 topics.
              </p>

              {/* Mode Options */}
              <div className="space-y-2.5">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPortalMode === 'AUTOMATIC_WEEKEND'
                      ? 'bg-brand-500/10 border-brand-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="portalMode"
                    value="AUTOMATIC_WEEKEND"
                    checked={selectedPortalMode === 'AUTOMATIC_WEEKEND'}
                    onChange={() => setSelectedPortalMode('AUTOMATIC_WEEKEND')}
                    className="mt-0.5 text-brand-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" /> Automatic Weekend Schedule (Default)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Tests automatically unlock exclusively on Saturday & Sunday (Asia/Kolkata timezone).
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPortalMode === 'MANUAL_OPEN'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="portalMode"
                    value="MANUAL_OPEN"
                    checked={selectedPortalMode === 'MANUAL_OPEN'}
                    onChange={() => setSelectedPortalMode('MANUAL_OPEN')}
                    className="mt-0.5 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Manual Unlock (Any Day)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Forces the portal open immediately for mock drives, evaluations, or test preparation.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPortalMode === 'MANUAL_CLOSED'
                      ? 'bg-rose-500/10 border-rose-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="portalMode"
                    value="MANUAL_CLOSED"
                    checked={selectedPortalMode === 'MANUAL_CLOSED'}
                    onChange={() => setSelectedPortalMode('MANUAL_CLOSED')}
                    className="mt-0.5 text-rose-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                      <Lock className="w-3.5 h-3.5 text-rose-400" /> Manual Lock
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Temporarily disables all test attempts for system maintenance or administrative freeze.
                    </div>
                  </div>
                </label>
              </div>

              {/* Custom Note */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Notice Banner for Candidates (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g., Mock Drive Active: Portal open until 6:00 PM today."
                  value={portalNote}
                  onChange={(e) => setPortalNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPortalModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePortalControl}
                disabled={savingPortalMode}
                className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {savingPortalMode ? 'Saving...' : 'Apply Portal Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
