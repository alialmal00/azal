// services/ticketService.ts
import api from './api';

export interface Ticket {
  id: number;
  user_id: number;
  full_name: string;
  email?: string;
  user_email?: string;
  phone: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
  answered_at: string | null;
  closed_at: string | null;
  replies_count: number;
  admin_replies_count: number;
  replies?: TicketReply[];
  user_name?: string;
}

export interface TicketReply {
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

export interface Category {
  id: number;
  name: string;
  name_fa: string;
  icon: string;
  sort_order: number;
}

export interface TicketStats {
  total: number;
  pending: number;
  answered: number;
  closed: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

class TicketService {
  // دریافت دسته‌بندی‌ها
  async getCategories(): Promise<{ success: boolean; categories?: Category[]; message?: string }> {
    try {
      const response = await api.get('/tickets/categories');
      return { success: true, categories: response.data.data.categories };
    } catch (error: any) {
      console.error('Get categories error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت دسته‌بندی‌ها' };
    }
  }

  // ثبت تیکت جدید
  async submitTicket(data: {
    full_name?: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
    priority?: string;
  }): Promise<{ success: boolean; ticket?: Ticket; message?: string }> {
    try {
      console.log('📤 Submitting ticket to /tickets');
      console.log('Data:', data);
      
      const response = await api.post('/tickets', data);
      console.log('📥 Submit response:', response.data);
      
      return { success: true, ticket: response.data.data.ticket, message: response.data.message };
    } catch (error: any) {
      console.error('Submit ticket error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطا در ثبت تیکت. لطفاً دوباره تلاش کنید.' 
      };
    }
  }

  // دریافت تیکت‌های من (کاربر)
  async getMyTickets(filters?: { status?: string; category?: string }): Promise<{
    success: boolean;
    tickets?: Ticket[];
    stats?: TicketStats;
    categories?: Category[];
    message?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      
      const url = params.toString() ? `/tickets/my?${params}` : '/tickets/my';
      console.log('📤 Fetching my tickets from:', url);
      
      const response = await api.get(url);
      console.log('📥 My tickets response:', response.data);
      
      return {
        success: true,
        tickets: response.data.data.tickets || [],
        stats: response.data.data.stats,
        categories: response.data.data.categories
      };
    } catch (error: any) {
      console.error('Get my tickets error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت تیکت‌ها' };
    }
  }

  // دریافت یک تیکت با جزئیات (کاربر)
  async getTicketById(id: number): Promise<{ success: boolean; ticket?: Ticket; message?: string }> {
    try {
      const url = `/tickets/my/${id}`;
      console.log(`📤 Fetching ticket ${id} from:`, url);
      
      const response = await api.get(url);
      console.log('📥 Ticket detail response:', response.data);
      
      return { success: true, ticket: response.data.data.ticket };
    } catch (error: any) {
      console.error('Get ticket error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت تیکت' };
    }
  }

  // افزودن پاسخ به تیکت (کاربر)
  async addReply(id: number, message: string): Promise<{ success: boolean; reply?: TicketReply; message?: string }> {
    try {
      const url = `/tickets/my/${id}/reply`;
      console.log(`📤 Adding reply to ticket ${id} at:`, url);
      
      const response = await api.post(url, { message });
      console.log('📥 Reply response:', response.data);
      
      return { success: true, reply: response.data.data.reply, message: response.data.message };
    } catch (error: any) {
      console.error('Add reply error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در ثبت پاسخ' };
    }
  }

  // بستن تیکت (کاربر)
  async closeTicket(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/tickets/my/${id}/close`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Close ticket error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در بستن تیکت' };
    }
  }

  // باز کردن مجدد تیکت (کاربر)
  async reopenTicket(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/tickets/my/${id}/reopen`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Reopen ticket error:', error);
      return { success: false, message: error.response?.data?.message || 'خطا در باز کردن تیکت' };
    }
  }
}

export const ticketService = new TicketService();