// src/types/index.ts
export type ExamType = 'ترکیبی' | 'چهارگزینه‌ای' | 'جای‌خالی' | 'درست/نادرست' | 'پاسخ‌کوتاه';
export type Difficulty = 'آسان' | 'متوسط' | 'سخت';
export type AppState = 'configuring' | 'generating' | 'taking' | 'results' | 'saved-exams' | 'loading' | 'advisor';
export type UserRole = 'student' | 'teacher' | 'university';

export interface ExamConfig {
  source_text: string;
  exam_type: ExamType | string;
  difficulty: Difficulty | string;
  num_questions: number;
  chapter_filter: string;
  user_name: string;
  exam_duration?: number;
}

export interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  q_id: string;
  type: 'mcq' | 'fitb' | 'short' | 'tf';
  prompt: string;
  options?: Option[];
  correct_answer?: string;
  concept_tags: string[];
  difficulty: number;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  type?: string;
  difficulty?: string;
}

export interface GeminiResponse {
  exam: Exam;
  grading_instructions: {
    weights: {
      mcq: number;
      fitb: number;
      short: number;
      tf: number;
    };
  };
  feedback_template: {
    fa: string;
  };
  ui_theme: {
    primary: string;
    accent: string;
    background: string;
    text_on_primary: string;
  };
}

export interface UserAnswers {
  [key: string]: string | boolean;
}

// برای ذخیره‌سازی آزمون
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
  status: 'completed' | 'in_progress' | 'abandoned';
  config?: any;
  time_spent?: number;
}

export interface SavedExamDetail extends SavedExam {
  exam_data: Exam;
  user_answers: UserAnswers;
  config: any;
}

export interface ExamStats {
  total_exams: number;
  total_correct: number;
  total_wrong: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  recent_exams: Array<{
    id: number;
    title: string;
    score: number;
    date: string;
  }>;
}

// مدل کاربر
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_selected?: boolean;
  avatar?: string;
  phone?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

// آمار داشبورد
export interface DashboardStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  totalQuestions: number;
  averageTime: number;
  bestScore: number;
  worstScore: number;
}