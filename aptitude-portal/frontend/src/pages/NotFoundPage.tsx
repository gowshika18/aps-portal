import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const handleHome = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (role === 'STAFF') {
      navigate('/staff/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-800 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider font-mono">404 Error</span>
        <h1 className="text-2xl font-extrabold text-white mt-2 mb-3">Page Not Found</h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          The requested URL path does not exist on the Aptitude Test Portal.
        </p>

        <button
          onClick={handleHome}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </button>
      </div>
    </div>
  );
};
