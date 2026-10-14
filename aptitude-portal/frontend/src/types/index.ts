export type Role = 'STUDENT' | 'STAFF';

export type TopicCategory = 'QUANTITATIVE' | 'LOGICAL';

export interface StudentProfile {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  section: string;
}

export interface StaffProfile {
  id: string;
  staffId: string;
  name: string;
  email: string;
  department: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  student?: StudentProfile | null;
  staff?: StaffProfile | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  redirectUrl: string;
}

export interface TestSummary {
  testNumber: number;
  name: string;
  questionCount?: number;
  difficulty?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  score?: number | null;
  scheduledNotice?: string;
}

export interface Topic {
  id: string;
  name: string;
  category: TopicCategory;
  displayOrder: number;
  testsCount: number;
  totalQuestions: number;
  progress: number;
  status: string;
  tests?: TestSummary[];
}

export interface StudentListItem {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  section: string;
  isOnline: boolean;
  status: 'ONLINE' | 'OFFLINE';
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  overallProgress: number;
  testsCompleted: number;
  topicsCompleted: number;
  questionsAttempted: number;
  accuracy: number;
  averageScore: number;
}

export interface StaffDashboardStats {
  totalStudents: number;
  activeNow: number;
  testsAttempted: number;
  averageScore: number;
  averageAccuracy?: number;
  recentActivity?: Array<{
    id: string;
    studentName: string;
    rollNumber: string;
    department: string;
    topicName: string;
    testNumber: number;
    score: number;
    accuracy: number;
    submittedAt: string;
  }>;
}

export interface StudentDetailView {
  student: {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    year: number;
    section: string;
    isOnline: boolean;
    status: 'ONLINE' | 'OFFLINE';
    lastLoginAt: string | null;
    lastSeenAt: string | null;
  };
  stats: {
    overallProgress: number;
    testsCompleted: number;
    totalTests: number;
    topicsCompleted: number;
    totalTopics: number;
    questionsAttempted: number;
    questionsRemaining: number;
    overallScore?: number;
    overallAccuracy?: number;
  };
  topics: Array<{
    id: string;
    name: string;
    category: TopicCategory;
    displayOrder: number;
    progress: number;
    isCompleted: boolean;
    completedTestsCount: number;
    totalScore: number;
    accuracy: number;
    tests: Array<{
      id: string;
      testNumber: number;
      title: string;
      isSubmitted: boolean;
      attemptId: string | null;
      score: number | null;
      accuracy: number | null;
      timeTakenSeconds: number | null;
      submittedAt: string | null;
    }>;
  }>;
  recentSessions: Array<{
    id: string;
    loginAt: string;
    logoutAt: string | null;
    lastSeenAt: string;
    isActive: boolean;
    ipAddress: string | null;
  }>;
}

export interface QuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty?: string;
  marks: number;
  concept?: string;
  subTopic?: string;
}

export interface ActiveTestResponse {
  status: 'IN_PROGRESS' | 'AUTO_SUBMITTED' | 'SUBMITTED';
  message?: string;
  attemptId?: string;
  attempt?: {
    id: string;
    testId: string;
    testNumber: number;
    testTitle: string;
    topicId: string;
    topicName: string;
    topicCategory: string;
    startedAt: string;
    durationSeconds: number;
    remainingSeconds: number;
    attemptNumber: number;
    isRetest: boolean;
  };
  questions?: QuestionItem[];
  savedAnswers?: Record<string, string>;
  result?: TestResultData;
}

export interface QuestionReviewItem extends QuestionItem {
  correctOption: string;
  explanation: string;
  selectedOption: string | null;
  isAnswered: boolean;
  isCorrect: boolean;
}

export interface TestResultData {
  attemptId: string;
  testId: string;
  testNumber: number;
  testTitle: string;
  topicId: string;
  topicName: string;
  topicCategory: string;
  totalQuestions: number;
  attemptedCount: number;
  unattemptedCount: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  submittedAt: string;
  attemptNumber?: number;
  isRetest?: boolean;
  canRetest?: boolean;
  retestAttemptId?: string | null;
  student?: {
    id: string;
    rollNumber: string;
    name: string;
    department: string;
  };
  questionReview?: QuestionReviewItem[];
}

export interface TopicOverallData {
  topic: {
    id: string;
    name: string;
    category: TopicCategory;
    displayOrder: number;
  };
  // Backend returns 'overallSummary' (not 'summary')
  overallSummary: {
    totalQuestions: number;
    totalAttempted: number;
    totalUnattempted: number;
    totalCorrect: number;
    totalWrong: number;
    totalScore: number;
    overallAccuracy: number;
    overallProgress: number;
    completedTestsCount: number;
    isCompleted: boolean;
  };
  // Keep 'summary' as optional alias for backward compatibility
  summary?: {
    totalQuestions: number;
    totalAttempted: number;
    totalUnattempted: number;
    totalCorrect: number;
    totalWrong: number;
    totalScore: number;
    overallAccuracy: number;
    overallProgress: number;
    completedTestsCount: number;
    isCompleted: boolean;
  };
  tests: Array<{
    id: string;
    testNumber: number;
    title: string;
    questionCount: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
    attemptId: string | null;
    score: number | null;
    accuracy: number | null;
    attemptedCount: number;
    unattemptedCount: number;
    correctCount: number;
    wrongCount: number;
    timeTakenSeconds: number | null;
    submittedAt: string | null;
    retestAttemptId?: string | null;
    canRetest?: boolean;
  }>;
}

export interface StudentDashboardMetrics {
  totalQuestions: number;
  totalTests: number;
  totalTopics: number;
  questionsAttempted: number;
  questionsRemaining: number;
  testsCompleted: number;
  testsRemaining: number;
  topicsCompleted: number;
  topicsRemaining: number;
  overallProgress: number;
  overallScore: number;
  overallAccuracy: number;
}

export interface PortalControlData {
  isOpen: boolean;
  mode: 'AUTOMATIC_WEEKEND' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';
  note: string;
  isWeekend: boolean;
  timezone: string;
  message: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BatchAnalyticsData {
  totalAttempts: number;
  topicMatrix: Array<{
    id: string;
    name: string;
    category: TopicCategory;
    displayOrder: number;
    attemptsCount: number;
    averageScore: number;
    averageAccuracy: number;
  }>;
  departmentStats: Array<{
    department: string;
    totalStudents: number;
    participatingStudents: number;
    totalAttempts: number;
    averageScore: number;
  }>;
  categoryStats: {
    quantitative: {
      totalTopics: number;
      attemptsCount: number;
      averageScore: number;
    };
    logical: {
      totalTopics: number;
      attemptsCount: number;
      averageScore: number;
    };
  };
  scoreBuckets: Record<string, number>;
}

export interface LiveMonitoringData {
  activeTestsCount: number;
  activeTests: Array<{
    attemptId: string;
    rollNumber: string;
    studentName: string;
    department: string;
    topicName: string;
    testNumber: number;
    answeredCount: number;
    totalQuestions: number;
    startedAt: string;
    elapsedSeconds: number;
    remainingSeconds: number;
  }>;
  onlineCount: number;
  onlineStudents: Array<{
    rollNumber: string;
    name: string;
    department: string;
    loginAt: string;
    lastSeenAt: string;
    ipAddress: string | null;
  }>;
}

export interface WeekendDayActivity {
  date: string;
  dayOfWeek: 'Saturday' | 'Sunday';
  dayOfMonth: number;
  status: 'ATTENDED' | 'MISSED' | 'UPCOMING';
  testsAttempted: number;
  questionsAttempted: number;
  score: number;
  accuracy: number;
  tests: Array<{ testTitle: string; topicName: string; score: number }>;
}

export interface MonthlyActivityData {
  year: number;
  month: number;
  monthName: string;
  totalWeekendDays: number;
  availableWeekendDays: number;
  attendedWeekendDays: number;
  missedWeekendDays: number;
  upcomingWeekendDays: number;
  participationPercentage: number;
  testsCompletedInMonth: number;
  questionsAttemptedInMonth: number;
  currentWeekendTarget: {
    target: string;
    status: 'ON_TRACK' | 'NEEDS_PRACTICE';
  };
  weekendDays: WeekendDayActivity[];
}
