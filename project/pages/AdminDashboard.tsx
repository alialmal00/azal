// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FiUsers, FiMail, FiMessageSquare, FiCheckCircle, 
  FiTrash2, FiRefreshCw, FiUserPlus, FiClock, FiTrendingUp, 
  FiShield, FiLock, FiLogOut, FiBarChart2, FiPieChart,
  FiX, FiSend, FiUser, FiCalendar, FiFileText, FiEye, FiFlag,
  FiTag, FiFolder, FiAlertCircle, FiCheck, FiCornerUpLeft,
  FiSearch, FiPhone, FiStar, FiEdit2, FiDollarSign,
  FiMoreVertical, FiDownload, FiPrinter, FiFilter, FiGrid,
  FiList, FiPlus, FiMinus, FiHelpCircle, FiSettings
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.azmoonik.ir/api';

// ========== انواع داده ==========
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  phone?: string;
  avatar?: string;
  exam_count?: number;
  avg_score?: number;
  total_score?: number;
  role_selected?: boolean;
}

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface Ticket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'pending' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  answered_at?: string;
  closed_at?: string;
  replies?: TicketReply[];
}

interface TicketReply {
  id: number;
  user_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_name: string;
}

interface Subscription {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  plan_name: string;
  plan_id: number;
  duration: '1m' | '3m' | '9m';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  created_at: string;
}

interface DashboardStats {
  overview: {
    users: {
      total_users: number;
      total_students: number;
      total_teachers: number;
      total_university: number;
      total_admins: number;
      active_users: number;
      new_users_today: number;
    };
    messages: {
      total_messages: number;
      unread_messages: number;
    };
    exams: {
      total_exams: number;
      completed_exams: number;
      avg_score: number;
    };
  };
  progress: {
    monthly: Array<{ month: string; new_users: number }>;
  };
  distribution: Array<{ role: string; count: number; percentage: number }>;
  topUsers: User[];
}

// ========== کامپوننت اصلی ==========
const AdminDashboard: React.FC = () => {
  // ========== State های احراز هویت ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // ========== State های داده ==========
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'tickets' | 'subscriptions'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  // ========== State های انتخاب شده ==========
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyingTicket, setReplyingTicket] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // ========== State های فیلتر ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // ========== State های UI ==========
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // ========== افکت اولیه ==========
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    } else {
      setLoading(false);
    }
  }, []);

  // ========== توابع احراز هویت ==========
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    if (loginPassword === 'Aa17510200') {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      loadAllData();
    } else {
      setLoginError('❌ رمز عبور اشتباه است');
    }

    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setLoginPassword('');
  };

  // ========== توابع بارگذاری داده ==========
  const loadAllData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchUsers(),
        fetchMessages(),
        fetchTickets(),
        fetchSubscriptions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'خطا در بارگذاری داده‌ها');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get('/admin/messages');
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/tickets');
      if (response.data.success) {
        setTickets(response.data.data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/admin/subscriptions');
      if (response.data.success) {
        setSubscriptions(response.data.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  // ========== توابع کمکی UI ==========
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} روز پیش`;
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      student: 'دانش‌آموز',
      teacher: 'معلم',
      university: 'دانشجو',
      admin: 'ادمین',
      system: 'سیستم'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: '#dbeafe',
      teacher: '#ede9fe',
      university: '#d1fae5',
      admin: '#fee2e2',
      system: '#fef3c7'
    };
    return colors[role] || '#e2e8f0';
  };

  const getRoleTextColor = (role: string) => {
    const colors: Record<string, string> = {
      student: '#1e40af',
      teacher: '#6d28d9',
      university: '#065f46',
      admin: '#991b1b',
      system: '#92400e'
    };
    return colors[role] || '#475569';
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      active: { label: 'فعال', color: '#065f46', bg: '#d1fae5' },
      pending: { label: 'در انتظار', color: '#92400e', bg: '#fef3c7' },
      answered: { label: 'پاسخ داده', color: '#1e40af', bg: '#dbeafe' },
      closed: { label: 'بسته', color: '#475569', bg: '#e2e8f0' },
      expired: { label: 'منقضی', color: '#991b1b', bg: '#fee2e2' },
      cancelled: { label: 'لغو شده', color: '#991b1b', bg: '#fef2f2' }
    };
    const item = config[status] || { label: status, color: '#475569', bg: '#e2e8f0' };
    return (
      <span style={{ 
        background: item.bg, 
        color: item.color, 
        padding: '2px 10px', 
        borderRadius: '20px', 
        fontSize: '0.7rem',
        fontWeight: 600
      }}>
        {item.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      low: { label: 'کم', color: '#065f46', bg: '#d1fae5' },
      medium: { label: 'متوسط', color: '#92400e', bg: '#fef3c7' },
      high: { label: 'بالا', color: '#9a3412', bg: '#fed7aa' },
      urgent: { label: 'فوری', color: '#991b1b', bg: '#fee2e2' }
    };
    const item = config[priority] || { label: priority, color: '#475569', bg: '#e2e8f0' };
    return (
      <span style={{ 
        background: item.bg, 
        color: item.color, 
        padding: '2px 10px', 
        borderRadius: '20px', 
        fontSize: '0.7rem',
        fontWeight: 600
      }}>
        {item.label}
      </span>
    );
  };

  // ========== توابع مدیریت کاربران ==========
  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !isActive });
      showMessage('success', 'وضعیت کاربر تغییر کرد');
      fetchUsers();
    } catch (error) {
      showMessage('error', 'خطا در تغییر وضعیت کاربر');
    }
  };

  const handleUpdateUserRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      showMessage('success', 'نقش کاربر تغییر کرد');
      fetchUsers();
    } catch (error) {
      showMessage('error', 'خطا در تغییر نقش کاربر');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است!')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showMessage('success', 'کاربر حذف شد');
      fetchUsers();
    } catch (error) {
      showMessage('error', 'خطا در حذف کاربر');
    }
  };

  // ========== توابع مدیریت پیام‌ها ==========
  const handleDeleteMessage = async (id: number) => {
    if (!confirm('آیا از حذف این پیام اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      showMessage('success', 'پیام حذف شد');
      fetchMessages();
    } catch (error) {
      showMessage('error', 'خطا در حذف پیام');
    }
  };

  const handleMarkMessageAsRead = async (id: number) => {
    try {
      await api.put(`/admin/messages/${id}/read`);
      fetchMessages();
    } catch (error) {
      showMessage('error', 'خطا در بروزرسانی پیام');
    }
  };

  // ========== توابع مدیریت تیکت‌ها ==========
  const handleReplyToTicket = async (ticketId: number) => {
    if (!replyText.trim()) {
      showMessage('error', 'لطفاً پاسخ را وارد کنید');
      return;
    }

    try {
      await api.post(`/admin/tickets/${ticketId}/reply`, { message: replyText });
      showMessage('success', '✅ پاسخ با موفقیت ثبت شد');
      setReplyText('');
      setReplyingTicket(null);
      fetchTickets();
    } catch (error) {
      showMessage('error', 'خطا در ثبت پاسخ');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('آیا از حذف این تیکت اطمینان دارید؟')) return;
    try {
      await api.delete(`/admin/tickets/${id}`);
      showMessage('success', 'تیکت حذف شد');
      fetchTickets();
    } catch (error) {
      showMessage('error', 'خطا در حذف تیکت');
    }
  };

  const handleUpdateTicketStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/tickets/${id}/status`, { status });
      showMessage('success', 'وضعیت تیکت تغییر کرد');
      fetchTickets();
    } catch (error) {
      showMessage('error', 'خطا در تغییر وضعیت تیکت');
    }
  };

  // ========== فیلتر کردن داده‌ها ==========
  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return user.name.toLowerCase().includes(query) || 
             user.email.toLowerCase().includes(query);
    }
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    return true;
  });

  const filteredTickets = tickets.filter(ticket => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return ticket.subject.toLowerCase().includes(query) || 
             ticket.user_name.toLowerCase().includes(query) ||
             ticket.message.toLowerCase().includes(query);
    }
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    return true;
  });

  // ========== رندر صفحه لاگین ==========
  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-login-icon"><FiShield size={32} color="white" /></div>
            <h2 className="admin-login-title">پنل مدیریت</h2>
            <p className="admin-login-subtitle">رمز عبور مدیریت را وارد کنید</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="رمز عبور مدیریت"
              className="admin-login-input"
              autoFocus
            />
            
            {loginError && (
              <div className="admin-login-error">{loginError}</div>
            )}
            
            <button type="submit" disabled={isLoggingIn} className="admin-login-btn">
              {isLoggingIn ? 'در حال ورود...' : 'ورود به پنل مدیریت'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== رندر لودینگ ==========
  if (loading || !dashboardData) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  const { overview, progress, distribution, topUsers } = dashboardData;

  // ========== رندر اصلی ==========
  return (
    <div className="admin-container">

      {/* ========== پیام توست ========== */}
      {message && (
        <div className={`admin-toast ${message.type}`}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><FiX size={14} /></button>
        </div>
      )}

      {/* ========== هدر ========== */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-title">
            <h1><FiShield /> پنل مدیریت آزمونیک</h1>
            <p>مدیریت کامل کاربران، اشتراک‌ها، پیام‌ها و تیکت‌ها</p>
          </div>
          <div className="admin-header-info">
            <button onClick={loadAllData} disabled={refreshing} className="admin-refresh-btn">
              <FiRefreshCw className={refreshing ? 'spin' : ''} />
              {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
            </button>
            <button onClick={handleLogout} className="admin-logout-btn">
              <FiLogOut /> خروج
            </button>
          </div>
        </div>
      </header>

      {/* ========== کارت‌های آمار ========== */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card blue">
          <div className="admin-stat-icon blue"><FiUsers /></div>
          <div className="admin-stat-value">{overview.users.total_users}</div>
          <div className="admin-stat-label">کل کاربران</div>
          <div className="admin-stat-trend">+{overview.users.new_users_today} امروز</div>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-icon green"><FiCheckCircle /></div>
          <div className="admin-stat-value">{overview.users.active_users}</div>
          <div className="admin-stat-label">کاربران فعال</div>
        </div>
        <div className="admin-stat-card yellow">
          <div className="admin-stat-icon yellow"><FiMessageSquare /></div>
          <div className="admin-stat-value">{overview.messages.unread_messages}</div>
          <div className="admin-stat-label">پیام‌های خوانده نشده</div>
        </div>
        <div className="admin-stat-card purple">
          <div className="admin-stat-icon purple"><FiBarChart2 /></div>
          <div className="admin-stat-value">{overview.exams.total_exams}</div>
          <div className="admin-stat-label">کل آزمون‌ها</div>
        </div>
      </div>

      {/* ========== تب‌ها ========== */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiTrendingUp /> نمای کلی
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> کاربران ({users.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <FiMail /> پیام‌ها ({messages.filter(m => !m.is_read).length} جدید)
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <FiMessageSquare /> تیکت‌ها ({tickets.filter(t => t.status === 'pending').length} در انتظار)
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <FiDollarSign /> اشتراک‌ها ({subscriptions.filter(s => s.status === 'active').length} فعال)
        </button>
      </div>

      {/* ========== محتوای تب‌ها ========== */}
      <div className="admin-tab-content">

        {/* ========== تب نمای کلی ========== */}
        {activeTab === 'overview' && (
          <div className="admin-overview">

            {/* توزیع کاربران و رشد ماهانه */}
            <div className="admin-stats-advanced">
              <div className="admin-stats-card">
                <h3><FiPieChart /> توزیع کاربران</h3>
                {distribution.map((item, index) => (
                  <div key={index} className="admin-progress-bar">
                    <div className="admin-progress-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%',
                          background: item.role === 'student' ? '#2563eb' : 
                                     item.role === 'teacher' ? '#8b5cf6' : 
                                     item.role === 'university' ? '#10b981' : 
                                     item.role === 'admin' ? '#ef4444' : '#6b7280'
                        }} />
                        {getRoleText(item.role)}
                      </span>
                      <span>{item.count} نفر ({item.percentage}%)</span>
                    </div>
                    <div className="admin-progress-track">
                      <div className="admin-progress-fill" style={{ 
                        width: `${item.percentage}%`,
                        background: item.role === 'student' ? '#2563eb' : 
                                   item.role === 'teacher' ? '#8b5cf6' : 
                                   item.role === 'university' ? '#10b981' : 
                                   item.role === 'admin' ? '#ef4444' : '#6b7280'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-stats-card">
                <h3><FiTrendingUp /> رشد ماهانه کاربران</h3>
                {progress.monthly.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>هنوز داده‌ای وجود ندارد</p>
                ) : (
                  progress.monthly.map((item, index) => {
                    const max = Math.max(...progress.monthly.map(m => m.new_users), 1);
                    return (
                      <div key={index} className="admin-progress-bar">
                        <div className="admin-progress-label">
                          <span>{item.month}</span>
                          <span>{item.new_users} نفر</span>
                        </div>
                        <div className="admin-progress-track">
                          <div className="admin-progress-fill" style={{ 
                            width: `${(item.new_users / max) * 100}%`,
                            background: 'linear-gradient(90deg, #2563eb, #7c3aed)'
                          }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* کاربران برتر */}
            <div className="admin-stats-card">
              <h3><FiStar /> کاربران برتر</h3>
              {topUsers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>هنوز داده‌ای وجود ندارد</p>
              ) : (
                <div className="admin-top-users">
                  {topUsers.map((user, index) => (
                    <div key={user.id} className="admin-top-user">
                      <div className={`admin-top-user-rank ${index < 3 ? 'top' : ''}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="admin-top-user-info">
                        <div className="admin-top-user-name">{user.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user.email}</div>
                      </div>
                      <div className="admin-top-user-stats">
                        <div>{user.exam_count || 0} آزمون</div>
                        <div style={{ 
                          color: (user.avg_score || 0) >= 70 ? '#10b981' : 
                                 (user.avg_score || 0) >= 50 ? '#f59e0b' : '#ef4444',
                          fontWeight: 700
                        }}>
                          {Math.round(user.avg_score || 0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== تب کاربران ========== */}
        {activeTab === 'users' && (
          <div>
            {/* نوار جستجو و فیلتر */}
            <div className="admin-search-bar">
              <div className="admin-search-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="جستجوی کاربران (نام، ایمیل)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="admin-filters">
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="all">همه نقش‌ها</option>
                  <option value="student">دانش‌آموز</option>
                  <option value="teacher">معلم</option>
                  <option value="university">دانشجو</option>
                  <option value="admin">ادمین</option>
                </select>
                <button 
                  className={`admin-view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FiList />
                </button>
                <button 
                  className={`admin-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid />
                </button>
              </div>
            </div>

            {/* جدول کاربران */}
            <div className="admin-users-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>نام</th>
                    <th>ایمیل</th>
                    <th>نقش</th>
                    <th>وضعیت</th>
                    <th>آزمون‌ها</th>
                    <th>میانگین</th>
                    <th>تاریخ عضویت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        کاربری یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar" style={{ background: getRoleColor(user.role) }}>
                              {user.name.charAt(0)}
                            </div>
                            <strong>{user.name}</strong>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <select 
                            value={user.role} 
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="admin-role-select"
                            style={{ 
                              background: getRoleColor(user.role),
                              color: getRoleTextColor(user.role)
                            }}
                          >
                            <option value="student">دانش‌آموز</option>
                            <option value="teacher">معلم</option>
                            <option value="university">دانشجو</option>
                            <option value="admin">ادمین</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            className={`admin-status-toggle ${user.is_active ? 'active' : 'inactive'}`}
                            onClick={() => handleUpdateUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? '✅ فعال' : '⛔ غیرفعال'}
                          </button>
                        </td>
                        <td>{user.exam_count || 0}</td>
                        <td style={{ 
                          color: (user.avg_score || 0) >= 70 ? '#10b981' : 
                                 (user.avg_score || 0) >= 50 ? '#f59e0b' : '#ef4444',
                          fontWeight: 700
                        }}>
                          {Math.round(user.avg_score || 0)}%
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td>
                          <button 
                            className="admin-btn-danger"
                            onClick={() => handleDeleteUser(user.id)}
                            title="حذف کاربر"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="admin-table-footer">
                <span>تعداد کاربران: {filteredUsers.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========== تب پیام‌ها ========== */}
        {activeTab === 'messages' && (
          <div className="admin-messages-container">
            <div className="admin-messages-grid">
              <div className="admin-messages-list">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <FiMail size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>هیچ پیامی یافت نشد</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`admin-message-item ${!msg.is_read ? 'unread' : ''}`}
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <div className="admin-message-header">
                        <div className="admin-message-sender">
                          <h4>{msg.name}</h4>
                          <p>{msg.email}</p>
                        </div>
                        <div className="admin-message-meta">
                          {!msg.is_read && <span className="unread-dot"></span>}
                          <span className="admin-message-date">{getTimeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                      {msg.subject && <div className="admin-message-subject">{msg.subject}</div>}
                      <div className="admin-message-preview">
                        {msg.message.length > 150 ? msg.message.substring(0, 150) + '...' : msg.message}
                      </div>
                      <div className="admin-message-actions">
                        {!msg.is_read && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkMessageAsRead(msg.id); }}
                            className="admin-btn-read"
                          >
                            <FiCheckCircle size={14} /> خوانده شد
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                          className="admin-btn-delete-small"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-message-detail">
                {selectedMessage ? (
                  <>
                    <div className="admin-detail-header">
                      <h3 className="admin-detail-title">
                        {selectedMessage.subject || 'بدون موضوع'}
                        {!selectedMessage.is_read && <span className="unread-badge">جدید</span>}
                      </h3>
                      <button onClick={() => setSelectedMessage(null)} className="admin-close-detail">
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="admin-detail-field">
                      <div className="admin-detail-label">از:</div>
                      <div className="admin-detail-value">
                        <strong>{selectedMessage.name}</strong> 
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>({selectedMessage.email})</span>
                      </div>
                    </div>
                    <div className="admin-detail-field">
                      <div className="admin-detail-label">تاریخ:</div>
                      <div className="admin-detail-value">{formatDate(selectedMessage.created_at)}</div>
                    </div>
                    <div className="admin-detail-field">
                      <div className="admin-detail-label">پیام:</div>
                      <div className="admin-detail-message-box">{selectedMessage.message}</div>
                    </div>
                    <div className="admin-detail-actions-bottom">
                      {!selectedMessage.is_read && (
                        <button 
                          className="admin-btn-read-large"
                          onClick={() => handleMarkMessageAsRead(selectedMessage.id)}
                        >
                          <FiCheckCircle /> علامت به عنوان خوانده شده
                        </button>
                      )}
                      <button 
                        className="admin-btn-delete-large"
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                      >
                        <FiTrash2 /> حذف پیام
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="admin-detail-empty">
                    <FiMail size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>پیامی را برای مشاهده جزئیات انتخاب کنید</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== تب تیکت‌ها ========== */}
        {activeTab === 'tickets' && (
          <div>
            {/* نوار جستجو و فیلتر */}
            <div className="admin-search-bar">
              <div className="admin-search-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="جستجوی تیکت‌ها (موضوع، نام، پیام)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="admin-filters">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="pending">در انتظار</option>
                  <option value="answered">پاسخ داده</option>
                  <option value="closed">بسته</option>
                </select>
              </div>
            </div>

            <div className="admin-tickets-list">
              {filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  <FiMessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>هیچ تیکتی یافت نشد</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className={`admin-ticket-item ${ticket.status === 'pending' ? 'pending' : ''}`}>
                    <div className="admin-ticket-header">
                      <div className="admin-ticket-user">
                        <div className="admin-ticket-avatar" style={{ background: getRoleColor(ticket.user_role || 'student') }}>
                          {ticket.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <strong>{ticket.user_name || 'کاربر ناشناس'}</strong>
                          <span>{ticket.user_email}</span>
                        </div>
                      </div>
                      <div className="admin-ticket-badges">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <div className="admin-ticket-subject">{ticket.subject}</div>
                    <div className="admin-ticket-message">{ticket.message}</div>

                    <div className="admin-ticket-footer">
                      <div className="admin-ticket-date">
                        <FiClock size={12} />
                        {getTimeAgo(ticket.created_at)}
                        {ticket.answered_at && ` · پاسخ: ${getTimeAgo(ticket.answered_at)}`}
                      </div>
                      <div className="admin-ticket-actions">
                        {ticket.status !== 'closed' && (
                          <button 
                            className="admin-btn-reply"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setReplyingTicket(ticket.id);
                            }}
                          >
                            <FiSend size={14} /> پاسخ
                          </button>
                        )}
                        {ticket.status === 'pending' && (
                          <button 
                            className="admin-btn-close"
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'closed')}
                          >
                            <FiLock size={14} /> بستن
                          </button>
                        )}
                        {ticket.status === 'closed' && (
                          <button 
                            className="admin-btn-reopen"
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'pending')}
                          >
                            <FiCornerUpLeft size={14} /> باز کردن
                          </button>
                        )}
                        <button 
                          className="admin-btn-delete-small"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* فرم پاسخ */}
                    {replyingTicket === ticket.id && (
                      <div className="admin-reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="پاسخ خود را وارد کنید..."
                          rows={3}
                          autoFocus
                        />
                        <div className="admin-reply-actions">
                          <button 
                            className="admin-btn-cancel"
                            onClick={() => {
                              setReplyingTicket(null);
                              setReplyText('');
                            }}
                          >
                            انصراف
                          </button>
                          <button 
                            className="admin-btn-send"
                            onClick={() => handleReplyToTicket(ticket.id)}
                          >
                            <FiSend size={14} /> ارسال پاسخ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========== تب اشتراک‌ها ========== */}
        {activeTab === 'subscriptions' && (
          <div>
            <div className="admin-subscriptions-stats">
              <div className="sub-stat">
                <span className="sub-stat-value">{subscriptions.length}</span>
                <span className="sub-stat-label">کل اشتراک‌ها</span>
              </div>
              <div className="sub-stat">
                <span className="sub-stat-value" style={{ color: '#10b981' }}>
                  {subscriptions.filter(s => s.status === 'active').length}
                </span>
                <span className="sub-stat-label">فعال</span>
              </div>
              <div className="sub-stat">
                <span className="sub-stat-value" style={{ color: '#f59e0b' }}>
                  {subscriptions.filter(s => s.status === 'expired').length}
                </span>
                <span className="sub-stat-label">منقضی</span>
              </div>
              <div className="sub-stat">
                <span className="sub-stat-value" style={{ color: '#ef4444' }}>
                  {subscriptions.filter(s => s.status === 'cancelled').length}
                </span>
                <span className="sub-stat-label">لغو شده</span>
              </div>
            </div>

            <div className="admin-subscriptions-table">
              {subscriptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  <FiDollarSign size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>هیچ اشتراکی یافت نشد</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>کاربر</th>
                      <th>پلن</th>
                      <th>مدت</th>
                      <th>شروع</th>
                      <th>پایان</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub, index) => (
                      <tr key={sub.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar" style={{ background: '#dbeafe' }}>
                              {sub.user_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{sub.user_name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sub.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td><strong>{sub.plan_name}</strong></td>
                        <td>
                          <span className="admin-duration-badge">
                            {sub.duration === '1m' ? '۱ ماهه' : 
                             sub.duration === '3m' ? '۳ ماهه' : '۹ ماهه'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(sub.start_date)}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(sub.end_date)}</td>
                        <td>{getStatusBadge(sub.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ========== استایل‌ها ========== */}
      <style>{`
        /* ====== کانتینر اصلی ====== */
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe, #fef3c7);
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
          padding: 16px;
        }

        /* ====== اسپینر ====== */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }

        /* ====== صفحه لاگین ====== */
        .admin-login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .admin-login-card {
          background: white;
          border-radius: 24px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .admin-login-header { text-align: center; margin-bottom: 32px; }
        .admin-login-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .admin-login-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
        .admin-login-subtitle { color: #6b7280; font-size: 0.9rem; }
        .admin-login-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .admin-login-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .admin-login-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }
        .admin-login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        .admin-login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ====== لودینگ ====== */
        .admin-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          gap: 16px;
        }
        .admin-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* ====== توست ====== */
        .admin-toast {
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          max-width: 400px;
        }
        .admin-toast.success { background: #10b981; color: white; }
        .admin-toast.error { background: #ef4444; color: white; }
        .admin-toast button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          margin-right: auto;
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* ====== هدر ====== */
        .admin-header {
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 20px;
          color: white;
        }
        .admin-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .admin-header-title h1 {
          font-size: 1.3rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .admin-header-title p {
          font-size: 0.8rem;
          opacity: 0.7;
          margin: 0;
        }
        .admin-header-info { display: flex; gap: 10px; }
        .admin-refresh-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .admin-refresh-btn:hover { background: rgba(255,255,255,0.2); }
        .admin-logout-btn {
          background: rgba(239,68,68,0.2);
          border: 1px solid rgba(239,68,68,0.3);
          padding: 8px 16px;
          border-radius: 8px;
          color: #fca5a5;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .admin-logout-btn:hover { background: rgba(239,68,68,0.4); }

        /* ====== کارت‌های آمار ====== */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .admin-stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border-right: 4px solid;
        }
        .admin-stat-card.blue { border-right-color: #2563eb; }
        .admin-stat-card.green { border-right-color: #10b981; }
        .admin-stat-card.yellow { border-right-color: #f59e0b; }
        .admin-stat-card.purple { border-right-color: #8b5cf6; }
        .admin-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .admin-stat-icon.blue { background: #dbeafe; color: #2563eb; }
        .admin-stat-icon.green { background: #d1fae5; color: #10b981; }
        .admin-stat-icon.yellow { background: #fef3c7; color: #f59e0b; }
        .admin-stat-icon.purple { background: #ede9fe; color: #8b5cf6; }
        .admin-stat-value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }
        .admin-stat-label { font-size: 0.8rem; color: #64748b; }
        .admin-stat-trend { font-size: 0.7rem; color: #10b981; margin-top: 4px; }

        /* ====== تب‌ها ====== */
        .admin-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          flex-wrap: wrap;
        }
        .admin-tab-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
          min-width: 100px;
        }
        .admin-tab-btn:hover { background: #f1f5f9; }
        .admin-tab-btn.active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
        }

        /* ====== محتوای تب‌ها ====== */
        .admin-tab-content {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          min-height: 400px;
        }

        /* ====== نمای کلی ====== */
        .admin-stats-advanced {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .admin-stats-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
        }
        .admin-stats-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-progress-bar { margin-bottom: 12px; }
        .admin-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 4px;
          color: #475569;
        }
        .admin-progress-track {
          height: 8px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }
        .admin-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 1s ease;
        }
        .admin-top-users {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .admin-top-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .admin-top-user-rank {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #475569;
          font-size: 0.85rem;
        }
        .admin-top-user-rank.top { background: #fef3c7; color: #f59e0b; }
        .admin-top-user-info { flex: 1; }
        .admin-top-user-name { font-weight: 600; }
        .admin-top-user-stats { text-align: left; font-size: 0.75rem; color: #64748b; }

        /* ====== جستجو و فیلتر ====== */
        .admin-search-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .admin-search-input {
          flex: 1;
          position: relative;
          min-width: 200px;
        }
        .admin-search-input svg {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .admin-search-input input {
          width: 100%;
          padding: 10px 40px 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .admin-search-input input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .admin-filters {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .admin-filter-select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.85rem;
          background: white;
        }
        .admin-view-toggle {
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .admin-view-toggle.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        /* ====== جدول کاربران ====== */
        .admin-users-table {
          overflow-x: auto;
        }
        .admin-users-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-users-table th {
          text-align: right;
          padding: 12px;
          background: #f8fafc;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.8rem;
          color: #475569;
          white-space: nowrap;
        }
        .admin-users-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.85rem;
        }
        .admin-users-table tr:hover td { background: #f8fafc; }
        .admin-table-footer {
          padding: 12px;
          text-align: left;
          font-size: 0.8rem;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }

        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
          color: #1e293b;
        }
        .admin-role-select {
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          background: white;
          font-family: inherit;
          cursor: pointer;
        }
        .admin-status-toggle {
          padding: 4px 12px;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .admin-status-toggle.active { background: #d1fae5; color: #065f46; }
        .admin-status-toggle.inactive { background: #fee2e2; color: #991b1b; }
        .admin-btn-danger {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .admin-btn-danger:hover { background: #fee2e2; }

        /* ====== پیام‌ها ====== */
        .admin-messages-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
        }
        .admin-messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
        }
        .admin-message-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-message-item:hover { border-color: #2563eb; }
        .admin-message-item.unread {
          background: #fffbeb;
          border-right: 4px solid #f59e0b;
        }
        .admin-message-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 8px;
        }
        .admin-message-sender h4 { margin: 0; font-size: 0.95rem; }
        .admin-message-sender p { margin: 0; font-size: 0.7rem; color: #94a3b8; }
        .admin-message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #f59e0b;
          border-radius: 50%;
        }
        .admin-message-date { font-size: 0.7rem; color: #94a3b8; }
        .admin-message-subject { font-weight: 600; margin-bottom: 4px; }
        .admin-message-preview { font-size: 0.85rem; color: #64748b; }
        .admin-message-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .admin-btn-read {
          background: none;
          border: none;
          color: #10b981;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .admin-btn-delete-small {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .admin-btn-delete-small:hover { background: #fee2e2; }

        .admin-message-detail {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          position: sticky;
          top: 100px;
          max-height: 600px;
          overflow-y: auto;
        }
        .admin-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin-detail-title {
          margin: 0;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .unread-badge {
          background: #f59e0b;
          color: white;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
        }
        .admin-close-detail {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
        }
        .admin-detail-field { margin-bottom: 12px; }
        .admin-detail-label { font-size: 0.7rem; color: #94a3b8; }
        .admin-detail-value { font-size: 0.9rem; }
        .admin-detail-message-box {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        .admin-detail-empty {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
        .admin-detail-actions-bottom {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .admin-btn-read-large {
          flex: 1;
          padding: 10px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }
        .admin-btn-read-large:hover { background: #059669; }
        .admin-btn-delete-large {
          flex: 1;
          padding: 10px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }
        .admin-btn-delete-large:hover { background: #dc2626; }

        /* ====== تیکت‌ها ====== */
        .admin-tickets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .admin-ticket-item {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s;
        }
        .admin-ticket-item:hover { border-color: #2563eb; }
        .admin-ticket-item.pending { border-right: 4px solid #f59e0b; }
        .admin-ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .admin-ticket-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-ticket-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          color: #1e293b;
        }
        .admin-ticket-user strong { font-size: 0.95rem; }
        .admin-ticket-user span { font-size: 0.7rem; color: #94a3b8; }
        .admin-ticket-badges {
          display: flex;
          gap: 6px;
        }
        .admin-ticket-subject { font-weight: 600; margin-bottom: 4px; }
        .admin-ticket-message {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .admin-ticket-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .admin-ticket-date {
          font-size: 0.7rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .admin-ticket-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .admin-btn-reply {
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .admin-btn-reply:hover { background: #1d4ed8; }
        .admin-btn-close {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .admin-btn-close:hover { background: #dc2626; }
        .admin-btn-reopen {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .admin-btn-reopen:hover { background: #d97706; }

        .admin-reply-form {
          margin-top: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .admin-reply-form textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          resize: vertical;
          font-size: 0.85rem;
        }
        .admin-reply-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .admin-btn-cancel {
          padding: 6px 16px;
          background: #e2e8f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .admin-btn-send {
          padding: 6px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .admin-btn-send:hover { background: #059669; }

        /* ====== اشتراک‌ها ====== */
        .admin-subscriptions-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .sub-stat {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }
        .sub-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }
        .sub-stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .admin-subscriptions-table {
          overflow-x: auto;
        }
        .admin-subscriptions-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-subscriptions-table th {
          text-align: right;
          padding: 12px;
          background: #f8fafc;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.8rem;
          color: #475569;
        }
        .admin-subscriptions-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.85rem;
        }
        .admin-duration-badge {
          background: #e2e8f0;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          color: #475569;
        }

        /* ====== ریسپانسیو ====== */
        @media (max-width: 1024px) {
          .admin-stats-advanced { grid-template-columns: 1fr; }
          .admin-messages-grid { grid-template-columns: 1fr; }
          .admin-message-detail { position: static; max-height: none; }
        }

        @media (max-width: 768px) {
          .admin-stats-grid { grid-template-columns: 1fr 1fr; }
          .admin-header-content { flex-direction: column; text-align: center; }
          .admin-tabs { flex-direction: column; }
          .admin-tab-btn { min-width: auto; }
          .admin-subscriptions-stats { grid-template-columns: 1fr 1fr; }
          .admin-search-bar { flex-direction: column; }
          .admin-search-input { width: 100%; }
          .admin-filters { width: 100%; flex-wrap: wrap; }
          .admin-filter-select { flex: 1; }
          .admin-users-table { font-size: 0.75rem; }
          .admin-users-table th, .admin-users-table td { padding: 8px; }
        }

        @media (max-width: 480px) {
          .admin-stats-grid { grid-template-columns: 1fr; }
          .admin-login-card { padding: 24px; }
          .admin-ticket-header { flex-direction: column; align-items: flex-start; }
          .admin-ticket-actions { width: 100%; justify-content: flex-start; }
          .admin-detail-actions-bottom { flex-direction: column; }
          .admin-subscriptions-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;