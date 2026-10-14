import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { testService } from '../services/test.service';
import { ActiveTestResponse, QuestionItem } from '../types';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  WifiOff,
} from 'lucide-react';

export const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRetestMode = searchParams.get('retest') === 'true';

  const [testData, setTestData] = useState<ActiveTestResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const timerRef = useRef<any>(null);
  const attemptIdRef = useRef<string | null>(null);
  const syncQueueRef = useRef<Array<{ questionId: string; option: string }>>([]);

  // Auto submit handler
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptIdRef.current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await testService.submitTest(attemptIdRef.current);
      // Clear localStorage cache on successful submission
      localStorage.removeItem(`aptitude_attempt_${attemptIdRef.current}`);
      navigate(`/tests/result/${result.attemptId}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Auto-submit failed. Please submit manually.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, navigate]);

  // Network listener & auto-flush sync queue on recovery
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (attemptIdRef.current && syncQueueRef.current.length > 0) {
        setSavingStatus('Syncing offline answers...');
        const queue = [...syncQueueRef.current];
        syncQueueRef.current = [];
        for (const item of queue) {
          try {
            await testService.saveAnswer(attemptIdRef.current, item.questionId, item.option);
          } catch (e) {
            syncQueueRef.current.push(item);
          }
        }
        setSavingStatus('All answers synced');
        setTimeout(() => setSavingStatus(null), 1500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSavingStatus('Offline – answers saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load test or resume active attempt
  useEffect(() => {
    let isMounted = true;

    async function loadTest() {
      if (!testId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = isRetestMode
          ? await testService.startRetest(testId)
          : await testService.startTest(testId);

        if (!isMounted) return;

        // If completed or auto-submitted, redirect to result page
        if (
          (data.status === 'AUTO_SUBMITTED' || data.status === 'SUBMITTED') &&
          (data.result?.attemptId || data.attemptId || data.attempt?.id)
        ) {
          const resAttemptId = data.result?.attemptId || data.attemptId || data.attempt?.id;
          navigate(`/tests/result/${resAttemptId}`, { replace: true });
          return;
        }

        // Validate question count (Must be exactly 20 questions)
        if (!data.questions || data.questions.length !== 20) {
          setError(`Invalid test data: Expected exactly 20 questions, but received ${data.questions?.length ?? 0}.`);
          setIsLoading(false);
          return;
        }

        if (!data.attempt) {
          setError('Unable to load test session. Please try again.');
          setIsLoading(false);
          return;
        }

        setTestData(data);
        attemptIdRef.current = data.attempt.id;

        // Restore from server + fallback to local storage
        const localCacheStr = localStorage.getItem(`aptitude_attempt_${data.attempt.id}`);
        const localCache = localCacheStr ? JSON.parse(localCacheStr) : {};
        const mergedAnswers = { ...data.savedAnswers, ...localCache };

        setSelectedAnswers(mergedAnswers);
        setRemainingSeconds(data.attempt.remainingSeconds);
      } catch (err: any) {
        if (isMounted) {
          const status = err.response?.status;
          const msg = err.response?.data?.message || err.message;
          if (status === 404 || msg?.toLowerCase().includes('not found')) {
            setError('Test not found.');
          } else {
            setError(msg || 'Unable to load this test. Please try again.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTest();

    return () => {
      isMounted = false;
    };
  }, [testId, isRetestMode, navigate]);

  // Server-side aligned timer countdown
  useEffect(() => {
    if (isLoading || !testData) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, testData, handleAutoSubmit]);

  const handleSelectOption = async (option: string) => {
    if (!testData || !testData.questions || !attemptIdRef.current) return;
    const currentQ = testData.questions[currentQIndex];
    if (!currentQ) return;

    const newAnswers = { ...selectedAnswers, [currentQ.id]: option };
    setSelectedAnswers(newAnswers);

    // 1. Immediately persist locally (Network Resilience)
    localStorage.setItem(`aptitude_attempt_${attemptIdRef.current}`, JSON.stringify(newAnswers));

    // 2. Attempt server sync
    if (navigator.onLine) {
      try {
        setSavingStatus('Saving...');
        await testService.saveAnswer(attemptIdRef.current, currentQ.id, option);
        setSavingStatus('Saved');
        setTimeout(() => setSavingStatus(null), 1000);
      } catch (err: any) {
        // Queue for background retry
        syncQueueRef.current.push({ questionId: currentQ.id, option });
        setSavingStatus('Saved locally (Sync pending)');
      }
    } else {
      syncQueueRef.current.push({ questionId: currentQ.id, option });
      setSavingStatus('Offline – saved locally');
    }
  };

  const handleSubmit = async () => {
    if (!attemptIdRef.current || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const result = await testService.submitTest(attemptIdRef.current);
      localStorage.removeItem(`aptitude_attempt_${attemptIdRef.current}`);
      navigate(`/tests/result/${result.attemptId}`, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Submission failed.');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading Test...</p>
      </div>
    );
  }

  if (error || !testData || !testData.questions || !testData.attempt) {
    const isNotFound = error === 'Test not found.' || error?.toLowerCase().includes('not found');
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-red-500/20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isNotFound ? 'Test not found.' : 'Unable to load this test.'}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {isNotFound
              ? 'The requested test could not be found.'
              : error || 'Please try again.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = testData.questions;
  const currentQ: QuestionItem | undefined = questions[currentQIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-red-500/20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Question not found.</h2>
          <p className="text-sm text-slate-400 mb-6">Unable to load the requested question.</p>
          <button
            onClick={() => setCurrentQIndex(0)}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
          >
            Go to Question 1
          </button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeUrgent = remainingSeconds < 180; // Less than 3 minutes

  const options = [
    { key: 'A', text: currentQ.optionA },
    { key: 'B', text: currentQ.optionB },
    { key: 'C', text: currentQ.optionC },
    { key: 'D', text: currentQ.optionD },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Test Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {testData.attempt.topicCategory} • {testData.attempt.topicName}
            </span>
            {testData.attempt.isRetest && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Retest
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white mt-1">
            {testData.attempt.testTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Network status indicator */}
          {!isOnline && (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <WifiOff className="w-3.5 h-3.5" /> Offline Mode
            </span>
          )}

          {savingStatus && (
            <span className="hidden sm:inline-block text-xs text-brand-400 font-medium">
              {savingStatus}
            </span>
          )}

          {/* Real-time Server Synced Countdown */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-base font-bold border transition-colors ${
              isTimeUrgent
                ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                : 'bg-slate-800/80 text-white border-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeUrgent ? 'text-red-400' : 'text-brand-400'}`} />
            <span>{formattedTime}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question & Options (3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            {/* Question Info Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-xl">
                  Question {currentQIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-400">
                  Marks: +{currentQ.marks} • Difficulty: {currentQ.difficulty || 'HARD'}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {selectedAnswers[currentQ.id] ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> Unanswered
                  </span>
                )}
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* 4 Options */}
            <div className="space-y-3 pt-2">
              {options.map(({ key, text }) => {
                const isSelected = selectedAnswers[currentQ.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center gap-4 ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {key}
                    </div>
                    <span className="text-sm leading-relaxed">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs text-slate-400 font-mono font-medium">
              {answeredCount} of {totalQuestions} answered
            </span>

            <button
              onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentQIndex === totalQuestions - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-brand-500/40 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette (1 col on lg) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-6 h-fit">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Question Palette
            </h3>

            {/* Question Matrix Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = !!selectedAnswers[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center relative ${
                      isCurrent
                        ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-950 font-extrabold'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                Answered
              </span>
              <span className="font-mono font-semibold text-emerald-400">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-md bg-slate-900 border border-slate-800" />
                Unanswered
              </span>
              <span className="font-mono font-semibold text-slate-400">
                {totalQuestions - answeredCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Submit Aptitude Test?</h3>
              <p className="text-sm text-slate-400">
                Are you sure you want to finalize and submit your test? Once submitted, your score will be computed and retakes are not permitted.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Answered Questions:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unanswered Questions:</span>
                <span className="font-bold text-amber-400">{totalQuestions - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Remaining:</span>
                <span className="font-mono font-bold text-white">{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
