import { api } from '../../../shared/lib/api';
import type { Task } from '../../../shared/types';

export const tasksService = {
  getTasks: async (orgId: string, projectId: string): Promise<Task[]> => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks`);
    return response.data;
  },

  createTask: async (orgId: string, projectId: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.post(`/organizations/${orgId}/projects/${projectId}/tasks`, data);
    return response.data;
  },

  updateTask: async (orgId: string, projectId: string, taskId: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (orgId: string, projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`);
  }
};