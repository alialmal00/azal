// src/components/BadgesList.tsx
import React from 'react';
import { FiAward } from 'react-icons/fi';
import type { Badge } from '../services/gamificationService';

interface BadgesListProps {
  badges: Badge[];
}

const BadgesList: React.FC<BadgesListProps> = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="badges-empty">
        <FiAward size={40} />
        <p>هنوز نشان‌ای دریافت نکرده‌اید</p>
        <p className="hint">با شرکت در آزمون‌ها و فعالیت بیشتر نشان دریافت کنید</p>
      </div>
    );
  }

  return (
    <div className="badges-grid">
      {badges.map((badge) => (
        <div key={badge.id} className="badge-card">
          <div className="badge-icon">{badge.icon || '🏅'}</div>
          <h4>{badge.title}</h4>
          <p>{badge.name}</p>
          <span className="badge-date">
            دریافت: {new Date(badge.earned_at).toLocaleDateString('fa-IR')}
          </span>
        </div>
      ))}
      <style>{`
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }
        .badge-card {
          background: white;
          border-radius: 1rem;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        .badge-card:hover {
          transform: translateY(-4px);
        }
        .badge-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .badge-card h4 {
          margin: 0.5rem 0 0.25rem;
          font-size: 1rem;
        }
        .badge-card p {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0 0 0.5rem;
        }
        .badge-date {
          font-size: 0.65rem;
          color: #94a3b8;
        }
        .badges-empty {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          color: #94a3b8;
        }
        .hint {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default BadgesList;