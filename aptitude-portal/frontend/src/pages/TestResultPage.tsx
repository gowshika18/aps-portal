import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '../services/test.service';
import { TestResultData } from '../types';
import { Navbar } from '../components/Navbar';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  Trophy,
} from 'lucide-react';

export const TestResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'UNATTEMPTED'>('ALL');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [isStartingRetest, setIsStartingRetest] = useState<boolean>(false);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await testService.getTestResult(attemptId);
        setResult(data);
        // By default expand all wrong or unattempted
        const initialExpanded: Record<string, boolean> = {};
        data.questionReview?.forEach((q) => {
          if (!q.isCorrect) initialExpanded[q.id] = true;
        });
        setExpandedQuestions(initialExpanded);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load test result.');
      } finally {
        setIsLoading(false);
      }
    }

    loadResult();
  }, [attemptId]);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleStartRetest = async () => {
    if (!result?.testId || isStartingRetest) return;
    try {
      setIsStartingRetest(true);
      const data = await testService.startRetest(result.testId);
      if (data.status === 'AUTO_SUBMITTED' && data.result) {
        navigate(`/tests/result/${data.result.attemptId}`, { replace: true });
        return;
      }
      // Navigate to test-taking page with the retest flag
      navigate(`/tests/take/${result.testId}?retest=true`, { replace: true });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Could not start retest.');
      setIsStartingRetest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Evaluating Test Results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-red-500/20 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Result</h2>
            <p className="text-sm text-slate-400 mb-6">{error || 'Result not available.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const minutesTaken = Math.floor(result.timeTakenSeconds / 60);
  const secondsTaken = result.timeTakenSeconds % 60;
  const formattedDuration = `${minutesTaken}m ${secondsTaken}s`;

  const filteredQuestions = (result.questionReview || []).filter((q) => {
    if (filter === 'CORRECT') return q.isCorrect;
    if (filter === 'WRONG') return q.isAnswered && !q.isCorrect;
    if (filter === 'UNATTEMPTED') return !q.isAnswered;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {result.topicCategory} • {result.topicName}
              </span>
              {result.isRetest && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Retest (Attempt #2)
                </span>
              )}
              {!result.isRetest && result.attemptNumber === 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700">
                  Attempt #1
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {result.testTitle} Result
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
            >
              Done & Return
            </button>
          </div>
        </div>

        {/* Score & Key Metrics Panel */}

        {/* Retest eligibility / Retest result banner */}
        {result.canRetest && (
          <div className="glass-panel rounded-3xl p-5 border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-300">Retest Available — Score ≤ 10</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your score of <span className="font-bold text-white">{result.score}/20</span> qualifies you for one retest attempt. Improve your score before moving on.
                </p>
              </div>
            </div>
            <button
              onClick={handleStartRetest}
              disabled={isStartingRetest}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isStartingRetest ? 'animate-spin' : ''}`} />
              {isStartingRetest ? 'Starting Retest...' : 'Take Retest Now'}
            </button>
          </div>
        )}

        {/* Retest already done - show link to view retest result */}
        {result.retestAttemptId && (
          <div className="glass-panel rounded-3xl p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-300">Retest Completed</p>
                <p className="text-xs text-slate-400 mt-0.5">You have already taken the retest for this test.</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/tests/result/${result.retestAttemptId}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Trophy className="w-4 h-4" />
              View Retest Result
            </button>
          </div>
        )}

        {/* Score & Key Metrics Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Final Score */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 glass-panel rounded-3xl p-6 border border-brand-500/30 bg-gradient-to-br from-brand-950/40 via-slate-900/60 to-slate-950/80 relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-1">
                Final Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
                  {result.score}
                </span>
                <span className="text-lg text-slate-400 font-mono">/ {result.totalQuestions}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Marks: 1 per question</span>
              <span className="font-semibold text-brand-400">
                {((result.score / result.totalQuestions) * 100).toFixed(0)}% Marks
              </span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Accuracy</span>
              <Target className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{result.accuracy}%</div>
            <span className="text-[11px] text-slate-400 mt-1">On attempted</span>
          </div>

          {/* Correct */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Correct</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {result.correctCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Questions correct</span>
          </div>

          {/* Wrong */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Wrong</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400 font-mono">{result.wrongCount}</div>
            <span className="text-[11px] text-slate-400 mt-1">Incorrect answers</span>
          </div>

          {/* Unattempted */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Unattempted</span>
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {result.unattemptedCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Time: {formattedDuration}</span>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              Detailed Solutions & Explanations ({result.totalQuestions})
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  filter === 'ALL' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({result.totalQuestions})
              </button>
              <button
                onClick={() => setFilter('CORRECT')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  filter === 'CORRECT'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Correct ({result.correctCount})
              </button>
              <button
                onClick={() => setFilter('WRONG')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  filter === 'WRONG' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wrong ({result.wrongCount})
              </button>
              <button
                onClick={() => setFilter('UNATTEMPTED')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  filter === 'UNATTEMPTED'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unattempted ({result.unattemptedCount})
              </button>
            </div>
          </div>

          {/* List of Questions with explanations */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isExpanded = !!expandedQuestions[q.id];
              const isCorrect = q.isCorrect;
              const isUnattempted = !q.isAnswered;

              const statusBadge = isCorrect ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                </span>
              ) : isUnattempted ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Unattempted
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Incorrect
                </span>
              );

              const options = [
                { key: 'A', text: q.optionA },
                { key: 'B', text: q.optionB },
                { key: 'C', text: q.optionC },
                { key: 'D', text: q.optionD },
              ];

              return (
                <div
                  key={q.id}
                  className="glass-panel rounded-3xl p-6 border border-slate-800 transition-all space-y-4"
                >
                  {/* Question Header */}
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer"
                    onClick={() => toggleExpand(q.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-sm text-slate-300">
                        {q.questionNumber}
                      </span>
                      {statusBadge}
                      {q.concept && (
                        <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
                          • {q.concept}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-base text-slate-100 font-medium leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {options.map(({ key, text }) => {
                      const isStudentChoice = q.selectedOption === key;
                      const isRightAnswer = q.correctOption === key;

                      let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-300';
                      let badgeStyle = 'bg-slate-800 text-slate-400';

                      if (isRightAnswer) {
                        optionStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-200';
                        badgeStyle = 'bg-emerald-500 text-white font-bold';
                      } else if (isStudentChoice && !isRightAnswer) {
                        optionStyle = 'bg-red-500/10 border-red-500 text-red-200';
                        badgeStyle = 'bg-red-500 text-white font-bold';
                      }

                      return (
                        <div
                          key={key}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-sm leading-relaxed ${optionStyle}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${badgeStyle}`}
                          >
                            {key}
                          </div>
                          <span className="flex-1">{text}</span>
                          {isRightAnswer && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                              Correct Answer
                            </span>
                          )}
                          {isStudentChoice && !isRightAnswer && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 shrink-0">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-900/60 rounded-2xl p-4 border border-brand-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Step-by-Step Solution & Concept
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
