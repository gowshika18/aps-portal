import api from './api';
import {
  ActiveTestResponse,
  TestResultData,
  TopicOverallData,
  StudentDashboardMetrics,
  MonthlyActivityData,
} from '../types';

const inFlightStartRequests = new Map<string, Promise<ActiveTestResponse>>();

function startAttempt(testId: string, isRetest: boolean): Promise<ActiveTestResponse> {
  const key = `${testId}:${isRetest ? 'retest' : 'first'}`;
  const existingRequest = inFlightStartRequests.get(key);
  if (existingRequest) return existingRequest;

  const endpoint = isRetest ? `/tests/${testId}/retest` : `/tests/${testId}/start`;
  const request = api.post(endpoint).then((response) => response.data.data as ActiveTestResponse);
  inFlightStartRequests.set(key, request);

  return request.finally(() => {
    if (inFlightStartRequests.get(key) === request) {
      inFlightStartRequests.delete(key);
    }
  });
}

export const testService = {
  // Get portal status (open on weekend, closed on weekdays)
  async getPortalStatus() {
    const response = await api.get('/tests/status');
    return response.data.data;
  },

  // Get student dashboard summary
  async getDashboardMetrics(): Promise<StudentDashboardMetrics> {
    const response = await api.get('/tests/dashboard');
    return response.data.data;
  },

  // Get all topics with student progress
  async getTopics() {
    const response = await api.get('/tests/topics');
    return response.data.data;
  },

  // Get topic details with 3 tests
  async getTopicDetails(topicId: string): Promise<TopicOverallData> {
    const response = await api.get(`/tests/topics/${topicId}`);
    return response.data.data;
  },

  // Get topic 3-test overall performance
  async getTopicOverall(topicId: string): Promise<TopicOverallData> {
    const response = await api.get(`/tests/topics/${topicId}/overall`);
    return response.data.data;
  },

  // Get test details & questions
  async getTest(testId: string) {
    const response = await api.get(`/tests/${testId}`);
    return response.data.data;
  },

  // Start or resume test (attempt #1)
  async startTest(testId: string): Promise<ActiveTestResponse> {
    return startAttempt(testId, false);
  },

  // Start retest (attempt #2) — only allowed if original score <= 10
  async startRetest(testId: string): Promise<ActiveTestResponse> {
    return startAttempt(testId, true);
  },

  // Save student answer
  async saveAnswer(attemptId: string, questionId: string, selectedOption: string) {
    const response = await api.post(`/tests/attempts/${attemptId}/answer`, {
      questionId,
      selectedOption,
    });
    return response.data.data;
  },

  // Submit test
  async submitTest(attemptId: string): Promise<TestResultData> {
    const response = await api.post(`/tests/attempts/${attemptId}/submit`);
    return response.data.data;
  },

  // Get test result
  async getTestResult(attemptId: string): Promise<TestResultData> {
    const response = await api.get(`/tests/attempts/${attemptId}/result`);
    return response.data.data;
  },

  // Get student monthly weekend activity and participation
  async getMonthlyActivity(year?: number, month?: number): Promise<MonthlyActivityData> {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/tests/activity/monthly${query}`);
    return response.data.data;
  },
};
