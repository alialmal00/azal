import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiCpu, FiEdit3, FiCheckCircle, FiZap } from 'react-icons/fi';

const LoadingView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      icon: <FiBookOpen size={24} />,
      title: 'در حال تحلیل متن',
      description: 'بررسی ساختار و مفاهیم کلیدی...',
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      icon: <FiCpu size={24} />,
      title: 'پردازش عمیق محتوا',
      description: 'تحلیل عمیق محتوا با Gemini AI...',
      color: '#8B5CF6',
      bgColor: '#F5F3FF'
    },
    {
      icon: <FiEdit3 size={24} />,
      title: 'طراحی سوالات',
      description: 'ایجاد سوالات استاندارد و گزینه‌ها...',
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    {
      icon: <FiCheckCircle size={24} />,
      title: 'آماده‌سازی نهایی',
      description: 'تنظیم سطح دشواری و بازخورد...',
      color: '#10B981',
      bgColor: '#ECFDF5'
    }
  ];

  useEffect(() => {
    // تغییر مرحله
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    // افزایش نوار پیشرفت
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="loading-container">
      {/* پس‌زمینه متحرک */}
      <div className="loading-background">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
        <div className="bg-dots"></div>
      </div>

      {/* محتوای اصلی */}
      <div className="loading-content">
        {/* لوگوی متحرک */}
        <div className="logo-wrapper">
          <div className="logo-pulse">
            <FiZap size={40} color="#fff" />
          </div>
          <div className="logo-ring"></div>
        </div>

        {/* عنوان */}
        <h2 className="loading-title">
          <span className="title-gradient">آزمونیک</span>
          <span className="title-sub">در حال ساخت آزمون شما</span>
        </h2>

        {/* نوار پیشرفت */}
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="progress-glow"></div>
            </div>
          </div>
          <span className="progress-text">{Math.min(Math.round(progress), 100)}%</span>
        </div>

        {/* مراحل - نمایش مرحله فعلی */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step-item ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
              style={{
                '--step-color': step.color,
                '--step-bg': step.bgColor
              } as React.CSSProperties}
            >
              <div className="step-icon-wrapper">
                <div className="step-icon" style={{ color: step.color }}>
                  {step.icon}
                </div>
                {index < currentStep && (
                  <div className="step-check">✓</div>
                )}
                {index === currentStep && (
                  <div className="step-active-dot"></div>
                )}
              </div>
              <div className="step-info">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* متن پایین */}
        <p className="loading-footer">
          <span className="dot-pulse"></span>
          لطفاً چند لحظه صبر کنید...
        </p>

        {/* ذرات شناور */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                opacity: 0.1 + Math.random() * 0.3
              }}
            ></div>
          ))}
        </div>
      </div>

      <style>{`
        /* ==========================================
           کانتینر اصلی
           ========================================== */
        .loading-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%) !important;
          overflow: hidden !important;
          font-family: 'Vazirmatn', sans-serif !important;
          direction: rtl !important;
          margin: 0 !important;
          padding: 0 !important;
        }
 
        /* ==========================================
           پس‌زمینه متحرک
           ========================================== */
        .loading-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.15;
        }

        .circle-1 {
          width: 400px;
          height: 400px;
          background: #3B82F6;
          top: -100px;
          right: -100px;
          animation: float1 8s ease-in-out infinite;
        }

        .circle-2 {
          width: 300px;
          height: 300px;
          background: #8B5CF6;
          bottom: -50px;
          left: -80px;
          animation: float2 10s ease-in-out infinite;
        }

        .circle-3 {
          width: 250px;
          height: 250px;
          background: #F59E0B;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float3 12s ease-in-out infinite;
        }

        .bg-dots {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: dotsMove 20s linear infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(10px, 10px) scale(1.05); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, -20px) scale(0.95); }
          66% { transform: translate(20px, 30px) scale(1.1); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }

        @keyframes dotsMove {
          0% { background-position: 0 0; }
          100% { background-position: 30px 30px; }
        }

        /* ==========================================
           محتوای اصلی
           ========================================== */
        .loading-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
        }

        /* ==========================================
           لوگو
           ========================================== */
        .logo-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .logo-pulse {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: logoPulse 2s ease-in-out infinite;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
        }

        .logo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: ringRotate 3s linear infinite;
        }

        .logo-ring::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          width: 6px;
          height: 6px;
          background: #3B82F6;
          border-radius: 50%;
          transform: translateX(-50%);
        }

        @keyframes logoPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes ringRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ==========================================
           عنوان
           ========================================== */
        .loading-title {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .title-gradient {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #60A5FA, #A78BFA, #60A5FA);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientShift 3s ease infinite;
        }

        .title-sub {
          color: #94A3B8;
          font-size: 0.9rem;
          font-weight: 400;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ==========================================
           نوار پیشرفت
           ========================================== */
        .progress-wrapper {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3B82F6, #8B5CF6, #F59E0B);
          background-size: 200% 100%;
          border-radius: 10px;
          transition: width 0.5s ease;
          animation: progressShine 2s linear infinite;
          position: relative;
        }

        .progress-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 100%;
          background: white;
          filter: blur(8px);
          opacity: 0.5;
        }

        .progress-text {
          color: #94A3B8;
          font-size: 0.85rem;
          font-weight: 600;
          min-width: 40px;
          text-align: left;
        }

        @keyframes progressShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* ==========================================
           مراحل
           ========================================== */
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          transition: all 0.5s ease;
          opacity: 0.3;
          transform: scale(0.95);
        }

        .step-item.active {
          opacity: 1;
          transform: scale(1);
          background: var(--step-bg, rgba(59, 130, 246, 0.1));
          border-color: var(--step-color, #3B82F6);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }

        .step-item.completed {
          opacity: 0.7;
          transform: scale(0.98);
        }

        .step-icon-wrapper {
          position: relative;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .step-item.active .step-icon {
          background: var(--step-bg, rgba(59, 130, 246, 0.2));
          animation: iconBounce 0.5s ease;
        }

        .step-check {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .step-active-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: var(--step-color, #3B82F6);
          border-radius: 50%;
          animation: dotPulse 1.5s ease-in-out infinite;
        }

        .step-info {
          flex: 1;
        }

        .step-info h4 {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #E2E8F0;
          transition: color 0.3s ease;
        }

        .step-item.active .step-info h4 {
          color: var(--step-color, #3B82F6);
        }

        .step-info p {
          margin: 0;
          font-size: 0.8rem;
          color: #64748B;
          transition: color 0.3s ease;
        }

        .step-item.active .step-info p {
          color: #94A3B8;
        }

        @keyframes iconBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.2); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }

        /* ==========================================
           فوتر
           ========================================== */
        .loading-footer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #64748B;
          font-size: 0.85rem;
        }

        .dot-pulse {
          width: 8px;
          height: 8px;
          background: #3B82F6;
          border-radius: 50%;
          animation: dotPulseFooter 1.5s ease-in-out infinite;
        }

        @keyframes dotPulseFooter {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* ==========================================
           ذرات شناور
           ========================================== */
        .particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          bottom: -10px;
          background: #3B82F6;
          border-radius: 50%;
          animation: particleFloat linear infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }

        /* ==========================================
           ریسپانسیو
           ========================================== */
        @media (max-width: 768px) {
          .loading-content {
            padding: 1.5rem;
            gap: 1.5rem;
          }

          .title-gradient {
            font-size: 1.5rem;
          }

          .step-item {
            padding: 0.75rem 1rem;
          }

          .step-icon {
            width: 40px;
            height: 40px;
          }

          .step-icon svg {
            width: 18px;
            height: 18px;
          }

          .step-info h4 {
            font-size: 0.85rem;
          }

          .step-info p {
            font-size: 0.7rem;
          }

          .logo-wrapper {
            width: 80px;
            height: 80px;
          }

          .logo-pulse {
            width: 60px;
            height: 60px;
          }

          .logo-pulse svg {
            width: 28px;
            height: 28px;
          }

          .logo-ring {
            width: 80px;
            height: 80px;
          }
        }

        @media (max-width: 480px) {
          .loading-content {
            padding: 1rem;
            gap: 1rem;
          }

          .title-gradient {
            font-size: 1.3rem;
          }

          .title-sub {
            font-size: 0.75rem;
          }

          .progress-text {
            font-size: 0.7rem;
            min-width: 30px;
          }

          .step-item {
            padding: 0.6rem 0.75rem;
            gap: 0.75rem;
          }

          .step-icon {
            width: 36px;
            height: 36px;
          }
          
        }
      `}</style>
    </div>
  );
};

export default LoadingView;