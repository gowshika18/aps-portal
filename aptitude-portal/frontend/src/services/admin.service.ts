import api from './api';

// ── Types & Interfaces ─────────────────────────────────────────────────────

export interface QuestionStats {
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  avgTimeSeconds: number;
}

export interface QuestionItem {
  id: string;
  testId: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  difficulty: string;
  marks: number;
  isActive?: boolean;
  version?: number;
  stats: QuestionStats;
  test?: {
    id: string;
    testNumber: number;
    title: string;
    topicId: string;
    topic?: {
      id: string;
      name: string;
      category: string;
    };
  };
}

export interface QuestionDuplicate {
  questionA: { id: string; text: string; topic: string; test: string };
  questionB: { id: string; text: string; topic: string; test: string };
  similarity: number;
}

export interface IntegrityCheckItem {
  check: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  details: string;
}

export interface IntegrityReport {
  summary: {
    status: 'PASS' | 'WARNING' | 'ERROR';
    totalTopics: number;
    totalTests: number;
    totalQuestions: number;
    totalAttempts: number;
    timestamp: string;
  };
  checks: IntegrityCheckItem[];
}

export interface AuditLogItem {
  id: string;
  userId: string;
  staffUser?: { name: string; staffId?: string };
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface StudentProfileData {
  id: string;
  rollNumber: string;
  name: string;
  email?: string;
  department: string;
  year: number;
  section: string;
  isActive: boolean;
  lastLoginAt?: string;
  stats: {
    testsCompleted: number;
    topicsCompleted: number;
    questionsAttempted: number;
    overallAccuracy: number;
    overallProgress: number;
    overallScore: number;
  };
  recentActivity: Array<{
    testTitle: string;
    topicName: string;
    score: number;
    accuracy: number;
    submittedAt: string;
  }>;
}

// ── Admin Service ──────────────────────────────────────────────────────────

export const adminService = {
  // Advanced Student Analytics
  async getStudentAdvancedAnalytics(rollNumber: string) {
    return api.get(`/admin/analytics/students/${rollNumber}`);
  },
  async getStudentWeakAreas(rollNumber: string, lowAccuracy = 60, lowCompletion = 100) {
    return api.get(`/admin/analytics/students/${rollNumber}/weak-areas`, {
      params: { lowAccuracy, lowCompletion },
    });
  },
  async getQuestions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    topicId?: string;
    testId?: string;
    difficulty?: string;
  }) {
    return api.get('/admin/analytics/questions', { params });
  },
  async runIntegrityCheck() {
    return api.get('/admin/integrity');
  },

  // Topics & Tests
  async getTopicsAndTests() {
    return api.get('/admin/topics-tests');
  },

  // Question Management
  async getQuestion(questionId: string) {
    return api.get(`/admin/questions/${questionId}`);
  },
  async addQuestion(data: any) {
    return api.post('/admin/questions', data);
  },
  async editQuestion(questionId: string, data: any) {
    return api.put(`/admin/questions/${questionId}`, data);
  },
  async deactivateQuestion(questionId: string, isActive?: boolean) {
    return api.delete(`/admin/questions/${questionId}/deactivate`, {
      data: { isActive },
    });
  },
  async bulkImport(payload: any) {
    return api.post('/admin/questions/bulk-import', payload);
  },
  async detectDuplicates(threshold = 0.85) {
    return api.get('/admin/questions/duplicates', {
      params: { threshold },
    });
  },
  async updateTestConfig(testId: string, data: any) {
    return api.put(`/admin/tests/${testId}/config`, data);
  },

  // Audit Logs
  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; entity?: string }) {
    return api.get('/admin/audit-logs', { params });
  },

  // Announcements
  async getAnnouncements() {
    return api.get('/admin/announcements');
  },
  async createAnnouncement(data: { title: string; message: string; startDate: string; endDate: string; isActive?: boolean }) {
    return api.post('/admin/announcements', data);
  },
  async updateAnnouncement(id: string, data: any) {
    return api.put(`/admin/announcements/${id}`, data);
  },
  async deleteAnnouncement(id: string) {
    return api.delete(`/admin/announcements/${id}`);
  },

  // Settings
  async getSettings() {
    return api.get('/admin/settings');
  },
  async updateSettings(updates: Record<string, string>) {
    return api.put('/admin/settings', updates);
  },

  // Exports (Server-side Blob responses)
  async exportStudentPerformance(params?: any) {
    return api.get('/admin/exports/student-performance', { params, responseType: 'blob' });
  },
  async exportTopicPerformance(params?: any) {
    return api.get('/admin/exports/topic-performance', { params, responseType: 'blob' });
  },
  async exportWeekendActivity(params?: any) {
    return api.get('/admin/exports/weekend-activity', { params, responseType: 'blob' });
  },

  // Paginated Student search
  async getStudentsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    year?: string;
    section?: string;
    sortBy?: string;
    sortDir?: string;
  }) {
    return api.get('/admin/students/paginated', { params });
  },

  // Notifications
  async broadcastNotification(data: { title: string; message: string; type?: string }) {
    return api.post('/portal/notifications/broadcast', data);
  },

  // Account Management
  async createStudentAccount(data: {
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    year: number;
    section: string;
    password: string;
  }) {
    return api.post('/admin/accounts/students', data);
  },
  async getStudentsAccountList(params?: { page?: number; pageSize?: number; search?: string }) {
    return api.get('/admin/accounts/students', { params });
  },
  async createStaffAccount(data: {
    staffId: string;
    name: string;
    email: string;
    department: string;
    password: string;
  }) {
    return api.post('/admin/accounts/staff', data);
  },
  async getStaffAccountList(params?: { page?: number; pageSize?: number; search?: string }) {
    return api.get('/admin/accounts/staff', { params });
  },
};

// ── Student Self-Service Portal API ─────────────────────────────────────────

export const portalService = {
  async getActiveAnnouncements() {
    return api.get('/portal/announcements/active');
  },
  async getNotifications(unreadOnly = false) {
    return api.get('/portal/notifications', { params: { unreadOnly } });
  },
  async markNotificationRead(id: string) {
    return api.post(`/portal/notifications/${id}/read`);
  },
  async markAllNotificationsRead() {
    return api.post('/portal/notifications/read-all');
  },
  async getMyAdvancedAnalytics() {
    return api.get('/portal/my/analytics');
  },
  async getMyWeakAreas(lowAccuracy = 60, lowCompletion = 100) {
    return api.get('/portal/my/weak-areas', { params: { lowAccuracy, lowCompletion } });
  },
  async getMyProfile() {
    return api.get('/portal/my/profile');
  },
};
