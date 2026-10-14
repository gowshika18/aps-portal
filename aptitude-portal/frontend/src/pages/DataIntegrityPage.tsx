import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, RefreshCw,
  AlertCircle, FileCheck
} from 'lucide-react';
import { adminService, IntegrityReport } from '../services/admin.service';

export const DataIntegrityPage: React.FC = () => {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.runIntegrityCheck();
      if (res.data.success) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to execute data integrity verification.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'PASS' | 'WARNING' | 'ERROR') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Database & Question Integrity Audit</h1>
              <p className="text-sm text-slate-400">Automated verification of 36 topics, 108 tests, 2,160 questions, schema rules & attempt consistency</p>
            </div>
          </div>

          <button
            onClick={runCheck}
            disabled={loading}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Integrity Audit
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Summary Card */}
        {report && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Overall System Integrity Status:</h2>
                  {getStatusBadge(report.summary.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Last verified at: <span className="text-slate-200 font-mono">{new Date(report.summary.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</span>
                </p>
              </div>

              {/* Counts Badge Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Topics</div>
                  <div className="text-xl font-bold text-slate-100 font-mono">{report.summary.totalTopics} / 36</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">36 Target</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Tests</div>
                  <div className="text-xl font-bold text-slate-100 font-mono">{report.summary.totalTests} / 108</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">3/Topic</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Questions</div>
                  <div className="text-xl font-bold text-slate-100 font-mono">{report.summary.totalQuestions} / 2,160</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">20/Test</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Attempts</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono">{report.summary.totalAttempts}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Historical</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Check List */}
        {report && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-400" /> Granular Verification Checks
              </h3>
              <span className="text-xs text-slate-400">{report.checks.length} Automated Checks</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {report.checks.map((c, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-200">{c.check}</span>
                      {getStatusBadge(c.status)}
                    </div>
                    <p className="text-xs text-slate-400">{c.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading placeholder */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Running transactional database integrity queries...</p>
          </div>
        )}
      </div>
    </div>
  );
};
