import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiDownload, FiEye, FiCalendar, FiClock } from 'react-icons/fi';

interface Payment {
    id: string;
    plan_name: string;
    duration: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    created_at: string;
    paid_at: string | null;
    description: string;
}

const BillingPage: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_paid: 0,
        total_count: 0,
        last_payment: null as string | null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/subscription/billing');
            if (response.data.success) {
                const data = response.data.data.payments || [];
                setPayments(data);
                
                // محاسبه آمار
                const successPayments = data.filter((p: any) => p.status === 'success');
                setStats({
                    total_paid: successPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
                    total_count: successPayments.length,
                    last_payment: successPayments.length > 0 ? successPayments[0].created_at : null
                });
            }
        } catch (error: any) {
            console.error('Error loading billing data:', error);
            if (error.response?.status === 401) {
                window.location.href = '/login';
            }
        }
        setLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'success': return '✅ موفق';
            case 'pending': return '⏳ در انتظار';
            case 'failed': return '❌ ناموفق';
            default: return status;
        }
    };

    const getDurationText = (duration: string) => {
        switch (duration) {
            case '1m': return '۱ ماهه';
            case '3m': return '۳ ماهه';
            case '9m': return '۹ ماهه';
            default: return duration;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>در حال بارگذاری صورتحساب‌ها...</p>
            </div>
        );
    }

    return (
        <div className="billing-page">
            <div className="page-header">
                <h2>💰 صورتحساب‌ها</h2>
                <p>تاریخچه پرداخت‌ها و صورتحساب‌های شما</p>
            </div>

            {/* کارت‌های آمار */}
            <div className="billing-stats">
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>{stats.total_paid.toLocaleString('fa-IR')}</h3>
                        <p>تومان</p>
                        <span>مجموع پرداخت‌ها</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <h3>{stats.total_count}</h3>
                        <p>فاکتور</p>
                        <span>تعداد پرداخت‌ها</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <h3>{stats.last_payment ? formatDate(stats.last_payment).split(' ')[0] : '—'}</h3>
                        <p>تاریخ</p>
                        <span>آخرین پرداخت</span>
                    </div>
                </div>
            </div>

            {/* لیست صورتحساب‌ها */}
            <div className="billing-list">
                <h3>📋 تاریخچه پرداخت‌ها</h3>
                {payments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>هیچ صورتحسابی ثبت نشده است</p>
                        <p className="empty-hint">برای خرید اشتراک به بخش <a href="/dashboard/subscription">اشتراک‌ها</a> بروید</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>تاریخ</th>
                                    <th>پلن</th>
                                    <th>مدت</th>
                                    <th>مبلغ</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => (
                                    <tr key={payment.id} className={payment.status === 'success' ? 'success-row' : ''}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="date-cell">
                                                <FiCalendar />
                                                <span>{formatDate(payment.created_at)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="plan-name">{payment.plan_name}</span>
                                        </td>
                                        <td>
                                            <span className="duration-badge">{getDurationText(payment.duration)}</span>
                                        </td>
                                        <td>
                                            <span className="amount">{payment.amount.toLocaleString('fa-IR')}</span>
                                            <span className="currency">تومان</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${payment.status}`}>
                                                {getStatusText(payment.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-download" disabled={payment.status !== 'success'}>
                                                <FiDownload size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .billing-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    direction: rtl;
                }

                .page-header {
                    margin-bottom: 24px;
                }
                .page-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .page-header p {
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .billing-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                .stat-icon {
                    font-size: 2rem;
                }
                .stat-info h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .stat-info p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #1e293b;
                }
                .stat-info span {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .billing-list {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                .billing-list h3 {
                    margin-bottom: 16px;
                    font-size: 1.1rem;
                }

                .table-wrapper {
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th {
                    text-align: right;
                    padding: 12px 16px;
                    background: #f8fafc;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }
                td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    vertical-align: middle;
                }
                .success-row {
                    background: #f8fafc;
                }

                .date-cell {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #475569;
                }

                .plan-name {
                    font-weight: 600;
                    color: #1e293b;
                }

                .duration-badge {
                    background: #e2e8f0;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: #475569;
                }

                .amount {
                    font-weight: 700;
                    color: #1e293b;
                    margin-left: 4px;
                }
                .currency {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-badge.success {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-badge.pending {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-badge.failed {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .btn-download {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .btn-download:hover:not(:disabled) {
                    background: #f1f5f9;
                    color: #2563eb;
                }
                .btn-download:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }
                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                .empty-state p {
                    color: #94a3b8;
                }
                .empty-hint {
                    font-size: 0.85rem;
                    margin-top: 8px;
                }
                .empty-hint a {
                    color: #2563eb;
                    text-decoration: none;
                }
                .empty-hint a:hover {
                    text-decoration: underline;
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    gap: 16px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top: 3px solid #2563eb;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .billing-stats {
                        grid-template-columns: 1fr;
                    }
                    .billing-list {
                        padding: 16px;
                    }
                    th, td {
                        padding: 8px 12px;
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default BillingPage;