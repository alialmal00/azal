// src/pages/ForgotPassword.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../index';
import { FiArrowRight, FiPhone, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

const ForgotPassword: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { forgotPassword, resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!phone.trim() || phone.length < 11) {
      setMessage({ type: 'error', text: 'لطفاً شماره موبایل معتبر وارد کنید' });
      setLoading(false);
      return;
    }

    const result = await forgotPassword(phone);
    setLoading(false);

    if (result.success) {
      setCodeSent(true);
      setMessage({ type: 'success', text: '✅ کد بازیابی به شماره موبایل شما ارسال شد' });
    } else {
      setMessage({ type: 'error', text: result.message || '❌ خطا در ارسال کد بازیابی' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!code || code.length !== 6) {
      setMessage({ type: 'error', text: 'لطفاً کد ۶ رقمی را وارد کنید' });
      setLoading(false);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'رمز عبور باید حداقل ۸ کاراکتر باشد' });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'رمز عبور و تکرار آن مطابقت ندارند' });
      setLoading(false);
      return;
    }

    const result = await resetPassword(phone, code, newPassword);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: '✅ رمز عبور شما با موفقیت تغییر کرد' });
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setMessage({ type: 'error', text: result.message || '❌ خطا در تغییر رمز عبور' });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* هدر */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <FiPhone size={32} color="#2563eb" />
          </div>
          <h2 style={styles.title}>🔑 فراموشی رمز عبور</h2>
          <p style={styles.subtitle}>
            {!codeSent 
              ? 'شماره موبایل خود را وارد کنید تا کد بازیابی دریافت کنید' 
              : 'کد ارسال شده و رمز جدید را وارد کنید'
            }
          </p>
        </div>

        {/* پیام وضعیت */}
        {message && (
          <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
            {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* فرم ارسال کد */}
        {!codeSent ? (
          <form onSubmit={handleSendCode} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>شماره موبایل</label>
              <div style={styles.inputWrapper}>
                <FiPhone style={styles.inputIcon} size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  disabled={loading}
                  style={styles.input}
                  dir="ltr"
                />
              </div>
              <p style={styles.hint}>کد بازیابی به این شماره ارسال خواهد شد</p>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <FiLoader style={styles.spinner} />
                  در حال ارسال...
                </>
              ) : (
                <>
                  ارسال کد بازیابی
                  <FiArrowRight size={18} />
                </>
              )}
            </button>

            <div style={styles.links}>
              <Link to="/login" style={styles.link}>← بازگشت به ورود</Link>
            </div>
          </form>
        ) : (
          /* فرم بازیابی رمز */
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>کد بازیابی (۶ رقمی)</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  disabled={loading}
                  style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontFamily: 'monospace' }}
                  dir="ltr"
                  maxLength={6}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>رمز عبور جدید (حداقل ۸ کاراکتر)</label>
              <div style={styles.inputWrapper}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>تکرار رمز عبور جدید</label>
              <div style={styles.inputWrapper}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <FiLoader style={styles.spinner} />
                  در حال تغییر...
                </>
              ) : (
                <>
                  تغییر رمز عبور
                  <FiCheckCircle size={18} />
                </>
              )}
            </button>

            <div style={styles.links}>
              <button 
                type="button" 
                onClick={() => setCodeSent(false)} 
                style={{ ...styles.link, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← بازگشت و ارسال مجدد کد
              </button>
            </div>
          </form>
        )}

        {/* فوتر */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            {!codeSent 
              ? 'هنوز حساب ندارید؟' 
              : 'کد را دریافت نکردید؟'
            }
            <Link to="/register" style={styles.footerLink}>
              {!codeSent ? ' ثبت‌نام کنید' : ' درخواست مجدد'}
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #ede9fe 100%)',
    padding: '20px',
    direction: 'rtl',
    fontFamily: 'Vazirmatn, IRANSans, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '32px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
    animation: 'fadeIn 0.5s ease',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    background: '#eff6ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.875rem',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '14px 44px 14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    direction: 'rtl',
  },
  hint: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    margin: '4px 0 0 0',
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  links: {
    textAlign: 'center',
    marginTop: '4px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  footer: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  footerLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 18px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    color: '#166534',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 18px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    color: '#991b1b',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
};

export default ForgotPassword;