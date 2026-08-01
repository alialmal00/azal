// src/App.tsx
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import type { AppState, ExamConfig, GeminiResponse, UserAnswers } from './types';
import { generateExam } from './services/geminiService';
import { examStorageService, SavedExam, SavedExamDetail } from './services/examStorageService';
import ConfigurationForm from './components/ConfigurationForm';
import LoadingView from './components/LoadingView';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import SavedExamsList from './components/SavedExamsList';
import AdvisorPage from './pages/AdvisorPage';
import ClassManager from './components/teacher/ClassManager';
import StudentClasses from './components/student/StudentClasses';
import ProgressChart from './components/ProgressChart';
import Profile from './components/Profile';
import SupportTicket from './components/SupportTicket';
import AchievementsPage from './components/AchievementsPage';
import NotificationBell from './components/NotificationBell';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';
import BillingPage from './pages/dashboard/BillingPage';
import { AuthContext } from './index';
import { useEntitlements } from './context/EntitlementsContext';
import api from './services/api';
import {
  FiUser, FiUsers, FiHome, FiLogOut, FiMenu, FiX,
  FiBook, FiFileText, FiBarChart2, FiCalendar, FiPlus,
  FiMessageSquare, FiGrid, FiTrendingUp, FiAward, FiClock,
  FiStar, FiTarget, FiCheckCircle, FiSettings, FiBell, FiHelpCircle,
  FiShoppingBag, FiCreditCard, FiDollarSign
} from 'react-icons/fi';
import './styles/app.css';
import './styles/footer.css';
import './styles/exam-config.css';
import logoImg from './assets/images/logo.png';

const App: React.FC = () => {
  const { user, isAuthenticated, logout, checkAuth } = useContext(AuthContext);
  // 🏛️ Entitlements مرکزی — منبع واحد محدودیت‌ها (بدون Hard-code محلی)
  const { entitlements, legacy: entLegacy, can: entCan, refresh: refreshEntitlements } = useEntitlements();
  const [renewalBannerDismissed, setRenewalBannerDismissed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // User state
  const [userRole, setUserRole] = useState<string>('student');
  const [userName, setUserName] = useState<string>('');

  // App states
  const [appState, setAppState] = useState<AppState>('configuring');
  const [error, setError] = useState<string | null>(null);
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    source_text: '',
    exam_type: 'ترکیبی',
    difficulty: 'متوسط',
    num_questions: 5,
    chapter_filter: '',
    user_name: '',
    exam_duration: 30
  });
  const [geminiResponse, setGeminiResponse] = useState<GeminiResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Side pages visibility
  const [showAdvisorPage, setShowAdvisorPage] = useState(false);
  const [showClassManager, setShowClassManager] = useState(false);
  const [showStudentClasses, setShowStudentClasses] = useState(false);
  const [showProgressChart, setShowProgressChart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [showBillingPage, setShowBillingPage] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [savedExamsCount, setSavedExamsCount] = useState<number>(0);
  const [viewingExamId, setViewingExamId] = useState<number | null>(null);
  const [viewingExamData, setViewingExamData] = useState<SavedExamDetail | null>(null);
  const configSectionRef = useRef<HTMLDivElement>(null);

  // Subscription & Plan states
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const subscriptionDataLoadedRef = useRef(false);
  const authVerifiedRef = useRef(false);
  const statsLoadedRef = useRef(false);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    totalQuestions: 0,
    averageTime: 0,
    bestScore: 0,
    worstScore: 0
  });

  // ========== تابع کمکی برای دریافت محدودیت‌ها ==========
  const getLimit = useCallback((key: string, fallback: number): number => {
    if (!userLimits) return fallback;
    const fromLimits = userLimits?.limits?.[key];
    const fromPlan = userLimits?.plan?.[key];
    const value = fromLimits ?? fromPlan ?? fallback;
    return typeof value === 'number' ? value : fallback;
  }, [userLimits]);

  // ========== بررسی احراز هویت ==========
  useEffect(() => {
    if (authVerifiedRef.current) return;
    const verifyAuth = async () => {
      console.log('🔍 App: Verifying authentication...');
      await checkAuth();
      setAuthChecked(true);
      authVerifiedRef.current = true;
    };
    verifyAuth();
  }, [checkAuth]);

  // ========== تنظیم نقش و نام کاربر ==========
  useEffect(() => {
    if (user) {
      console.log('📱 App received user:', user);
      setUserRole(user.role || 'student');
      setUserName(user.name || 'کاربر');
    }
  }, [user]);

  // ========== بارگذاری داده‌های اشتراک (اصلاح‌شده) ==========
  const loadSubscriptionData = useCallback(async () => {
    try {
      const response = await api.get('/subscription/my');
      if (response?.data?.success && response?.data?.data) {
        const data = response.data.data;
        setCurrentPlan(data.plan || null);
        setSubscription(data.subscription || null);
        setUsage(data.usage || null);
      } else {
        console.warn('⚠️ Subscription data not available');
        setCurrentPlan(null);
        setSubscription(null);
        setUsage(null);
      }
    } catch (err: any) {
      console.warn('⚠️ Error loading subscription:', err?.response?.status || err?.message);
      // خطا را silent handle می‌کنیم - کاربر ممکن است اشتراک نداشته باشد
      setCurrentPlan(null);
      setSubscription(null);
      setUsage(null);
    }
  }, []);

  // ========== همگام‌سازی با Entitlements مرکزی ==========
  // userLimits از Context تغذیه می‌شود؛ این تابع فقط آن را تازه می‌کند
  const loadUserLimits = useCallback(async () => {
    await refreshEntitlements();
  }, [refreshEntitlements]);

  useEffect(() => {
    if (entLegacy) {
      setUserLimits(entLegacy);
      console.log('📊 Entitlements synced (central):', entLegacy.plan?.name);
    }
  }, [entLegacy]);

  // ========== فراخوانی اشتراک و محدودیت‌ها فقط یک‌بار پس از احراز هویت ==========
  useEffect(() => {
    if (authChecked && isAuthenticated && user && !subscriptionDataLoadedRef.current) {
      subscriptionDataLoadedRef.current = true;
      loadSubscriptionData();
      loadUserLimits();
    }
  }, [authChecked, isAuthenticated, user, loadSubscriptionData, loadUserLimits]);

  // ========== ریدایرکت به لاگین ==========
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      console.log('🚪 Not authenticated, redirecting to login');
      window.location.href = '/login';
    }
  }, [authChecked, isAuthenticated]);

  // ========== لود کردن آمار داشبورد ==========
  const loadDashboardStats = useCallback(async () => {
    if (!user || !user.role_selected) {
      console.log('Skipping stats load - user not ready');
      return;
    }
    try {
      console.log('Loading dashboard stats...');
      const result = await examStorageService.getUserStats();
      console.log('Stats result:', result);
      if (result?.success && result?.stats) {
        setDashboardStats({
          totalExams: result.stats.totalExams || 0,
          completedExams: result.stats.completedExams || 0,
          averageScore: result.stats.averageScore || 0,
          totalQuestions: result.stats.totalQuestions || 0,
          averageTime: result.stats.averageTime || 0,
          bestScore: result.stats.bestScore || 0,
          worstScore: result.stats.worstScore || 0
        });
      }
      const examsResult = await examStorageService.getUserExams({ limit: 100 });
      if (examsResult?.success && examsResult?.exams) {
        setSavedExamsCount(examsResult.exams.length);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.role_selected || statsLoadedRef.current) {
      return;
    }
    statsLoadedRef.current = true;
    loadDashboardStats();
  }, [user, loadDashboardStats]);

  const refreshStats = useCallback(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // ========== اگر احراز هویت بررسی نشده ==========
  if (!authChecked) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ========== Helpers ==========
  const scrollToExamCreator = () => {
    setTimeout(() => {
      if (configSectionRef.current) {
        configSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const firstInput = configSectionRef.current.querySelector('input, textarea');
        if (firstInput && firstInput instanceof HTMLElement) firstInput.focus();
      }
    }, 100);
  };

  const closeAllSidePages = () => {
    setShowClassManager(false);
    setShowStudentClasses(false);
    setShowAdvisorPage(false);
    setShowProgressChart(false);
    setShowProfile(false);
    setShowSupport(false);
    setShowAchievements(false);
    setShowSubscriptionPage(false);
    setShowBillingPage(false);
  };

  const goToExamCreator = () => {
    setAppState('configuring');
    setSidebarOpen(false);
    closeAllSidePages();
    scrollToExamCreator();
  };

  // ========== Exam handlers ==========
  const handleStartExam = async (config: ExamConfig) => {
    setExamConfig(config);
    setAppState('generating');
    setError(null);
    try {
      const response = await generateExam(config);
      if (!response || !response.exam) {
        throw new Error('پاسخ نامعتبر از سرور دریافت شد');
      }
      setGeminiResponse(response);
      setUserAnswers({});
      setAppState('taking');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطا در تولید آزمون');
      setAppState('configuring');
    }
  };

  const handleSubmitExam = (answers: UserAnswers, spentTime: number) => {
    setUserAnswers(answers);
    setTimeSpent(spentTime);
    setAppState('results');
    setTimeout(() => refreshStats(), 1000);
    // 🔄 تازه‌سازی مصرف بعد از اتمام آزمون (همگام با سرور)
    setTimeout(() => loadUserLimits(), 1200);
  };

  const handleRestart = () => {
    setAppState('configuring');
    setGeminiResponse(null);
    setUserAnswers({});
    setError(null);
    setViewingExamId(null);
    setViewingExamData(null);
    setTimeSpent(0);
    refreshStats();
  };

  const handleViewSavedExam = async (examId: number) => {
    setAppState('loading');
    try {
      const result = await examStorageService.getExamById(examId);
      if (result?.success && result?.exam) {
        setViewingExamId(examId);
        setViewingExamData(result.exam);

        const examData = result.exam.exam_data;
        const savedResponse: GeminiResponse = {
          exam: examData,
          grading_instructions: { weights: { mcq: 1, fitb: 2, short: 2, tf: 1 } },
          feedback_template: { fa: result.exam.notes || 'بازخورد آزمون' },
          ui_theme: { primary: '#1E40AF', accent: '#3B82F6', background: '#F9FAFB', text_on_primary: '#FFFFFF' }
        };
        setGeminiResponse(savedResponse);
        setUserAnswers(result.exam.user_answers || {});
        setTimeSpent(result.exam.time_spent || 0);
        setAppState('results');
      } else {
        alert('خطا در دریافت آزمون');
        setAppState('saved-exams');
      }
    } catch (err) {
      console.error('Error viewing saved exam:', err);
      alert('خطا در دریافت آزمون');
      setAppState('saved-exams');
    }
  };

  const handleRecreateExam = (config: any) => {
    setExamConfig({
      source_text: config?.source_text || '',
      exam_type: config?.exam_type || 'ترکیبی',
      difficulty: config?.difficulty || 'متوسط',
      num_questions: config?.num_questions || 5,
      chapter_filter: config?.chapter_filter || '',
      user_name: config?.user_name || userName,
      exam_duration: config?.exam_duration || 30
    });
    setAppState('configuring');
    scrollToExamCreator();
  };

  // ========== Auth actions ==========
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // ========== Navigation for side pages ==========
  const openSidePage = (page: string) => {
    setSidebarOpen(false);
    closeAllSidePages();
    switch (page) {
      case 'advisor': setShowAdvisorPage(true); break;
      case 'classManager': setShowClassManager(true); break;
      case 'studentClasses': setShowStudentClasses(true); break;
      case 'progress': setShowProgressChart(true); break;
      case 'profile': setShowProfile(true); break;
      case 'support': setShowSupport(true); break;
      case 'achievements': setShowAchievements(true); break;
      case 'subscription':
        setShowSubscriptionPage(true);
        setAppState('configuring');
        break;
      case 'billing':
        setShowBillingPage(true);
        setAppState('configuring');
        break;
    }
  };

  const handleNavigateToSavedExams = () => {
    setAppState('saved-exams');
    setSidebarOpen(false);
    closeAllSidePages();
    refreshStats();
  };

  // ========== Role based config ==========
  const roleConfig: Record<string, {
    title: string;
    icon: React.ReactNode;
    quickActions: { label: string; icon: React.ReactNode; action: () => void; color: string }[];
  }> = {
    student: {
      title: 'دانش‌آموز',
      icon: <FiUser />,
      quickActions: [
        { label: 'آزمون جدید', icon: <FiPlus />, action: goToExamCreator, color: '#2563eb' },
        { label: 'آزمون‌های من', icon: <FiFileText />, action: handleNavigateToSavedExams, color: '#10b981' },
        { label: 'کلاس‌های من', icon: <FiUsers />, action: () => openSidePage('studentClasses'), color: '#8b5cf6' },
        { label: 'نمودار پیشرفت', icon: <FiTrendingUp />, action: () => openSidePage('progress'), color: '#f59e0b' },
        { label: 'دستاوردها', icon: <FiAward />, action: () => openSidePage('achievements'), color: '#ec4899' },
        { label: 'مشاوره هوشمند', icon: <FiMessageSquare />, action: () => openSidePage('advisor'), color: '#06b6d4' }
      ]
    },
    teacher: {
      title: 'معلم',
      icon: <FiUsers />,
      quickActions: [
        { label: 'ساخت آزمون جدید', icon: <FiPlus />, action: goToExamCreator, color: '#2563eb' },
        { label: 'مدیریت آزمون‌ها', icon: <FiFileText />, action: handleNavigateToSavedExams, color: '#10b981' },
        { label: 'مدیریت کلاس‌ها', icon: <FiUsers />, action: () => openSidePage('classManager'), color: '#8b5cf6' },
        { label: 'نمودار پیشرفت', icon: <FiTrendingUp />, action: () => openSidePage('progress'), color: '#f59e0b' },
        { label: 'دستاوردها', icon: <FiAward />, action: () => openSidePage('achievements'), color: '#ec4899' },
        { label: 'مشاوره هوشمند', icon: <FiMessageSquare />, action: () => openSidePage('advisor'), color: '#06b6d4' }
      ]
    },
    university: {
      title: 'دانشجو',
      icon: <FiBook />,
      quickActions: [
        { label: 'آزمون تخصصی جدید', icon: <FiPlus />, action: goToExamCreator, color: '#2563eb' },
        { label: 'آزمون‌های ذخیره شده', icon: <FiFileText />, action: handleNavigateToSavedExams, color: '#10b981' },
        { label: 'نمودار پیشرفت', icon: <FiTrendingUp />, action: () => openSidePage('progress'), color: '#f59e0b' },
        { label: 'دستاوردها', icon: <FiAward />, action: () => openSidePage('achievements'), color: '#ec4899' },
        { label: 'مشاوره هوشمند', icon: <FiMessageSquare />, action: () => openSidePage('advisor'), color: '#06b6d4' }
      ]
    }
  };

  const currentRole = roleConfig[userRole] || roleConfig.student;

  // ========== Render side pages ==========
  if (showAdvisorPage) {
    return (
      <AdvisorPage
        userRole={userRole}
        userName={userName}
        onClose={() => setShowAdvisorPage(false)}
        limits={{
          maxAdvisorMessages: getLimit('max_advisor_month', 20),
          maxAdvisorChars: userLimits?.plan?.max_advisor_chars ?? 500,
          advisorUsed: userLimits?.usage?.advisor_used ?? 0
        }}
      />
    );
  }

  if (showClassManager && (userRole === 'teacher' || userRole === 'university')) {
    return (
      <div className="app-container">
        <button onClick={() => setShowClassManager(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <ClassManager
            teacherId={user?.id || 0}
            teacherName={userName}
            userRole={userRole}
            limits={{
              maxClasses: getLimit('max_classes', 1),
              maxStudentsPerClass: getLimit('max_students_class', 2),
              classesCount: userLimits?.usage?.classes_used ?? 0
            }}
          />
        </div>
      </div>
    );
  }

  if (showStudentClasses && userRole === 'student') {
    return (
      <div className="app-container">
        <button onClick={() => setShowStudentClasses(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <StudentClasses
            studentId={user?.id || 0}
            studentName={userName}
            onJoinClass={() => setShowStudentClasses(false)}
          />
        </div>
      </div>
    );
  }

  if (showProgressChart) {
    return (
      <div className="app-container">
        <button onClick={() => setShowProgressChart(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <ProgressChart userId={user?.id || 0} userName={userName} userRole={userRole} />
        </div>
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className="app-container">
        <button onClick={() => setShowProfile(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <Profile user={user} onUpdate={() => {}} />
        </div>
      </div>
    );
  }

  if (showSupport) {
    return (
      <div className="app-container">
        <button onClick={() => setShowSupport(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <SupportTicket user={user} />
        </div>
      </div>
    );
  }

  if (showAchievements) {
    return (
      <div className="app-container">
        <button onClick={() => setShowAchievements(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <AchievementsPage userId={user?.id || 0} userName={userName} />
        </div>
      </div>
    );
  }

  if (showSubscriptionPage) {
    return (
      <div className="app-container">
        <button onClick={() => setShowSubscriptionPage(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <SubscriptionPage />
        </div>
      </div>
    );
  }

  if (showBillingPage) {
    return (
      <div className="app-container">
        <button onClick={() => setShowBillingPage(false)} className="back-button">
          <FiX size={20} /> بازگشت
        </button>
        <div className="app-main">
          <BillingPage />
        </div>
      </div>
    );
  }

  // ========== Main content renderer ==========
  const renderContent = () => {
    switch (appState) {
      case 'generating':
      case 'loading':
        return <LoadingView />;

      case 'taking':
        if (geminiResponse) {
          return (
            <ExamView
              examData={geminiResponse.exam}
              onSubmit={handleSubmitExam}
              duration={examConfig.exam_duration}
              limits={{
                maxQuestions: getLimit('max_questions_exam', 5)
              }}
            />
          );
        }
        return null;

      case 'results':
        if (geminiResponse) {
          return (
            <ResultsView
              response={geminiResponse}
              userAnswers={userAnswers}
              userName={examConfig.user_name || userName}
              onRestart={handleRestart}
              timeSpent={timeSpent}
              examDuration={examConfig.exam_duration}
              canExportPDF={entCan('pdf_export')}
            />
          );
        }
        return null;

      case 'saved-exams':
        return (
          <div className="saved-exams-page">
            <div className="page-header">
              <h2 className="page-title">آزمون‌های ذخیره شده</h2>
              <p className="page-subtitle">{savedExamsCount} آزمون ذخیره شده</p>
            </div>
            <SavedExamsList onViewExam={handleViewSavedExam} onRecreateExam={handleRecreateExam} />
          </div>
        );

      case 'configuring':
      default:
        return (
          <div className="app-content">
            {/* Welcome banner */}
            <div className="welcome-banner">
              <div className="banner-header">
                <div className="role-info">
                  <div className="role-icon">{currentRole.icon}</div>
                  <div>
                    <h2 className="banner-title">پنل {currentRole.title}</h2>
                    <p className="banner-subtitle">سلام {userName} عزیز، به آزمونیک خوش آمدید</p>
                    {currentPlan && (
                      <span className="plan-tag">
                        اشتراک: {currentPlan.name}
                        {subscription && (
                          <span style={{ marginRight: '8px', fontSize: '0.65rem', opacity: 0.8 }}>
                            ({subscription.duration === '1m' ? '۱ ماهه' :
                              subscription.duration === '3m' ? '۳ ماهه' : '۹ ماهه'})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="quick-stats">
                {[
                  { icon: <FiFileText />, value: dashboardStats.totalExams, label: 'آزمون‌ها' },
                  { icon: <FiCalendar />, value: dashboardStats.completedExams, label: 'تکمیل شده' },
                  { icon: <FiBarChart2 />, value: `${dashboardStats.averageScore}%`, label: 'میانگین نمره' },
                  { icon: <FiBook />, value: dashboardStats.totalQuestions, label: 'سوال‌ها' },
                  { icon: <FiClock />, value: `${dashboardStats.averageTime} دقیقه`, label: 'میانگین زمان' }
                ].map((stat, idx) => (
                  <div key={idx} className="stat-card">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-info">
                      <h3>{stat.value}</h3>
                      <p>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="quick-actions">
              <h3 className="section-title">اقدامات سریع</h3>
              <div className="action-grid">
                {currentRole.quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className="action-btn"
                    style={{ '--btn-color': action.color } as React.CSSProperties}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
                <button onClick={() => openSidePage('subscription')} className="action-btn" style={{ '--btn-color': '#8b5cf6' } as React.CSSProperties}>
                  <span className="action-icon"><FiShoppingBag /></span>
                  <span>اشتراک‌ها</span>
                </button>
                <button onClick={() => openSidePage('billing')} className="action-btn" style={{ '--btn-color': '#f59e0b' } as React.CSSProperties}>
                  <span className="action-icon"><FiCreditCard /></span>
                  <span>صورت‌حساب‌ها</span>
                </button>
              </div>
            </div>

            {/* Config section */}
            <div className="config-section" ref={configSectionRef}>
              <h3 className="section-title">ساخت آزمون جدید</h3>
              <ConfigurationForm
                onStartExam={handleStartExam}
                initialConfig={examConfig}
                error={error}
                limits={{
                  maxExams: getLimit('max_exams_month', 2),
                  maxQuestions: getLimit('max_questions_exam', 5),
                  maxFileSize: parseFloat(userLimits?.plan?.max_file_size_mb) || 1.5,
                  examsUsed: userLimits?.usage?.exams_used ?? 0  // ✅ قبلاً اشتباهاً questions_used می‌خواند
                }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Mobile sidebar overlay */}
      <div className={`mobile-sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>منو</h3>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}><FiX size={24} /></button>
        </div>
        <div className="user-info-sidebar">
          <div className="user-avatar">{userName?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <p className="user-name">{userName}</p>
            <p className="user-email">{user?.email || 'ایمیل'}</p>
            <span className="user-role-tag">{currentRole.title}</span>
            {currentPlan && (
              <span className="plan-tag-sidebar">{currentPlan.name}</span>
            )}
          </div>
        </div>
        <div className="sidebar-menu">
          <button onClick={goToExamCreator} className="menu-item"><FiHome className="menu-icon" /><span>داشبورد</span></button>
          <button onClick={goToExamCreator} className="menu-item"><FiPlus className="menu-icon" /><span>آزمون جدید</span></button>
          <button onClick={handleNavigateToSavedExams} className="menu-item">
            <FiFileText className="menu-icon" /><span>آزمون‌های ذخیره شده</span>
            {savedExamsCount > 0 && <span className="menu-badge">{savedExamsCount}</span>}
          </button>
          {(userRole === 'teacher' || userRole === 'university') && (
            <button onClick={() => openSidePage('classManager')} className="menu-item"><FiUsers className="menu-icon" /><span>مدیریت کلاس‌ها</span></button>
          )}
          {userRole === 'student' && (
            <button onClick={() => openSidePage('studentClasses')} className="menu-item"><FiUsers className="menu-icon" /><span>کلاس‌های من</span></button>
          )}
          <button onClick={() => openSidePage('progress')} className="menu-item"><FiTrendingUp className="menu-icon" /><span>نمودار پیشرفت</span></button>
          <button onClick={() => openSidePage('achievements')} className="menu-item"><FiAward className="menu-icon" /><span>دستاوردها</span></button>
          <button onClick={() => openSidePage('advisor')} className="menu-item"><FiMessageSquare className="menu-icon" /><span>مشاوره هوشمند</span></button>
          <div className="sidebar-divider" />
          <button onClick={() => openSidePage('subscription')} className="menu-item">
            <FiShoppingBag className="menu-icon" />
            <span>اشتراک‌ها</span>
            {!subscription && <span className="menu-badge">جدید</span>}
          </button>
          <button onClick={() => openSidePage('billing')} className="menu-item">
            <FiCreditCard className="menu-icon" />
            <span>صورت‌حساب‌ها</span>
          </button>
          <div className="sidebar-divider" />
          <button onClick={() => openSidePage('profile')} className="menu-item"><FiUser className="menu-icon" /><span>پروفایل</span></button>
          <button onClick={() => openSidePage('support')} className="menu-item"><FiHelpCircle className="menu-icon" /><span>پشتیبانی</span></button>
          <button onClick={handleLogout} className="menu-item logout"><FiLogOut className="menu-icon" /><span>خروج</span></button>
        </div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="header-right-side">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={24} />
            </button>
          </div>
          <div className="header-center">
            <div className="logo">
              <img src={logoImg} alt="آزمونیک" />
              <h1 className="logo-text">آزمونیک</h1>
            </div>
          </div>
          <div className="header-left-side">
            <NotificationBell onNotificationCountChange={setUnreadNotifications} />
            <div className="subscription-indicator" onClick={() => openSidePage('subscription')}>
              <FiDollarSign size={16} />
              <span className="plan-badge">
                {currentPlan?.name || 'رایگان'}
              </span>
            </div>
            <div className="user-profile" onClick={() => openSidePage('profile')}>
              <div className="user-info">
                <p className="user-name">{userName}</p>
                <p className="user-role">{currentRole.title}</p>
              </div>
              <div className="user-avatar">{userName?.charAt(0) || 'U'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      {/* 🔔 بنر تمدید اشتراک — اشتراک خودکار تمدید نمی‌شود */}
      {entitlements?.renewal_notice?.show && !renewalBannerDismissed && (
        <div className="renewal-banner">
          <div className="renewal-banner-content">
            <FiClock size={22} className="renewal-banner-icon" />
            <div className="renewal-banner-text">
              <strong>اشتراک شما به پایان رسیده است</strong>
              <span>{entitlements.renewal_notice?.message}</span>
            </div>
            <button
              className="renewal-banner-btn"
              onClick={() => { closeAllSidePages(); setShowSubscriptionPage(true); }}
            >
              تمدید اشتراک
            </button>
          </div>
          <button
            className="renewal-banner-close"
            onClick={() => setRenewalBannerDismissed(true)}
            aria-label="بستن"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      <main className="app-main">{renderContent()}</main>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="modern-footer-content">
          <div className="modern-footer-logo">
            <img src={logoImg} alt="آزمونیک" />
            <span>آزمونیک</span>
          </div>
          <div className="modern-footer-text">پلتفرم هوشمند تولید آزمون و تحلیل عملکرد تحصیلی</div>
        </div>
      </footer>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
        }
        .app-header {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .header-right-side { display: flex; align-items: center; width: 80px; }
        .menu-toggle {
          background: #f1f5f9; border: none; cursor: pointer;
          padding: 8px 12px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #475569; transition: all 0.2s;
        }
        .menu-toggle:hover { background: #e2e8f0; }
        .header-center { flex: 1; display: flex; justify-content: center; }
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo img { height: 45px; width: auto; }
        .logo-text { font-size: 1.2rem; font-weight: 700; color: #1e40af; margin: 0; }
        .header-left-side { display: flex; align-items: center; gap: 16px; width: 80px; justify-content: flex-end; }
        .subscription-indicator {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px; background: #f1f5f9; border-radius: 30px;
          cursor: pointer; transition: all 0.2s; font-size: 0.75rem;
          font-weight: 500; color: #1e293b;
        }
        .subscription-indicator:hover { background: #e2e8f0; }
        .plan-badge { font-weight: 600; }
        .user-profile {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px; border-radius: 40px; background: #f1f5f9; cursor: pointer;
        }
        .user-info { text-align: right; }
        .user-name { font-weight: 600; font-size: 0.8rem; line-height: 1.2; }
        .user-role { font-size: 0.65rem; color: #64748b; }
        .user-avatar {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; color: white; font-weight: 600; font-size: 0.8rem;
        }
        .app-main { flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%; }
        /* 🔔 بنر تمدید اشتراک */
        .renewal-banner {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-bottom: 2px solid #f59e0b;
          padding: 12px 24px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          position: sticky; top: 64px; z-index: 99;
        }
        .renewal-banner-content {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          justify-content: center; max-width: 1200px;
        }
        .renewal-banner-icon { color: #b45309; flex-shrink: 0; }
        .renewal-banner-text { display: flex; flex-direction: column; gap: 2px; }
        .renewal-banner-text strong { color: #92400e; font-size: 0.95rem; }
        .renewal-banner-text span { color: #a16207; font-size: 0.82rem; }
        .renewal-banner-btn {
          background: #d97706; color: white; border: none; cursor: pointer;
          padding: 8px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem;
          font-family: inherit; transition: all 0.2s; white-space: nowrap;
        }
        .renewal-banner-btn:hover { background: #b45309; transform: translateY(-1px); }
        .renewal-banner-close {
          background: transparent; border: none; cursor: pointer; color: #b45309;
          padding: 6px; border-radius: 6px; display: flex; align-items: center;
          position: absolute; left: 16px;
        }
        .renewal-banner-close:hover { background: rgba(180, 83, 9, 0.12); }
        .renewal-banner { position: relative; }
        .welcome-banner {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-radius: 20px; padding: 20px 24px; margin-bottom: 24px;
        }
        .banner-header {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
        }
        .role-info { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .role-icon {
          width: 50px; height: 50px; background: white; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #2563eb; font-size: 1.5rem;
        }
        .banner-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .banner-subtitle { color: #475569; font-size: 0.85rem; }
        .plan-tag {
          display: inline-block; background: #2563eb; color: white;
          padding: 2px 12px; border-radius: 20px; font-size: 0.7rem;
          font-weight: 600; margin-top: 4px;
        }
        .quick-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        .stat-card {
          background: white; border-radius: 16px; padding: 14px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          border-radius: 12px; display: flex; align-items: center;
          justify-content: center; color: white; font-size: 1.2rem;
        }
        .stat-info h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0; }
        .stat-info p { font-size: 0.7rem; color: #64748b; margin: 0; }
        .quick-actions { margin: 24px 0; }
        .section-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .action-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .action-btn {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 16px 12px; display: flex; flex-direction: column;
          align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover {
          border-color: var(--btn-color, #2563eb);
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .action-icon { font-size: 1.5rem; color: var(--btn-color, #2563eb); }
        .action-btn span:last-child { font-weight: 500; font-size: 0.8rem; }
        .config-section {
          background: white; border-radius: 20px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .mobile-sidebar-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 1000;
          opacity: 0; visibility: hidden; transition: all 0.3s;
        }
        .mobile-sidebar-overlay.active { opacity: 1; visibility: visible; }
        .mobile-sidebar {
          position: fixed; top: 0; right: -280px; width: 280px; height: 100vh;
          background: white; z-index: 1001; transition: right 0.3s;
          display: flex; flex-direction: column; overflow-y: auto;
        }
        .mobile-sidebar.open { right: 0; }
        .sidebar-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
        }
        .close-btn { background: none; border: none; cursor: pointer; color: #64748b; }
        .user-info-sidebar {
          padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .user-role-tag {
          background: #2563eb; color: white; padding: 2px 8px;
          border-radius: 20px; font-size: 0.7rem;
        }
        .plan-tag-sidebar {
          background: #10b981; color: white; padding: 2px 8px;
          border-radius: 20px; font-size: 0.7rem;
        }
        .sidebar-menu { flex: 1; overflow-y: auto; padding: 12px 0; }
        .menu-item {
          display: flex; align-items: center; width: 100%;
          padding: 10px 20px; background: none; border: none;
          text-align: right; color: #475569; cursor: pointer;
          gap: 12px; font-size: 0.85rem;
        }
        .menu-item:hover { background: #f1f5f9; color: #1e293b; }
        .menu-icon { font-size: 1.1rem; }
        .menu-badge {
          background: #ef4444; color: white; font-size: 0.6rem;
          padding: 2px 8px; border-radius: 20px; margin-right: auto;
        }
        .sidebar-divider { height: 1px; background: #e2e8f0; margin: 12px 20px; }
        .menu-item.logout { color: #ef4444; }
        .back-button {
          position: fixed; top: 80px; left: 20px; z-index: 50;
          background: #1e293b; color: white; border: none; border-radius: 30px;
          padding: 8px 18px; display: flex; align-items: center; gap: 8px;
          cursor: pointer; font-size: 0.8rem;
        }
        .back-button:hover { background: #334155; }
        .loading-screen {
          display: flex; flex-direction: column; justify-content: center;
          align-items: center; height: 100vh; gap: 16px; background: #f8fafc;
        }
        .spinner {
          width: 40px; height: 40px; border: 3px solid #e2e8f0;
          border-top: 3px solid #2563eb; border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modern-footer { background: #0f172a; color: #94a3b8; padding: 24px 0; margin-top: 32px; }
        .modern-footer-content {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px;
        }
        .modern-footer-logo { display: flex; align-items: center; gap: 10px; }
        .modern-footer-logo img { height: 32px; }
        .modern-footer-logo span {
          font-size: 1.1rem; font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .modern-footer-text { font-size: 0.8rem; }
        .saved-exams-page .page-header { text-align: center; margin-bottom: 24px; }
        .page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .page-subtitle { color: #64748b; font-size: 0.85rem; }
        @media (max-width: 1024px) {
          .quick-stats { grid-template-columns: repeat(3, 1fr); }
          .action-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .header-container { padding: 0 12px; }
          .logo img { height: 35px; }
          .logo-text { font-size: 1rem; }
          .user-info { display: none; }
          .user-profile { padding: 6px; }
          .user-avatar { width: 32px; height: 32px; }
          .header-right-side { width: 50px; }
          .header-left-side { width: 50px; }
          .app-main { padding: 16px; }
          .welcome-banner { padding: 16px; }
          .role-info { flex-direction: column; text-align: center; }
          .banner-header { flex-direction: column; text-align: center; }
          .quick-stats { grid-template-columns: repeat(2, 1fr); }
          .action-grid { grid-template-columns: repeat(2, 1fr); }
          .modern-footer-content { flex-direction: column; text-align: center; }
          .back-button { top: 70px; left: 10px; padding: 6px 14px; font-size: 0.7rem; }
          .subscription-indicator span { display: none; }
          .subscription-indicator { padding: 4px 8px; }
        }
        @media (max-width: 480px) {
          .app-main { padding: 12px; }
          .quick-stats { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: 1fr; }
          .stat-card { padding: 12px; }
          .stat-icon { width: 40px; height: 40px; font-size: 1rem; }
          .stat-info h3 { font-size: 1rem; }
          .action-btn { padding: 12px; }
        }
      `}</style>
    </div>
  );
};

export default App;