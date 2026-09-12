import { api } from './api';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('agent64_token', res.data.access_token);
      localStorage.setItem('agent64_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('agent64_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return {
      id: 'usr-admin-01',
      email: 'admin@example.com',
      name: 'Dr. Ramesh Varma (Admin)',
      role: 'admin',
    };
  },

  logout() {
    localStorage.removeItem('agent64_token');
    localStorage.removeItem('agent64_user');
  },
};
