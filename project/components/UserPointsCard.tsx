// src/components/UserPointsCard.tsx
import React from 'react';
import { FiAward, FiStar } from 'react-icons/fi';

interface UserPointsCardProps {
  points: number;
  level: number;
  experience: number;
}

const UserPointsCard: React.FC<UserPointsCardProps> = ({ points, level, experience }) => {
  // محاسبه تجربه مورد نیاز برای سطح بعدی
  const nextLevelExp = level * 100;
  const currentLevelExp = (level - 1) * 100;
  const progress = ((experience - currentLevelExp) / 100) * 100;

  return (
    <div className="user-points-card">
      <div className="points-header">
        <div className="points-icon">
          <FiStar size={32} />
        </div>
        <div className="points-info">
          <h3>امتیاز کل</h3>
          <p className="points-value">{points.toLocaleString('fa-IR')}</p>
        </div>
        <div className="level-info">
          <h3>سطح</h3>
          <p className="level-value">{level}</p>
        </div>
      </div>
      <div className="exp-bar">
        <div className="exp-label">
          <span>تجربه</span>
          <span>{experience} / {nextLevelExp}</span>
        </div>
        <div className="exp-progress">
          <div className="exp-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
      </div>
      <style>{`
        .user-points-card {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 1.5rem;
          padding: 1.5rem;
          color: white;
          margin-bottom: 1.5rem;
        }
        .points-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .points-icon {
          width: 4rem;
          height: 4rem;
          background: rgba(255,255,255,0.1);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .points-info h3, .level-info h3 {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0 0 0.25rem 0;
        }
        .points-value, .level-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
        }
        .exp-bar {
          margin-top: 0.5rem;
        }
        .exp-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          margin-bottom: 0.25rem;
        }
        .exp-progress {
          background: rgba(255,255,255,0.2);
          border-radius: 1rem;
          height: 0.5rem;
          overflow: hidden;
        }
        .exp-fill {
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          height: 100%;
          border-radius: 1rem;
          transition: width 0.3s;
        }
      `}</style>
    </div>
  );
};

export default UserPointsCard;