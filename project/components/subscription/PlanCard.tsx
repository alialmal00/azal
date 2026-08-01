// src/components/subscription/PlanCard.tsx
import React, { useState } from 'react';
import { FiCheckCircle, FiStar, FiLoader } from 'react-icons/fi';

interface PlanCardProps {
    plan: any;
    onSelect: (planId: string, duration: string) => void;
    isCurrent?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isCurrent }) => {
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

    const features = [
        { label: 'تعداد آزمون در ماه', value: plan.max_exams_month },
        { label: 'تعداد سوال در هر آزمون', value: plan.max_questions_exam },
        { label: 'حجم فایل', value: `${plan.max_file_size_mb} مگابایت` },
        { label: 'تعداد کلاس', value: plan.max_classes },
        { label: 'پیام مشاور', value: plan.max_advisor_month },
        { label: 'کاراکتر مشاور', value: plan.max_advisor_chars }
    ];

    const isFree = plan.name === 'رایگان';
    const isFeatured = plan.name === 'استاندارد';

    const handleSelect = () => {
        setIsLoading(true);
        onSelect(plan.id, selectedDuration);
        setTimeout(() => setIsLoading(false), 1000);
    };

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
                {features.map((f, i) => (
                    <li key={i}>
                        <FiCheckCircle className="check-icon" />
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
                .spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PlanCard;