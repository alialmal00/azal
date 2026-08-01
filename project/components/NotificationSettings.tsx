// src/components/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { FiBell, FiMail, FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { notificationService, NotificationSettings as NotifSettingsType } from '../services/notificationService';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotifSettingsType>({
    exam_reminder: true,
    exam_deadline: true,
    online_class: true,
    ticket_answer: true,
    class_join: true,
    achievements: true,
    system: true,
    email_notification: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await notificationService.getSettings();
    if (result.success && result.data) {
      setSettings(result.data);
    }
    setLoading(false);
  };

  const handleToggle = (key: keyof NotifSettingsType) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await notificationService.updateSettings(settings);
    if (result.success) {
      setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' });
    } else {
      setMessage({ type: 'error', text: result.message || 'خطا در ذخیره تنظیمات' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return <div className="loading">در حال بارگذاری تنظیمات...</div>;
  }

  return (
    <div className="notification-settings-container">
      <div className="settings-header">
        <h2>🔔 تنظیمات اعلان‌ها</h2>
        <p>نوع اعلان‌هایی که می‌خواهید دریافت کنید را انتخاب کنید</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-card">
        <div className="setting-group">
          <h3>📚 آزمون‌ها</h3>
          <div className="setting-item">
            <label>یادآوری زمان شروع آزمون</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.exam_reminder} onChange={() => handleToggle('exam_reminder')} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <label>یادآوری ددلاین آزمون</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.exam_deadline} onChange={() => handleToggle('exam_deadline')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>🎥 کلاس آنلاین</h3>
          <div className="setting-item">
            <label>شروع کلاس آنلاین</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.online_class} onChange={() => handleToggle('online_class')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>💬 پشتیبانی</h3>
          <div className="setting-item">
            <label>پاسخ به تیکت</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.ticket_answer} onChange={() => handleToggle('ticket_answer')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>👥 کلاس‌ها</h3>
          <div className="setting-item">
            <label>عضویت در کلاس</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.class_join} onChange={() => handleToggle('class_join')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>🏆 دستاوردها و امتیازات</h3>
          <div className="setting-item">
            <label>دریافت نوتیفیکیشن دستاوردها</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.achievements} onChange={() => handleToggle('achievements')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>📧 ایمیل</h3>
          <div className="setting-item">
            <label>دریافت اعلان از طریق ایمیل</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.email_notification} onChange={() => handleToggle('email_notification')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <h3>⚙️ سیستمی</h3>
          <div className="setting-item">
            <label>اعلان‌های سیستمی</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.system} onChange={() => handleToggle('system')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'در حال ذخیره...' : <><FiSave /> ذخیره تنظیمات</>}
        </button>
      </div>

      <style>{`
        .notification-settings-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          direction: rtl;
        }
        .settings-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
        }
        .settings-header h2 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
        }
        .settings-header p {
          margin: 0;
          opacity: 0.8;
        }
        .settings-card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .setting-group {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .setting-group h3 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #1e293b;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        .setting-item label:first-child {
          font-size: 0.9rem;
          color: #4b5563;
        }
        .settings-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .settings-message.success { background: #d1fae5; color: #065f46; }
        .settings-message.error { background: #fee2e2; color: #991b1b; }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #2563eb;
        }
        input:checked + .slider:before {
          transform: translateX(24px);
        }
        .save-btn {
          width: 100%;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          margin-top: 16px;
        }
        .save-btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;