import { api } from '../../../shared/lib/api';

export interface ProjectMetrics {
  totalCompleted: number;
  avgHoursToComplete: number;
}

export interface TimelineEvent {
  date: string;
  eventsCount: number;
}

export const analyticsService = {
  getMetrics: async (projectId: string): Promise<ProjectMetrics> => {
    const response = await api.get(`/projects/${projectId}/analytics/metrics`);
    return response.data;
  },
  
  getTimeline: async (projectId: string): Promise<TimelineEvent[]> => {
    const response = await api.get(`/projects/${projectId}/analytics/timeline`);
    return response.data;
  }
};