// src/components/AchievementsPage.tsx
import React, { useState, useEffect } from 'react';
import { FiAward, FiTrendingUp, FiStar } from 'react-icons/fi';
import { gamificationService, UserPoints, LeaderboardUser } from '../services/gamificationService';
import UserPointsCard from './UserPointsCard';
import BadgesList from './BadgesList';
import Leaderboard from './Leaderboard';

interface AchievementsPageProps {
  userId: number;
  userName: string;
}

const AchievementsPage: React.FC<AchievementsPageProps> = ({ userId, userName }) => {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard'>('badges');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await gamificationService.getUserPoints();
    if (result.success && result.data) {
      setPoints(result.data);
      setLeaderboard(result.leaderboard || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><p>در حال بارگذاری...</p></div>;
  }

  return (
    <div className="achievements-page">
      <div className="page-header">
        <h1>🏆 دستاوردهای من</h1>
        <p>{userName} عزیز، امتیازات و نشان‌های خود را ببینید</p>
      </div>

      {points && (
        <UserPointsCard points={points.total_points} level={points.level} experience={points.experience} />
      )}

      <div className="achievements-tabs">
        <button className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
          <FiAward /> نشان‌ها
        </button>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <FiTrendingUp /> جدول رتبه‌بندی
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'badges' && (
          <div className="badges-section">
            <h3>نشان‌های کسب شده</h3>
            <BadgesList badges={points?.badges || []} />
          </div>
        )}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <Leaderboard users={leaderboard} />
          </div>
        )}
      </div>

      <style>{`
        .achievements-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          direction: rtl;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }
        .page-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
        }
        .page-header h1 { margin: 0 0 8px 0; font-size: 1.5rem; }
        .page-header p { margin: 0; opacity: 0.8; }
        .achievements-tabs {
          display: flex;
          gap: 10px;
          background: white;
          padding: 8px;
          border-radius: 20px;
          margin-bottom: 24px;
        }
        .tab-btn {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }
        .tab-btn:hover { background: #f1f5f9; }
        .tab-btn.active { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
        .badges-section h3, .leaderboard-section h3 {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
        }
        .loading {
          text-align: center;
          padding: 60px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AchievementsPage;