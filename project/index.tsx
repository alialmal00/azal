import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import './styles/app.css';
import './styles/auth.css';
import './styles/role-select.css';
import './styles/landing.css';
import './styles/homepage.css';
import './styles/joinClass.css';
import './styles/studentClasses.css';
import './styles/classManager.css';
import './styles/classExamManager.css';
import './styles/exam-config.css';
import './styles/footer.css';
import './styles/admin.css';
import './styles/advisor.css';
import './styles/pdf-preview.css';

import api from './services/api';
import { EntitlementsProvider } from './context/EntitlementsContext';

// ==================== Pages ====================
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SelectRole from './pages/SelectRole';
import App from './App';
import AdminDashboard from './pages/AdminDashboard';
import TakeClassExam from './pages/TakeClassExam';

// ==================== صفحات محتوایی ====================
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';

// ==================== Types & Context ====================
export interface User {
  id: number;
  name: string;
  phone: string;
  role?: string;
  role_selected?: boolean;
  createdAt?: string;
  avatar?: string;
  is_verified?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  verifyCode: (phone: string, code: string) => Promise<{ success: boolean; message?: string }>;
  resendCode: (phone: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (phone: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (phone: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  selectRole: (role: string) => Promise<{ success: boolean; message?: string }>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  verifyCode: async () => ({ success: false }),
  resendCode: async () => ({ success: false }),
  forgotPassword: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  selectRole: async () => ({ success: false }),
  updateUser: () => {},
  checkAuth: async () => {},
});

// ==================== Auth Provider ====================
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const authCheckDoneRef = React.useRef(false);

  const checkAuth = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking authentication...');
      const response = await api.get('/auth/me');
      console.log('Check auth response:', response.data);

      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', userData.name);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ Not authenticated');
      }
    } catch (error: any) {
      console.error('Check auth error:', error.response?.status, error.response?.data?.message);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 🔐 ورود
  // ============================================
  const login = React.useCallback(async (phone: string, password: string) => {
    try {
      console.log('🔐 Logging in:', phone);
      const response = await api.post('/auth/login', { phone, password });
      console.log('Login response:', response.data);

      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      
      // ✅ اگر کاربر تأیید نشده باشد
      if (response.data.requiresVerification) {
        return {
          success: false,
          message: response.data.message || 'حساب کاربری شما تأیید نشده است. کد تأیید جدید ارسال شد.',
          requiresVerification: true,
        };
      }
      
      return { success: false, message: response.data.message || 'خطا در ورود' };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        return {
          success: false,
          message: error.response?.data?.message || 'حساب کاربری شما تأیید نشده است.',
          requiresVerification: true,
        };
      }
      
      return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
    }
  }, []);

  // ============================================
  // 📝 ثبت‌نام
  // ============================================
  const register = React.useCallback(async (data: any) => {
    try {
      console.log('📝 Registering:', data.phone);
      const response = await api.post('/auth/register', data);
      console.log('Register response:', response.data);

      if (response.data.success) {
        return { 
          success: true, 
          message: '✅ کد تأیید به شماره موبایل شما ارسال شد. لطفاً کد را وارد کنید.',
          data: response.data.data
        };
      }
      return { success: false, message: response.data.message || 'خطا در ثبت‌نام' };
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
    }
  }, []);

  // ============================================
  // ✅ تأیید کد
  // ============================================
  const verifyCode = React.useCallback(async (phone: string, code: string) => {
    try {
      console.log('✅ Verifying code for:', phone);
      const response = await api.post('/auth/verify', { phone, code });
      console.log('Verify response:', response.data);

      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, message: '✅ حساب کاربری شما با موفقیت تأیید شد' };
      }
      return { success: false, message: response.data.message || '❌ کد تأیید نامعتبر است' };
    } catch (error: any) {
      console.error('Verify error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در تأیید کد' };
    }
  }, []);

  // ============================================
  // 🔄 ارسال مجدد کد
  // ============================================
  const resendCode = React.useCallback(async (phone: string) => {
    try {
      console.log('📤 Resending code for:', phone);
      const response = await api.post('/auth/resend-verification', { phone });
      console.log('Resend response:', response.data);

      if (response.data.success) {
        return { success: true, message: '✅ کد جدید با موفقیت ارسال شد' };
      }
      return { success: false, message: response.data.message || 'خطا در ارسال کد' };
    } catch (error: any) {
      console.error('Resend error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ارسال کد' };
    }
  }, []);

  // ============================================
  // 🔑 فراموشی رمز عبور
  // ============================================
  const forgotPassword = React.useCallback(async (phone: string) => {
    try {
      console.log('🔑 Forgot password for:', phone);
      const response = await api.post('/auth/forgot-password', { phone });
      console.log('Forgot password response:', response.data);

      if (response.data.success) {
        return { success: true, message: '✅ کد بازیابی رمز عبور به شماره موبایل شما ارسال شد' };
      }
      return { success: false, message: response.data.message || 'خطا در ارسال کد' };
    } catch (error: any) {
      console.error('Forgot password error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
    }
  }, []);

  // ============================================
  // 🔐 بازیابی رمز عبور
  // ============================================
  const resetPassword = React.useCallback(async (phone: string, code: string, newPassword: string) => {
    try {
      console.log('🔐 Resetting password for:', phone);
      const response = await api.post('/auth/reset-password', { phone, code, newPassword });
      console.log('Reset password response:', response.data);

      if (response.data.success) {
        return { success: true, message: '✅ رمز عبور شما با موفقیت تغییر کرد' };
      }
      return { success: false, message: response.data.message || 'خطا در تغییر رمز عبور' };
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
    }
  }, []);

  // ============================================
  // 🎭 انتخاب نقش
  // ============================================
  const selectRole = React.useCallback(async (role: string) => {
    try {
      console.log('🎭 Selecting role:', role);
      const response = await api.post('/auth/select-role', { role });
      console.log('Select role response:', response.data);

      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'خطا در انتخاب نقش' };
    } catch (error: any) {
      console.error('Select role error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'خطا در ارتباط با سرور' };
    }
  }, []);

  // ============================================
  // 🚪 خروج
  // ============================================
  const logout = React.useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ============================================
  // 👤 به‌روزرسانی کاربر
  // ============================================
  const updateUser = React.useCallback((userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  }, [user]);

  // ============================================
  // 🔄 چک کردن احراز هویت در شروع
  // ============================================
  React.useEffect(() => {
    if (authCheckDoneRef.current) return;
    authCheckDoneRef.current = true;
    checkAuth();
  }, [checkAuth]);

  const contextValue = React.useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      register,
      verifyCode,
      resendCode,
      forgotPassword,
      resetPassword,
      selectRole,
      updateUser,
      checkAuth,
    }),
    [
      isAuthenticated,
      user,
      login,
      logout,
      register,
      verifyCode,
      resendCode,
      forgotPassword,
      resetPassword,
      selectRole,
      updateUser,
      checkAuth,
    ]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// ==================== Route Guards ====================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RoleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.role_selected || !user.role) {
    return <Navigate to="/select-role" replace />;
  }
  return <>{children}</>;
};

// ==================== Loading Component ====================
const LoadingScreen = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      flexDirection: 'column',
      gap: '20px',
    }}
  >
    <div className="spinner-large" />
    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>در حال بارگذاری آزمونیک...</p>
    <style>{`
      .spinner-large {
        width: 60px;
        height: 60px;
        border: 5px solid #e2e8f0;
        border-top: 5px solid #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

// ==================== Main App ====================
const RootApp = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EntitlementsProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyCode />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />

          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <RoleGuard>
                  <App />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/take-class-exam"
            element={
              <ProtectedRoute>
                <RoleGuard>
                  <TakeClassExam />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute>
                <RoleGuard>
                  <App />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute>
                <RoleGuard>
                  <App />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/university/*"
            element={
              <ProtectedRoute>
                <RoleGuard>
                  <App />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/panel" element={<Navigate to="/app" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />

          <Route
            path="*"
            element={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <h1 style={{ fontSize: '3rem', color: '#64748b' }}>۴۰۴</h1>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
                  صفحه مورد نظر یافت نشد
                </p>
                <button
                  onClick={() => (window.location.href = '/')}
                  style={{
                    padding: '12px 24px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  بازگشت به صفحه اصلی
                </button>
              </div>
            }
          />
        </Routes>
        </EntitlementsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// ==================== Render ====================
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);