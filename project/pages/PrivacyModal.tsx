// src/pages/auth/PrivacyModal.tsx
import React from 'react';
import { FiX, FiCheckCircle, FiShield, FiDatabase, FiEye, FiLock } from 'react-icons/fi';

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  const sections = [
    {
      icon: <FiDatabase />,
      title: 'اطلاعات جمع‌آوری شده',
      content: 'ما اطلاعات زیر را جمع‌آوری می‌کنیم: نام و نام خانوادگی، شماره موبایل، اطلاعات تحصیلی، محتوای آزمون‌ها و پاسخ‌های شما، اطلاعات فنی مانند آدرس IP و نوع مرورگر.'
    },
    {
      icon: <FiEye />,
      title: 'استفاده از اطلاعات',
      content: 'اطلاعات شما برای ارائه خدمات آزمون‌سازی، تحلیل عملکرد، بهبود تجربه کاربری، ارسال اطلاعیه‌ها و پشتیبانی استفاده می‌شود.'
    },
    {
      icon: <FiShield />,
      title: 'امنیت اطلاعات',
      content: 'ما از پروتکل‌های امنیتی پیشرفته برای محافظت از اطلاعات شما استفاده می‌کنیم. تمام داده‌ها در سرورهای امن با رمزنگاری ذخیره می‌شوند.'
    },
    {
      icon: <FiLock />,
      title: 'ذخیره‌سازی و حذف',
      content: 'شما می‌توانید در هر زمان درخواست حذف حساب کاربری و تمام داده‌های مرتبط را بدهید. اطلاعات تا ۳۰ روز پس از درخواست حذف نگهداری می‌شوند.'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔒 حریم خصوصی</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p className="privacy-intro">
            حریم خصوصی شما برای ما بسیار مهم است. این خط مشی نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما را توضیح می‌دهد.
          </p>

          <div className="privacy-grid">
            {sections.map((section, index) => (
              <div key={index} className="privacy-item">
                <div className="privacy-icon">{section.icon}</div>
                <div>
                  <h4>{section.title}</h4>
                  <p>{section.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="privacy-footer">
            <button className="btn-accept" onClick={onClose}>
              <FiCheckCircle /> پذیرفتن و بستن
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .privacy-intro {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          color: #475569;
          font-size: 0.9rem;
          border-right: 4px solid #2563eb;
        }
        .privacy-grid { display: flex; flex-direction: column; gap: 16px; }
        .privacy-item {
          display: flex;
          gap: 14px;
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .privacy-item:hover { background: #f1f5f9; }
        .privacy-icon {
          width: 40px;
          height: 40px;
          background: #dbeafe;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .privacy-item h4 { margin: 0 0 4px 0; font-size: 0.9rem; color: #1e293b; }
        .privacy-item p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; }
        .privacy-footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
        .btn-accept {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37,99,235,0.3);
        }
      `}</style>
    </div>
  );
};

export default PrivacyModal;