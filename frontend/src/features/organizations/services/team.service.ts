import { api } from '../../../shared/lib/api';
import type { TeamMember } from '../../../shared/types';

export const teamService = {
  getMembers: async (orgId: string): Promise<TeamMember[]> => {
    const response = await api.get(`/organizations/${orgId}/members`);
    return response.data;
  },
  
  addMember: async (orgId: string, email: string, role: string): Promise<void> => {
    await api.post(`/organizations/${orgId}/members`, { email, role });
  },
  
  removeMember: async (orgId: string, membershipId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/members/${membershipId}`);
  },
  
  updateMemberRole: async (orgId: string, membershipId: string, role: string): Promise<void> => {
    await api.patch(`/organizations/${orgId}/members/${membershipId}/role`, { role });
  }
};