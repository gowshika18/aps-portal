import { api } from './api';
import { Topic, TopicCategory } from '../types';

export const topicService = {
  async getAllTopics(category?: TopicCategory): Promise<Topic[]> {
    const params = category ? { category } : {};
    const response = await api.get<{ success: boolean; data: Topic[] }>('/topics', { params });
    return response.data.data;
  },

  async getTopicById(id: string): Promise<Topic> {
    const response = await api.get<{ success: boolean; data: Topic }>(`/topics/${id}`);
    return response.data.data;
  },
};
