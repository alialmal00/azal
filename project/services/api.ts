// src/services/api.ts
import axios from 'axios';

// =============================================
// 📍 تنظیمات پایه
// =============================================
const API_URL = import.meta.env.VITE_API_URL || 'https://api.azmoonik.ir/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // ✅ ارسال کوکی به همراه درخواست
  timeout: 30000, // ۳۰ ثانیه تایم‌اوت
});

// =============================================
// 📤 Interceptor برای درخواست‌ها (Request)
// =============================================
api.interceptors.request.use(
  (config) => {
    // 🐛 لاگ درخواست (برای دیباگ)
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    
    // 📝 اگر توکن در localStorage دارید، می‌توانید به هدر اضافه کنید
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// =============================================
// 📥 Interceptor برای پاسخ‌ها (Response)
// =============================================
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    // 🚫 خطای ۴۰۱ (Unauthorized) - توکن منقضی شده
    if (error.response?.status === 401) {
      console.warn('🔒 Session expired or invalid token');
      
      // حذف توکن و کوکی
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // 🔄 ریدایرکت به صفحه لاگین (اگر در مرورگر هستیم)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // 🚫 خطای ۴۰۳ (Forbidden)
    if (error.response?.status === 403) {
      console.warn('⛔ Access denied');
    }
    
    // 🚫 خطای ۵۰۰ (Server Error)
    if (error.response?.status === 500) {
      console.error('💥 Server error:', error.response?.data?.message || 'Unknown error');
    }
    
    // 📡 خطای Network (ارتباط با سرور)
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - Server is not responding');
    }
    
    // 🐛 لاگ کامل خطا
    console.error('❌ Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

// =============================================
// 🛠️ توابع کمکی (Helper Functions)
// =============================================

// 📌 تابع برای تنظیم توکن در هدر
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// 📌 تابع برای گرفتن توکن از کوکی
export const getTokenFromCookie = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

// 📌 تابع برای تنظیم کوکی (دستی)
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

// 📌 تابع برای حذف کوکی
export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// =============================================
// 📦 سرویس‌های مخصوص هر بخش
// =============================================

// 🔐 سرویس احراز هویت
export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getMe: () =>
    api.get('/auth/me'),
  
  selectRole: (role: string) =>
    api.post('/auth/select-role', { role }),
  
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// 📝 سرویس آزمون‌ها
export const examService = {
  // شروع آزمون (با افزایش مصرف)
  startExam: (data: any) =>
    api.post('/exams/start', data),
  
  saveExam: (data: any) =>
    api.post('/exams/save', data),
  
  getMyExams: (params?: any) =>
    api.get('/exams', { params }),
  
  getExamById: (id: number) =>
    api.get(`/exams/${id}`),
  
  getStats: () =>
    api.get('/exams/stats'),
  
  updateExam: (id: number, data: any) =>
    api.put(`/exams/${id}`, data),
  
  deleteExam: (id: number) =>
    api.delete(`/exams/${id}`),
};

// 👨‍🏫 سرویس کلاس‌ها
export const classService = {
  getMyClasses: () =>
    api.get('/classes/class/my-classes'),
  
  getClassMembers: (classId: number) =>
    api.get(`/classes/class/${classId}/members`),
  
  joinClass: (code: string) =>
    api.post('/classes/class/join', { code }),
  
  createClass: (data: { name: string; description?: string; subject?: string; grade_level?: string }) =>
    api.post('/classes/class/create', data),
  
  leaveClass: (classId: number) =>
    api.post(`/classes/class/${classId}/leave`),
  
  removeMember: (classId: number, userId: number) =>
    api.delete(`/classes/class/${classId}/member/${userId}`),
  
  getClassById: (classId: number) =>
    api.get(`/classes/class/${classId}`),
  
  // سازمان
  addMemberToOrganization: (email: string, role: string) =>
    api.post('/classes/organization/add-member', { email, role }),
  
  getOrganizationMembers: () =>
    api.get('/classes/organization/members'),
};

// 📝 سرویس آزمون‌های کلاسی
export const classExamService = {
  getClassExams: (classId: number) =>
    api.get(`/class-exams/class/${classId}/exams`),
  
  getMyExams: (classId?: number) =>
    api.get(`/class-exams/my-exams${classId ? `?classId=${classId}` : ''}`),
  
  submitExam: (examId: number, answers: any, timeSpent: number) =>
    api.post(`/class-exams/exam/${examId}/submit`, { answers, time_spent: timeSpent }),
  
  getMyResults: (classId?: number) =>
    api.get(`/class-exams/my-results${classId ? `?classId=${classId}` : ''}`),
  
  getExamResults: (examId: number) =>
    api.get(`/class-exams/exam/${examId}/results`),
  
  getClassProgress: (classId: number) =>
    api.get(`/class-exams/class/${classId}/progress`),
};

// 🎫 سرویس تیکت‌ها
export const ticketService = {
  getMyTickets: () =>
    api.get('/tickets/my'),
  
  getTicketById: (id: number) =>
    api.get(`/tickets/my/${id}`),
  
  createTicket: (data: any) =>
    api.post('/tickets', data),
  
  replyToTicket: (id: number, message: string) =>
    api.post(`/tickets/my/${id}/reply`, { message }),
  
  closeTicket: (id: number) =>
    api.put(`/tickets/my/${id}/close`),
  
  reopenTicket: (id: number) =>
    api.put(`/tickets/my/${id}/reopen`),
};

// 💬 سرویس مشاوره
export const advisorService = {
  chat: (data: { message: string; userRole: string; history?: any[]; userName?: string }) =>
    api.post('/advisor/chat', data),
};

// 💰 سرویس اشتراک
export const subscriptionService = {
  getPlans: (panelType?: string) =>
    api.get(`/subscription/plans${panelType ? `?panel=${panelType}` : ''}`),
  
  getMySubscription: () =>
    api.get('/subscription/my'),
  
  getUsage: () =>
    api.get('/subscription/usage'),
  
  purchase: (planId: string, duration: string) =>
    api.post('/subscription/purchase', { planId, duration }),
  
  getBilling: () =>
    api.get('/subscription/billing'),
  
  cancel: () =>
    api.post('/subscription/cancel'),
  
  getLimits: () =>
    api.get('/subscription/limits'),
};

// =============================================
export default api;