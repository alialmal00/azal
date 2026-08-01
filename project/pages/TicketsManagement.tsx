// src/pages/TicketsManagement.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMessageSquare, FiCheckCircle, FiAlertCircle, FiClock, FiSend, FiX, FiRefreshCw, FiUser } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

interface Ticket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  answer: string | null;
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  answered_at: string | null;
}

const TicketsManagement: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered' | 'closed'>('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, answered: 0, closed: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setRefreshing(true);
    setError(null);
    try {
      console.log('🔄 Fetching tickets from:', `${API_URL}/tickets/admin/all`);
      
      const response = await axios.get(`${API_URL}/tickets/admin/all`, {
        withCredentials: true,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', response.data);
      
      if (response.data.success) {
        const ticketsData = response.data.data || [];
        console.log(`✅ Found ${ticketsData.length} tickets`);
        
        if (ticketsData.length === 0) {
          console.log('⚠️ No tickets found. Possible reasons:');
          console.log('   1. No tickets have been submitted yet');
          console.log('   2. Database connection issue');
          console.log('   3. Tickets table is empty');
        }
        
        setTickets(ticketsData);
        setStats({
          total: ticketsData.length,
          pending: ticketsData.filter((t: Ticket) => t.status === 'pending').length,
          answered: ticketsData.filter((t: Ticket) => t.status === 'answered').length,
          closed: ticketsData.filter((t: Ticket) => t.status === 'closed').length
        });
      } else {
        console.error('API returned success=false:', response.data.message);
        setError(response.data.message || 'خطا در دریافت تیکت‌ها');
      }
    } catch (error: any) {
      console.error('❌ Error fetching tickets:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        if (error.response.status === 401) {
          setError('لطفاً دوباره وارد پنل ادمین شوید');
        } else {
          setError(error.response.data?.message || 'خطا در ارتباط با سرور');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setError('سرور پاسخ نمی‌دهد. لطفاً مطمئن شوید سرور در حال اجراست.');
      } else {
        setError(error.message || 'خطای ناشناخته');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket) return;
    if (!replyText.trim()) {
      alert('لطفاً پاسخ را وارد کنید');
      return;
    }

    setReplyLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/tickets/admin/${selectedTicket.id}/answer`,
        { answer: replyText },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('✅ پاسخ با موفقیت ثبت شد');
        setReplyText('');
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert(response.data.message || 'خطا در ثبت پاسخ');
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      alert(error.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setReplyLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge pending"><FiClock /> در انتظار پاسخ</span>;
      case 'answered':
        return <span className="badge answered"><FiCheckCircle /> پاسخ داده شده</span>;
      case 'closed':
        return <span className="badge closed"><FiX /> بسته شده</span>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'answered': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="tickets-loading">
        <div className="spinner"></div>
        <p>در حال بارگذاری تیکت‌ها...</p>
      </div>
    );
  }

  return (
    <div className="tickets-management">
      <div className="tickets-header">
        <h1><FiMessageSquare /> مدیریت تیکت‌های پشتیبانی</h1>
        <p>مشاهده و پاسخ به تیکت‌های کاربران</p>
        <button className="refresh-btn" onClick={fetchTickets} disabled={refreshing}>
          <FiRefreshCw className={refreshing ? 'spin' : ''} />
          {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><FiX size={16} /></button>
        </div>
      )}

      <div className="stats-cards">
        <div className="stat-card" style={{ borderRightColor: '#3b82f6' }} onClick={() => setFilter('all')}>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">کل تیکت‌ها</div>
        </div>
        <div className="stat-card" style={{ borderRightColor: '#f59e0b' }} onClick={() => setFilter('pending')}>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">در انتظار پاسخ</div>
        </div>
        <div className="stat-card" style={{ borderRightColor: '#10b981' }} onClick={() => setFilter('answered')}>
          <div className="stat-value">{stats.answered}</div>
          <div className="stat-label">پاسخ داده شده</div>
        </div>
        <div className="stat-card" style={{ borderRightColor: '#6b7280' }} onClick={() => setFilter('closed')}>
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-label">بسته شده</div>
        </div>
      </div>

      <div className="filter-buttons">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>همه</button>
        <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>در انتظار</button>
        <button className={`filter-btn ${filter === 'answered' ? 'active' : ''}`} onClick={() => setFilter('answered')}>پاسخ داده شده</button>
        <button className={`filter-btn ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>بسته شده</button>
      </div>

      <div className="tickets-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare size={48} />
            <p>هیچ تیکتی یافت نشد</p>
            {filter !== 'all' && (
              <button className="clear-filter-btn" onClick={() => setFilter('all')}>
                نمایش همه تیکت‌ها
              </button>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className={`ticket-card ${ticket.status}`} style={{ borderRightColor: getStatusColor(ticket.status) }}>
              <div className="ticket-header">
                <div className="ticket-user">
                  <FiUser />
                  <div>
                    <strong>{ticket.user_name || 'کاربر ناشناس'}</strong>
                    <span>{ticket.user_email}</span>
                  </div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>
              
              <div className="ticket-subject">{ticket.subject}</div>
              <div className="ticket-message">{ticket.message}</div>
              
              <div className="ticket-date">
                {new Date(ticket.created_at).toLocaleDateString('fa-IR')} - {new Date(ticket.created_at).toLocaleTimeString('fa-IR')}
              </div>
              
              {ticket.answer && (
                <div className="ticket-answer">
                  <strong>پاسخ شما:</strong>
                  <p>{ticket.answer}</p>
                </div>
              )}
              
              {ticket.status === 'pending' && (
                <button className="reply-btn" onClick={() => setSelectedTicket(ticket)}>
                  <FiSend /> پاسخ به تیکت
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="reply-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>پاسخ به تیکت: {selectedTicket.subject}</h3>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="original-message">
                <strong>پیام کاربر:</strong>
                <p>{selectedTicket.message}</p>
                <small>{selectedTicket.user_name} - {new Date(selectedTicket.created_at).toLocaleString('fa-IR')}</small>
              </div>
              <textarea
                placeholder="پاسخ خود را وارد کنید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setSelectedTicket(null)}>انصراف</button>
              <button className="send-btn" onClick={handleReply} disabled={replyLoading}>
                {replyLoading ? 'در حال ارسال...' : <><FiSend /> ارسال پاسخ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tickets-management {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          direction: rtl;
          font-family: 'Vazirmatn', sans-serif;
        }
        .tickets-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        .tickets-header h1 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tickets-header p {
          margin: 0;
          opacity: 0.8;
        }
        .refresh-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .refresh-btn:hover {
          background: rgba(255,255,255,0.25);
        }
        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border-right: 4px solid #ef4444;
        }
        .error-message button {
          background: none;
          border: none;
          cursor: pointer;
          margin-right: auto;
          color: inherit;
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          border-right: 4px solid;
          transition: transform 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .stat-card:hover {
          transform: translateY(-4px);
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
        }
        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
        }
        .filter-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: 50px;
        }
        .filter-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn.active {
          background: #2563eb;
          color: white;
        }
        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ticket-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          border-right: 4px solid;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        .ticket-card:hover {
          transform: translateX(-4px);
        }
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .ticket-user {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
        }
        .ticket-user strong {
          display: block;
          font-size: 0.9rem;
          color: #1e293b;
        }
        .ticket-user span {
          font-size: 0.7rem;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .badge.pending { background: #fef3c7; color: #92400e; }
        .badge.answered { background: #d1fae5; color: #065f46; }
        .badge.closed { background: #e2e8f0; color: #475569; }
        .ticket-subject {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .ticket-message {
          color: #4b5563;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .ticket-date {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-bottom: 12px;
        }
        .ticket-answer {
          background: #f0fdf4;
          padding: 12px;
          border-radius: 12px;
          margin: 12px 0;
        }
        .ticket-answer strong {
          display: block;
          font-size: 0.75rem;
          margin-bottom: 6px;
        }
        .reply-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          margin-top: 8px;
        }
        .reply-btn:hover {
          background: #1d4ed8;
        }
        .empty-state {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 20px;
          color: #94a3b8;
        }
        .clear-filter-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          cursor: pointer;
          margin-top: 16px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .reply-modal {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 550px;
          overflow: hidden;
          animation: slideIn 0.3s ease;
        }
        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #94a3b8;
        }
        .modal-body {
          padding: 20px;
        }
        .original-message {
          background: #f8fafc;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .original-message textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          resize: vertical;
        }
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
        }
        .cancel-btn {
          flex: 1;
          padding: 10px;
          background: #e2e8f0;
          border: none;
          border-radius: 12px;
          cursor: pointer;
        }
        .send-btn {
          flex: 1;
          padding: 10px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .tickets-loading {
          text-align: center;
          padding: 80px;
        }
        @media (max-width: 768px) {
          .stats-cards { grid-template-columns: repeat(2, 1fr); }
          .filter-buttons { flex-wrap: wrap; border-radius: 16px; }
          .ticket-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default TicketsManagement;