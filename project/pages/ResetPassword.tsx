// src/pages/ResetPassword.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../index';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowRight } from 'react-icons/fi';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const navigate = useNavigate();
  const { resetPassword } = useContext(AuthContext);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      navigate('/forgot-password');
    }
  }, [phone, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!code || code.length !== 6) {
      setError('لطفاً کد ۶ رقمی ارسال شده را وارد کنید');
      setLoading(false);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setLoading(false);
      return;
    }

    const result = await resetPassword(phone, code, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess('✅ رمز عبور شما با موفقیت تغییر کرد');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message || '❌ خطا در تغییر رمز عبور');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <FiCheckCircle size={32} color="#10b981" />
          </div>
          <h2 style={styles.title}>🔐 تغییر رمز عبور</h2>
          <p style={styles.subtitle}>رمز عبور جدید خود را وارد کنید</p>
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
            <label style={styles.label}>کد بازیابی (۶ رقمی)</label>
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>رمز عبور جدید (حداقل ۸ کاراکتر)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>تکرار رمز عبور جدید</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              disabled={loading}
              style={styles.input}
            />
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
                <FiArrowRight size={18} />
              </>
            )}
          </button>

          <div style={styles.links}>
            <Link to="/login" style={styles.link}>← بازگشت به ورود</Link>
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
    background: '#ecfdf5',
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
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    direction: 'rtl',
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
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
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
};

export default ResetPassword;