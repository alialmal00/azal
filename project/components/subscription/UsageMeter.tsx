// src/components/UsageMeter.tsx
import React from 'react';
import { FiBarChart2, FiMessageSquare, FiHardDrive, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface UsageMeterProps {
    usage: {
        exams_used: number;
        max_exams: number;
        advisor_used: number;
        max_advisor: number;
        storage_used_mb: number;
        max_storage: number;
    };
}

const UsageMeter: React.FC<UsageMeterProps> = ({ usage }) => {
    console.log('📊 UsageMeter received:', usage);

    // داده‌های ایمن با مقادیر پیش‌فرض
    const safeUsage = {
        exams_used: usage?.exams_used ?? 0,
        max_exams: usage?.max_exams ?? 5,
        advisor_used: usage?.advisor_used ?? 0,
        max_advisor: usage?.max_advisor ?? 30,
        storage_used_mb: usage?.storage_used_mb ?? 0,
        max_storage: usage?.max_storage ?? 1.5
    };

    const items = [
        {
            icon: <FiBarChart2 />,
            label: 'آزمون‌ها',
            used: safeUsage.exams_used,
            max: safeUsage.max_exams,
            color: '#2563eb',
            getStatus: (used: number, max: number) => {
                const remaining = max - used;
                if (remaining <= 0) return { text: 'تمام شده', color: '#ef4444', icon: <FiAlertCircle /> };
                if (remaining <= 2) return { text: `${remaining} عدد باقی`, color: '#f59e0b', icon: <FiAlertCircle /> };
                return { text: `${remaining} عدد`, color: '#10b981', icon: <FiCheckCircle /> };
            }
        },
        {
            icon: <FiMessageSquare />,
            label: 'پیام مشاور',
            used: safeUsage.advisor_used,
            max: safeUsage.max_advisor,
            color: '#8b5cf6',
            getStatus: (used: number, max: number) => {
                const remaining = max - used;
                if (remaining <= 0) return { text: 'تمام شده', color: '#ef4444', icon: <FiAlertCircle /> };
                if (remaining <= 5) return { text: `${remaining} پیام باقی`, color: '#f59e0b', icon: <FiAlertCircle /> };
                return { text: `${remaining} پیام`, color: '#10b981', icon: <FiCheckCircle /> };
            }
        },
        {
            icon: <FiHardDrive />,
            label: 'فضای ذخیره‌سازی',
            used: safeUsage.storage_used_mb,
            max: safeUsage.max_storage,
            color: '#10b981',
            unit: 'MB',
            getStatus: (used: number, max: number) => {
                const percent = (used / max) * 100;
                if (percent >= 100) return { text: 'پر شده', color: '#ef4444', icon: <FiAlertCircle /> };
                if (percent >= 80) return { text: `${Math.round(percent)}% استفاده`, color: '#f59e0b', icon: <FiAlertCircle /> };
                return { text: `${Math.round(percent)}%`, color: '#10b981', icon: <FiCheckCircle /> };
            }
        }
    ];

    return (
        <div className="usage-meter">
            {items.map((item, index) => {
                const percent = Math.min((item.used / item.max) * 100, 100);
                const status = item.getStatus(item.used, item.max);
                const isFull = item.used >= item.max;

                return (
                    <div key={index} className="usage-item">
                        <div className="usage-header">
                            <div className="usage-icon" style={{ color: item.color }}>
                                {item.icon}
                            </div>
                            <div className="usage-label">
                                <span>{item.label}</span>
                                <span className="usage-numbers">
                                    {item.used} / {item.max} {item.unit || ''}
                                </span>
                            </div>
                            <div className="usage-status" style={{ color: status.color }}>
                                {status.icon}
                                <span>{status.text}</span>
                            </div>
                        </div>
                        <div className="progress-track">
                            <div 
                                className={`progress-fill ${isFull ? 'full' : percent >= 80 ? 'warning' : ''}`}
                                style={{ 
                                    width: `${Math.min(percent, 100)}%`,
                                    background: isFull ? '#ef4444' : percent >= 80 ? '#f59e0b' : item.color
                                }}
                            />
                        </div>
                        <div className="usage-footer">
                            <span>{item.used} استفاده شده</span>
                            <span>حداکثر {item.max}</span>
                        </div>
                    </div>
                );
            })}

            <style>{`
                .usage-meter {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .usage-item {
                    background: #f8fafc;
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                }

                .usage-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }

                .usage-icon {
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                }

                .usage-label {
                    flex: 1;
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #1e293b;
                    gap: 8px;
                }

                .usage-numbers {
                    font-weight: 600;
                    color: #475569;
                }

                .usage-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .progress-track {
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }

                .progress-fill.warning {
                    background: #f59e0b;
                }
                .progress-fill.full {
                    background: #ef4444;
                }

                .usage-footer {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    color: #94a3b8;
                }

                @media (max-width: 768px) {
                    .usage-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .usage-status {
                        align-self: flex-start;
                    }
                }
            `}</style>
        </div>
    );
};

export default UsageMeter;