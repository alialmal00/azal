// src/components/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import NotificationList from './NotificationList';
import { notificationService } from '../services/notificationService';
import api from '../services/api';

interface NotificationBellProps {
  onNotificationCountChange?: (count: number) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationCountChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    // ✅ دیگر نیازی به چک کردن token در localStorage نیست
    // axios با withCredentials: true کوکی را خودکار ارسال می‌کند
    
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(20);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
        if (onNotificationCountChange) onNotificationCountChange(result.data.unreadCount);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      // اگر خطای 401 بود، لاگین کنید
      if (error.response?.status === 401) {
        // فقط لاگ کن، اجازه بده کامپوننت کار کند
        console.log('🔒 User not authenticated for notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // فقط در صورتی که کاربر لاگین است، اعلان‌ها را بارگذاری کن
    // با بررسی وجود کوکی یا از طریق props می‌توانید این کار را انجام دهید
    loadNotifications();
    
    // هر ۳۰ ثانیه یکبار بروزرسانی
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    loadNotifications();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="اعلان‌ها"
      >
        <FiBell size={22} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>اعلان‌ها</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                همه را خوانده شده علامت بزن
              </button>
            )}
          </div>
          <NotificationList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      <style>{`
        .notification-bell-container { position: relative; }
        .notification-bell-btn { position: relative; background: none; border: none; cursor: pointer; color: #4b5563; padding: 8px; border-radius: 50%; transition: background 0.2s; }
        .notification-bell-btn:hover { background: #f3f4f6; }
        .notification-badge { position: absolute; top: 0; right: 0; background: #ef4444; color: white; font-size: 0.7rem; font-weight: bold; min-width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0 4px; transform: translate(25%, -25%); }
        .notification-dropdown { position: absolute; top: 100%; left: -180px; width: 380px; max-height: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; overflow: hidden; direction: rtl; }
        .notification-dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
        .notification-dropdown-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
        .mark-all-read { background: none; border: none; color: #2563eb; font-size: 0.75rem; cursor: pointer; }
        @media (max-width: 480px) { .notification-dropdown { position: fixed; top: 60px; left: 10px; right: 10px; width: auto; max-width: none; } }
      `}</style>
    </div>
  );
};

export default NotificationBell;