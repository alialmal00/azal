// src/components/Profile.tsx
import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiSave, FiX, FiCamera, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

interface ProfileProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await api.put('/auth/profile', { name, email });
      if (response.data.success) {
        const updatedUser = { ...user, name, email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdate(updatedUser);
        setMessage({ type: 'success', text: 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'خطا در به‌روزرسانی' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'رمز عبور جدید و تکرار آن مطابقت ندارند' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'خطا در تغییر رمز عبور' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        // TODO: آپلود عکس به سرور
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 پروفایل کاربری</h1>
        <p>اطلاعات شخصی خود را مدیریت کنید</p>
      </div>

      {message && (
        <div className={`profile-message ${message.type}`}>
          {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-content">
        {/* بخش آواتار */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            {avatar ? (
              <img src={avatar} alt="avatar" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">{user?.name?.charAt(0) || 'U'}</div>
            )}
            <label className="avatar-upload">
              <FiCamera size={18} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          </div>
          <h3>{user?.name}</h3>
          <p className="user-role-badge">{user?.role === 'student' ? 'دانش‌آموز' : user?.role === 'teacher' ? 'معلم' : 'سازمان'}</p>
        </div>

        {/* فرم اطلاعات شخصی */}
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-group">
            <label><FiUser /> نام و نام خانوادگی</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label><FiMail /> ایمیل</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'در حال ذخیره...' : <><FiSave /> ذخیره تغییرات</>}
          </button>
        </form>

        {/* بخش تغییر رمز عبور */}
        <div className="password-section">
          <button className="btn-toggle-password" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {showPasswordForm ? <FiX /> : <FiLock />}
            {showPasswordForm ? 'بستن فرم تغییر رمز' : 'تغییر رمز عبور'}
          </button>
          
          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>رمز عبور فعلی</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>رمز عبور جدید</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>تکرار رمز عبور جدید</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-change-password" disabled={loading}>
                {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .profile-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          direction: rtl;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }
        .profile-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
        }
        .profile-header h1 { margin: 0 0 8px 0; font-size: 1.5rem; }
        .profile-header p { margin: 0; opacity: 0.8; }
        .profile-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .profile-message.success { background: #d1fae5; color: #065f46; }
        .profile-message.error { background: #fee2e2; color: #991b1b; }
        .profile-content {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .avatar-section {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .avatar-wrapper {
          position: relative;
          display: inline-block;
        }
        .avatar-image, .avatar-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder {
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }
        .avatar-upload {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #2563eb;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }
        .user-role-badge {
          display: inline-block;
          background: #e2e8f0;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          margin-top: 8px;
        }
        .profile-form, .password-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #1e293b;
        }
        .form-group input {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .btn-save, .btn-change-password {
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-save:hover, .btn-change-password:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }
        .password-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        .btn-toggle-password {
          background: none;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #475569;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .profile-content { padding: 20px; }
        }
      `}</style>
    </div>
  );
};

export default Profile;