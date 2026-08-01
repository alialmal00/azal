// src/pages/dashboard/SubscriptionPage.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  FiShoppingBag, FiCheck, FiX, FiClock, FiZap, FiStar,
  FiFileText, FiMessageSquare, FiUsers, FiHardDrive,
  FiCreditCard, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiRefreshCw, FiLoader, FiAward, FiTrendingUp, FiDollarSign,
  FiCalendar, FiArrowLeft, FiCheckCircle, FiXCircle, FiInfo
} from 'react-icons/fi';
import { AuthContext } from '../../index';
import api from '../../services/api';

// ==================== Types ====================
interface Plan {
  id: number;
  name: string;
  panel_type: string;
  price_1m: number;
  price_3m: number;
  price_9m: number;
  max_exams_month: number;
  max_questions_exam: number;
  max_file_size_mb: number;
  max_classes: number;
  max_students_class: number;
  max_advisor_month: number;
  max_advisor_chars: number;
  is_active: boolean;
}

interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  duration: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Usage {
  exams_used: number;
  advisor_used: number;
  questions_used: number;
  classes_used: number;
  storage_used_mb: number;
}

interface Payment {
  id: number;
  plan_name: string;
  duration: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

interface UserLimits {
  plan: {
    id: number;
    name: string;
    is_free: boolean;
    max_exams_month: number;
    max_questions_exam: number;
    max_total_questions: number;
    max_file_size_mb: number;
    max_classes: number;
    max_students_class: number;
    max_advisor_month: number;
    max_advisor_chars: number;
  };
  usage: {
    exams_used: number;
    questions_used: number;
    advisor_used: number;
    classes_used: number;
  };
  limits: {
    exams_remaining: number;
    questions_remaining: number;
    advisor_remaining: number;
    classes_remaining: number;
  };
  subscription: Subscription | null;
}

// ==================== Component ====================
const SubscriptionPage: React.FC = () => {
  const { user } = useContext(AuthContext);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<Usage>({ exams_used: 0, advisor_used: 0, questions_used: 0, classes_used: 0, storage_used_mb: 0 });
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [billingHistory, setBillingHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<Record<number, string>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ==================== Load Data ====================
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlans(),
        loadMySubscription(),
        loadUsage(),
        loadUserLimits(),
        loadBillingHistory()
      ]);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const panelType = user?.role || 'student';
      const response = await api.get(`/subscription/plans?panel=${panelType}`);
      if (response.data.success) {
        setPlans(response.data.data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadMySubscription = async () => {
    try {
      const response = await api.get('/subscription/my');
      if (response.data.success) {
        const data = response.data.data;
        setCurrentSubscription(data.subscription);
        setCurrentPlan(data.plan);
        if (data.usage) setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadUsage = async () => {
    try {
      const response = await api.get('/subscription/usage');
      if (response.data.success) {
        setUsage(response.data.data.usage);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const loadUserLimits = async () => {
    try {
      const response = await api.get('/subscription/limits');
      if (response.data.success) {
        setUserLimits(response.data.data);
      }
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  };

  const loadBillingHistory = async () => {
    try {
      const response = await api.get('/subscription/billing');
      if (response.data.success) {
        setBillingHistory(response.data.data.payments || []);
      }
    } catch (error) {
      console.error('Error loading billing:', error);
    }
  };

  // ==================== Purchase ====================
  const handlePurchase = async (planId: number) => {
    const duration = selectedDuration[planId] || '1m';
    setPurchasing(planId);
    setMessage(null);

    try {
      const response = await api.post('/subscription/purchase', { planId, duration });
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message || '✅ اشتراک با موفقیت فعال شد!' });
        await loadAllData();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'خطا در خرید اشتراک' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setPurchasing(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ==================== Cancel ====================
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await api.post('/subscription/cancel');
      if (response.data.success) {
        setMessage({ type: 'success', text: 'اشتراک شما با موفقیت لغو شد' });
        setShowCancelConfirm(false);
        await loadAllData();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'خطا در لغو اشتراک' });
    } finally {
      setCancelling(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ==================== Helpers ====================
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case '1m': return '۱ ماهه';
      case '3m': return '۳ ماهه';
      case '9m': return '۹ ماهه';
      default: return duration;
    }
  };

  const getDiscountPercent = (plan: Plan, duration: string) => {
    if (duration === '1m') return 0;
    const monthlyPrice = plan.price_1m;
    let totalPrice: number;
    let months: number;
    if (duration === '3m') { totalPrice = plan.price_3m; months = 3; }
    else { totalPrice = plan.price_9m; months = 9; }
    const fullPrice = monthlyPrice * months;
    return Math.round(((fullPrice - totalPrice) / fullPrice) * 100);
  };

  const getUsagePercent = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 70) return '#f59e0b';
    return '#10b981';
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('پایه') || planName.includes('رایگان')) return <FiZap size={24} />;
    if (planName.includes('استاندارد')) return <FiStar size={24} />;
    if (planName.includes('حرفه‌ای')) return <FiAward size={24} />;
    return <FiShoppingBag size={24} />;
  };

  const getPlanColor = (planName: string) => {
    if (planName.includes('پایه') || planName.includes('رایگان')) return '#6b7280';
    if (planName.includes('استاندارد')) return '#2563eb';
    if (planName.includes('حرفه‌ای')) return '#7c3aed';
    return '#2563eb';
  };

  const isCurrentPlan = (planId: number) => {
    return currentSubscription?.plan_id === planId && currentSubscription?.status === 'active';
  };

  const getDaysRemaining = () => {
    if (!currentSubscription?.end_date) return 0;
    const end = new Date(currentSubscription.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // ==================== Render ====================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', marginTop: '16px' }}>در حال بارگذاری اطلاعات اشتراک...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>
            <FiShoppingBag size={28} />
          </div>
          <div>
            <h1 style={styles.headerTitle}>مدیریت اشتراک</h1>
            <p style={styles.headerSubtitle}>پلن‌ها و اشتراک‌های azmoonik.ir</p>
          </div>
        </div>
        <div style={styles.headerBadge}>
          <FiCreditCard size={16} />
          <span>درگاه پرداخت: زرین‌پال</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          ...styles.message,
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          borderRight: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiXCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Subscription Status */}
      <div style={styles.currentPlanCard}>
        <div style={styles.currentPlanHeader}>
          <h2 style={styles.sectionTitle}>
            <FiInfo size={20} />
            وضعیت اشتراک فعلی
          </h2>
        </div>
        <div style={styles.currentPlanBody}>
          <div style={styles.currentPlanInfo}>
            <div style={styles.currentPlanIcon}>
              {currentPlan ? getPlanIcon(currentPlan.name) : <FiZap size={28} />}
            </div>
            <div>
              <h3 style={styles.currentPlanName}>
                {currentPlan?.name || 'رایگان'}
                {currentSubscription && (
                  <span style={styles.activeBadge}>فعال</span>
                )}
              </h3>
              <p style={styles.currentPlanMeta}>
                {currentSubscription ? (
                  <>
                    <FiCalendar size={14} style={{ marginLeft: '4px' }} />
                    {getDurationLabel(currentSubscription.duration)} ·{' '}
                    {getDaysRemaining()} روز باقی‌مانده
                  </>
                ) : (
                  'اشتراک فعالی ندارید'
                )}
              </p>
            </div>
          </div>
          {currentSubscription && currentSubscription.status === 'active' && (
            <button
              style={styles.cancelBtn}
              onClick={() => setShowCancelConfirm(true)}
            >
              <FiX size={14} />
              لغو اشتراک
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div style={styles.usageSection}>
        <h2 style={styles.sectionTitle}>
          <FiTrendingUp size={20} />
          مصرف ماهانه
        </h2>
        <div style={styles.usageGrid}>
          {/* Exams */}
          <UsageCard
            icon={<FiFileText size={20} />}
            label="آزمون‌های AI"
            used={userLimits?.usage?.exams_used || usage.exams_used}
            max={userLimits?.plan?.max_exams_month || currentPlan?.max_exams_month || 5}
            color="#2563eb"
          />
          {/* Questions */}
          <UsageCard
            icon={<FiZap size={20} />}
            label="سوالات مصرف‌شده"
            used={userLimits?.usage?.questions_used || usage.questions_used}
            max={userLimits?.plan?.max_total_questions || (currentPlan ? currentPlan.max_exams_month * currentPlan.max_questions_exam : 75)}
            color="#7c3aed"
          />
          {/* Advisor */}
          <UsageCard
            icon={<FiMessageSquare size={20} />}
            label="پیام‌های مشاور"
            used={userLimits?.usage?.advisor_used || usage.advisor_used}
            max={userLimits?.plan?.max_advisor_month || currentPlan?.max_advisor_month || 20}
            color="#10b981"
          />
          {/* Classes (Teacher only) */}
          {(user?.role === 'teacher' || user?.role === 'university') && (
            <UsageCard
              icon={<FiUsers size={20} />}
              label="کلاس‌ها"
              used={userLimits?.usage?.classes_used || usage.classes_used}
              max={userLimits?.plan?.max_classes || currentPlan?.max_classes || 1}
              color="#f59e0b"
            />
          )}
          {/* Storage */}
          <UsageCard
            icon={<FiHardDrive size={20} />}
            label="حجم فایل (MB)"
            used={usage.storage_used_mb}
            max={currentPlan?.max_file_size_mb || 5}
            color="#06b6d4"
          />
        </div>
      </div>

      {/* Plans */}
      <div style={styles.plansSection}>
        <h2 style={styles.sectionTitle}>
          <FiShoppingBag size={20} />
          پلن‌های موجود
          <span style={styles.planCount}>{plans.length} پلن</span>
        </h2>

        {plans.length === 0 ? (
          <div style={styles.emptyState}>
            <FiAlertCircle size={40} />
            <p>هیچ پلنی برای نقش شما تعریف نشده است</p>
          </div>
        ) : (
          <div style={styles.plansGrid}>
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);
              const planColor = getPlanColor(plan.name);
              const discount3m = getDiscountPercent(plan, '3m');
              const discount9m = getDiscountPercent(plan, '9m');
              const selectedDur = selectedDuration[plan.id] || '1m';

              return (
                <div
                  key={plan.id}
                  style={{
                    ...styles.planCard,
                    borderColor: isCurrent ? planColor : '#e2e8f0',
                    boxShadow: isCurrent ? `0 0 0 2px ${planColor}20` : '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  {isCurrent && (
                    <div style={{ ...styles.currentBadge, background: planColor }}>
                      <FiCheck size={12} />
                      پلن فعلی شما
                    </div>
                  )}

                  {/* Plan Header */}
                  <div style={styles.planHeader}>
                    <div style={{ ...styles.planIcon, background: `${planColor}15`, color: planColor }}>
                      {getPlanIcon(plan.name)}
                    </div>
                    <h3 style={styles.planName}>{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div style={styles.planPrice}>
                    <span style={styles.priceAmount}>
                      {formatPrice(
                        selectedDur === '1m' ? plan.price_1m :
                        selectedDur === '3m' ? plan.price_3m : plan.price_9m
                      )}
                    </span>
                    <span style={styles.priceUnit}>تومان / {getDurationLabel(selectedDur)}</span>
                  </div>

                  {/* Duration Selector */}
                  <div style={styles.durationSelector}>
                    {(['1m', '3m', '9m'] as const).map((dur) => (
                      <button
                        key={dur}
                        style={{
                          ...styles.durationBtn,
                          background: selectedDur === dur ? planColor : '#f1f5f9',
                          color: selectedDur === dur ? 'white' : '#475569'
                        }}
                        onClick={() => setSelectedDuration(prev => ({ ...prev, [plan.id]: dur }))}
                      >
                        {getDurationLabel(dur)}
                        {dur === '3m' && discount3m > 0 && (
                          <span style={styles.discountTag}>-{discount3m}%</span>
                        )}
                        {dur === '9m' && discount9m > 0 && (
                          <span style={styles.discountTag}>-{discount9m}%</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Features */}
                  <div style={styles.planFeatures}>
                    <FeatureItem icon={<FiFileText size={14} />} text={`${plan.max_exams_month} آزمون AI در ماه`} />
                    <FeatureItem icon={<FiZap size={14} />} text={`${plan.max_questions_exam} سوال در هر آزمون`} />
                    <FeatureItem icon={<FiHardDrive size={14} />} text={`${plan.max_file_size_mb} مگابایت حجم فایل`} />
                    {(user?.role === 'teacher' || user?.role === 'university') && (
                      <>
                        <FeatureItem icon={<FiUsers size={14} />} text={`${plan.max_classes} کلاس · ${plan.max_students_class} دانش‌آموز`} />
                      </>
                    )}
                    {user?.role === 'student' && (
                      <FeatureItem icon={<FiUsers size={14} />} text={`عضویت در ${plan.max_classes} کلاس معلم`} />
                    )}
                    <FeatureItem icon={<FiMessageSquare size={14} />} text={`${plan.max_advisor_month} پیام مشاور · ${plan.max_advisor_chars} کاراکتر`} />
                    {(user?.role === 'teacher') && (
                      <FeatureItem icon={<FiCheck size={14} />} text="تصحیح کلاسی رایگان و بدون سقف" highlight />
                    )}
                    {(user?.role === 'student' || user?.role === 'university') && (
                      <FeatureItem icon={<FiCheck size={14} />} text={user?.role === 'student' ? 'آزمون‌های کلاسی معلم رایگان' : 'PDF کارنامه + ذخیره آزمون'} highlight />
                    )}
                  </div>

                  {/* Purchase Button */}
                  <button
                    style={{
                      ...styles.purchaseBtn,
                      background: isCurrent ? '#e2e8f0' : planColor,
                      color: isCurrent ? '#64748b' : 'white',
                      cursor: isCurrent ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isCurrent || purchasing === plan.id}
                    onClick={() => handlePurchase(plan.id)}
                  >
                    {purchasing === plan.id ? (
                      <>
                        <div style={styles.btnSpinner}></div>
                        <span>در حال پردازش...</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <FiCheck size={16} />
                        <span>پلن فعال شما</span>
                      </>
                    ) : (
                      <>
                        <FiCreditCard size={16} />
                        <span>خرید اشتراک</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discount Info */}
      <div style={styles.discountInfo}>
        <FiInfo size={16} />
        <span>تخفیف ۳ ماهه: ۱۰٪ · تخفیف ۹ ماهه: ۱۸٪ · درگاه پرداخت: زرین‌پال</span>
      </div>

      {/* Billing History */}
      <div style={styles.billingSection}>
        <div style={styles.billingHeader} onClick={() => setShowBilling(!showBilling)}>
          <h2 style={styles.sectionTitle}>
            <FiCreditCard size={20} />
            تاریخچه پرداخت‌ها
          </h2>
          <button style={styles.toggleBtn}>
            {showBilling ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </button>
        </div>

        {showBilling && (
          <div style={styles.billingBody}>
            {billingHistory.length === 0 ? (
              <div style={styles.emptyBilling}>
                <FiCreditCard size={32} />
                <p>هنوز پرداختی ثبت نشده است</p>
              </div>
            ) : (
              <div style={styles.billingList}>
                {billingHistory.map((payment) => (
                  <div key={payment.id} style={styles.billingItem}>
                    <div style={styles.billingItemRight}>
                      <div style={{
                        ...styles.billingStatus,
                        background: payment.status === 'success' ? '#d1fae5' : '#fee2e2',
                        color: payment.status === 'success' ? '#065f46' : '#991b1b'
                      }}>
                        {payment.status === 'success' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                      </div>
                      <div>
                        <p style={styles.billingTitle}>{payment.description || payment.plan_name}</p>
                        <p style={styles.billingDate}>
                          {new Date(payment.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <div style={styles.billingItemLeft}>
                      <span style={styles.billingAmount}>{formatPrice(payment.amount)} تومان</span>
                      <span style={styles.billingDuration}>{getDurationLabel(payment.duration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <FiAlertCircle size={32} />
            </div>
            <h3 style={styles.modalTitle}>لغو اشتراک</h3>
            <p style={styles.modalText}>
              آیا مطمئن هستید که می‌خواهید اشتراک خود را لغو کنید؟
              پس از لغو، به پلن رایگان بازخواهید گشت.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowCancelConfirm(false)}
              >
                انصراف
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <div style={styles.btnSpinner}></div>
                    در حال لغو...
                  </>
                ) : (
                  'بله، لغو کن'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ==================== Sub Components ====================
const UsageCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  used: number;
  max: number;
  color: string;
}> = ({ icon, label, used, max, color }) => {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const barColor = percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : color;

  return (
    <div style={styles.usageCard}>
      <div style={styles.usageCardHeader}>
        <div style={{ ...styles.usageIcon, background: `${color}15`, color }}>
          {icon}
        </div>
        <span style={styles.usageLabel}>{label}</span>
      </div>
      <div style={styles.usageNumbers}>
        <span style={styles.usageUsed}>{used}</span>
        <span style={styles.usageMax}>/ {max}</span>
      </div>
      <div style={styles.usageBar}>
        <div style={{ ...styles.usageBarFill, width: `${percent}%`, background: barColor }}></div>
      </div>
      <span style={{ ...styles.usagePercent, color: barColor }}>{percent}%</span>
    </div>
  );
};

const FeatureItem: React.FC<{
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}> = ({ icon, text, highlight }) => (
  <div style={styles.featureItem}>
    <span style={{ color: highlight ? '#10b981' : '#64748b' }}>{icon}</span>
    <span style={{ color: highlight ? '#065f46' : '#475569', fontWeight: highlight ? 600 : 400 }}>
      {text}
    </span>
  </div>
);

// ==================== Styles ====================
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    direction: 'rtl',
    fontFamily: "'Vazirmatn', 'IRANSans', sans-serif",
    animation: 'fadeIn 0.4s ease'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    padding: '24px',
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    borderRadius: '20px',
    color: 'white'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIcon: {
    width: '56px',
    height: '56px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: 0
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    opacity: 0.7,
    margin: '4px 0 0'
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.1)',
    padding: '8px 16px',
    borderRadius: '30px',
    fontSize: '0.8rem'
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderRadius: '14px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    fontWeight: 500,
    animation: 'fadeIn 0.3s ease'
  },
  currentPlanCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  currentPlanHeader: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0
  },
  currentPlanBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  currentPlanInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  currentPlanIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2563eb'
  },
  currentPlanName: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  activeBadge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  currentPlanMeta: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '4px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500
  },
  usageSection: {
    marginBottom: '32px'
  },
  usageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px'
  },
  usageCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9'
  },
  usageCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px'
  },
  usageIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  usageLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 500
  },
  usageNumbers: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '8px'
  },
  usageUsed: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1e293b'
  },
  usageMax: {
    fontSize: '0.85rem',
    color: '#94a3b8'
  },
  usageBar: {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  usageBarFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.5s ease'
  },
  usagePercent: {
    fontSize: '0.7rem',
    fontWeight: 600
  },
  plansSection: {
    marginBottom: '24px'
  },
  planCount: {
    background: '#f1f5f9',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 500,
    marginRight: '8px'
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginTop: '20px'
  },
  planCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    border: '2px solid #e2e8f0',
    position: 'relative',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  currentBadge: {
    position: 'absolute',
    top: '-12px',
    right: '20px',
    color: 'white',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  planHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  planIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  planName: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0
  },
  planPrice: {
    marginBottom: '16px',
    textAlign: 'center'
  },
  priceAmount: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#1e293b',
    display: 'block'
  },
  priceUnit: {
    fontSize: '0.8rem',
    color: '#64748b'
  },
  durationSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  durationBtn: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'all 0.2s ease'
  },
  discountTag: {
    fontSize: '0.6rem',
    opacity: 0.8
  },
  planFeatures: {
    flex: 1,
    marginBottom: '20px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    fontSize: '0.82rem',
    borderBottom: '1px solid #f8fafc'
  },
  purchaseBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '14px',
    fontSize: '0.9rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    fontFamily: "'Vazirmatn', sans-serif"
  },
  btnSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  discountInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#fef3c7',
    borderRadius: '12px',
    color: '#92400e',
    fontSize: '0.8rem',
    marginBottom: '24px'
  },
  billingSection: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px'
  },
  billingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    cursor: 'pointer'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center'
  },
  billingBody: {
    padding: '0 24px 24px',
    borderTop: '1px solid #f1f5f9'
  },
  emptyBilling: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8'
  },
  billingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '16px'
  },
  billingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  billingItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  billingStatus: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  billingTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: 0
  },
  billingDate: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    margin: '2px 0 0'
  },
  billingItemLeft: {
    textAlign: 'left'
  },
  billingAmount: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#1e293b',
    display: 'block'
  },
  billingDuration: {
    fontSize: '0.7rem',
    color: '#64748b'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: 'white',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease'
  },
  modalIcon: {
    width: '64px',
    height: '64px',
    background: '#fee2e2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    color: '#dc2626'
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px'
  },
  modalText: {
    fontSize: '0.85rem',
    color: '#64748b',
    lineHeight: 1.7,
    marginBottom: '24px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  modalCancelBtn: {
    flex: 1,
    padding: '12px',
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem'
  },
  modalConfirmBtn: {
    flex: 1,
    padding: '12px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }
};

export default SubscriptionPage;