// src/pages/SelectRole.tsx
import React, { useState, useEffect, useContext } from 'react';
import { FiUser, FiUsers, FiBookOpen, FiArrowRight, FiCheckCircle, FiTarget, FiAward, FiCheck, FiX } from 'react-icons/fi';
import { AuthContext } from '../index';
import api from '../services/api';
import logoImg from '../assets/images/logo.png';
import '../styles/role-select.css';

const SelectRole = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [userName, setUserName] = useState('');
  const { user, login, checkAuth } = useContext(AuthContext);
  const selectRoleLoadDone = React.useRef(false);

  useEffect(() => {
    if (selectRoleLoadDone.current) return;
    const loadUser = async () => {
      try {
        if (user && user.name) {
          setUserName(user.name);
          selectRoleLoadDone.current = true;
          return;
        }
        
        const response = await api.get('/auth/me');
        console.log('📥 GetMe response:', response.data);
        
        if (response.data.success && response.data.data?.user) {
          const userData = response.data.data.user;
          setUserName(userData.name || '');
          selectRoleLoadDone.current = true;
          if (login) {
            login(userData);
          }
        } else {
          selectRoleLoadDone.current = true;
          window.location.href = '/login';
        }
      } catch (err) {
        selectRoleLoadDone.current = true;
        console.error('Error loading user:', err);
        window.location.href = '/login';
      }
    };
    loadUser();
  }, [user, login]);

  const roles = [
    {
      id: 'student',
      title: 'دانش‌آموز',
      icon: <FiUser size={48} />,
      description: 'آزمون دهید، عملکردتان را تحلیل کنید، پیشرفت کنید',
      features: [
        'آزمون‌های شخصی‌سازی شده',
        'تحلیل هوشمند نقاط ضعف',
        'پیگیری پیشرفت تحصیلی',
        'دسترسی به منابع آموزشی'
      ],
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)'
    },
    {
      id: 'teacher',
      title: 'معلم',
      icon: <FiUsers size={48} />,
      description: 'آزمون ایجاد کنید، کلاس‌ها را مدیریت کنید، دانش‌آموزان را راهنمایی کنید',
      features: [
        'ساخت آزمون هوشمند',
        'مدیریت کلاس‌های درسی',
        'بررسی عملکرد دانش‌آموزان',
        'گزارش‌گیری پیشرفته'
      ],
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
    },
    {
      id: 'university',
      title: 'دانشجو',
      icon: <FiBookOpen size={48} />,
      description: 'آزمون‌های تخصصی دانشگاهی، تحلیل پیشرفت، آمادگی برای امتحانات',
      features: [
        'آزمون‌های تخصصی رشته‌ای',
        'تحلیل پیشرفت دروس تخصصی',
        'آمادگی برای کنکور ارشد و دکتری',
        'مدیریت پروژه‌های دانشگاهی',
        'رزومه علمی'
      ],
      color: '#1e3a5f',
      gradient: 'linear-gradient(135deg, #1e3a5f, #2c5f8a)'
    }
  ];

  const getRoleName = (roleId: string): string => {
    const roleNames: Record<string, string> = {
      student: 'دانش‌آموز',
      teacher: 'معلم',
      university: 'دانشجو'
    };
    return roleNames[roleId] || roleId;
  };

  const handleConfirm = async () => {
    if (!selectedRole) {
      setError('لطفاً یک نقش را انتخاب کنید');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📤 Sending select role request:', selectedRole);
      
      const response = await api.post('/auth/select-role', { role: selectedRole });
      console.log('📥 Select role response:', response.data);
      
      if (response.data.success) {
        // ذخیره نام نقش برای نمایش در پیام
        const roleName = getRoleName(selectedRole);
        setNewRoleName(roleName);
        
        // نمایش Toast موفقیت
        setShowSuccessToast(true);
        
        // بعد از 2 ثانیه به صفحه اصلی برو
        setTimeout(() => {
          window.location.href = '/app';
        }, 2000);
        
      } else {
        setError(response.data.message || 'خطا در انتخاب نقش');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Select role error:', err);
      
      if (err.response?.status === 401) {
        setError('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'خطا در ارتباط با سرور');
      }
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/app';
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="role-select-container">
      {/* Toast نوتیفیکیشن موفقیت */}
      {showSuccessToast && (
        <div className="success-toast">
          <div className="toast-content">
            <div className="toast-icon">
              <FiCheck size={20} />
            </div>
            <div className="toast-text">
              <strong>موفقیت!</strong>
              <span>نقش شما با موفقیت به "{newRoleName}" تغییر کرد.</span>
            </div>
            <button className="toast-close" onClick={() => setShowSuccessToast(false)}>
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      <header className="role-header">
        <div className="container">
          <div className="logo">
            <img src={logoImg} alt="آزمونیک" className="logo-img" />
            <span>آزمونیک</span>
          </div>
          {userName && (
            <div className="user-info">
              <div className="user-avatar">{userName.charAt(0)}</div>
              <span>خوش آمدید {userName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="role-main">
        <div className="container">
          <div className="role-intro">
            <h1>نوع حساب کاربری خود را انتخاب کنید</h1>
            <p className="subtitle">
              لطفاً یکی از گزینه‌های زیر را انتخاب کنید. این انتخاب تعیین‌کننده امکانات و دسترسی‌های شما خواهد بود.
            </p>
            <div className="selection-info">
              <FiCheckCircle />
              <span>می‌توانید بعداً در تنظیمات پروفایل این انتخاب را تغییر دهید</span>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              ❌ {error}
            </div>
          )}

          <div className="role-grid">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.id)}
                style={{ '--role-color': role.color, '--role-gradient': role.gradient } as React.CSSProperties}
                data-role={role.id}
              >
                <div className="card-header">
                  <div className="role-icon" style={{ background: role.gradient }}>{role.icon}</div>
                  <h3>{role.title}</h3>
                </div>
                <div className="card-body">
                  <p className="role-description">{role.description}</p>
                  <div className="role-features">
                    <h4><FiAward /> امکانات اصلی</h4>
                    <ul>
                      {role.features.map((feature, idx) => (
                        <li key={idx}><FiCheckCircle /> {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="card-footer">
                  {selectedRole === role.id ? (
                    <div className="selected-badge"><FiCheckCircle /> انتخاب شده</div>
                  ) : (
                    <button className="select-btn" onClick={() => setSelectedRole(role.id)}>
                      انتخاب این پنل <FiArrowRight />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="role-actions">
            <button 
              className="btn-outline" 
              onClick={handleBack}
              disabled={loading}
            >
              بازگشت
            </button>
            <button 
              className="btn-primary" 
              onClick={handleConfirm} 
              disabled={!selectedRole || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  در حال انتقال...
                </>
              ) : (
                <>
                  ادامه با پنل {selectedRoleData?.title || ''}
                  <FiArrowRight />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="role-footer">
        <div className="container">
          <p>© ۱۴۰۴ آزمونیک - پلتفرم هوشمند آزمون و یادگیری</p>
          <div className="footer-links">
            <a href="/about">درباره ما</a>
            <a href="/contact">تماس با ما</a>
            <a href="/terms">قوانین و مقررات</a>
          </div>
        </div>
      </footer>

      <style>{`
        .role-select-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
        }

        /* ========== Toast موفقیت ========== */
        .success-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          left: 20px;
          z-index: 9999;
          animation: toastSlideIn 0.3s ease;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast-content {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
          max-width: 450px;
          margin: 0 auto;
        }

        .toast-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .toast-text {
          flex: 1;
        }

        .toast-text strong {
          display: block;
          color: white;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }

        .toast-text span {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
        }

        .toast-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* ========== هدر با لوگو ========== */
        .role-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .role-header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        .logo span {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #475569;
          font-weight: 500;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .role-main {
          padding: 3rem 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .role-intro {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .role-intro h1 {
          font-size: 2.5rem;
          color: #1e293b;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .selection-info {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 0.95rem;
        }

        .role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .role-grid {
            grid-template-columns: 1fr;
          }
        }

        .role-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .role-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .role-card.selected {
          border-color: var(--role-color);
          box-shadow: 0 20px 50px rgba(var(--role-color-rgb), 0.2);
        }

        .card-header {
          padding: 2rem 2rem 1.5rem;
          text-align: center;
        }

        .role-icon {
          width: 90px;
          height: 90px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .card-header h3 {
          font-size: 1.8rem;
          margin: 0;
          font-weight: 700;
        }

        .card-body {
          padding: 1.5rem;
          flex: 1;
        }

        .role-description {
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .role-features {
          background: #f8fafc;
          border-radius: 16px;
          padding: 1.25rem;
        }

        .role-features h4 {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1e293b;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .role-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .role-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0.75rem;
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .role-features li svg {
          color: #10b981;
          flex-shrink: 0;
          font-size: 1rem;
        }

        .card-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .selected-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          font-size: 1.1rem;
          animation: pulse 1.5s infinite;
        }

        .select-btn {
          width: 100%;
          padding: 12px 20px;
          background: white;
          border: 2px solid;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          border-color: var(--role-color);
          color: var(--role-color);
        }

        .select-btn:hover {
          background: var(--role-color);
          color: white;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .role-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .role-actions .btn-outline,
        .role-actions .btn-primary {
          padding: 14px 32px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 220px;
          justify-content: center;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .role-actions .btn-outline {
          background: transparent;
          border: 2px solid #cbd5e1;
          color: #475569;
        }

        .role-actions .btn-outline:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        .role-actions .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
        }

        .role-actions .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .role-actions .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner-small {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-left: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .role-footer {
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 1.5rem 0;
          margin-top: 2rem;
        }

        .role-footer .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .role-footer p {
          color: #64748b;
          margin: 0;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
        }

        .footer-links a {
          color: #2563eb;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: #1d4ed8;
        }

        .role-card[data-role="university"] .role-icon {
          background: linear-gradient(135deg, #1e3a5f, #2c5f8a) !important;
        }

        .role-card[data-role="university"]:hover {
          border-color: #c9a03d !important;
          box-shadow: 0 20px 40px rgba(30, 58, 95, 0.3) !important;
        }

        .role-card[data-role="university"] .select-btn {
          border-color: #1e3a5f;
          color: #1e3a5f;
        }

        .role-card[data-role="university"] .select-btn:hover {
          background: linear-gradient(135deg, #1e3a5f, #2c5f8a) !important;
          color: white !important;
          border-color: transparent !important;
        }

        @media (max-width: 768px) {
          .role-intro h1 {
            font-size: 1.8rem;
          }
          
          .role-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .role-actions .btn-outline,
          .role-actions .btn-primary {
            width: 100%;
            max-width: 300px;
          }
          
          .role-footer .container {
            flex-direction: column;
            text-align: center;
          }
          
          .footer-links {
            justify-content: center;
          }

          .toast-content {
            max-width: 100%;
            margin: 0 10px;
          }

          .toast-text span {
            font-size: 0.75rem;
          }

          .logo-img {
            height: 32px;
          }

          .logo span {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SelectRole;