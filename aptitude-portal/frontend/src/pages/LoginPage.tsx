import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, ShieldCheck, UserCheck, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Role } from '../types';

export const LoginPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<Role>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    setError(null);
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload =
        activeRole === 'STUDENT'
          ? { rollNumber: identifier.trim(), password }
          : { staffId: identifier.trim(), password };

      const redirectUrl = await login(payload);
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Invalid credentials. Please verify your details and try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background aesthetic glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/25 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">APTITUDE TEST PORTAL</h1>
          <p className="text-sm text-slate-400 mt-1.5">College Placement Assessment Platform</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              id="student-role-btn"
              onClick={() => handleRoleChange('STUDENT')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeRole === 'STUDENT'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              id="staff-role-btn"
              onClick={() => handleRoleChange('STAFF')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeRole === 'STAFF'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Staff</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier input */}
            <div>
              <label
                htmlFor="identifier-input"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
              >
                {activeRole === 'STUDENT' ? 'Roll Number' : 'Staff ID'}
              </label>
              <div className="relative">
                <input
                  id="identifier-input"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeRole === 'STUDENT' ? 'Enter Roll Number' : 'Enter Staff ID'}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors uppercase font-mono"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                activeRole === 'STUDENT'
                  ? 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Forgot password */}
            <div className="text-center pt-2">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Forgot your password? Please contact your Placement Cell Administrator to reset your credentials.');
                }}
                className="text-xs text-slate-400 hover:text-brand-400 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </form>
        </div>

        {/* Create Account Section */}
        <div className="mt-6 glass-panel rounded-2xl p-5 border border-slate-800/60 text-center space-y-3">
          <p className="text-xs text-slate-400 font-medium">Don't have an account?</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/register/student"
              id="create-student-account-btn"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-brand-600/80 hover:bg-brand-600 border border-brand-500/30 hover:border-brand-500/60 shadow-md shadow-brand-500/10 transition-all duration-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Student Account
            </Link>
            <Link
              to="/register/staff"
              id="create-staff-account-btn"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700/80 hover:bg-emerald-700 border border-emerald-500/30 hover:border-emerald-500/60 shadow-md shadow-emerald-500/10 transition-all duration-200"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Staff Account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          College Placement Assessment Platform
        </p>
      </div>
    </div>
  );
};
