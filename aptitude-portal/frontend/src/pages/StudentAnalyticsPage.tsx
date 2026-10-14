import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2, TrendingUp, Target, Clock, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, ArrowUpDown,
  BookOpen, Layers, RefreshCw, Zap
} from 'lucide-react';
import { portalService } from '../services/admin.service';

type SortField = 'topicName' | 'accuracy' | 'completionPct' | 'avgTimePerTest' | 'correct';
type SortDir = 'asc' | 'desc';

export const StudentAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [weakAreas, setWeakAreas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'weakareas' | 'time'>('overview');
  const [sortField, setSortField] = useState<SortField>('topicName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'QUANTITATIVE' | 'LOGICAL'>('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [analyticsData, weakData] = await Promise.all([
          portalService.getMyAdvancedAnalytics(),
          portalService.getMyWeakAreas(),
        ]);
        setAnalytics(analyticsData);
        setWeakAreas(weakData);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const sortedTopics = useMemo(() => {
    if (!analytics?.topicAnalytics) return [];
    let topics = [...analytics.topicAnalytics];
    if (categoryFilter !== 'ALL') topics = topics.filter((t: any) => t.category === categoryFilter);
    topics.sort((a: any, b: any) => {
      const aVal = a[sortField]; const bVal = b[sortField];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : (aVal ?? 0) - (bVal ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return topics;
  }, [analytics, sortField, sortDir, categoryFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-400" /> : <ChevronDown className="w-3 h-3 text-brand-400" />;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
        <p className="text-slate-400 text-sm">Loading performance data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-rose-400">{error}</p>
      </div>
    </div>
  );

  const overall = analytics?.overall;
  const time = analytics?.timeDistribution;
  const trend = analytics?.weeklyTrend ?? [];

  const timeBars = [
    { label: '< 30 sec', value: time?.lt30 ?? 0, color: 'bg-emerald-500' },
    { label: '30–60 sec', value: time?.t30_60 ?? 0, color: 'bg-blue-500' },
    { label: '60–90 sec', value: time?.t60_90 ?? 0, color: 'bg-amber-500' },
    { label: '90–120 sec', value: time?.t90_120 ?? 0, color: 'bg-orange-500' },
    { label: '> 120 sec', value: time?.gt120 ?? 0, color: 'bg-rose-500' },
  ];
  const maxTimeBar = Math.max(...timeBars.map((b) => b.value), 1);

  const maxTrendVal = Math.max(...trend.map((w: any) => w.testsCompleted), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-brand-400" />
            Performance Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Detailed breakdown of your progress across all 36 topics and 108 tests.
          </p>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-slate-800 space-x-1">
          {([
            { key: 'overview', label: 'Overview', icon: BarChart2 },
            { key: 'topics', label: 'Topic Breakdown', icon: Layers },
            { key: 'weakareas', label: 'Needs Practice', icon: Target },
            { key: 'time', label: 'Time Analysis', icon: Clock },
          ] as any[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === key
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'weakareas' && (weakAreas?.weakAreasCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {weakAreas.weakAreasCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Tests Done', value: overall?.totalTests ?? 0, color: 'text-brand-400' },
                { label: 'Qs Attempted', value: overall?.totalAttempted ?? 0, color: 'text-blue-400' },
                { label: 'Correct', value: overall?.totalCorrect ?? 0, color: 'text-emerald-400' },
                { label: 'Wrong', value: overall?.totalWrong ?? 0, color: 'text-rose-400' },
                { label: 'Unattempted', value: overall?.totalUnattempted ?? 0, color: 'text-amber-400' },
                { label: 'Accuracy', value: `${overall?.overallAccuracy ?? 0}%`, color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
                  <div className={`text-2xl font-extrabold ${color} font-mono`}>{value}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Performance bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" /> Time Stats
                </h3>
                {[
                  { label: 'Avg Score', value: `${overall?.avgScorePercent ?? 0}%` },
                  { label: 'Avg Time / Test', value: `${Math.floor((overall?.avgTimePerTest ?? 0) / 60)}m ${(overall?.avgTimePerTest ?? 0) % 60}s` },
                  { label: 'Avg Time / Question', value: `${overall?.avgTimePerQuestion ?? 0}s` },
                  { label: 'Total Study Time', value: `${Math.floor((overall?.totalTimeSeconds ?? 0) / 3600)}h ${Math.floor(((overall?.totalTimeSeconds ?? 0) % 3600) / 60)}m` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-white font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {/* Weekly trend mini chart */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" /> Tests Per Week
                </h3>
                {trend.length === 0 ? (
                  <p className="text-xs text-slate-500">No weekly data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {trend.slice(-8).map((wk: any) => (
                      <div key={wk.weekLabel} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 w-16 font-mono text-[10px]">{wk.weekLabel}</span>
                        <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded transition-all duration-500"
                            style={{ width: `${(wk.testsCompleted / maxTrendVal) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 w-8 text-right font-mono">{wk.testsCompleted}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TOPICS TAB ── */}
        {activeTab === 'topics' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                {(['ALL', 'QUANTITATIVE', 'LOGICAL'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      categoryFilter === cat
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Topics' : cat === 'QUANTITATIVE' ? 'Quantitative' : 'Logical'}
                  </button>
                ))}
              </div>
            </div>

            {sortedTopics.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No topic data yet. Complete some tests to see analytics.
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('topicName')}>
                          <span className="flex items-center gap-1">Topic <SortIcon field="topicName" /></span>
                        </th>
                        <th className="py-3 px-4 text-center">Tests</th>
                        <th className="py-3 px-4 text-center">Qs Attempted</th>
                        <th className="py-3 px-4 text-center">Correct / Wrong</th>
                        <th className="py-3 px-4 cursor-pointer text-center" onClick={() => handleSort('accuracy')}>
                          <span className="flex items-center justify-center gap-1">Accuracy <SortIcon field="accuracy" /></span>
                        </th>
                        <th className="py-3 px-4 cursor-pointer text-center" onClick={() => handleSort('completionPct')}>
                          <span className="flex items-center justify-center gap-1">Completion <SortIcon field="completionPct" /></span>
                        </th>
                        <th className="py-3 px-4 cursor-pointer text-center" onClick={() => handleSort('avgTimePerTest')}>
                          <span className="flex items-center justify-center gap-1">Avg Time <SortIcon field="avgTimePerTest" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                      {sortedTopics.map((topic: any) => (
                        <tr key={topic.topicId} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{topic.topicName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {topic.category === 'QUANTITATIVE' ? 'Quantitative' : 'Logical'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${topic.isCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {topic.testsCompleted}/3
                            </span>
                            {topic.isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline ml-1" />}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{topic.questionsAttempted}/60</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-emerald-400 font-mono">{topic.correct}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-rose-400 font-mono">{topic.wrong}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold font-mono ${
                              topic.accuracy >= 75 ? 'text-emerald-400'
                              : topic.accuracy >= 50 ? 'text-amber-400'
                              : 'text-rose-400'
                            }`}>
                              {topic.accuracy}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, topic.completionPct)}%` }}
                                />
                              </div>
                              <span className="font-mono text-brand-400">{topic.completionPct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-300">
                            {Math.floor(topic.avgTimePerTest / 60)}m {topic.avgTimePerTest % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WEAK AREAS TAB ── */}
        {activeTab === 'weakareas' && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-300">Practice Recommended</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Topics below {weakAreas?.thresholds?.lowAccuracyThreshold ?? 60}% accuracy or with incomplete tests are listed here.
                  These are based on your recorded test data only.
                </p>
              </div>
            </div>

            {(weakAreas?.weakAreas?.length ?? 0) === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-emerald-400 font-semibold">No weak areas detected!</p>
                <p className="text-slate-400 text-sm">All attempted topics are above the accuracy threshold.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weakAreas.weakAreas.map((area: any) => (
                  <div
                    key={area.topicId}
                    className="glass-card rounded-2xl p-5 border border-amber-500/20 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white">{area.topicName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                          {area.category === 'QUANTITATIVE' ? 'Quantitative' : 'Logical'}
                        </div>
                      </div>
                      <span className={`text-sm font-extrabold font-mono ${
                        area.accuracy === 0 ? 'text-slate-400'
                        : area.accuracy < 40 ? 'text-rose-400'
                        : 'text-amber-400'
                      }`}>
                        {area.accuracy === 0 ? '—' : `${area.accuracy}%`}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Qs Attempted:</span>
                        <span className="text-slate-200 font-mono">{area.questionsAttempted}/60</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="text-slate-200 font-mono">{area.questionsRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tests Done:</span>
                        <span className="text-slate-200 font-mono">{area.testsCompleted}/3</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {area.reasons.map((r: string) => (
                        <span key={r} className="inline-block mr-1 mb-1 px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {r}
                        </span>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">Suggestion: </span>
                      {area.suggestedPracticeArea}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TIME ANALYSIS TAB ── */}
        {activeTab === 'time' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                Question Time Distribution
              </h3>
              {timeBars.every((b) => b.value === 0) ? (
                <p className="text-slate-500 text-sm">No time data recorded yet. Time data requires questions answered with time tracking.</p>
              ) : (
                <div className="space-y-4">
                  {timeBars.map((bar) => (
                    <div key={bar.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium w-24">{bar.label}</span>
                        <span className="text-slate-400 font-mono">{bar.value} Qs</span>
                      </div>
                      <div className="h-5 bg-slate-900 rounded-lg overflow-hidden flex items-center">
                        <div
                          className={`h-full ${bar.color} rounded-lg transition-all duration-700`}
                          style={{ width: `${Math.max((bar.value / maxTimeBar) * 100, bar.value > 0 ? 2 : 0)}%` }}
                        />
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">
                          {maxTimeBar > 0 ? Math.round((bar.value / maxTimeBar) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Avg Time / Question', value: `${overall?.avgTimePerQuestion ?? 0}s`, icon: Clock, color: 'text-blue-400' },
                { label: 'Avg Time / Test', value: `${Math.floor((overall?.avgTimePerTest ?? 0) / 60)}m ${(overall?.avgTimePerTest ?? 0) % 60}s`, icon: Zap, color: 'text-amber-400' },
                { label: 'Total Study Time', value: `${Math.floor((overall?.totalTimeSeconds ?? 0) / 3600)}h ${Math.floor(((overall?.totalTimeSeconds ?? 0) % 3600) / 60)}m`, icon: BookOpen, color: 'text-emerald-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card rounded-2xl p-5 border border-slate-800 text-center space-y-2">
                  <Icon className={`w-6 h-6 ${color} mx-auto`} />
                  <div className={`text-2xl font-extrabold ${color} font-mono`}>{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
