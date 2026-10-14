import { api } from './api';
import {
  StaffDashboardStats,
  StudentListItem,
  StudentDetailView,
  BatchAnalyticsData,
  LiveMonitoringData,
  PortalControlData,
} from '../types';

export const studentService = {
  async getStaffStats(): Promise<StaffDashboardStats> {
    const response = await api.get<{ success: boolean; data: StaffDashboardStats }>('/admin/stats');
    return response.data.data;
  },

  async getAllStudents(): Promise<StudentListItem[]> {
    const response = await api.get<{ success: boolean; data: StudentListItem[] }>('/admin/students');
    return response.data.data;
  },

  async getStudentDetails(rollNumber: string): Promise<StudentDetailView> {
    const response = await api.get<{ success: boolean; data: StudentDetailView }>(`/admin/students/${rollNumber}`);
    return response.data.data;
  },

  async getBatchAnalytics(): Promise<BatchAnalyticsData> {
    const response = await api.get<{ success: boolean; data: BatchAnalyticsData }>('/admin/analytics');
    return response.data.data;
  },

  async getLiveMonitoring(): Promise<LiveMonitoringData> {
    const response = await api.get<{ success: boolean; data: LiveMonitoringData }>('/admin/live-monitoring');
    return response.data.data;
  },

  async getPortalControl(): Promise<PortalControlData> {
    const response = await api.get<{ success: boolean; data: PortalControlData }>('/admin/portal-control');
    return response.data.data;
  },

  async updatePortalControl(
    mode: 'AUTOMATIC_WEEKEND' | 'MANUAL_OPEN' | 'MANUAL_CLOSED',
    note?: string
  ): Promise<PortalControlData> {
    const response = await api.post<{ success: boolean; data: PortalControlData }>('/admin/portal-control', {
      mode,
      note,
    });
    return response.data.data;
  },
};
