import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { StudentRegistrationPage } from './pages/StudentRegistrationPage';
import { StaffRegistrationPage } from './pages/StaffRegistrationPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentAnalyticsPage } from './pages/StudentAnalyticsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { StaffDashboard } from './pages/StaffDashboard';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { QuestionManagementPage } from './pages/QuestionManagementPage';
import { DataIntegrityPage } from './pages/DataIntegrityPage';
import { StaffReportsPage } from './pages/StaffReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AccountManagementPage } from './pages/AccountManagementPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { TestResultPage } from './pages/TestResultPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Component to handle root URL "/" redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return role === 'STAFF' ? (
    <Navigate to="/staff/dashboard" replace />
  ) : (
    <Navigate to="/student/dashboard" replace />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegistrationPage />} />
          <Route path="/register/staff" element={<StaffRegistrationPage />} />

          {/* Root Redirect & Dashboard alias */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<RootRedirect />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <StudentDashboard />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/analytics"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <StudentAnalyticsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <StudentProfilePage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Test Engine Routes */}
          <Route
            path="/tests/take/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/take/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/test/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests/take/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/test/take/:testId"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STUDENT">
                  <TestTakingPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/result/:attemptId"
            element={
              <ProtectedRoute>
                <TestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/result/:attemptId"
            element={
              <ProtectedRoute>
                <TestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/test/result/:attemptId"
            element={
              <ProtectedRoute>
                <TestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests/result/:attemptId"
            element={
              <ProtectedRoute>
                <TestResultPage />
              </ProtectedRoute>
            }
          />

          {/* Staff Protected Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <StaffDashboard />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/students/:rollNumber"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <StudentDetailPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/questions"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <QuestionManagementPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/integrity"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <DataIntegrityPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <StaffReportsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/audit-logs"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <AuditLogsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/accounts"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <AccountManagementPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRole="STAFF">
                  <AdminSettingsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* Access Denied & Fallbacks */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
