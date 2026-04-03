import { api } from '../../../shared/lib/api';
import type { Organization } from '../../../shared/types';

export const organizationsService = {
  getMyOrganizations: async (): Promise<Organization[]> => {
    const response = await api.get('/organizations');
    return response.data;
  },
  createOrganization: async (name: string): Promise<Organization> => {
    const response = await api.post('/organizations', { name });
    return response.data;
  },
  updateOrganization: async (id: string, name: string): Promise<Organization> => {
    const response = await api.patch(`/organizations/${id}`, { name });
    return response.data;
  },
  deleteOrganization: async (id: string): Promise<void> => {
    await api.delete(`/organizations/${id}`);
  }
};