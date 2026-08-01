// src/pages/Login.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../index';
import { FiUser, FiLock, FiArrowRight, FiLoader, FiAlertCircle } from 'react-icons/fi';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/app');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone.trim() || !password) {
      setError('لطفاً شماره موبایل و رمز عبور را وارد کنید');
      setLoading(false);
      return;
    }

    try {
      const result = await login(phone, password);
      setLoading(false);

      if (result.success) {
        navigate('/app');
      } else if (result.requiresVerification) {
        // ✅ هدایت به صفحه تأیید کد با شماره موبایل
        navigate(`/verify?phone=${encodeURIComponent(phone)}`);
      } else {
        setError(result.message || 'خطا در ورود');
      }
    } catch (error: any) {
      setLoading(false);
      setError(error.response?.data?.message || 'خطا در ارتباط با سرور');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <FiUser size={32} color="#2563eb" />
          </div>
          <h2 style={styles.title}>🔐 ورود به حساب</h2>
          <p style={styles.subtitle}>به سامانه هوشمند آزمون‌سازی خوش آمدید</p>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>شماره موبایل</label>
            <div style={styles.inputWrapper}>
              <FiUser style={styles.inputIcon} size={18} />
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
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>رمز عبور</label>
            <div style={styles.inputWrapper}>
              <FiLock style={styles.inputIcon} size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                disabled={loading}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              رمز عبور را فراموش کرده‌اید؟
            </Link>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (
              <>
                <FiLoader style={styles.spinner} />
                در حال ورود...
              </>
            ) : (
              <>
                ورود به حساب
                <FiArrowRight size={18} />
              </>
            )}
          </button>

          <div style={styles.registerRow}>
            <span style={styles.registerText}>حساب ندارید؟</span>
            <Link to="/register" style={styles.registerLink}>ثبت‌نام کنید</Link>
          </div>
        </form>
      </div>
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
    maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
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
  forgotRow: {
    textAlign: 'left',
    marginTop: '-8px',
  },
  forgotLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: '500',
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
  registerRow: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  registerText: {
    marginLeft: '4px',
  },
  registerLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
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

export default Login;