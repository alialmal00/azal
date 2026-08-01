// src/pages/Register.tsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../index';
import { FiUser, FiLock, FiPhone, FiCheckCircle, FiLoader, FiAlertCircle } from 'react-icons/fi';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/app');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.name.trim() || formData.name.length < 3) {
      setError('نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 11) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      setLoading(false);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('لطفاً با قوانین و حریم خصوصی ما موافقت کنید');
      setLoading(false);
      return;
    }

    const result = await register({
      ...formData,
      agreeTerms
    });

    setLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => {
        navigate(`/verify?phone=${encodeURIComponent(formData.phone)}`);
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <FiCheckCircle size={32} color="#2563eb" />
          </div>
          <h2 style={styles.title}>📝 ثبت‌نام در آزمونیک</h2>
          <p style={styles.subtitle}>همین حالا عضو شوید و از امکانات هوشمند ما استفاده کنید</p>
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

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>نام و نام خانوادگی</label>
            <div style={styles.inputWrapper}>
              <FiUser style={styles.inputIcon} size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="علی رضایی"
                disabled={loading}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>شماره موبایل</label>
            <div style={styles.inputWrapper}>
              <FiPhone style={styles.inputIcon} size={18} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                disabled={loading}
                style={styles.input}
                dir="ltr"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>رمز عبور (حداقل ۸ کاراکتر)</label>
            <div style={styles.inputWrapper}>
              <FiLock style={styles.inputIcon} size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                disabled={loading}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>تکرار رمز عبور</label>
            <div style={styles.inputWrapper}>
              <FiLock style={styles.inputIcon} size={18} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                disabled={loading}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
                style={styles.checkbox}
              />
              <span>
                با <Link to="/terms" style={styles.link}>قوانین</Link> و{' '}
                <Link to="/privacy" style={styles.link}>حریم خصوصی</Link> موافقم
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (
              <>
                <FiLoader style={styles.spinner} />
                در حال ثبت‌نام...
              </>
            ) : (
              'ایجاد حساب کاربری'
            )}
          </button>

          <div style={styles.loginRow}>
            <span style={styles.loginText}>قبلاً حساب دارید؟</span>
            <Link to="/login" style={styles.loginLink}>وارد شوید</Link>
          </div>
        </form>
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
    maxWidth: '460px',
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
  checkboxGroup: {
    margin: '4px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.875rem',
    color: '#475569',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#2563eb',
    cursor: 'pointer',
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
  loginRow: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  loginText: {
    marginLeft: '4px',
  },
  loginLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
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
    marginBottom: '8px',
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
    marginBottom: '8px',
  },
};

export default Register;