// src/components/NotificationList.tsx
import React from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle, FiUsers, FiBookOpen, FiVideo, FiMessageSquare } from 'react-icons/fi';
import type { Notification } from '../services/notificationService';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onClose: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'exam_reminder':
    case 'exam_deadline':
      return <FiBookOpen size={18} />;
    case 'online_class':
      return <FiVideo size={18} />;
    case 'ticket_answer':
      return <FiMessageSquare size={18} />;
    case 'class_join':
      return <FiUsers size={18} />;
    case 'system':
      return <FiAlertCircle size={18} />;
    default:
      return <FiClock size={18} />;
  }
};

const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'لحظاتی پیش';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} روز پیش`;
};

const NotificationList: React.FC<NotificationListProps> = ({ notifications, loading, onMarkAsRead, onClose }) => {
  if (loading) {
    return <div className="notif-loading">در حال بارگذاری...</div>;
  }

  if (notifications.length === 0) {
    return <div className="notif-empty">هیچ اعلانی وجود ندارد</div>;
  }

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) onMarkAsRead(notif.id);
    if (notif.link) {
      window.location.href = notif.link;
      onClose();
    }
  };

  return (
    <div className="notification-list">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
          onClick={() => handleClick(notif)}
        >
          <div className="notif-icon">
            {getIcon(notif.type)}
          </div>
          <div className="notif-content">
            <div className="notif-title">{notif.title}</div>
            <div className="notif-message">{notif.message}</div>
            <div className="notif-time">{getTimeAgo(notif.created_at)}</div>
          </div>
          {!notif.is_read && <div className="notif-dot"></div>}
        </div>
      ))}
      <style>{`
        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        .notification-item:hover {
          background: #f9fafb;
        }
        .notification-item.unread {
          background: #eff6ff;
        }
        .notif-icon {
          width: 36px;
          height: 36px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
        }
        .notif-content {
          flex: 1;
        }
        .notif-title {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        .notif-message {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }
        .notif-time {
          font-size: 0.65rem;
          color: #9ca3af;
          margin-top: 4px;
        }
        .notif-dot {
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
        }
        .notif-loading, .notif-empty {
          text-align: center;
          padding: 32px;
          color: #9ca3af;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default NotificationList;