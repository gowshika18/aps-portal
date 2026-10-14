import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface RoleProtectedRouteProps {
  allowedRole: Role;
  children: React.ReactElement;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRole, children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Validating permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    // If student tries staff routes, redirect to student dashboard
    if (role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // If staff tries student routes, redirect to staff dashboard
    if (role === 'STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
