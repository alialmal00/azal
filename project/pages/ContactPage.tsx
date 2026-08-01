// src/pages/ContactPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare, 
  FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiTwitter, 
  FiLinkedin, FiInstagram, FiGlobe
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    // شبیه‌سازی ارسال
    setTimeout(() => {
      setStatus({ type: 'success', message: '✅ پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="contact-page">
      {/* ========== هدر ========== */}
      <header className="modern-header">
        <div className="container">
          <div className="header-inner">
            <Link to="/" className="logo">
              <img src={logoImg} alt="آزمونیک" />
              <span>آزمونیک</span>
            </Link>
            <nav className="main-nav">
              <Link to="/">صفحه اصلی</Link>
              <Link to="/about">درباره ما</Link>
              <Link to="/blog">وبلاگ</Link>
              <Link to="/contact" className="active">تماس با ما</Link>
            </nav>
            <div className="auth-buttons">
              <Link to="/login" className="btn-outline">ورود</Link>
              <Link to="/register" className="btn-primary">ثبت نام</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========== Hero ========== */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <h1>📬 در <span className="gradient-text">تماس</span> باشید</h1>
            <p>سوال، پیشنهاد یا انتقادی دارید؟ خوشحال می‌شویم از شما بشنویم</p>
          </div>
        </div>
      </section>

      {/* ========== Contact Info ========== */}
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            <div className="info-card">
              <div className="info-icon blue"><FiPhone /></div>
              <h4>تلفن</h4>
              <p>۰۲۱-۱۲۳۴۵۶۷۸</p>
              <span>شنبه تا چهارشنبه ۹ تا ۱۷</span>
            </div>
            <div className="info-card">
              <div className="info-icon purple"><FiMail /></div>
              <h4>ایمیل</h4>
              <p>support@azmoonik.com</p>
              <span>پاسخگویی ۲۴ ساعته</span>
            </div>
            <div className="info-card">
              <div className="info-icon green"><FiMapPin /></div>
              <h4>آدرس</h4>
              <p>تهران، خیابان آزادی</p>
              <span>ساختمان آزمونیک</span>
            </div>
            <div className="info-card">
              <div className="info-icon orange"><FiClock /></div>
              <h4>ساعت کاری</h4>
              <p>شنبه تا چهارشنبه</p>
              <span>۰۹:۰۰ - ۱۷:۰۰</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Contact Form ========== */}
      <section className="contact-form-section">
        <div className="container">
          <div className="contact-form-wrapper">
            <div className="form-header">
              <h2>ارسال پیام</h2>
              <p>ما در اسرع وقت به پیام شما پاسخ خواهیم داد</p>
            </div>

            {status.type && (
              <div className={`status-message ${status.type}`}>
                {status.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label><FiUser /> نام و نام خانوادگی</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="نام خود را وارد کنید"
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FiMail /> ایمیل</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label><FiMessageSquare /> موضوع</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="موضوع پیام"
                />
              </div>

              <div className="form-group">
                <label>پیام</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="پیام خود را وارد کنید..."
                  rows={6}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  'در حال ارسال...'
                ) : (
                  <>
                    <FiSend /> ارسال پیام
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========== Map ========== */}
      <section className="map-section">
        <div className="container">
          <div className="map-placeholder">
            <FiMapPin size={48} />
            <h3>ما اینجا هستیم</h3>
            <p>تهران، خیابان آزادی، نبش خیابان آزمون</p>
          </div>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="modern-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <img src={logoImg} alt="آزمونیک" />
                <span>آزمونیک</span>
              </div>
              <p>پلتفرم هوشمند تولید آزمون و تحلیل عملکرد تحصیلی</p>
              <div className="footer-social">
                <a href="#"><FiTwitter /></a>
                <a href="#"><FiLinkedin /></a>
                <a href="#"><FiInstagram /></a>
              </div>
            </div>
            <div className="footer-col">
              <h4>دسترسی سریع</h4>
              <Link to="/">صفحه اصلی</Link>
              <Link to="/about">درباره ما</Link>
              <Link to="/blog">وبلاگ</Link>
              <Link to="/contact">تماس با ما</Link>
            </div>
            <div className="footer-col">
              <h4>قوانین</h4>
              <Link to="/terms">قوانین و مقررات</Link>
              <Link to="/privacy">حریم خصوصی</Link>
              <Link to="/faq">سوالات متداول</Link>
            </div>
            <div className="footer-col">
              <h4>تماس با ما</h4>
              <p><FiPhone /> ۰۲۱-۱۲۳۴۵۶۷۸</p>
              <p><FiMail /> support@azmoonik.com</p>
              <p><FiMapPin /> تهران، خیابان آزادی</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© ۱۴۰۴ آزمونیک. تمامی حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .contact-page {
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
          background: #f8fafc;
        }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 2rem; }

        /* ---------- هدر ---------- */
        .modern-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          z-index: 1000;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .header-inner { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .logo img { height: 45px; width: auto; }
        .logo span { font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .main-nav { display: flex; gap: 2rem; align-items: center; }
        .main-nav a { text-decoration: none; color: #4b5563; font-weight: 500; transition: all 0.3s; position: relative; }
        .main-nav a::after { content: ''; position: absolute; bottom: -4px; right: 0; width: 0; height: 2px; background: linear-gradient(135deg, #2563eb, #7c3aed); transition: width 0.3s; }
        .main-nav a:hover::after, .main-nav a.active::after { width: 100%; }
        .main-nav a:hover { color: #2563eb; }
        .main-nav a.active { color: #2563eb; }
        .auth-buttons { display: flex; gap: 1rem; }
        .btn-outline { padding: 0.6rem 1.5rem; border-radius: 2rem; text-decoration: none; font-weight: 600; border: 2px solid #2563eb; color: #2563eb; transition: all 0.3s; }
        .btn-outline:hover { background: #2563eb; color: white; }
        .btn-primary { padding: 0.6rem 1.5rem; border-radius: 2rem; text-decoration: none; font-weight: 600; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; transition: all 0.3s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.3); }

        /* ---------- Hero ---------- */
        .contact-hero {
          padding: 130px 0 60px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white;
          text-align: center;
        }
        .contact-hero-content h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .contact-hero-content p { color: #94a3b8; }

        /* ---------- Contact Info ---------- */
        .contact-info-section { padding: 4rem 0; }
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .info-card {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 20px;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .info-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .info-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
        }
        .info-icon.blue { background: #dbeafe; color: #2563eb; }
        .info-icon.purple { background: #ede9fe; color: #7c3aed; }
        .info-icon.green { background: #d1fae5; color: #10b981; }
        .info-icon.orange { background: #fef3c7; color: #f59e0b; }
        .info-card h4 { color: #1e293b; margin-bottom: 0.5rem; }
        .info-card p { color: #475569; font-weight: 600; }
        .info-card span { color: #94a3b8; font-size: 0.85rem; }

        /* ---------- Contact Form ---------- */
        .contact-form-section { padding: 2rem 0 4rem; }
        .contact-form-wrapper {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          padding: 3rem;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .form-header { text-align: center; margin-bottom: 2rem; }
        .form-header h2 { font-size: 1.8rem; color: #1e293b; margin-bottom: 0.5rem; }
        .form-header p { color: #64748b; }
        .status-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .status-message.success { background: #d1fae5; color: #065f46; }
        .status-message.error { background: #fee2e2; color: #991b1b; }
        .contact-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label {
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .form-group input, .form-group textarea {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s;
          font-family: inherit;
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .form-group textarea { resize: vertical; }
        .submit-btn {
          padding: 1rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37,99,235,0.3);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ---------- Map ---------- */
        .map-section { padding: 2rem 0 4rem; }
        .map-placeholder {
          background: white;
          border-radius: 24px;
          padding: 4rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 2px dashed #e2e8f0;
        }
        .map-placeholder svg { color: #2563eb; margin-bottom: 1rem; }
        .map-placeholder h3 { color: #1e293b; margin-bottom: 0.5rem; }
        .map-placeholder p { color: #64748b; }

        /* ---------- Footer ---------- */
        .modern-footer {
          background: #0f172a;
          color: #94a3b8;
          padding: 3rem 0 1.5rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .footer-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .footer-logo img { height: 40px; width: auto; }
        .footer-logo span { font-size: 1.3rem; font-weight: 700; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .footer-social { display: flex; gap: 1rem; margin-top: 1rem; }
        .footer-social a { color: #64748b; transition: all 0.3s; font-size: 1.2rem; }
        .footer-social a:hover { color: #60a5fa; transform: translateY(-2px); }
        .footer-col h4 { color: white; margin-bottom: 1rem; }
        .footer-col a { display: block; color: #94a3b8; text-decoration: none; margin-bottom: 0.5rem; transition: all 0.3s; }
        .footer-col a:hover { color: #60a5fa; transform: translateX(-4px); }
        .footer-col p { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .footer-bottom { text-align: center; padding-top: 1.5rem; border-top: 1px solid #1e293b; font-size: 0.85rem; }

        @media (max-width: 1024px) {
          .contact-info-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .container { padding: 0 1rem; }
          .main-nav { display: none; }
          .form-row { grid-template-columns: 1fr; }
          .contact-info-grid { grid-template-columns: 1fr; }
          .contact-form-wrapper { padding: 1.5rem; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;