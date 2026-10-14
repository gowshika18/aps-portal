import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle, Plus, Upload, Search, AlertTriangle,
  CheckCircle, XCircle, Edit2, Eye, Trash2, Sliders, RefreshCw,
  Copy, Layers, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { adminService, QuestionItem, QuestionDuplicate } from '../services/admin.service';

export const QuestionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import' | 'duplicates' | 'testConfig'>('list');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topicsTests, setTopicsTests] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Modals & form state
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<QuestionItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Question Form
  const [addForm, setAddForm] = useState({
    topicId: '',
    testId: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    difficulty: 'HARD',
    marks: 1,
  });

  // Edit Question Form
  const [editForm, setEditForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    difficulty: 'HARD',
    marks: 1,
    changeReason: '',
  });

  // Bulk Import
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<{ loading: boolean; result?: any; error?: string }>({ loading: false });

  // Duplicates
  const [duplicates, setDuplicates] = useState<QuestionDuplicate[]>([]);
  const [dupThreshold, setDupThreshold] = useState(0.85);
  const [dupLoading, setDupLoading] = useState(false);

  // Test Config Form
  const [selectedTestForConfig, setSelectedTestForConfig] = useState('');
  const [testConfigForm, setTestConfigForm] = useState({
    title: '',
    durationMinutes: 30,
    isActive: true,
  });

  // Load topics and tests
  useEffect(() => {
    loadTopicsTests();
  }, []);

  // Load questions when tab/filters change
  useEffect(() => {
    if (activeTab === 'list') {
      loadQuestions();
    } else if (activeTab === 'duplicates') {
      loadDuplicates();
    }
  }, [activeTab, page, selectedTopic, selectedTest, selectedDifficulty]);

  const loadTopicsTests = async () => {
    try {
      const res = await adminService.getTopicsAndTests();
      if (res.data.success) {
        setTopicsTests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load topics and tests', err);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await adminService.getQuestions({
        page,
        limit: 15,
        search: search.trim() || undefined,
        topicId: selectedTopic || undefined,
        testId: selectedTest || undefined,
        difficulty: selectedDifficulty || undefined,
      });
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        setTotalQuestions(res.data.data.pagination.total);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  const loadDuplicates = async () => {
    setDupLoading(true);
    try {
      const res = await adminService.detectDuplicates(dupThreshold);
      if (res.data.success) {
        setDuplicates(res.data.data.duplicates);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Duplicate scan failed' });
    } finally {
      setDupLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQuestions();
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.addQuestion(addForm);
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Question created successfully!' });
        setAddForm({
          topicId: '',
          testId: '',
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          explanation: '',
          difficulty: 'HARD',
          marks: 1,
        });
        setActiveTab('list');
        loadQuestions();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to add question' });
    }
  };

  const handleOpenEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditForm({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      marks: q.marks,
      changeReason: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      const res = await adminService.editQuestion(editingQuestion.id, editForm);
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Question updated with new version successfully!' });
        setEditingQuestion(null);
        loadQuestions();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update question' });
    }
  };

  const handleToggleActive = async (q: QuestionItem) => {
    try {
      const res = await adminService.deactivateQuestion(q.id, !q.isActive);
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Question ${q.isActive ? 'deactivated' : 'activated'} successfully.`
        });
        loadQuestions();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const handleBulkImport = async () => {
    try {
      setImportStatus({ loading: true });
      const parsed = JSON.parse(importJson);
      const res = await adminService.bulkImport(parsed);
      setImportStatus({ loading: false, result: res.data.data });
      setNotification({ type: 'success', message: res.data.message });
      loadQuestions();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid JSON format';
      setImportStatus({ loading: false, error: msg });
      setNotification({ type: 'error', message: msg });
    }
  };

  const handleSaveTestConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForConfig) return;
    try {
      const res = await adminService.updateTestConfig(selectedTestForConfig, {
        title: testConfigForm.title,
        durationMinutes: Number(testConfigForm.durationMinutes),
        isActive: testConfigForm.isActive,
      });
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Test configuration updated successfully!' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update test config' });
    }
  };

  const availableTests = useMemo(() => {
    if (!addForm.topicId) return [];
    const topic = topicsTests.find((t) => t.id === addForm.topicId);
    return topic ? topic.tests : [];
  }, [addForm.topicId, topicsTests]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Question Bank & Quality Management</h1>
                  <p className="text-sm text-slate-400">Staff Question Management, Quality Metrics, Versioning & Bulk Operations</p>
                </div>
              </div>
            </div>

            {/* Notification alert */}
            {notification && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium animate-fade-in ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{notification.message}</span>
                <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'list'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Question Quality Analytics ({totalQuestions})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'add'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Question
              </span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'import'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Bulk JSON Import
              </span>
            </button>

            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'duplicates'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Duplicate Detection
              </span>
            </button>

            <button
              onClick={() => setActiveTab('testConfig')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'testConfig'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Test Configuration
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: QUESTION QUALITY & LIST */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search question text or explanation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-all"
                >
                  Search
                </button>
              </form>

              {/* Topic & Test dropdown filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedTopic}
                  onChange={(e) => { setSelectedTopic(e.target.value); setSelectedTest(''); setPage(1); }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Topics (36)</option>
                  {topicsTests.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="VERY_HARD">Very Hard</option>
                </select>

                <button
                  onClick={() => { setSearch(''); setSelectedTopic(''); setSelectedTest(''); setSelectedDifficulty(''); setPage(1); loadQuestions(); }}
                  title="Reset filters"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Q# / Topic / Test</th>
                      <th className="py-3 px-4 max-w-xs">Question Preview</th>
                      <th className="py-3 px-3 text-center">Difficulty</th>
                      <th className="py-3 px-3 text-center">Attempts</th>
                      <th className="py-3 px-3 text-center">Correct</th>
                      <th className="py-3 px-3 text-center">Wrong</th>
                      <th className="py-3 px-3 text-center">Accuracy</th>
                      <th className="py-3 px-3 text-center">Avg Time</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <p>Loading questions quality metrics...</p>
                        </td>
                      </tr>
                    ) : questions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          No questions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">Q#{q.questionNumber}</div>
                            <div className="text-[11px] text-slate-400">{q.test?.topic?.name || 'Unknown Topic'}</div>
                            <div className="text-[10px] text-indigo-400 font-medium">{q.test?.title || `Test #${q.test?.testNumber}`}</div>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="line-clamp-2 text-slate-300 font-medium">{q.questionText}</p>
                            <span className="text-[10px] text-slate-500">Marks: {q.marks} | Correct: Option {q.correctOption}</span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              q.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-slate-300">{q.stats.attempts}</td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-400">{q.stats.correct}</td>
                          <td className="py-3 px-3 text-center font-mono text-rose-400">{q.stats.wrong}</td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="font-semibold font-mono text-slate-200">{q.stats.accuracy}%</div>
                            <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className={`h-full ${
                                  q.stats.accuracy >= 70 ? 'bg-emerald-500' :
                                  q.stats.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${q.stats.accuracy}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {q.stats.avgTimeSeconds > 0 ? `${q.stats.avgTimeSeconds}s` : '—'}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {q.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingQuestion(q)}
                                title="View Question Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(q)}
                                title="Edit Question"
                                className="p-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleActive(q)}
                                title={q.isActive !== false ? 'Deactivate Question' : 'Activate Question'}
                                className={`p-1.5 rounded-lg transition-all ${
                                  q.isActive !== false
                                    ? 'bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white'
                                    : 'bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="py-3 px-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Showing Page <span className="font-semibold text-slate-200">{page}</span> of <span className="font-semibold text-slate-200">{totalPages}</span> ({totalQuestions} Total Questions)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 flex items-center gap-1 transition-all"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD QUESTION */}
        {activeTab === 'add' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-4xl mx-auto shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" /> Add New Test Question
            </h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Topic *</label>
                  <select
                    required
                    value={addForm.topicId}
                    onChange={(e) => setAddForm({ ...addForm, topicId: e.target.value, testId: '' })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Topic...</option>
                    {topicsTests.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Test *</label>
                  <select
                    required
                    disabled={!addForm.topicId}
                    value={addForm.testId}
                    onChange={(e) => setAddForm({ ...addForm, testId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">Select Test...</option>
                    {availableTests.map((test: any) => (
                      <option key={test.id} value={test.id}>{test.title || `Test #${test.testNumber}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={addForm.questionText}
                  onChange={(e) => setAddForm({ ...addForm, questionText: e.target.value })}
                  placeholder="Enter the full question problem statement..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={addForm.optionA}
                    onChange={(e) => setAddForm({ ...addForm, optionA: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={addForm.optionB}
                    onChange={(e) => setAddForm({ ...addForm, optionB: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    value={addForm.optionC}
                    onChange={(e) => setAddForm({ ...addForm, optionC: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    value={addForm.optionD}
                    onChange={(e) => setAddForm({ ...addForm, optionD: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Correct Option *</label>
                  <select
                    value={addForm.correctOption}
                    onChange={(e) => setAddForm({ ...addForm, correctOption: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:border-brand-500"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Difficulty *</label>
                  <select
                    value={addForm.difficulty}
                    onChange={(e) => setAddForm({ ...addForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="VERY_HARD">Very Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Marks *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={addForm.marks}
                    onChange={(e) => setAddForm({ ...addForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Explanation & Step-by-Step Solution</label>
                <textarea
                  rows={3}
                  value={addForm.explanation}
                  onChange={(e) => setAddForm({ ...addForm, explanation: e.target.value })}
                  placeholder="Provide pedagogical rationale..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20"
                >
                  Create Question
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: BULK JSON IMPORT */}
        {activeTab === 'import' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-4xl mx-auto shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" /> Bulk Question Import (JSON)
              </h2>
              <p className="text-sm text-slate-400">
                Import complete test sets of 20 questions with transactional integrity. If any question fails validation, the entire batch rolls back.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">JSON Batch Payload</label>
                <button
                  onClick={() => {
                    const sample = {
                      topic: "Percentages",
                      testNumber: 1,
                      questions: Array.from({ length: 20 }, (_, i) => ({
                        questionNumber: i + 1,
                        questionText: `A sample question ${i + 1} regarding percentages and financial calculations...`,
                        optionA: "Option 1",
                        optionB: "Option 2",
                        optionC: "Option 3",
                        optionD: "Option 4",
                        correctOption: "B",
                        explanation: "Detailed explanation for problem solving...",
                        difficulty: "HARD",
                        marks: 1
                      }))
                    };
                    setImportJson(JSON.stringify(sample, null, 2));
                  }}
                  className="text-xs text-brand-400 hover:underline"
                >
                  Load Sample 20-Question JSON Template
                </button>
              </div>

              <textarea
                rows={14}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste valid JSON structure containing topic, testNumber, and array of 20 questions..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {importStatus.result && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Import Successful!
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Imported {importStatus.result.importedCount} questions for topic "{importStatus.result.topic}" (Test #{importStatus.result.testNumber}).
                </div>
              </div>
            )}

            {importStatus.error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <div className="font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Import Validation Error
                </div>
                <div className="text-xs text-slate-300 mt-1">{importStatus.error}</div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                disabled={importStatus.loading || !importJson.trim()}
                onClick={handleBulkImport}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
              >
                {importStatus.loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Validate & Import Batch
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DUPLICATE DETECTION */}
        {activeTab === 'duplicates' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Copy className="w-5 h-5 text-amber-400" /> Question Duplicate Detection
                  </h2>
                  <p className="text-sm text-slate-400">
                    Calculates normalized text similarity across all 2,160 questions to identify potential duplicates.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Similarity Threshold:</label>
                  <select
                    value={dupThreshold}
                    onChange={(e) => setDupThreshold(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  >
                    <option value={0.75}>75% Similarity</option>
                    <option value={0.85}>85% Similarity</option>
                    <option value={0.90}>90% Similarity</option>
                    <option value={0.95}>95% Exact Match</option>
                  </select>
                  <button
                    onClick={loadDuplicates}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-scan
                  </button>
                </div>
              </div>
            </div>

            {/* Duplicates List */}
            <div className="space-y-4">
              {dupLoading ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Comparing 2,160 questions across all 36 topics...</p>
                </div>
              ) : duplicates.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-emerald-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="text-base font-bold text-slate-200">Zero Duplicates Detected</p>
                  <p className="text-xs text-slate-400 mt-1">All questions meet distinct uniqueness criteria above {Math.round(dupThreshold * 100)}% threshold.</p>
                </div>
              ) : (
                duplicates.map((dup, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Potential Duplicate Flagged
                      </span>
                      <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                        Similarity: {dup.similarity}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Question A */}
                      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                        <div className="font-semibold text-brand-400">Question A (ID: {dup.questionA.id.slice(0, 8)})</div>
                        <div className="text-slate-400 text-[11px]">{dup.questionA.topic} • {dup.questionA.test}</div>
                        <p className="text-slate-200 mt-2 font-medium">{dup.questionA.text}</p>
                      </div>

                      {/* Question B */}
                      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                        <div className="font-semibold text-indigo-400">Question B (ID: {dup.questionB.id.slice(0, 8)})</div>
                        <div className="text-slate-400 text-[11px]">{dup.questionB.topic} • {dup.questionB.test}</div>
                        <p className="text-slate-200 mt-2 font-medium">{dup.questionB.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TEST CONFIGURATION */}
        {activeTab === 'testConfig' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-400" /> Test Configuration Management
              </h2>
              <p className="text-sm text-slate-400">
                Configure future test parameters (timer duration, active status, display titles). Historical completed attempts remain unaffected.
              </p>
            </div>

            <form onSubmit={handleSaveTestConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Test to Configure *</label>
                <select
                  required
                  value={selectedTestForConfig}
                  onChange={(e) => {
                    const testId = e.target.value;
                    setSelectedTestForConfig(testId);
                    // Find test info
                    for (const topic of topicsTests) {
                      const found = topic.tests?.find((t: any) => t.id === testId);
                      if (found) {
                        setTestConfigForm({
                          title: found.title || `Test #${found.testNumber}`,
                          durationMinutes: Math.round((found.durationSeconds || 1800) / 60),
                          isActive: found.isActive !== false,
                        });
                        break;
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">Select a Test (108 Available)...</option>
                  {topicsTests.map((topic) =>
                    topic.tests?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {topic.name} — Test #{t.testNumber} ({t.title || 'Standard Test'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedTestForConfig && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Test Title</label>
                    <input
                      type="text"
                      value={testConfigForm.title}
                      onChange={(e) => setTestConfigForm({ ...testConfigForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={testConfigForm.durationMinutes}
                        onChange={(e) => setTestConfigForm({ ...testConfigForm, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Test Status</label>
                      <select
                        value={testConfigForm.isActive ? 'true' : 'false'}
                        onChange={(e) => setTestConfigForm({ ...testConfigForm, isActive: e.target.value === 'true' })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      >
                        <option value="true">Active (Students Can Attempt)</option>
                        <option value="false">Inactive / Locked</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20"
                    >
                      Save Configuration
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </div>

      {/* EDIT MODAL WITH VERSIONING */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full my-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Question #{editingQuestion.questionNumber}</h3>
                <p className="text-xs text-slate-400">Saving creates an immutable historical version snapshot.</p>
              </div>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.questionText}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionA}
                    onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionB}
                    onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionC}
                    onChange={(e) => setEditForm({ ...editForm, optionC: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={editForm.optionD}
                    onChange={(e) => setEditForm({ ...editForm, optionD: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Correct Option</label>
                  <select
                    value={editForm.correctOption}
                    onChange={(e) => setEditForm({ ...editForm, correctOption: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="VERY_HARD">Very Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.marks}
                    onChange={(e) => setEditForm({ ...editForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 uppercase mb-1">Reason for Change (Audit Note)</label>
                <input
                  type="text"
                  placeholder="e.g., Typo correction in formula, clarification of option B"
                  value={editForm.changeReason}
                  onChange={(e) => setEditForm({ ...editForm, changeReason: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/20"
                >
                  Save & Increment Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Question Details (Version {viewingQuestion.version || 1})
                </h3>
                <p className="text-xs text-slate-400">{viewingQuestion.test?.topic?.name} • {viewingQuestion.test?.title}</p>
              </div>
              <button onClick={() => setViewingQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-400 block mb-1">Problem Statement:</span>
                <p className="text-slate-200 text-sm">{viewingQuestion.questionText}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div
                    key={opt}
                    className={`p-2.5 rounded-xl border ${
                      viewingQuestion.correctOption === opt
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-bold mr-1.5">{opt}:</span> {viewingQuestion[`option${opt}` as keyof QuestionItem] as string}
                  </div>
                ))}
              </div>

              {viewingQuestion.explanation && (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <span className="font-semibold text-indigo-400 block mb-1">Pedagogical Explanation:</span>
                  <p className="text-slate-300">{viewingQuestion.explanation}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
