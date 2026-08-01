// services/adminTicketService.ts
import axios from 'axios';

const API_URL = 'https://api.azmoonik.ir/api';

export interface AdminTicket {
  id: number;
  user_id: number;
  full_name: string | null;
  phone: string | null;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
  answered_at: string | null;
  closed_at: string | null;
  user_name: string;
  user_email: string;
  user_role: string;
  replies_count: number;
  admin_replies_count: number;
  replies?: AdminTicketReply[];
}

export interface AdminTicketReply {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_name: string;
  user_role: string;
  display_name: string;
}

export interface AdminTicketStats {
  total: number;
  pending: number;
  answered: number;
  closed: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  name_fa: string;
  icon: string;
  sort_order: number;
}

class AdminTicketService {
  async getAllTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    tickets?: AdminTicket[];
    stats?: AdminTicketStats;
    categories?: AdminCategory[];
    message?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      
      const url = params.toString() ? `/admin/tickets?${params}` : '/admin/tickets';
      const response = await axios.get(`${API_URL}${url}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          tickets: response.data.data?.tickets || [],
          stats: response.data.data?.stats,
          categories: response.data.data?.categories
        };
      }
      return { success: false, message: response.data?.message };
    } catch (error: any) {
      console.error('Get tickets error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت تیکت‌ها' };
    }
  }

  async getTicketById(id: number): Promise<{ success: boolean; ticket?: AdminTicket; message?: string }> {
    try {
      const response = await axios.get(`${API_URL}/admin/tickets/${id}`);
      if (response.data && response.data.success) {
        return { success: true, ticket: response.data.data.ticket };
      }
      return { success: false, message: response.data?.message };
    } catch (error: any) {
      console.error('Get ticket error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت تیکت' };
    }
  }

  async addReply(id: number, message: string): Promise<{ success: boolean; reply?: AdminTicketReply; message?: string }> {
    try {
      const response = await axios.post(`${API_URL}/admin/tickets/${id}/reply`, { message });
      if (response.data && response.data.success) {
        return { 
          success: true, 
          reply: response.data.data?.reply, 
          message: response.data.message 
        };
      }
      return { success: false, message: response.data?.message };
    } catch (error: any) {
      console.error('Add reply error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در ثبت پاسخ' };
    }
  }

  async updateTicketStatus(id: number, status: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.put(`${API_URL}/admin/tickets/${id}/status`, { status });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Update status error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در به‌روزرسانی وضعیت' };
    }
  }

  async deleteTicket(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.delete(`${API_URL}/admin/tickets/${id}`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Delete ticket error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در حذف تیکت' };
    }
  }
}

export const adminTicketService = new AdminTicketService();