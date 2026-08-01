// src/components/subscription/PlanCard.tsx
import React, { useState } from 'react';
import { 
  FiCheckCircle, FiStar, FiLoader, FiUsers, 
  FiFileText, FiMessageSquare, FiClock, FiBookOpen, FiZap 
} from 'react-icons/fi';

interface PlanCardProps {
    plan: any;
    onSelect: (planId: string, duration: string) => void;
    isCurrent?: boolean;
    features?: Array<{ icon: React.ReactNode; label: string; value: any }>;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isCurrent, features = [] }) => {
    const [selectedDuration, setSelectedDuration] = useState('1m');
    const [isLoading, setIsLoading] = useState(false);

    const durations = [
        { label: '۱ ماهه', value: '1m', price: plan.price_1m },
        { label: '۳ ماهه (۱۰٪ تخفیف)', value: '3m', price: plan.price_3m },
        { label: '۹ ماهه (۱۸٪ تخفیف)', value: '9m', price: plan.price_9m }
    ];

    const getPrice = () => {
        const duration = durations.find(d => d.value === selectedDuration);
        return duration?.price || 0;
    };

    const getDiscount = () => {
        if (selectedDuration === '3m') return '۱۰٪';
        if (selectedDuration === '9m') return '۱۸٪';
        return null;
    };

    const isFree = plan.name === 'رایگان';
    const isFeatured = plan.name === 'استاندارد' || plan.name === 'حرفه‌ای';

    const handleSelect = () => {
        setIsLoading(true);
        onSelect(plan.id, selectedDuration);
        setTimeout(() => setIsLoading(false), 1000);
    };

    // ✅ ویژگی‌های پلن
    const planFeatures = features.length > 0 ? features : [
        { icon: <FiFileText />, label: 'تعداد آزمون در ماه', value: plan.max_exams_month },
        { icon: <FiBookOpen />, label: 'تعداد سوال در هر آزمون', value: plan.max_questions_exam },
        { icon: <FiZap />, label: 'مجموع سوالات در ماه', value: plan.max_exams_month * plan.max_questions_exam },
        { icon: <FiMessageSquare />, label: 'پیام مشاور', value: plan.max_advisor_month },
        { icon: <FiUsers />, label: 'تعداد کلاس', value: plan.max_classes },
        { icon: <FiUsers />, label: 'دانش‌آموز در هر کلاس', value: plan.max_students_class },
        { icon: <FiClock />, label: 'حجم فایل', value: `${plan.max_file_size_mb} مگابایت` }
    ];

    return (
        <div className={`plan-card ${isFeatured ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}>
            {isFeatured && (
                <div className="featured-badge">
                    <FiStar /> پیشنهادی
                </div>
            )}
            
            <div className="plan-header">
                <h3>{plan.name}</h3>
                {isCurrent && <span className="current-badge">✓ فعال</span>}
            </div>

            {!isFree && (
                <div className="plan-price">
                    <span className="price">{getPrice().toLocaleString('fa-IR')}</span>
                    <span className="period">تومان</span>
                    {getDiscount() && (
                        <span className="discount-badge">{getDiscount()} تخفیف</span>
                    )}
                </div>
            )}

            {isFree && (
                <div className="plan-price free">
                    <span className="price">رایگان</span>
                </div>
            )}

            {!isFree && (
                <div className="plan-duration">
                    {durations.map(d => (
                        <button
                            key={d.value}
                            className={`duration-btn ${selectedDuration === d.value ? 'active' : ''}`}
                            onClick={() => setSelectedDuration(d.value)}
                        >
                            {d.label}
                            <span className="price-small">{d.price.toLocaleString('fa-IR')}</span>
                        </button>
                    ))}
                </div>
            )}

            <ul className="plan-features">
                {planFeatures.map((f, i) => (
                    <li key={i}>
                        <span className="feature-icon">{f.icon}</span>
                        <span>{f.label}: <strong>{f.value}</strong></span>
                    </li>
                ))}
                {isFree && (
                    <li className="free-feature">
                        <FiCheckCircle className="check-icon" />
                        <span>مناسب برای شروع</span>
                    </li>
                )}
            </ul>

            {!isCurrent && (
                <button
                    className={`plan-select-btn ${isFeatured ? 'primary' : 'secondary'}`}
                    onClick={handleSelect}
                    disabled={isFree || isLoading}
                >
                    {isLoading ? (
                        <>
                            <FiLoader className="spinning" />
                            در حال پردازش...
                        </>
                    ) : isFree ? (
                        'فعال'
                    ) : (
                        'انتخاب این پلن'
                    )}
                </button>
            )}

            {isCurrent && (
                <div className="current-plan-info">
                    <span>✅ اشتراک فعال شما</span>
                </div>
            )}

            <style>{`
                .plan-card {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    border: 2px solid #e2e8f0;
                    position: relative;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }

                .plan-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
                }

                .plan-card.featured {
                    border-color: #2563eb;
                    background: linear-gradient(135deg, #ffffff, #f8faff);
                }

                .plan-card.current {
                    border-color: #10b981;
                    background: #f0fdf4;
                }

                .featured-badge {
                    position: absolute;
                    top: -12px;
                    right: 50%;
                    transform: translateX(50%);
                    background: linear-gradient(135deg, #2563eb, #7c3aed);
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }

                .plan-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .plan-header h3 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }

                .current-badge {
                    background: #10b981;
                    color: white;
                    padding: 2px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .plan-price {
                    margin: 12px 0;
                }

                .plan-price .price {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1e293b;
                }

                .plan-price .period {
                    font-size: 0.9rem;
                    color: #64748b;
                }

                .plan-price.free .price {
                    color: #10b981;
                }

                .discount-badge {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    margin-right: 8px;
                }

                .plan-duration {
                    display: flex;
                    gap: 8px;
                    margin: 12px 0;
                }

                .duration-btn {
                    flex: 1;
                    padding: 8px 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.7rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: all 0.2s;
                    font-family: inherit;
                    gap: 4px;
                }

                .duration-btn:hover {
                    border-color: #2563eb;
                    background: #f8fafc;
                }

                .duration-btn.active {
                    border-color: #2563eb;
                    background: #eff6ff;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
                }

                .duration-btn .price-small {
                    font-weight: 700;
                    font-size: 0.8rem;
                    color: #1e293b;
                }

                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 16px 0;
                    flex: 1;
                }

                .plan-features li {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 0;
                    font-size: 0.85rem;
                    color: #475569;
                }

                .plan-features .feature-icon {
                    color: #2563eb;
                    font-size: 1rem;
                    width: 20px;
                    text-align: center;
                }

                .plan-features .check-icon {
                    color: #10b981;
                    flex-shrink: 0;
                }

                .plan-features strong {
                    color: #1e293b;
                }

                .free-feature {
                    color: #10b981 !important;
                }

                .plan-select-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 8px;
                }

                .plan-select-btn.primary {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }

                .plan-select-btn.primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
                }

                .plan-select-btn.secondary {
                    background: #e2e8f0;
                    color: #475569;
                }

                .plan-select-btn.secondary:hover:not(:disabled) {
                    background: #cbd5e1;
                }

                .plan-select-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .current-plan-info {
                    text-align: center;
                    padding: 12px;
                    background: #d1fae5;
                    border-radius: 12px;
                    color: #065f46;
                    font-weight: 500;
                    margin-top: 8px;
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .plan-card {
                        padding: 20px;
                    }
                    .plan-price .price {
                        font-size: 1.6rem;
                    }
                    .plan-duration {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default PlanCard;