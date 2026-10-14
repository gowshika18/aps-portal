import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Users, BookOpen,
  Filter
} from 'lucide-react';
import { adminService } from '../services/admin.service';

export const StaffReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const handleDownload = async (
    reportType: 'student-performance' | 'topic-performance' | 'weekend-activity',
    filename: string
  ) => {
    setDownloading(reportType);
    try {
      let res;
      const params = {
        department: departmentFilter || undefined,
        year: yearFilter ? Number(yearFilter) : undefined,
        section: sectionFilter || undefined,
      };

      if (reportType === 'student-performance') {
        res = await adminService.exportStudentPerformance(params);
      } else if (reportType === 'topic-performance') {
        res = await adminService.exportTopicPerformance(params);
      } else {
        res = await adminService.exportWeekendActivity(params);
      }

      // Create blob link and trigger download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to generate export. Please check server logs.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Staff Reports & Export Intelligence</h1>
              <p className="text-sm text-slate-400">Generate server-side CSV exports for placement department reporting, topic audits & attendance records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-brand-400" /> Export Scope Filters:
          </span>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="IT">Information Tech (IT)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="EEE">Electrical (EEE)</option>
            <option value="MECH">Mechanical (MECH)</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Academic Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        {/* 3 Main Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Student Performance CSV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-brand-500/30 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Student Performance Report</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Overall academic placement metrics per student including roll number, department, tests completed, accuracy, score & attendance.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                <div>• Roll Number, Name, Department</div>
                <div>• Tests & Topics Completed</div>
                <div>• Questions Attempted, Correct, Wrong</div>
                <div>• Overall Accuracy & Score</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={downloading === 'student-performance'}
                onClick={() => handleDownload('student-performance', 'student_performance_report')}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading === 'student-performance' ? 'Generating CSV...' : 'Download Student CSV'}
              </button>
            </div>
          </div>

          {/* Card 2: Topic Performance CSV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Topic Performance Matrix</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Topic-level breakdown for all 36 quantitative and logical topics per student with completion % and scores.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                <div>• Roll Number, Student, Topic</div>
                <div>• Tests Completed (out of 3)</div>
                <div>• Attempted, Correct, Wrong</div>
                <div>• Topic Accuracy & Completion %</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={downloading === 'topic-performance'}
                onClick={() => handleDownload('topic-performance', 'topic_performance_matrix')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading === 'topic-performance' ? 'Generating CSV...' : 'Download Topic CSV'}
              </button>
            </div>
          </div>

          {/* Card 3: Weekend Activity CSV */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Weekend Attendance Log</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological weekend attendance log in Asia/Kolkata timezone with timestamped test submissions.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                <div>• Roll Number, Student Name</div>
                <div>• Date (IST), Day of Week</div>
                <div>• Test Activity Title</div>
                <div>• Daily Questions & Score</div>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={downloading === 'weekend-activity'}
                onClick={() => handleDownload('weekend-activity', 'weekend_attendance_log')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading === 'weekend-activity' ? 'Generating CSV...' : 'Download Attendance CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
