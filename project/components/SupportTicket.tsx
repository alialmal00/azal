// frontend/components/SupportTicket.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiMessageSquare, FiPhone, FiMail, FiSend, FiPlus,
  FiCheckCircle, FiAlertCircle, FiRefreshCw,
  FiCalendar, FiTag, FiFlag, FiFolder, FiClock,
  FiX, FiSearch, FiEye, FiCornerUpLeft, FiUser, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { ticketService, Ticket, TicketStats, Category } from '../services/ticketService';

interface SupportTicketProps {
  user: any;
}

const SupportTicket: React.FC<SupportTicketProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // فرم تیکت جدید
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    phone: '',
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium'
  });

  const priorityConfig = {
    low: { bg: '#D1FAE5', text: '#065F46', label: 'کم', icon: '🟢' },
    medium: { bg: '#FEF3C7', text: '#92400E', label: 'متوسط', icon: '🟡' },
    high: { bg: '#FED7AA', text: '#9A3412', label: 'بالا', icon: '🟠' },
    urgent: { bg: '#FEE2E2', text: '#991B1B', label: 'فوری', icon: '🔴' }
  };

  const statusConfig = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'در انتظار پاسخ', icon: '⏳' },
    answered: { bg: '#D1FAE5', text: '#065F46', label: 'پاسخ داده شده', icon: '✓' },
    closed: { bg: '#E2E8F0', text: '#475569', label: 'بسته شده', icon: '🔒' }
  };

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [ticketsRes, categoriesRes] = await Promise.all([
        ticketService.getMyTickets({ status: activeFilter === 'all' ? undefined : activeFilter }),
        ticketService.getCategories()
      ]);

      if (ticketsRes.success && ticketsRes.tickets) {
        setTickets(ticketsRes.tickets);
        setStats(ticketsRes.stats || null);
      }
      if (categoriesRes.success && categoriesRes.categories) {
        setCategories(categoriesRes.categories);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('خطا در دریافت اطلاعات');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId: number) => {
    try {
      const result = await ticketService.getTicketById(ticketId);
      if (result.success && result.ticket) {
        setSelectedTicket(result.ticket);
      }
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  useEffect(() => {
    if (selectedTicket && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [selectedTicket]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('لطفاً موضوع و پیام را وارد کنید');
      return;
    }

    setReplyLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ticketService.submitTicket(formData);
      if (result.success) {
        setSuccess('✅ تیکت شما با موفقیت ثبت شد');
        setFormData({
          ...formData,
          subject: '',
          message: '',
          phone: formData.phone,
          category: 'general',
          priority: 'medium'
        });
        setShowNewTicketForm(false);
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'خطا در ثبت تیکت');
      }
    } catch (err) {
      console.error('Submit ticket error:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) {
      setError('لطفاً پاسخ را وارد کنید');
      return;
    }

    setReplyLoading(true);
    try {
      const result = await ticketService.addReply(selectedTicket.id, replyText);
      if (result.success) {
        setSuccess('✅ پاسخ شما با موفقیت ثبت شد');
        setReplyText('');
        await fetchData();
        await fetchTicketDetail(selectedTicket.id);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'خطا در ثبت پاسخ');
      }
    } catch (err) {
      console.error('Reply error:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('آیا از بستن این تیکت اطمینان دارید؟')) return;

    try {
      const result = await ticketService.closeTicket(selectedTicket.id);
      if (result.success) {
        setSuccess('✅ تیکت با موفقیت بسته شد');
        await fetchData();
        await fetchTicketDetail(selectedTicket.id);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'خطا در بستن تیکت');
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError('خطا در بستن تیکت');
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      const result = await ticketService.reopenTicket(selectedTicket.id);
      if (result.success) {
        setSuccess('✅ تیکت با موفقیت باز شد');
        await fetchData();
        await fetchTicketDetail(selectedTicket.id);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'خطا در باز کردن تیکت');
      }
    } catch (err) {
      console.error('Error reopening ticket:', err);
      setError('خطا در باز کردن تیکت');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (searchTerm) {
      return ticket.subject.includes(searchTerm) || ticket.message.includes(searchTerm);
    }
    return true;
  });

  const formatDate = (date: string) => {
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

  const categoryMap: Record<string, string> = {
    general: 'عمومی',
    technical: 'فنی',
    financial: 'مالی',
    educational: 'آموزشی',
    account: 'حساب کاربری'
  };

  if (loading) {
    return (
      <div className="support-loading">
        <div className="spinner"></div>
        <p>در حال بارگذاری تیکت‌ها...</p>
      </div>
    );
  }

  return (
    <div className="support-ticket-container">
      {/* Toast Notifications */}
      {error && (
        <div className="toast-message error" onClick={() => setError(null)}>
          <FiAlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><FiX size={14} /></button>
        </div>
      )}
      {success && (
        <div className="toast-message success" onClick={() => setSuccess(null)}>
          <FiCheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><FiX size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-header-content">
          <div className="ticket-header-icon">
            <FiMessageSquare size={28} />
          </div>
          <div className="ticket-header-text">
            <h1>پشتیبانی آزمونیک</h1>
            <p>ثبت و پیگیری درخواست‌های پشتیبانی</p>
          </div>
          <button className="new-ticket-btn" onClick={() => setShowNewTicketForm(true)}>
            <FiPlus size={18} /> تیکت جدید
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card" style={{ borderRightColor: '#3b82f6' }} onClick={() => setActiveFilter('all')}>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">کل تیکت‌ها</div>
          </div>
          <div className="stat-card" style={{ borderRightColor: '#f59e0b' }} onClick={() => setActiveFilter('pending')}>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">در انتظار پاسخ</div>
          </div>
          <div className="stat-card" style={{ borderRightColor: '#10b981' }} onClick={() => setActiveFilter('answered')}>
            <div className="stat-value">{stats.answered}</div>
            <div className="stat-label">پاسخ داده شده</div>
          </div>
          <div className="stat-card" style={{ borderRightColor: '#6b7280' }} onClick={() => setActiveFilter('closed')}>
            <div className="stat-value">{stats.closed}</div>
            <div className="stat-label">بسته شده</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="جستجوی تیکت‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={fetchData} disabled={refreshing}>
          <FiRefreshCw className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      {/* Tickets Layout */}
      <div className="tickets-layout">
        {/* Left Sidebar - Tickets List */}
        <div className="tickets-sidebar">
          <div className="tickets-list-header">
            <h3>تیکت‌های من</h3>
            <span className="tickets-count">{filteredTickets.length}</span>
          </div>
          <div className="tickets-list">
            {filteredTickets.length === 0 ? (
              <div className="empty-tickets">
                <FiMessageSquare size={40} />
                <p>هیچ تیکتی یافت نشد</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`ticket-list-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                  onClick={() => fetchTicketDetail(ticket.id)}
                >
                  <div className="ticket-item-header">
                    <div className="ticket-subject">{ticket.subject}</div>
                    <div className={`priority-badge ${ticket.priority}`}>
                      {priorityConfig[ticket.priority].icon} {priorityConfig[ticket.priority].label}
                    </div>
                  </div>
                  <div className="ticket-item-preview">
                    {ticket.message.substring(0, 60)}...
                  </div>
                  <div className="ticket-item-footer">
                    <div className="ticket-category">
                      <FiFolder size={12} />
                      {categoryMap[ticket.category] || ticket.category}
                    </div>
                    <div className={`ticket-status ${ticket.status}`}>
                      {statusConfig[ticket.status].icon} {statusConfig[ticket.status].label}
                    </div>
                  </div>
                  <div className="ticket-item-date">
                    <FiCalendar size={12} />
                    {getTimeAgo(ticket.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Ticket Detail */}
        <div className="ticket-detail-panel">
          {selectedTicket ? (
            <div className="ticket-detail">
              <div className="ticket-detail-header">
                <div className="ticket-detail-title">
                  <h3>{selectedTicket.subject}</h3>
                  <div className={`status-badge ${selectedTicket.status}`}>
                    {statusConfig[selectedTicket.status].icon} {statusConfig[selectedTicket.status].label}
                  </div>
                </div>
                <div className="ticket-detail-meta">
                  <div className="meta-item">
                    <FiTag size={14} />
                    <span>دسته‌بندی:</span>
                    <strong>{categoryMap[selectedTicket.category] || selectedTicket.category}</strong>
                  </div>
                  <div className="meta-item">
                    <FiFlag size={14} />
                    <span>اولویت:</span>
                    <strong className={`priority-text ${selectedTicket.priority}`}>
                      {priorityConfig[selectedTicket.priority].label}
                    </strong>
                  </div>
                  <div className="meta-item">
                    <FiUser size={14} />
                    <span>ارسال‌کننده:</span>
                    <strong>{selectedTicket.full_name || user?.name}</strong>
                  </div>
                  <div className="meta-item">
                    <FiCalendar size={14} />
                    <span>تاریخ ثبت:</span>
                    <strong>{formatDate(selectedTicket.created_at)}</strong>
                  </div>
                </div>
              </div>

              <div className="ticket-detail-body">
                {/* User Message */}
                <div className="message-box user-message">
                  <div className="message-header">
                    <div className="message-sender">
                      <div className="sender-avatar">
                        {(selectedTicket.full_name || user?.name)?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <strong>{selectedTicket.full_name || user?.name}</strong>
                        <span className="sender-role">کاربر</span>
                      </div>
                    </div>
                    <div className="message-date">{formatDate(selectedTicket.created_at)}</div>
                  </div>
                  <div className="message-content">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies && selectedTicket.replies.map((reply) => (
                  <div key={reply.id} className={`message-box ${reply.is_admin ? 'admin-message' : 'user-message'}`}>
                    <div className="message-header">
                      <div className="message-sender">
                        <div className="sender-avatar" style={reply.is_admin ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' } : {}}>
                          {reply.is_admin ? 'A' : (reply.display_name?.charAt(0) || 'U')}
                        </div>
                        <div>
                          <strong>{reply.display_name}</strong>
                          <span className="sender-role">{reply.is_admin ? 'پشتیبانی' : 'کاربر'}</span>
                        </div>
                      </div>
                      <div className="message-date">{formatDate(reply.created_at)}</div>
                    </div>
                    <div className="message-content">
                      {reply.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Section */}
              {selectedTicket.status !== 'closed' && (
                <div className="ticket-detail-footer">
                  <textarea
                    ref={replyInputRef}
                    className="reply-input"
                    placeholder="پاسخ خود را وارد کنید..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="reply-actions">
                    <button
                      className="btn-send-reply"
                      onClick={handleReply}
                      disabled={replyLoading || !replyText.trim()}
                    >
                      {replyLoading ? (
                        <div className="btn-spinner"></div>
                      ) : (
                        <><FiSend /> ارسال پاسخ</>
                      )}
                    </button>
                    <button
                      className="btn-close-ticket"
                      onClick={handleCloseTicket}
                    >
                      <FiX /> بستن تیکت
                    </button>
                  </div>
                </div>
              )}

              {/* Closed Ticket Info */}
              {selectedTicket.status === 'closed' && (
                <div className="ticket-closed-info">
                  <FiCheckCircle size={20} />
                  <span>این تیکت بسته شده است.</span>
                  <button className="btn-reopen" onClick={handleReopenTicket}>
                    <FiCornerUpLeft /> باز کردن مجدد
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="no-ticket-selected">
              <FiMessageSquare size={64} />
              <h3>تیکتی را انتخاب کنید</h3>
              <p>برای مشاهده جزئیات، روی یکی از تیکت‌ها کلیک کنید</p>
              <button className="btn-new-ticket" onClick={() => setShowNewTicketForm(true)}>
                <FiPlus /> تیکت جدید
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="modal-overlay" onClick={() => setShowNewTicketForm(false)}>
          <div className="new-ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 تیکت جدید</h3>
              <button className="modal-close" onClick={() => setShowNewTicketForm(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTicket} className="new-ticket-form">
              <div className="form-row">
                <div className="form-group">
                  <label><FiUser /> نام کامل</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
                <div className="form-group">
                  <label><FiPhone /> تلفن (اختیاری)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><FiFolder /> دسته‌بندی</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name_fa}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label><FiFlag /> اولویت</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange}>
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>موضوع</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="موضوع تیکت"
                  required
                />
              </div>
              <div className="form-group">
                <label>پیام</label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="مشکل خود را به طور کامل توضیح دهید..."
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowNewTicketForm(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn-submit" disabled={replyLoading}>
                  {replyLoading ? 'در حال ارسال...' : <><FiSend /> ارسال تیکت</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .support-ticket-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          direction: rtl;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
        }

        .toast-message {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          padding: 14px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          animation: slideInRight 0.3s ease;
        }
        .toast-message.success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        .toast-message.error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        .toast-message button {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .ticket-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
        }
        .ticket-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .ticket-header-icon {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.15);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ticket-header-text h1 {
          margin: 0 0 4px 0;
          font-size: 1.5rem;
        }
        .ticket-header-text p {
          margin: 0;
          opacity: 0.8;
          font-size: 0.85rem;
        }
        .new-ticket-btn {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 12px 24px;
          border-radius: 40px;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .new-ticket-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          border-right: 4px solid;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
        }
        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 4px;
        }

        .filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 40px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
        }
        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          padding: 8px 12px;
          font-size: 0.85rem;
          background: transparent;
        }
        .refresh-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 40px;
          width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .refresh-btn:hover {
          background: #f1f5f9;
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tickets-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          min-height: 600px;
        }

        .tickets-sidebar {
          background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        .tickets-list-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tickets-list-header h3 {
          margin: 0;
          font-size: 1rem;
        }
        .tickets-count {
          background: #e2e8f0;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        .tickets-list {
          flex: 1;
          overflow-y: auto;
          max-height: 600px;
        }
        .ticket-list-item {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ticket-list-item:hover {
          background: #f1f5f9;
        }
        .ticket-list-item.active {
          background: #eff6ff;
          border-right: 3px solid #2563eb;
        }
        .ticket-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .ticket-subject {
          font-weight: 600;
          font-size: 0.9rem;
          color: #1e293b;
        }
        .priority-badge {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .priority-badge.low { background: #d1fae5; color: #065f46; }
        .priority-badge.medium { background: #fef3c7; color: #92400e; }
        .priority-badge.high { background: #fed7aa; color: #9a3412; }
        .priority-badge.urgent { background: #fee2e2; color: #991b1b; }
        .ticket-item-preview {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 8px;
        }
        .ticket-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .ticket-category {
          font-size: 0.7rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ticket-status {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .ticket-status.pending { background: #fef3c7; color: #92400e; }
        .ticket-status.answered { background: #d1fae5; color: #065f46; }
        .ticket-status.closed { background: #e2e8f0; color: #475569; }
        .ticket-item-date {
          font-size: 0.65rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .empty-tickets {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }

        .ticket-detail-panel {
          background: white;
          overflow-y: auto;
          max-height: 600px;
        }
        .ticket-detail {
          padding: 24px;
        }
        .ticket-detail-header {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .ticket-detail-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .ticket-detail-title h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        .status-badge {
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.answered { background: #d1fae5; color: #065f46; }
        .status-badge.closed { background: #e2e8f0; color: #475569; }
        .ticket-detail-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 0.8rem;
          color: #64748b;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .priority-text.low { color: #10b981; }
        .priority-text.medium { color: #f59e0b; }
        .priority-text.high { color: #ea580c; }
        .priority-text.urgent { color: #ef4444; }

        .ticket-detail-body {
          margin-bottom: 24px;
        }
        .message-box {
          margin-bottom: 20px;
          border-radius: 16px;
          overflow: hidden;
        }
        .message-box.user-message {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .message-box.admin-message {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }
        .message-header {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .message-sender {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sender-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }
        .sender-role {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-right: 6px;
        }
        .message-date {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .message-content {
          padding: 16px;
          line-height: 1.7;
          font-size: 0.9rem;
          color: #1e293b;
          white-space: pre-wrap;
        }

        .ticket-detail-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .reply-input {
          width: 100%;
          padding: 14px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          transition: all 0.2s;
        }
        .reply-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .reply-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .btn-send-reply {
          flex: 2;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-send-reply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-close-ticket {
          flex: 1;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 12px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .ticket-closed-info {
          text-align: center;
          padding: 24px;
          background: #f1f5f9;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #10b981;
        }
        .btn-reopen {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .no-ticket-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 60px;
          text-align: center;
          color: #94a3b8;
        }
        .no-ticket-selected h3 {
          margin: 16px 0 8px;
          color: #64748b;
        }
        .btn-new-ticket {
          margin-top: 20px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .new-ticket-modal {
          background: white;
          border-radius: 28px;
          width: 90%;
          max-width: 650px;
          max-height: 85vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease;
        }
        @keyframes modalSlideIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
        }
        .new-ticket-form {
          padding: 24px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.85rem;
          color: #334155;
        }
        .form-group input, .form-group select, .form-group textarea {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.85rem;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .modal-footer {
          padding: 16px 24px 24px;
          display: flex;
          gap: 12px;
        }
        .btn-cancel {
          flex: 1;
          padding: 12px;
          background: #e2e8f0;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-submit {
          flex: 1;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .tickets-layout {
            grid-template-columns: 1fr;
          }
          .tickets-sidebar {
            border-left: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .tickets-list {
            max-height: 400px;
          }
          .stats-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .support-ticket-container {
            padding: 12px;
          }
          .ticket-header-content {
            flex-direction: column;
            text-align: center;
          }
          .ticket-detail-meta {
            flex-direction: column;
            gap: 8px;
          }
          .reply-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SupportTicket;