// src/components/Leaderboard.tsx
import React from 'react';
import { FiAward } from 'react-icons/fi';
import type { LeaderboardUser } from '../services/gamificationService';

interface LeaderboardProps {
  users: LeaderboardUser[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users }) => {
  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <FiAward size={24} />
        <h3>جدول رتبه‌بندی</h3>
      </div>
      <div className="leaderboard-list">
        {users.map((user, idx) => (
          <div key={user.id} className={`leaderboard-item ${idx < 3 ? 'top' : ''}`}>
            <div className="rank">{idx + 1}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role === 'student' ? 'دانش‌آموز' : user.role === 'teacher' ? 'معلم' : 'سازمان'}
              </span>
            </div>
            <div className="points">
              {getRankIcon(idx) && <span className="rank-icon">{getRankIcon(idx)}</span>}
              <strong>{user.total_points.toLocaleString('fa-IR')}</strong>
              <span>امتیاز</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .leaderboard-container {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .leaderboard-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .leaderboard-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 1rem;
          transition: all 0.2s;
        }
        .leaderboard-item.top {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
        }
        .rank {
          width: 2rem;
          font-weight: 700;
          color: #475569;
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          display: block;
          font-weight: 600;
        }
        .user-role {
          font-size: 0.7rem;
          color: #64748b;
        }
        .points {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 500;
        }
        .rank-icon {
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;