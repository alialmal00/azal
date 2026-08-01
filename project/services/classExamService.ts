// src/services/classExamService.ts
import api from './api';

export interface ClassExam {
  id: number;
  class_id: number;
  teacher_id: number;
  title: string;
  description: string;
  exam_data: any;
  config: any;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  class_name?: string;
  teacher_name?: string;
  submission_count?: number;
  avg_score?: number;
  submission_id?: number;
  submission_status?: string;
  score?: number;
  score_percentage?: number;
}

export interface ExamSubmission {
  id: number;
  exam_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  answers: any;
  score: number;
  total_points: number;
  score_percentage: number;
  correct_count: number;
  wrong_count: number;
  time_spent: number;
  submitted_at: string;
}

export interface OnlineClass {
  id: number;
  class_id: number;
  teacher_id: number;
  title: string;
  description: string;
  meet_link: string;
  scheduled_at: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  class_name?: string;
  teacher_name?: string;
  attendee_count?: number;
  has_joined?: boolean;
  bbb_meeting_id?: string;
  bbb_is_running?: boolean;
  bbb_participant_count?: number;
  record?: boolean;
  started_at?: string;
  ended_at?: string;
}

class ClassExamService {
  // ========== آزمون‌های کلاسی ==========
  
  async createExam(data: {
    class_id: number;
    title: string;
    description?: string;
    exam_data: any;
    config?: any;
  }): Promise<{ success: boolean; exam?: ClassExam; message?: string }> {
    try {
      const payload = {
        class_id: Number(data.class_id),
        title: String(data.title).trim(),
        description: data.description ? String(data.description).trim() : '',
        exam_data: data.exam_data,
        config: data.config || {}
      };
      
      const response = await api.post('/class-exams/exam/create', payload);
      return { success: true, exam: response.data.data.exam, message: response.data.message };
    } catch (error: any) {
      console.error('Create exam error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ایجاد آزمون' };
    }
  }

  async getClassExams(classId: number): Promise<{ success: boolean; exams?: ClassExam[]; message?: string }> {
    try {
      const response = await api.get(`/class-exams/class/${classId}/exams`);
      return { success: true, exams: response.data.data.exams };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت آزمون‌ها' };
    }
  }

  async getExamById(examId: number): Promise<{ success: boolean; exam?: ClassExam; message?: string }> {
    try {
      const response = await api.get(`/class-exams/exam/${examId}`);
      return { success: true, exam: response.data.data.exam };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت آزمون' };
    }
  }

  async updateExam(examId: number, data: any): Promise<{ success: boolean; exam?: ClassExam; message?: string }> {
    try {
      const response = await api.put(`/class-exams/exam/${examId}`, data);
      return { success: true, exam: response.data.data.exam, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در به‌روزرسانی آزمون' };
    }
  }

  async publishExam(examId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/class-exams/exam/${examId}/publish`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در انتشار آزمون' };
    }
  }

  async deleteExam(examId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/class-exams/exam/${examId}`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در حذف آزمون' };
    }
  }

  async getMyExams(classId?: number): Promise<{ success: boolean; exams?: ClassExam[]; message?: string }> {
    try {
      const url = classId ? `/class-exams/my-exams?classId=${classId}` : '/class-exams/my-exams';
      const response = await api.get(url);
      return { success: true, exams: response.data.data.exams };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت آزمون‌ها' };
    }
  }

  async submitExam(examId: number, answers: any, timeSpent: number): Promise<{ 
    success: boolean; 
    score?: number; 
    totalPoints?: number; 
    scorePercentage?: number;
    message?: string;
  }> {
    try {
      const response = await api.post(`/class-exams/exam/${examId}/submit`, { 
        answers, 
        time_spent: timeSpent 
      });
      return { 
        success: true, 
        score: response.data.data.score,
        totalPoints: response.data.data.totalPoints,
        scorePercentage: response.data.data.scorePercentage,
        message: response.data.message 
      };
    } catch (error: any) {
      console.error('Submit exam error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطا در ثبت پاسخ‌ها' 
      };
    }
  }

  async getExamResults(examId: number): Promise<{ success: boolean; results?: ExamSubmission[]; stats?: any; message?: string }> {
    try {
      const response = await api.get(`/class-exams/exam/${examId}/results`);
      return { success: true, results: response.data.data.results, stats: response.data.data.stats };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت نتایج' };
    }
  }

  async getMyResults(classId?: number): Promise<{ success: boolean; results?: any[]; message?: string }> {
    try {
      const url = classId ? `/class-exams/my-results?classId=${classId}` : '/class-exams/my-results';
      const response = await api.get(url);
      return { success: true, results: response.data.data.results };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت نتایج' };
    }
  }

  async getClassProgress(classId: number): Promise<{ success: boolean; progress?: any[]; classStats?: any; message?: string }> {
    try {
      const response = await api.get(`/class-exams/class/${classId}/progress`);
      return { success: true, progress: response.data.data.progress, classStats: response.data.data.classStats };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت آمار پیشرفت' };
    }
  }

  // ========== کلاس آنلاین (BigBlueButton) ==========

  async createOnlineClass(data: {
    class_id: number;
    title: string;
    description?: string;
    scheduled_at: string;
    duration?: number;
    record?: boolean;
  }): Promise<{ success: boolean; onlineClass?: OnlineClass; message?: string }> {
    try {
      const response = await api.post('/class-exams/online/create', data);
      return { success: true, onlineClass: response.data.data.onlineClass, message: response.data.message };
    } catch (error: any) {
      console.error('Create online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ایجاد کلاس آنلاین' };
    }
  }

  async getOnlineClasses(classId: number): Promise<{ success: boolean; onlineClasses?: OnlineClass[]; message?: string }> {
    try {
      const response = await api.get(`/class-exams/online/class/${classId}`);
      return { success: true, onlineClasses: response.data.data.onlineClasses };
    } catch (error: any) {
      console.error('Get online classes error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت جلسات' };
    }
  }

  async getMyOnlineClasses(): Promise<{ success: boolean; onlineClasses?: OnlineClass[]; message?: string }> {
    try {
      const response = await api.get('/class-exams/online/my-classes');
      return { success: true, onlineClasses: response.data.data.onlineClasses };
    } catch (error: any) {
      console.error('Get my online classes error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت جلسات' };
    }
  }

  async getOnlineClassDetails(onlineClassId: number): Promise<{ 
    success: boolean; 
    onlineClass?: OnlineClass; 
    message?: string 
  }> {
    try {
      const response = await api.get(`/class-exams/online/${onlineClassId}/details`);
      return { success: true, onlineClass: response.data.data.onlineClass };
    } catch (error: any) {
      console.error('Get online class details error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت اطلاعات جلسه' };
    }
  }

  async startOnlineClass(onlineClassId: number): Promise<{ 
    success: boolean; 
    joinLink?: string; 
    message?: string 
  }> {
    try {
      const response = await api.post(`/class-exams/online/${onlineClassId}/start`);
      return { 
        success: true, 
        joinLink: response.data.data.joinLink,
        message: response.data.message 
      };
    } catch (error: any) {
      console.error('Start online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در شروع جلسه' };
    }
  }

  async endOnlineClass(onlineClassId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/class-exams/online/${onlineClassId}/end`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('End online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در پایان جلسه' };
    }
  }

  async joinOnlineClass(onlineClassId: number): Promise<{ 
    success: boolean; 
    joinLink?: string; 
    onlineClass?: OnlineClass;
    message?: string 
  }> {
    try {
      const response = await api.post(`/class-exams/online/${onlineClassId}/join`);
      if (response.data.success) {
        return { 
          success: true, 
          joinLink: response.data.data.joinLink,
          onlineClass: response.data.data.onlineClass,
          message: response.data.message 
        };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.error('Join online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ورود به جلسه' };
    }
  }

  async leaveOnlineClass(onlineClassId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/class-exams/online/${onlineClassId}/leave`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Leave online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ثبت خروج' };
    }
  }

  async getOnlineClassStats(onlineClassId: number): Promise<{ 
    success: boolean; 
    stats?: any; 
    message?: string 
  }> {
    try {
      const response = await api.get(`/class-exams/online/${onlineClassId}/stats`);
      return { success: true, stats: response.data.data.stats };
    } catch (error: any) {
      console.error('Get online class stats error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت آمار' };
    }
  }

  async deleteOnlineClass(onlineClassId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/class-exams/online/${onlineClassId}`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Delete online class error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در حذف جلسه' };
    }
  }

  async getOnlineClassRecordings(onlineClassId: number): Promise<{ 
    success: boolean; 
    recordings?: any[]; 
    message?: string 
  }> {
    try {
      const response = await api.get(`/class-exams/online/${onlineClassId}/recordings`);
      if (response.data.success) {
        return { success: true, recordings: response.data.data.recordings || [] };
      }
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.error('Get recordings error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت ضبط‌ها' };
    }
  }
}

export const classExamService = new ClassExamService();