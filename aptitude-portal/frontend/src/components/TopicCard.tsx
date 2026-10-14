import React from 'react';
import { Topic } from '../types';
import { BookOpen, Layers, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';

interface TopicCardProps {
  topic: any;
  onClick?: (topic: Topic) => void;
  onOpen?: (topic: Topic) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick, onOpen }) => {
  const isQuantitative = topic.category === 'QUANTITATIVE';
  const handleOpen = () => {
    if (onClick) onClick(topic);
    else if (onOpen) onOpen(topic);
  };

  const progress = topic.progress ?? 0;
  const isCompleted = topic.isCompleted || progress === 100;
  const completedTests = topic.completedTests ?? 0;

  return (
    <div
      onClick={handleOpen}
      className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
    >
      {/* Top accent glow line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isQuantitative
            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
            : 'bg-gradient-to-r from-purple-500 to-pink-400'
        }`}
      />

      <div>
        {/* Category & Order */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
              isQuantitative
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}
          >
            {isQuantitative ? 'Quantitative' : 'Logical'}
          </span>
          <span className="text-[11px] font-mono font-medium text-slate-400">
            #{topic.displayOrder}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors duration-200 line-clamp-1">
          {topic.name}
        </h3>

        {/* Tests & Questions info */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg p-2 border border-slate-800/80">
            <Layers className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>3 Tests</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg p-2 border border-slate-800/80">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>60 Questions</span>
          </div>
        </div>

        {/* Progress Bar (out of 60 questions) */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="font-bold text-slate-300 font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Tag */}
        <div className="mt-3">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">Completed (3/3 Tests)</span>
            </div>
          ) : completedTests > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-lg px-2.5 py-1">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-medium">{completedTests}/3 Tests Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">Not Started</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 group/btn shadow-sm"
        >
          <span>VIEW TESTS</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};
