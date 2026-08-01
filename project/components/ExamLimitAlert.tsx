// src/components/ExamLimitAlert.tsx
import React from 'react';
import { FiAlertTriangle, FiShoppingBag, FiX } from 'react-icons/fi';

interface ExamLimitAlertProps {
  type: 'exam' | 'advisor' | 'storage' | 'class';
  planName: string;
  maxValue: number;
  usedValue: number;
  onUpgrade?: () => void;
  onClose?: () => void;
}

const ExamLimitAlert: React.FC<ExamLimitAlertProps> = ({
  type,
  planName,
  maxValue,
  usedValue,
  onUpgrade,
  onClose
}) => {
  const config = {
    exam: {
      title: 'سقف آزمون ماهانه',
      message: `شما ${usedValue} از ${maxValue} آزمون ماهانه خود را استفاده کرده‌اید.`,
      icon: '📝'
    },
    advisor: {
      title: 'سقف پیام مشاور',
      message: `شما ${usedValue} از ${maxValue} پیام مشاور ماهانه خود را استفاده کرده‌اید.`,
      icon: '💬'
    },
    storage: {
      title: 'سقف فضای ذخیره‌سازی',
      message: `شما ${usedValue} از ${maxValue} مگابایت فضای ذخیره‌سازی خود را استفاده کرده‌اید.`,
      icon: '💾'
    },
    class: {
      title: 'سقف تعداد کلاس',
      message: `شما ${usedValue} از ${maxValue} کلاس مجاز خود را ایجاد کرده‌اید.`,
      icon: '🏫'
    }
  };

  const info = config[type];
  const isFull = usedValue >= maxValue;

  return (
    <div className={`exam-limit-alert ${isFull ? 'full' : 'warning'}`}>
      <div className="exam-limit-icon">{info.icon}</div>
      <div className="exam-limit-content">
        <h4>{info.title}</h4>
        <p>{info.message}</p>
        {isFull && (
          <p className="exam-limit-full">
            ⚠️ سقف مصرف شما کامل شده است. برای ادامه، اشتراک خود را ارتقا دهید.
          </p>
        )}
        <div className="exam-limit-bar">
          <div 
            className="exam-limit-bar-fill"
            style={{ 
              width: `${Math.min((usedValue / maxValue) * 100, 100)}%`,
              background: isFull ? '#ef4444' : (usedValue / maxValue) >= 0.8 ? '#f59e0b' : '#10b981'
            }}
          />
        </div>
        <div className="exam-limit-numbers">
          <span>{usedValue} استفاده شده</span>
          <span>حداکثر {maxValue}</span>
        </div>
      </div>
      <div className="exam-limit-actions">
        {isFull && (
          <button className="exam-limit-upgrade" onClick={onUpgrade}>
            <FiShoppingBag /> ارتقا اشتراک
          </button>
        )}
        {onClose && (
          <button className="exam-limit-close" onClick={onClose}>
            <FiX />
          </button>
        )}
      </div>

      <style>{`
        .exam-limit-alert {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 14px;
          border-right: 4px solid;
          margin: 12px 0;
          background: #f8fafc;
        }

        .exam-limit-alert.warning {
          border-right-color: #f59e0b;
          background: #fffbeb;
        }

        .exam-limit-alert.full {
          border-right-color: #ef4444;
          background: #fef2f2;
        }

        .exam-limit-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .exam-limit-content {
          flex: 1;
        }

        .exam-limit-content h4 {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .exam-limit-content p {
          margin: 0 0 6px 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .exam-limit-full {
          color: #ef4444 !important;
          font-weight: 500;
        }

        .exam-limit-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin: 8px 0;
        }

        .exam-limit-bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.5s ease;
        }

        .exam-limit-numbers {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .exam-limit-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .exam-limit-upgrade {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .exam-limit-upgrade:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }

        .exam-limit-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
        }

        @media (max-width: 768px) {
          .exam-limit-alert {
            flex-direction: column;
            text-align: center;
          }
          .exam-limit-actions {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ExamLimitAlert;