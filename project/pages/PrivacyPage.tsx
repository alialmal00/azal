// src/pages/PrivacyPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiDatabase, FiEye, FiMail, FiLock, FiTrash2, 
  FiBell, FiGlobe, FiServer, FiUserCheck, FiMapPin, FiPhone, 
  FiTwitter, FiInstagram, FiLinkedin, FiUsers, FiFileText,
  FiCheckCircle, FiInfo, FiClock, FiAlertTriangle
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const PrivacyPage: React.FC = () => {
  const sections = [
    {
      title: '۱. اطلاعات جمع‌آوری شده',
      icon: <FiDatabase />,
      content: 'ما اطلاعات زیر را جمع‌آوری می‌کنیم: نام و نام خانوادگی، شماره موبایل، اطلاعات تحصیلی (مقطع، رشته، مدرسه/دانشگاه)، محتوای آزمون‌ها و پاسخ‌های شما، اطلاعات فنی مانند آدرس IP، نوع مرورگر و دستگاه، تاریخ و زمان فعالیت شما در سامانه. تمامی اطلاعات با رضایت شما و برای ارائه خدمات بهتر جمع‌آوری می‌شوند.'
    },
    {
      title: '۲. نحوه استفاده از اطلاعات',
      icon: <FiEye />,
      content: 'اطلاعات شما برای ارائه خدمات آزمون‌سازی، تحلیل عملکرد تحصیلی، بهبود تجربه کاربری، شخصی‌سازی محتوا، ارسال اطلاعیه‌ها و یادآوری‌ها، پشتیبانی و پاسخ به سوالات شما استفاده می‌شود. همچنین از داده‌های جمع‌آوری شده برای بهبود الگوریتم‌های هوش مصنوعی استفاده می‌کنیم.'
    },
    {
      title: '۳. امنیت اطلاعات',
      icon: <FiShield />,
      content: 'ما از پروتکل‌های امنیتی پیشرفته (SSL/TLS) برای محافظت از اطلاعات شما استفاده می‌کنیم. تمام داده‌ها در سرورهای امن با رمزنگاری AES-256 ذخیره می‌شوند. دسترسی به اطلاعات کاربران محدود به پرسنل مجاز است و تمامی فعالیت‌ها ثبت و پایش می‌شود.'
    },
    {
      title: '۴. اشتراک‌گذاری اطلاعات',
      icon: <FiUsers />,
      content: 'اطلاعات شخصی شما بدون رضایت صریح، با هیچ شخص ثالثی به اشتراک گذاشته نمی‌شود، مگر در موارد قانونی (با حکم دادگاه) یا برای ارائه خدمات (مانند درگاه پرداخت). اطلاعات به صورت انبوه و ناشناس ممکن است برای تحقیقات آماری استفاده شود.'
    },
    {
      title: '۵. ذخیره‌سازی و حذف اطلاعات',
      icon: <FiTrash2 />,
      content: 'شما می‌توانید در هر زمان درخواست حذف حساب کاربری و تمام داده‌های مرتبط را بدهید. اطلاعات تا ۳۰ روز پس از درخواست حذف نگهداری می‌شوند و سپس به طور کامل پاک می‌شوند. اطلاعات مالی بر اساس قوانین مالیاتی تا ۱۰ سال نگهداری می‌شوند.'
    },
    {
      title: '۶. کوکی‌ها (Cookies)',
      icon: <FiBell />,
      content: 'ما از کوکی‌ها برای بهبود تجربه کاربری، حفظ وضعیت ورود، ذخیره تنظیمات کاربر، تحلیل عملکرد و ارائه محتوای شخصی‌سازی شده استفاده می‌کنیم. شما می‌توانید کوکی‌ها را در مرورگر خود مدیریت یا غیرفعال کنید. غیرفعال کردن کوکی‌ها ممکن است برخی از قابلیت‌های سایت را محدود کند.'
    },
    {
      title: '۷. حقوق کاربران',
      icon: <FiUserCheck />,
      content: 'شما حق دارید: به اطلاعات خود دسترسی داشته باشید، اطلاعات نادرست را تصحیح کنید، درخواست حذف اطلاعات بدهید، از پردازش اطلاعات خود مخالفت کنید، اطلاعات خود را به صورت قابل حمل دریافت کنید، و از نحوه استفاده از اطلاعات خود مطلع شوید. برای اعمال این حقوق، با پشتیبانی تماس بگیرید.'
    },
    {
      title: '۸. تغییرات در سیاست حریم خصوصی',
      icon: <FiClock />,
      content: 'ما ممکن است این سیاست را به‌روزرسانی کنیم. تغییرات در این صفحه منتشر می‌شود و تاریخ به‌روزرسانی در بالا درج می‌گردد. کاربران موظف به بررسی دوره‌ای این صفحه هستند. ادامه استفاده از سرویس‌ها پس از تغییرات، به معنی پذیرش سیاست جدید است.'
    }
  ];

  return (
    <div className="privacy-page">
      <header className="privacy-header">
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
              <Link to="/contact">تماس با ما</Link>
            </nav>
            <div className="auth-buttons">
              <Link to="/login" className="btn-outline">ورود</Link>
              <Link to="/register" className="btn-primary">ثبت نام</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="privacy-hero">
        <div className="container">
          <div className="hero-icon">
            <FiShield size={48} />
          </div>
          <h1>حریم <span className="gradient-text">خصوصی</span></h1>
          <p>چگونه از اطلاعات شما محافظت می‌کنیم</p>
          <div className="hero-badge">
            <FiCheckCircle size={16} />
            <span>مطابق با قوانین حفاظت از داده‌ها</span>
          </div>
        </div>
      </section>

      <section className="privacy-content">
        <div className="container">
          <div className="privacy-intro">
            <div className="intro-icon">
              <FiInfo size={24} />
            </div>
            <div className="intro-text">
              <p>
                <strong>حریم خصوصی شما برای ما بسیار مهم است.</strong> این خط مشی نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما را توضیح می‌دهد. 
                ما متعهد به حفظ حریم خصوصی و امنیت اطلاعات شما هستیم و تمامی اقدامات لازم برای محافظت از داده‌های شما را انجام می‌دهیم.
              </p>
            </div>
          </div>

          <div className="privacy-grid">
            {sections.map((section, idx) => (
              <div key={idx} className="privacy-card">
                <div className="privacy-icon">{section.icon}</div>
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
          </div>

          <div className="privacy-footer">
            <div className="privacy-rights">
              <h3>🔒 حقوق شما در یک نگاه</h3>
              <div className="rights-grid">
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>دسترسی به اطلاعات</span>
                </div>
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>تصحیح اطلاعات</span>
                </div>
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>حذف اطلاعات</span>
                </div>
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>مخالفت با پردازش</span>
                </div>
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>انتقال داده</span>
                </div>
                <div className="right-item">
                  <FiCheckCircle className="right-icon" />
                  <span>اطلاع از نحوه استفاده</span>
                </div>
              </div>
            </div>

            <div className="privacy-contact">
              <h3>سوالات در مورد حریم خصوصی؟</h3>
              <p>
                اگر سوالی در مورد این خط مشی یا نحوه پردازش اطلاعات شما دارید، لطفاً با ما تماس بگیرید.
              </p>
              <div className="contact-links">
                <Link to="/contact" className="contact-link">
                  <FiMail /> تماس با پشتیبانی
                </Link>
              </div>
            </div>

            <div className="privacy-note">
              <FiAlertTriangle size={16} />
              <span>
                این خط مشی مطابق با قوانین جمهوری اسلامی ایران و مقررات حفاظت از داده‌ها تدوین شده است.
              </span>
            </div>
          </div>
        </div>
      </section>

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
        .privacy-page { direction: rtl; font-family: 'Vazirmatn', 'IRANSans', sans-serif; }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
        
        .privacy-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          z-index: 1000;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .header-inner { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .logo img { height: 40px; width: auto; }
        .logo span { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .main-nav { display: flex; gap: 2rem; }
        .main-nav a { text-decoration: none; color: #4b5563; font-weight: 500; transition: color 0.3s; }
        .main-nav a:hover { color: #2563eb; }
        .auth-buttons { display: flex; gap: 1rem; }
        .btn-outline, .btn-primary { padding: 0.6rem 1.5rem; border-radius: 2rem; text-decoration: none; font-weight: 600; }
        .btn-outline { border: 2px solid #2563eb; color: #2563eb; }
        .btn-outline:hover { background: #2563eb; color: white; }
        .btn-primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
        
        .privacy-hero {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          padding: 130px 0 60px;
          color: white;
          text-align: center;
        }
        .hero-icon {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .privacy-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 30px;
          margin-top: 16px;
          font-size: 0.8rem;
        }
        
        .privacy-content { padding: 60px 0; background: #f8fafc; }
        .privacy-intro {
          display: flex;
          gap: 20px;
          background: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 40px;
          border-right: 4px solid #10b981;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .intro-icon {
          flex-shrink: 0;
          color: #10b981;
        }
        .intro-text p { color: #475569; line-height: 1.8; }
        
        .privacy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .privacy-card {
          background: white;
          padding: 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .privacy-card:hover { transform: translateY(-4px); }
        .privacy-icon {
          width: 50px;
          height: 50px;
          background: #dbeafe;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: #2563eb;
        }
        .privacy-card h3 { margin-bottom: 1rem; font-size: 1.1rem; }
        .privacy-card p { color: #64748b; line-height: 1.7; font-size: 0.9rem; }
        
        .privacy-footer {
          margin-top: 3rem;
          background: white;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .privacy-rights h3 {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .rights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 600px;
          margin: 0 auto 1.5rem;
        }
        .right-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 0.85rem;
          color: #475569;
        }
        .right-icon { color: #10b981; flex-shrink: 0; }
        
        .privacy-contact {
          text-align: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 16px;
        }
        .privacy-contact h3 { margin-bottom: 0.5rem; }
        .privacy-contact p { color: #64748b; margin-bottom: 1rem; }
        .contact-links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .contact-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.8rem 2rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          text-decoration: none;
          border-radius: 2rem;
          font-weight: 600;
        }
        .contact-link:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.3); }
        
        .privacy-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          font-size: 0.85rem;
          color: #64748b;
        }
        
        .modern-footer {
          background: #0f172a;
          color: #94a3b8;
          padding: 3rem 0 1.5rem;
        }
        .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
        .footer-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .footer-logo img { height: 40px; width: auto; }
        .footer-social { display: flex; gap: 1rem; margin-top: 1rem; }
        .footer-col h4 { color: white; margin-bottom: 1rem; }
        .footer-col a { display: block; color: #94a3b8; text-decoration: none; margin-bottom: 0.5rem; }
        .footer-col a:hover { color: #60a5fa; }
        .footer-bottom { text-align: center; padding-top: 1.5rem; border-top: 1px solid #1e293b; }
        
        @media (max-width: 768px) {
          .privacy-grid { grid-template-columns: 1fr; }
          .rights-grid { grid-template-columns: 1fr; }
          .privacy-intro { flex-direction: column; text-align: center; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .main-nav { display: none; }
          .privacy-hero h1 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPage;