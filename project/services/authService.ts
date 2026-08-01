// src/services/authService.ts
import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  role_selected?: boolean;
}

class AuthService {
  async register(name: string, email: string, password: string) {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      console.log('Register response:', response.data);
      
      if (response.data.success && response.data.data) {
        return { success: true, user: response.data.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در ثبت‌نام' };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data) {
        return { success: true, user: response.data.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در ورود' };
    }
  }

  async selectRole(role: string) {
    try {
      const response = await api.post('/auth/select-role', { role });
      console.log('Select role response:', response.data);
      
      if (response.data.success && response.data.data) {
        return { success: true, user: response.data.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.error('Select role error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در انتخاب نقش' };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getMe(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      console.log('Get me response:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data.user;
      }
      return null;
    } catch (error: any) {
      console.error('Get me error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();