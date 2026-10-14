import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { testService } from '../services/test.service';
import { Topic, TopicOverallData } from '../types';
import {
  X,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Play,
  RotateCcw,
  Award,
} from 'lucide-react';

interface TopicModalProps {
  topic: Topic | null;
  onClose: () => void;
  isPortalOpen?: boolean;
}

export const TopicModal: React.FC<TopicModalProps> = ({ topic, onClose }) => {
  const navigate = useNavigate();
  const [topicData, setTopicData] = useState<TopicOverallData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTestToStart, setSelectedTestToStart] = useState<{
    id: string;
    testNumber: number;
    title: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      if (!topic) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await testService.getTopicDetails(topic.id);
        setTopicData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load topic details');
      } finally {
        setIsLoading(false);
      }
    }

    loadDetails();
  }, [topic]);

  if (!topic) return null;

  const handleStartTestConfirmed = () => {
    if (!selectedTestToStart) return;
    navigate(`/tests/take/${selectedTestToStart.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
              topic.category === 'QUANTITATIVE'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}
          >
            {topic.category}
          </span>
          <span className="text-xs text-slate-400 font-mono">Topic #{topic.displayOrder}</span>
          {topicData?.overallSummary?.isCompleted && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{topic.name}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          3 Comprehensive Hard-level practice tests (20 questions each, 60 questions total).
        </p>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs">Loading Test Modules...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 3 Tests List */}
            <div className="space-y-3">
              {topicData?.tests.map((test) => {
                const isSubmitted = test.status === 'SUBMITTED';
                const isInProgress = test.status === 'IN_PROGRESS';

                return (
                  <div
                    key={test.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold shrink-0 ${
                          isSubmitted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {test.testNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{test.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" /> 20 Questions
                          </span>
                          <span>•</span>
                          <span>20 Minutes</span>
                          {isSubmitted && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold font-mono">
                                Score: {test.score}/20 ({test.accuracy}%)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSubmitted ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/tests/take/${test.id}`)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            View Test
                          </button>
                          <button
                            onClick={() => navigate(`/tests/result/${test.attemptId}`)}
                            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                          >
                            View Result <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isInProgress ? (
                        <button
                          onClick={() => navigate(`/tests/take/${test.id}`)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Resume Test
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/tests/take/${test.id}`)}
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                        >
                          <Play className="w-3.5 h-3.5" /> View Test
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combined 3-Test Overall Topic Result (Phase 2 Requirement 13) */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Award className="w-4 h-4 text-brand-400" />
                  Topic Combined Performance (3 Tests / 60 Qs)
                </div>
                <span className="text-xs font-mono font-bold text-brand-400">
                  {topicData?.overallSummary?.overallProgress ?? 0}% Complete
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Tests Done</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {topicData?.overallSummary?.completedTestsCount ?? 0} / 3
                  </span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Attempted</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {topicData?.overallSummary?.totalAttempted ?? 0} / 60
                  </span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Score</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {topicData?.overallSummary?.totalScore ?? 0} / 60
                  </span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Accuracy</span>
                  <span className="text-sm font-bold text-brand-400 font-mono">
                    {topicData?.overallSummary?.overallAccuracy ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Test Instructions Modal */}
        {selectedTestToStart && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-brand-500/30 shadow-2xl relative text-left space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {topic.name}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{selectedTestToStart.title}</h3>

              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-white text-sm">Official Instructions:</p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                  <li>
                    <strong className="text-white">20 Questions:</strong> High-difficulty placement questions.
                  </li>
                  <li>
                    <strong className="text-white">20 Minutes:</strong> Server timer begins immediately upon clicking Start.
                  </li>
                  <li>
                    <strong className="text-white">Live Answer Saving:</strong> Answers are automatically synchronized.
                  </li>
                  <li>
                    <strong className="text-white">No Retakes:</strong> Each test can only be attempted and submitted once.
                  </li>
                  <li>
                    <strong className="text-white">Automatic Submission:</strong> Test automatically submits when time reaches zero.
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTestToStart(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartTestConfirmed}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start Test Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
