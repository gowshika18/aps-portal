import { api } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(payload: { rollNumber?: string; staffId?: string; username?: string; password: string }): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse; message?: string }>('/auth/login', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<{ success: boolean; data: { user: User }; message?: string }>('/auth/me');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch session profile');
    }
    return response.data.data.user;
  },
};
