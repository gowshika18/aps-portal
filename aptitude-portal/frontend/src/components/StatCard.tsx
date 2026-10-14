import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

const colorMap = {
  blue: {
    bg: 'from-blue-500/10 to-brand-500/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/10 text-blue-400',
    text: 'text-blue-400',
  },
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-500/5',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    iconBg: 'bg-indigo-500/10 text-indigo-400',
    text: 'text-indigo-400',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    text: 'text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconBg: 'bg-amber-500/10 text-amber-400',
    text: 'text-amber-400',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    iconBg: 'bg-rose-500/10 text-rose-400',
    text: 'text-rose-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-500/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/10 text-purple-400',
    text: 'text-purple-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}) => {
  const c = colorMap[color];

  return (
    <div
      className={`glass-card p-5 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
