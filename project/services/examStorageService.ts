// src/services/examStorageService.ts
import api from './api';

export interface DashboardStats {
    totalExams: number;
    completedExams: number;
    averageScore: number;
    totalQuestions: number;
    averageTime: number;
    bestScore: number;
    worstScore: number;
    totalCorrect?: number;
    totalWrong?: number;
}

export interface RecentExam {
    id: number;
    title: string;
    score: number;
    date: string;
    time_spent: number;
    total_points?: number;
}

export interface SavedExam {
    id: number;
    exam_title: string;
    exam_type: string;
    difficulty: string;
    score: number;
    total_points: number;
    score_percentage: number;
    correct_count: number;
    wrong_count: number;
    created_at: string;
    completed_at: string;
    is_favorite: boolean;
    tags: string[];
    notes: string;
    status: string;
    time_spent: number;
}

export interface SavedExamDetail extends SavedExam {
    exam_data: any;
    user_answers: any;
    config: any;
}

class ExamStorageService {
    async saveExam(
        examData: any,
        userAnswers: Record<string, any>,
        config: any,
        results: {
            score: number;
            totalPoints: number;
            scorePercentage: number;
            correctAnswersCount: number;
            wrongAnswersCount: number;
            examTitle: string;
            timeSpent?: number;
        }
    ) {
        try {
            // ✅ فقط از api استفاده کن، نیازی به چک کردن token نیست
            const response = await api.post('/exams/save', {
                examData,
                userAnswers,
                config,
                results
            });
            
            if (response.data.success) {
                return {
                    success: true,
                    examId: response.data.data.examId,
                    message: 'آزمون با موفقیت ذخیره شد'
                };
            }
            
            return { success: false, message: response.data.message || 'خطا در ذخیره آزمون' };
        } catch (error: any) {
            console.error('Save exam error details:', error);
            if (error.response?.status === 401) {
                return { success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید' };
            }
            return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
        }
    }

    async getUserExams(filters?: {
        status?: string;
        exam_type?: string;
        is_favorite?: boolean;
        limit?: number;
    }): Promise<{ success: boolean; exams?: SavedExam[]; message?: string }> {
        try {
            // ✅ حذف چک کردن localStorage - اجازه بده axios درخواست بزند
            const queryParams = new URLSearchParams();
            if (filters?.status) queryParams.append('status', filters.status);
            if (filters?.exam_type) queryParams.append('exam_type', filters.exam_type);
            if (filters?.is_favorite !== undefined) queryParams.append('is_favorite', String(filters.is_favorite));
            if (filters?.limit) queryParams.append('limit', String(filters.limit));
            
            const response = await api.get(`/exams?${queryParams.toString()}`);
            
            if (response.data.success) {
                return { success: true, exams: response.data.data.exams };
            }
            return { success: false, message: response.data.message };
        } catch (error: any) {
            console.error('Get exams error:', error);
            if (error.response?.status === 401) {
                // اگر خطای 401 باشد، کاربر باید دوباره لاگین کند
                return { success: false, message: 'لطفاً دوباره وارد شوید' };
            }
            return { success: false, message: 'خطا در دریافت آزمون‌ها' };
        }
    }

    async getExamById(id: number): Promise<{ success: boolean; exam?: SavedExamDetail; message?: string }> {
        try {
            const response = await api.get(`/exams/${id}`);
            
            if (response.data.success) {
                return { success: true, exam: response.data.data.exam };
            }
            return { success: false, message: response.data.message };
        } catch (error: any) {
            console.error('Get exam error:', error);
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت آزمون' };
        }
    }

    async updateExam(id: number, updates: {
        is_favorite?: boolean;
        tags?: string[];
        notes?: string;
        status?: string;
    }): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await api.put(`/exams/${id}`, updates);
            
            if (response.data.success) {
                return { success: true, message: 'آزمون با موفقیت به‌روزرسانی شد' };
            }
            return { success: false, message: response.data.message };
        } catch (error: any) {
            console.error('Update exam error:', error);
            return { success: false, message: error.response?.data?.message || 'خطا در به‌روزرسانی آزمون' };
        }
    }

    async deleteExam(id: number): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await api.delete(`/exams/${id}`);
            
            if (response.data.success) {
                return { success: true, message: 'آزمون با موفقیت حذف شد' };
            }
            return { success: false, message: response.data.message };
        } catch (error: any) {
            console.error('Delete exam error:', error);
            return { success: false, message: error.response?.data?.message || 'خطا در حذف آزمون' };
        }
    }

    async getUserStats(): Promise<{ 
        success: boolean; 
        stats?: DashboardStats; 
        recentExams?: RecentExam[];
        message?: string 
    }> {
        try {
            const response = await api.get('/exams/stats');
            console.log('📊 Stats API response:', response.data);
            
            if (response.data.success && response.data.data) {
                return { 
                    success: true, 
                    stats: {
                        totalExams: response.data.data.stats.total_exams || 0,
                        completedExams: response.data.data.stats.completed_exams || 0,
                        averageScore: Math.round(response.data.data.stats.avg_score || 0),
                        totalQuestions: response.data.data.stats.total_questions || 0,
                        averageTime: response.data.data.stats.avg_time_minutes || 0,
                        bestScore: response.data.data.stats.best_score || 0,
                        worstScore: response.data.data.stats.worst_score || 0,
                        totalCorrect: response.data.data.stats.total_correct || 0,
                        totalWrong: response.data.data.stats.total_wrong || 0
                    },
                    recentExams: response.data.data.recentExams || []
                };
            }
            return { success: false, message: 'خطا در دریافت آمار' };
        } catch (error: any) {
            console.error('Get stats error:', error);
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت آمار' };
        }
    }
}

export const examStorageService = new ExamStorageService();