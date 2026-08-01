// src/components/student/JoinClass.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiLink, FiCheck, FiX, FiUsers, FiBookOpen, 
  FiArrowRight, FiClock, FiUser, FiLogIn, FiHome,
  FiLoader, FiAlertCircle
} from 'react-icons/fi';
import { classService, Class } from '../../services/classService';
import '../../styles/joinClass.css';

interface JoinClassProps {
  onJoined?: () => void;
}

const JoinClass: React.FC<JoinClassProps> = ({ onJoined }) => {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [enteringClassId, setEnteringClassId] = useState<number | null>(null);

  useEffect(() => {
    loadMyClasses();
  }, []);

  const loadMyClasses = async () => {
    setLoadingClasses(true);
    try {
      const result = await classService.getMyClasses();
      console.log('📚 My classes loaded:', result);
      if (result.success && result.classes) {
        setMyClasses(result.classes);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleJoin = async () => {
    // اعتبارسنجی کد
    const cleanCode = classCode.trim().toUpperCase();
    if (!cleanCode) {
      setMessage({ type: 'error', text: 'لطفاً کد کلاس را وارد کنید' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (cleanCode.length < 6 || cleanCode.length > 10) {
      setMessage({ type: 'error', text: 'کد کلاس باید بین 6 تا 10 کاراکتر باشد' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('🔍 Joining class with code:', cleanCode);
      const result = await classService.joinClassByCode(cleanCode);
      console.log('📥 Join result:', result);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'با موفقیت به کلاس پیوستید!' });
        setClassCode('');
        // بارگذاری مجدد کلاس‌ها
        await loadMyClasses();
        if (onJoined) onJoined();
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در پیوستن به کلاس. لطفاً کد را بررسی کنید.' });
      }
    } catch (error: any) {
      console.error('Join error:', error);
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.message || 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleEnterClass = async (classId: number, className: string) => {
    setEnteringClassId(classId);
    try {
      // اینجا می‌توانید به صفحه جزئیات کلاس هدایت کنید
      // فعلاً یک alert نشان می‌دهیم
      console.log(`🚪 Entering class: ${className} (ID: ${classId})`);
      
      // TODO: در آینده به صفحه کلاس هدایت کنید
      // navigate(`/class/${classId}`);
      
      alert(`در حال ورود به کلاس "${className}"...\nاین قابلیت به زودی تکمیل می‌شود.`);
    } catch (error) {
      console.error('Enter class error:', error);
      alert('خطا در ورود به کلاس');
    } finally {
      setEnteringClassId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="join-class-wrapper">
      <div className="join-header">
        <h1>🎓 آزمونیک</h1>
        <p>پلتفرم هوشمند آزمون و یادگیری</p>
      </div>

      {/* کارت اصلی پیوستن به کلاس */}
      <div className="join-main-card">
        <div className="join-card-header">
          <div className="join-icon-circle">
            <FiUsers size={36} />
          </div>
          <h2>پیوستن به کلاس</h2>
          <p>با وارد کردن کد کلاس، به جمع همکلاسی‌های خود بپیوندید</p>
        </div>

        <div className="join-card-body">
          {/* پیام وضعیت */}
          {message && (
            <div className={`status-alert ${message.type}`}>
              {message.type === 'success' ? <FiCheck size={18} /> : 
               message.type === 'error' ? <FiX size={18} /> : 
               <FiAlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* ورودی کد کلاس */}
          <div className="code-input-container">
            <label className="code-input-label">کد کلاس</label>
            <div className="code-input-wrapper">
              <span className="code-input-prefix">
                <FiLink size={16} />
              </span>
              <input
                type="text"
                placeholder="مثال: A1B2C3D4"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="code-input"
                maxLength={10}
                autoFocus
              />
            </div>
            <div className="code-input-hint">
              <span>📌 کد را از معلم خود دریافت کنید</span>
              <span>{classCode.length}/10</span>
            </div>
          </div>

          {/* دکمه پیوستن */}
          <button 
            className="join-action-btn" 
            onClick={handleJoin} 
            disabled={loading || !classCode.trim()}
          >
            {loading ? (
              <>
                <div className="spinner-circle"></div>
                <span>در حال بررسی...</span>
              </>
            ) : (
              <>
                <span>پیوستن به کلاس</span>
                <FiArrowRight />
              </>
            )}
          </button>

          {/* اطلاعات راهنما */}
          <div className="join-info-box">
            <p>
              <FiClock size={14} />
              کد کلاس معمولاً 8 کاراکتری و شامل حروف بزرگ و اعداد است
            </p>
          </div>
        </div>
      </div>

      {/* بخش کلاس‌های من */}
      <div className="my-classes-section">
        <div className="section-header">
          <FiBookOpen size={20} />
          <h3>کلاس‌های من</h3>
        </div>

        {loadingClasses ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner-md"></div>
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.8rem' }}>
              در حال بارگذاری کلاس‌ها...
            </p>
          </div>
        ) : myClasses.length > 0 ? (
          <div className="classes-grid">
            {myClasses.map((cls) => (
              <div 
                key={cls.id} 
                className="class-item-card"
                onClick={() => handleEnterClass(cls.id, cls.name)}
              >
                <div className="class-item-info">
                  <div className="class-avatar">
                    <FiBookOpen size={24} />
                  </div>
                  <div className="class-details">
                    <h4>{cls.name}</h4>
                    <div className="class-meta">
                      <span>
                        <FiUser size={12} />
                        {cls.teacher_name || 'معلم'}
                      </span>
                      <span>
                        <FiLink size={12} />
                        {cls.class_code}
                      </span>
                      {cls.subject && (
                        <span>
                          <FiBookOpen size={12} />
                          {cls.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  className="enter-class-btn"
                  disabled={enteringClassId === cls.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnterClass(cls.id, cls.name);
                  }}
                >
                  {enteringClassId === cls.id ? (
                    <>
                      <div className="spinner-circle"></div>
                      <span>در حال ورود...</span>
                    </>
                  ) : (
                    <>
                      <span>ورود به کلاس</span>
                      <FiLogIn size={14} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <div className="empty-icon-box">
              <FiHome size={32} />
            </div>
            <h4>هنوز به کلاسی نپیوسته‌اید</h4>
            <p>از کد کلاس خود برای پیوستن استفاده کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinClass;