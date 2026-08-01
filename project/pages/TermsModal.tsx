// src/pages/auth/TermsModal.tsx
import React from 'react';
import { FiX, FiCheckCircle, FiFileText, FiLock, FiUserCheck, FiAlertCircle } from 'react-icons/fi';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 قوانین و مقررات</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div className="terms-section">
            <h3>۱. پذیرش قوانین</h3>
            <p>استفاده از سرویس‌های آزمونیک به معنی پذیرش کامل تمامی قوانین و مقررات ذکر شده است.</p>
          </div>

          <div className="terms-section">
            <h3>۲. حساب کاربری</h3>
            <p>کاربران مسئول حفظ امنیت اطلاعات حساب کاربری خود هستند. آزمونیک در قبال سوء استفاده مسئولیتی ندارد.</p>
          </div>

          <div className="terms-section">
            <h3>۳. محتوای تولید شده</h3>
            <p>کلیه آزمون‌ها و محتوای تولید شده توسط هوش مصنوعی، متعلق به آزمونیک است.</p>
          </div>

          <div className="terms-section">
            <h3>۴. حریم خصوصی</h3>
            <p>اطلاعات شخصی کاربران مطابق با قوانین حریم خصوصی محافظت می‌شود.</p>
          </div>

          <div className="terms-section">
            <h3>۵. مسئولیت‌ها</h3>
            <p>آزمونیک در قبال هرگونه آسیب مستقیم یا غیرمستقیم ناشی از استفاده از سرویس‌ها مسئولیتی ندارد.</p>
          </div>

          <div className="terms-footer">
            <button className="btn-accept" onClick={onClose}>
              <FiCheckCircle /> پذیرفتن و بستن
            </button>
          </div>
        </div>
      </div>

      <style>{`
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
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          animation: scaleIn 0.3s ease;
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          background: white;
          border-radius: 24px 24px 0 0;
          z-index: 1;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; color: #1e293b; }
        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .modal-close:hover { background: #f1f5f9; color: #1e293b; }
        .modal-body { padding: 24px; }
        .terms-section { margin-bottom: 20px; }
        .terms-section:last-of-type { margin-bottom: 0; }
        .terms-section h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }
        .terms-section p { margin: 0; color: #64748b; line-height: 1.6; font-size: 0.9rem; }
        .terms-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
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

export default TermsModal;