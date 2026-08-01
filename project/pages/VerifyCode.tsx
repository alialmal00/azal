// src/pages/VerifyCode.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../index';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowRight, FiCopy } from 'react-icons/fi';

const VerifyCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phoneFromUrl = searchParams.get('phone') || '';
  const testCodeFromUrl = searchParams.get('code') || '';
  const navigate = useNavigate();
  const { verifyCode, resendCode } = useContext(AuthContext);

  const [phone, setPhone] = useState(phoneFromUrl);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [testCode, setTestCode] = useState(testCodeFromUrl);

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
    if (testCodeFromUrl && testCodeFromUrl.length === 6) {
      setCode(testCodeFromUrl);
    }
  }, [phone, navigate, testCodeFromUrl]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleVerify = async () => {
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError('لطفاً کد ۶ رقمی را به طور کامل وارد کنید');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await verifyCode(phone, cleanCode);
    setLoading(false);

    if (result.success) {
      setSuccess('✅ حساب کاربری شما با موفقیت تأیید شد');
      setTimeout(() => navigate('/app'), 1500);
    } else {
      setError(result.message || '❌ کد تأیید نامعتبر است');
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    const result = await resendCode(phone);
    setIsResending(false);
    
    if (result.success) {
      setSuccess('✅ کد جدید با موفقیت ارسال شد');
      setCountdown(60);
      setCanResend(false);
      setCode('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || '❌ خطا در ارسال مجدد کد');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <FiCheckCircle size={32} color="#2563eb" />
          </div>
          <h2 style={styles.title}>✅ تأیید حساب کاربری</h2>
          <p style={styles.subtitle}>
            کد ۶ رقمی ارسال شده به شماره <strong>{phone}</strong> را وارد کنید
          </p>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={styles.successMessage}>
            <FiCheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <div style={styles.content}>
          {testCode && process.env.NODE_ENV === 'development' && (
            <div style={styles.testCodeBox}>
              <span>🔑 کد تست: <strong>{testCode}</strong></span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(testCode);
                  setSuccess('✅ کد تست کپی شد!');
                  setTimeout(() => setSuccess(''), 2000);
                }}
                style={styles.copyBtn}
              >
                <FiCopy size={14} /> کپی
              </button>
            </div>
          )}

          {/* ✅ ورودی کد - با direction: ltr برای ورود صحیح اعداد */}
          <div style={styles.codeInputWrapper}>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="کد ۶ رقمی را وارد کنید"
              disabled={loading || isResending}
              style={styles.codeInput}
              autoFocus
              dir="ltr"
              maxLength={6}
            />
            <div style={styles.codeLength}>
              {code.length} / ۶
            </div>
          </div>

          <div style={styles.hint}>
            📱 کد تأیید به شماره موبایل شما ارسال شد
          </div>

          <button onClick={handleVerify} disabled={loading || isResending || code.length !== 6} style={styles.button}>
            {loading ? (
              <>
                <FiLoader style={styles.spinner} />
                در حال تأیید...
              </>
            ) : (
              'تأیید حساب کاربری'
            )}
          </button>

          <div style={styles.resend}>
            {canResend ? (
              <button onClick={handleResend} style={styles.resendBtn} disabled={isResending}>
                {isResending ? 'در حال ارسال...' : '🔄 ارسال مجدد کد'}
              </button>
            ) : (
              <span style={styles.timer}>ارسال مجدد کد در {countdown} ثانیه</span>
            )}
          </div>

          <div style={styles.links}>
            <Link to="/login" style={styles.linkBtn}>
              ← بازگشت به ورود
            </Link>
          </div>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  testCodeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '12px',
    fontSize: '0.9rem',
    color: '#92400e',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
  },
  codeInputWrapper: {
    position: 'relative',
  },
  codeInput: {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '1.5rem',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: '8px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    // ✅ کلید اصلی: LTR برای ورود درست اعداد
    direction: 'ltr',
    height: '70px',
  },
  codeLength: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  hint: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem',
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
  resend: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
  },
  timer: {
    opacity: 0.7,
  },
  linkBtn: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
  },
};

export default VerifyCode;