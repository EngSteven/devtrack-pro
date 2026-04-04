import { api } from '../../../shared/lib/api';

export const usersService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (data: { name: string }) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
  
  deleteAccount: async () => {
    await api.delete('/users/me');
  }
  
};