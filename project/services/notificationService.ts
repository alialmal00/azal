// src/services/notificationService.ts
import api from './api';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  scheduled_for: string | null;
  metadata: any;
}

export interface NotificationSettings {
  exam_reminder: boolean;
  exam_deadline: boolean;
  online_class: boolean;
  ticket_answer: boolean;
  class_join: boolean;
  achievements: boolean;
  system: boolean;
  email_notification: boolean;
}

class NotificationService {
  // دریافت لیست اعلان‌ها
  async getNotifications(limit = 50, offset = 0): Promise<{ success: boolean; data?: { notifications: Notification[]; unreadCount: number }; message?: string }> {
    try {
      const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت اعلان‌ها' };
    }
  }

  // علامت زدن یک اعلان به عنوان خوانده شده
  async markAsRead(notificationId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در بروزرسانی اعلان' };
    }
  }

  // علامت زدن همه اعلان‌ها به عنوان خوانده شده
  async markAllAsRead(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put('/notifications/read-all');
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در بروزرسانی اعلان‌ها' };
    }
  }

  // دریافت تنظیمات اعلان کاربر
  async getSettings(): Promise<{ success: boolean; data?: NotificationSettings; message?: string }> {
    try {
      const response = await api.get('/notifications/settings');
      return { success: true, data: response.data.data.settings };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت تنظیمات' };
    }
  }

  // به‌روزرسانی تنظیمات اعلان
  async updateSettings(settings: Partial<NotificationSettings>): Promise<{ success: boolean; data?: NotificationSettings; message?: string }> {
    try {
      const response = await api.put('/notifications/settings', settings);
      return { success: true, data: response.data.data.settings, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در ذخیره تنظیمات' };
    }
  }
}

export const notificationService = new NotificationService();