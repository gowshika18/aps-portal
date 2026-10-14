import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (role === 'STAFF') {
      navigate('/staff/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-800 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">403 Forbidden</span>
        <h1 className="text-2xl font-extrabold text-white mt-2 mb-3">Access Denied</h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          You do not have administrative credentials to access this area. This action has been logged for security compliance.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleReturn}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return to Your Dashboard</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
