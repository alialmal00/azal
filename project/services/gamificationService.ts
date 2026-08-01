// src/services/gamificationService.ts
import api from './api';

export interface UserPoints {
  total_points: number;
  level: number;
  experience: number;
  badges: Badge[];
}

export interface Badge {
  id: number;
  name: string;
  title: string;
  icon: string;
  earned_at: string;
}

export interface LeaderboardUser {
  id: number;
  name: string;
  role: string;
  total_points: number;
  level: number;
}

class GamificationService {
  async getUserPoints(): Promise<{ success: boolean; data?: UserPoints; leaderboard?: LeaderboardUser[]; message?: string }> {
    try {
      const response = await api.get('/gamification/my-points');
      return { success: true, data: response.data.data.points, leaderboard: response.data.data.leaderboard };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت امتیازات' };
    }
  }
}

export const gamificationService = new GamificationService();