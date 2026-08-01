// src/pages/TermsPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiBookOpen, FiUserCheck, FiLock, FiAlertCircle, FiHome,
  FiPhone, FiMail, FiMapPin, FiTwitter, FiInstagram, FiLinkedin,
  FiFileText, FiCheckCircle, FiInfo, FiClock
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const TermsPage: React.FC = () => {
  const sections = [
    {
      title: '۱. پذیرش قوانین',
      icon: <FiFileText />,
      content: 'استفاده از سرویس‌های آزمونیک به معنی پذیرش کامل تمامی قوانین و مقررات ذکر شده در این صفحه است. در صورت عدم پذیرش هر یک از بندها، لطفاً از سرویس‌های ما استفاده نکنید. این قوانین در تاریخ ۱۴۰۴/۰۱/۰۱ به‌روزرسانی شده و برای کلیه کاربران لازم‌الاجرا است.'
    },
    {
      title: '۲. حساب کاربری و امنیت',
      icon: <FiUserCheck />,
      content: 'کاربران مسئول حفظ امنیت اطلاعات حساب کاربری خود هستند. آزمونیک در قبال سوء استفاده از حساب کاربری توسط اشخاص ثالث مسئولیتی ندارد. کاربر موظف است در صورت مشاهده هرگونه فعالیت مشکوک، بلافاصله مراتب را به پشتیبانی اطلاع دهد. هرگونه انتقال یا فروش حساب کاربری ممنوع است.'
    },
    {
      title: '۳. محتوای تولید شده',
      icon: <FiBookOpen />,
      content: 'کلیه آزمون‌ها و محتوای تولید شده توسط هوش مصنوعی، متعلق به آزمونیک بوده و استفاده تجاری از آن‌ها بدون کسب مجوز کتبی ممنوع است. کاربران حق کپی‌برداری، توزیع یا فروش محتوای تولید شده را ندارند. تمامی حقوق مادی و معنوی برای آزمونیک محفوظ است.'
    },
    {
      title: '۴. حریم خصوصی و حفاظت از داده‌ها',
      icon: <FiLock />,
      content: 'اطلاعات شخصی کاربران مطابق با قوانین حریم خصوصی و مقررات حفاظت از داده‌ها محافظت می‌شود. آزمونیک متعهد است که اطلاعات کاربران را بدون رضایت آن‌ها به هیچ شخص ثالثی منتقل نکند. تمامی داده‌ها در سرورهای امن با بالاترین استانداردهای رمزنگاری ذخیره می‌شوند.'
    },
    {
      title: '۵. مسئولیت‌ها و محدودیت‌ها',
      icon: <FiAlertCircle />,
      content: 'آزمونیک در قبال هرگونه آسیب مستقیم یا غیرمستقیم ناشی از استفاده از سرویس‌ها مسئولیتی ندارد. سرویس‌ها "همان‌طور که هستند" ارائه می‌شوند و آزمونیک هیچ گونه تضمینی در مورد دقت، کامل بودن یا به‌روز بودن محتوا نمی‌دهد. کاربران مسئولیت استفاده از نتایج آزمون‌ها را بر عهده دارند.'
    },
    {
      title: '۶. تغییرات در قوانین',
      icon: <FiClock />,
      content: 'آزمونیک حق دارد در هر زمان قوانین و مقررات را تغییر دهد. کاربران موظف به بررسی دوره‌ای این صفحه هستند. تغییرات پس از انتشار در این صفحه، بلافاصله قابل اجرا خواهند بود. ادامه استفاده از سرویس‌ها پس از تغییرات، به معنی پذیرش قوانین جدید است.'
    },
    {
      title: '۷. قوانین مالی و پرداخت',
      icon: <FiInfo />,
      content: 'تمامی پرداخت‌ها از طریق درگاه‌های رسمی و امن انجام می‌شود. مبالغ پرداختی برای اشتراک‌ها، غیرقابل بازگشت است مگر در مواردی که سرویس ارائه نشود. کاربران موظف به پرداخت به‌موقع مبالغ اشتراک هستند. آزمونیک حق تغییر قیمت‌ها را با اطلاع قبلی دارد.'
    },
    {
      title: '۸. حق مالکیت فکری',
      icon: <FiShield />,
      content: 'تمامی حقوق مالکیت فکری مربوط به نرم‌افزار، طراحی، لوگو، محتوا و الگوریتم‌های آزمونیک، متعلق به این مجموعه است. هرگونه کپی‌برداری، مهندسی معکوس یا استفاده غیرمجاز از کدها و الگوریتم‌ها، پیگرد قانونی دارد.'
    }
  ];

  return (
    <div className="terms-page">
      <header className="terms-header">
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

      <section className="terms-hero">
        <div className="container">
          <div className="hero-icon">
            <FiFileText size={48} />
          </div>
          <h1>قوانین و <span className="gradient-text">مقررات</span></h1>
          <p>آخرین به‌روزرسانی: ۱۵ فروردین ۱۴۰۴</p>
          <div className="hero-badge">
            <FiCheckCircle size={16} />
            <span>نسخه ۲.۱ - لازم‌الاجرا از ۱۴۰۴/۰۱/۱۵</span>
          </div>
        </div>
      </section>

      <section className="terms-content">
        <div className="container">
          <div className="terms-intro">
            <p>
              <strong>«آزمونیک»</strong> (که در ادامه «سرویس» نامیده می‌شود) یک پلتفرم هوشمند تولید آزمون و تحلیل عملکرد تحصیلی است. 
              استفاده از این سرویس به منزله پذیرش کامل شرایط و ضوابط زیر است. لطفاً این قوانین را با دقت مطالعه فرمایید.
            </p>
          </div>

          <div className="terms-grid">
            {sections.map((section, idx) => (
              <div key={idx} className="terms-card">
                <div className="terms-icon">{section.icon}</div>
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
          </div>

          <div className="terms-footer">
            <div className="terms-acknowledge">
              <h3>تأیید و پذیرش</h3>
              <p>
                با ثبت‌نام و استفاده از سرویس‌های آزمونیک، شما تأیید می‌کنید که:
              </p>
              <ul>
                <li>✅ تمامی قوانین و مقررات فوق را مطالعه و درک کرده‌اید</li>
                <li>✅ با تمامی بندهای این قرارداد موافقت می‌کنید</li>
                <li>✅ حداقل ۱۸ سال سن دارید یا با تأیید والدین ثبت‌نام می‌کنید</li>
                <li>✅ اطلاعات وارد شده صحیح و کامل است</li>
              </ul>
            </div>

            <div className="terms-actions">
              <Link to="/" className="btn-home">← بازگشت به صفحه اصلی</Link>
              <Link to="/register" className="btn-accept">✅ پذیرفتن و ادامه</Link>
            </div>

            <div className="terms-contact">
              <p>
                <FiInfo size={16} />
                در صورت داشتن هرگونه سؤال در مورد قوانین، با پشتیبانی تماس بگیرید:
                <a href="mailto:support@azmoonik.ir">support@azmoonik.ir</a>
              </p>
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
        .terms-page { direction: rtl; font-family: 'Vazirmatn', 'IRANSans', sans-serif; }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
        
        .terms-header {
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
        
        .terms-hero {
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
        .terms-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
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
        
        .terms-content { padding: 60px 0; background: #f8fafc; }
        .terms-intro {
          background: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 40px;
          border-right: 4px solid #2563eb;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .terms-intro p { color: #475569; line-height: 1.8; font-size: 1rem; }
        
        .terms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .terms-card {
          background: white;
          padding: 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .terms-card:hover { transform: translateY(-4px); }
        .terms-icon {
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
        .terms-card h3 { margin-bottom: 1rem; font-size: 1.1rem; }
        .terms-card p { color: #64748b; line-height: 1.7; font-size: 0.9rem; }
        
        .terms-footer {
          margin-top: 3rem;
          padding: 2rem;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .terms-acknowledge h3 {
          text-align: center;
          margin-bottom: 1rem;
          color: #1e293b;
        }
        .terms-acknowledge p {
          text-align: center;
          color: #64748b;
          margin-bottom: 1rem;
        }
        .terms-acknowledge ul {
          list-style: none;
          padding: 0;
          max-width: 500px;
          margin: 0 auto 1.5rem;
        }
        .terms-acknowledge ul li {
          padding: 8px 0;
          color: #475569;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .terms-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-home, .btn-accept {
          padding: 0.8rem 2rem;
          border-radius: 2rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }
        .btn-home { background: #e2e8f0; color: #475569; }
        .btn-home:hover { background: #cbd5e1; }
        .btn-accept { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
        .btn-accept:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.3); }
        .terms-contact {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
        }
        .terms-contact a {
          color: #2563eb;
          text-decoration: none;
          margin-right: 8px;
        }
        .terms-contact a:hover { text-decoration: underline; }
        
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
          .terms-grid { grid-template-columns: 1fr; }
          .terms-actions { flex-direction: column; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .main-nav { display: none; }
          .terms-hero h1 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};

export default TermsPage;