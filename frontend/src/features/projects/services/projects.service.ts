import { api } from '../../../shared/lib/api';
import type { Project } from '../../../shared/types';

export const projectsService = {
  getProjectsByOrg: async (orgId: string): Promise<Project[]> => {
    const response = await api.get(`/organizations/${orgId}/projects`);
    return response.data;
  },
  createProject: async (orgId: string, name: string, description?: string): Promise<Project> => {
    const response = await api.post(`/organizations/${orgId}/projects`, { name, description });
    return response.data;
  },
  updateProject: async (orgId: string, projectId: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.patch(`/organizations/${orgId}/projects/${projectId}`, data);
    return response.data;
  },
  deleteProject: async (orgId: string, projectId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/projects/${projectId}`);
  }
};