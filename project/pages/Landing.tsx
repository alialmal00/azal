// src/pages/Landing.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUpload, FiSettings, FiCheckCircle, FiBarChart2, FiUsers, FiMail,
  FiFileText, FiTarget, FiTrendingUp, FiAward, FiClock, FiShield,
  FiInstagram, FiTwitter, FiLinkedin, FiMapPin, FiPhone, FiSend, 
  FiPlayCircle, FiHome, FiMessageSquare, FiDownload, FiZap, FiStar,
  FiBookOpen, FiVideo, FiUserPlus, FiGlobe, FiServer, FiLock,
  FiArrowRight, FiChevronDown, FiMenu, FiX, FiGithub, FiYoutube,
  FiFacebook, FiExternalLink, FiCreditCard, FiHeadphones, FiCoffee
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showLoader, setShowLoader] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const homeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      const sections = [
        { id: 'home', ref: homeRef },
        { id: 'features', ref: featuresRef },
        { id: 'pricing', ref: pricingRef },
        { id: 'contact', ref: contactRef }
      ];

      let active = 'home';
      for (const section of sections) {
        if (section.ref?.current) {
          const el = section.ref.current;
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top - 50 && scrollY < top + height - 50) {
            active = section.id;
            break;
          }
        }
      }
      setActiveSection(active);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const offset = 80;
      const top = ref.current.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: null, message: '' });

    setTimeout(() => {
      setFormStatus({
        type: 'success',
        message: '✅ پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.'
      });
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  if (showLoader) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-logo">
            <img src={logoImg} alt="آزمونیک" />
            <span>آزمونیک</span>
          </div>
          <div className="splash-line"></div>
          <div className="splash-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <FiUpload />,
      title: 'آپلود ساده',
      desc: 'فایل PDF یا جزوه خود را با کشیدن و رها کردن بارگذاری کنید. از تمامی فرمت‌های رایج پشتیبانی می‌شود.'
    },
    {
      icon: <FiSettings />,
      title: 'تنظیمات پیشرفته',
      desc: 'سطح دشواری، تعداد سوالات، زمان آزمون و نوع سوالات را به دلخواه تنظیم کنید.'
    },
    {
      icon: <FiBarChart2 />,
      title: 'تحلیل هوشمند',
      desc: 'سیستم ما پاسخ‌های شما را تحلیل کرده و گزارش کاملی از نقاط قوت و ضعف ارائه می‌دهد.'
    },
    {
      icon: <FiAward />,
      title: 'دستاوردها و نشان‌ها',
      desc: 'با پیشرفت در یادگیری، نشان‌های افتخار دریافت کنید و انگیزه خود را حفظ کنید.'
    },
    {
      icon: <FiUsers />,
      title: 'مدیریت کلاس هوشمند',
      desc: 'ایجاد کلاس، مدیریت دانش‌آموزان، برگزاری آزمون آنلاین و پیگیری پیشرفت تحصیلی.'
    },
    {
      icon: <FiMessageSquare />,
      title: 'پشتیبانی ۲۴/۷ هوشمند',
      desc: 'مشاور هوش مصنوعی همیشه آنلاین برای پاسخ به سوالات درسی و رفع اشکال فوری.'
    },
    {
      icon: <FiDownload />,
      title: 'دانلود گزارش PDF',
      desc: 'دریافت کارنامه کامل و گزارش پیشرفت تحصیلی در قالب PDF حرفه‌ای و قابل چاپ.'
    },
    {
      icon: <FiClock />,
      title: 'آزمون‌های زمان‌دار',
      desc: 'تنظیم زمان مشخص برای هر آزمون و تمرین مدیریت زمان در شرایط واقعی امتحان.'
    }
  ];

  const plans = [
    {
      name: 'آزمایشی',
      price: 'رایگان',
      features: ['۵ آزمون در ماه', 'تحلیل پایه عملکرد', 'پشتیبانی ایمیلی', 'گزارش ساده'],
      cta: 'شروع رایگان',
      popular: false
    },
    {
      name: 'حرفه‌ای',
      price: '۹۹,۰۰۰ تومان',
      period: '/ماه',
      features: ['آزمون نامحدود', 'تحلیل پیشرفته هوش مصنوعی', 'گزارش‌های شخصی‌سازی شده', 'پشتیبانی اختصاصی', 'داشبورد پیشرفته'],
      cta: 'شروع دوره حرفه‌ای',
      popular: true
    },
    {
      name: 'سازمانی',
      price: 'تماس بگیرید',
      features: ['مدیریت کاربران نامحدود', 'گزارش‌های سازمانی سفارشی', 'API اختصاصی', 'پشتیبانی ۲۴/۷', 'ادغام با سیستم‌های آموزشی'],
      cta: 'درخواست دمو',
      popular: false
    }
  ];

  const faqs = [
    { q: 'آزمونیک چیست؟', a: 'آزمونیک یک پلتفرم هوشمند تولید آزمون است که با استفاده از هوش مصنوعی، از متن شما سوالات استاندارد و شخصی‌سازی شده تولید می‌کند.' },
    { q: 'چگونه از آزمونیک استفاده کنم؟', a: 'کافی است متن یا فایل خود را آپلود کنید، تنظیمات مورد نظر را انتخاب کنید و آزمون هوشمند خود را دریافت کنید.' },
    { q: 'آیا داده‌های من امن هستند؟', a: 'بله، تمام داده‌ها با بالاترین سطح امنیت رمزنگاری شده و در سرورهای امن ذخیره می‌شوند.' },
    { q: 'آیا آزمونیک برای معلمان مناسب است؟', a: 'بله، معلمان می‌توانند با استفاده از آزمونیک، آزمون‌های استاندارد و شخصی‌سازی شده برای دانش‌آموزان خود طراحی کنند.' }
  ];

  return (
    <div className="landing">
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <img src={logoImg} alt="logo" className="logo-lo" />
            <a href="#">آزمونـیک</a>
          </div>
          
          <nav className="nav desktop-only">
            <div className={`nav-item ${activeSection === 'home' ? 'active' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="nav-icon-wrapper"><FiHome className="nav-icon-top" /></div>
              <span className="nav-text">خانه</span>
            </div>
            <div className={`nav-item ${activeSection === 'features' ? 'active' : ''}`} onClick={() => scrollTo(featuresRef)}>
              <div className="nav-icon-wrapper"><FiTarget className="nav-icon-top" /></div>
              <span className="nav-text">امکانات</span>
            </div>
            <div className={`nav-item ${activeSection === 'pricing' ? 'active' : ''}`} onClick={() => scrollTo(pricingRef)}>
              <div className="nav-icon-wrapper"><FiTrendingUp className="nav-icon-top" /></div>
              <span className="nav-text">قیمت‌ها</span>
            </div>
            <div className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`} onClick={() => scrollTo(contactRef)}>
              <div className="nav-icon-wrapper"><FiMail className="nav-icon-top" /></div>
              <span className="nav-text">تماس</span>
            </div>
          </nav>

          <div className="auth-actions">
            <div className="auth-buttons-box">
              <Link to="/login" className="auth-btn login-btn">
                <FiUsers /> ورود
              </Link>
              <Link to="/register" className="auth-btn register-btn">
                <FiCheckCircle /> ثبت‌نام
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-bottom-nav">
        <div className="nav-items">
          <div className={`nav-item ${activeSection === 'home' ? 'active' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="nav-icon-wrapper"><FiHome className="nav-icon-top" /></div>
            <span className="nav-text">خانه</span>
          </div>
          <div className={`nav-item ${activeSection === 'features' ? 'active' : ''}`} onClick={() => scrollTo(featuresRef)}>
            <div className="nav-icon-wrapper"><FiTarget className="nav-icon-top" /></div>
            <span className="nav-text">امکانات</span>
          </div>
          <div className={`nav-item ${activeSection === 'pricing' ? 'active' : ''}`} onClick={() => scrollTo(pricingRef)}>
            <div className="nav-icon-wrapper"><FiTrendingUp className="nav-icon-top" /></div>
            <span className="nav-text">قیمت‌ها</span>
          </div>
          <div className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`} onClick={() => scrollTo(contactRef)}>
            <div className="nav-icon-wrapper"><FiMail className="nav-icon-top" /></div>
            <span className="nav-text">تماس</span>
          </div>
        </div>
      </div>

      <section ref={homeRef} className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>جزوه بده، <span className="gradient-text">آزمون هوشمند</span> تحویل بگیر</h1>
            <p>آزمونیک با استفاده از هوش مصنوعی پیشرفته، از جزوه و PDF شما آزمون‌های استاندارد و شخصی‌سازی شده می‌سازد، پاسخ‌ها را به طور خودکار تصحیح می‌کند و نقاط ضعف شما را به صورت دقیق تحلیل می‌کند.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary-large">
                <FiPlayCircle /> شروع رایگان
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/assets/images/hero31.png" alt="پیش‌نمایش داشبورد هوشمند آزمونیک" />
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      <section ref={featuresRef} className="features">
        <div className="container">
          <h2>امکانات <span className="gradient-text">آزمونیک</span></h2>
          <p className="section-subtitle">همه چیزهایی که برای موفقیت نیاز دارید</p>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={pricingRef} className="pricing">
        <div className="container">
          <h2>پلن‌های <span className="gradient-text">قیمت‌گذاری</span></h2>
          <p className="section-subtitle">پلن مناسب خود را انتخاب کنید، ۱۴ روز تست رایگان دارید</p>
          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`price-card ${plan.popular ? 'featured' : ''}`}>
                <h3>{plan.name}</h3>
                <p className="price">{plan.price}{plan.period && <span>{plan.period}</span>}</p>
                <ul>
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <Link to="/register" className={plan.popular ? 'btn-primary' : 'btn-outline'}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={contactRef} className="contact">
        <div className="container">
          <h2>در <span className="gradient-text">تماس</span> باشید</h2>
          <p className="section-subtitle">سوال یا پیشنهادی دارید؟ خوشحال می‌شویم بشنویم</p>

          {formStatus.type && (
            <div className={`contact-status ${formStatus.type}`}>
              {formStatus.message}
            </div>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="نام و نام خانوادگی" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input type="email" name="email" placeholder="آدرس ایمیل" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="text" name="subject" placeholder="موضوع" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
            <textarea name="message" placeholder="پیام شما..." required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <FiSend /> {isSubmitting ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
          </form>
        </div>
      </section>

      <footer className="footer minimal">
        <div className="container">
          <div className="footer-main">
            <div className="footer-info">
              <div className="footer-logo">
                <img src={logoImg} alt="logo" />
                <span>آزمونـیک</span>
              </div>
              <span className="footer-description">پلتفرم هوشمند تولید آزمون و تحلیل عملکرد تحصیلی</span>
              <div className="footer-social">
                <a href="#" className="social-btn"><FiInstagram /></a>
                <a href="#" className="social-btn"><FiTwitter /></a>
                <a href="#" className="social-btn"><FiLinkedin /></a>
              </div>
            </div>
            <div className="footer-quick-links">
              <div className="quick-links-column">
                <h5>دسترسی سریع</h5>
                <div onClick={() => scrollTo(featuresRef)}>امکانات</div>
                <div onClick={() => scrollTo(pricingRef)}>قیمت‌ها</div>
                <Link to="/about">درباره ما</Link>
                <div onClick={() => scrollTo(contactRef)}>تماس</div>
              </div>
              <div className="quick-links-column">
                <h5>قوانین</h5>
                <Link to="/terms">قوانین و مقررات</Link>
                <Link to="/privacy">حریم خصوصی</Link>
                <Link to="/faq">سوالات متداول</Link>
              </div>
            </div>
            <div className="footer-contact">
              <h5>ارتباط با ما</h5>
              <div className="contact-item"><FiMail /><span>support@azmunik.com</span></div>
              <div className="contact-item"><FiPhone /><span>۰۲۱-۱۲۳۴۵۶۷۸</span></div>
              <div className="contact-item"><FiMapPin /><span>تهران، خیابان آزادی</span></div>
            </div>
          </div>
          <hr className="footer-line" />
          <div className="copyright">
            <p>© ۱۴۰۴ طراحی شده با ❤️ برای دانش‌آموزان ایران</p>
          </div>
        </div>
      </footer>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing {
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* ========== SPLASH ========== */
        .splash-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: splashFadeOut 0.3s ease-in-out forwards;
          animation-delay: 0.1s;
        }

        @keyframes splashFadeOut {
          from { opacity: 1; visibility: visible; }
          to { opacity: 0; visibility: hidden; }
        }

        .splash-content {
          text-align: center;
          animation: splashZoomIn 0.5s ease-out;
        }

        @keyframes splashZoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .splash-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .splash-logo img { height: 50px; width: auto; }
        .splash-logo span {
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .splash-line {
          width: 60px;
          height: 3px;
          background: rgba(255,255,255,0.5);
          margin: 20px auto;
          border-radius: 3px;
          animation: splashLineGrow 0.6s ease-out forwards;
        }

        @keyframes splashLineGrow {
          from { width: 0; opacity: 0; }
          to { width: 60px; opacity: 1; }
        }

        .splash-dots {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .splash-dots span {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: splashDotFade 0.8s ease-in-out infinite;
        }
        .splash-dots span:nth-child(1) { animation-delay: 0s; }
        .splash-dots span:nth-child(2) { animation-delay: 0.15s; }
        .splash-dots span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes splashDotFade {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* ========== HEADER ========== */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          z-index: 1000;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .logo .logo-lo { height: 45px; width: auto; }
        .logo a {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
        }

        .nav {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #4b5563;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
          min-width: 60px;
          cursor: pointer;
        }
        .nav-item:hover { background: rgba(37,99,235,0.05); color: #2563eb; }

        .nav-item.active .nav-icon-wrapper {
          background: linear-gradient(135deg, #2563eb15, #7c3aed15);
        }
        .nav-item.active .nav-icon-top { color: #2563eb; }
        .nav-item.active .nav-text { color: #2563eb; font-weight: 600; }

        .nav-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin-bottom: 4px;
          background: transparent;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .nav-icon-top { font-size: 18px; color: #94a3b8; transition: all 0.3s ease; }
        .nav-text { font-size: 0.7rem; font-weight: 500; color: #94a3b8; transition: all 0.3s ease; }

        .auth-actions { display: flex; gap: 0.75rem; align-items: center; }

        .auth-buttons-box {
          display: flex;
          background: #f1f5f9;
          border-radius: 50px;
          padding: 4px;
          gap: 4px;
        }

        .auth-btn {
          padding: 0.45rem 1.2rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
        }

        .login-btn {
          background: transparent;
          color: #4b5563;
          border: none;
        }
        .login-btn:hover { background: rgba(37,99,235,0.08); color: #2563eb; }

        .register-btn {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .register-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(37,99,235,0.35); }

        .desktop-only { display: flex; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .auth-btn { padding: 0.35rem 0.9rem; font-size: 0.75rem; }
          .auth-buttons-box { padding: 3px; gap: 3px; }
        }

        /* ========== MOBILE BOTTOM NAV ========== */
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(0,0,0,0.08);
          padding: 6px 10px;
          z-index: 1000;
          display: none;
          border-radius: 16px 16px 0 0;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav { display: block; }
          body { padding-bottom: 65px; }
        }

        .nav-items {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 4px;
        }

        .mobile-bottom-nav .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 8px;
          border-radius: 10px;
          cursor: pointer;
          flex: 1;
          max-width: 70px;
        }
        .mobile-bottom-nav .nav-icon-wrapper { width: 32px; height: 32px; }
        .mobile-bottom-nav .nav-icon-top { font-size: 16px; }
        .mobile-bottom-nav .nav-text { font-size: 0.6rem; }

        .mobile-bottom-nav .nav-item.active .nav-icon-wrapper {
          background: linear-gradient(135deg, #2563eb15, #7c3aed15);
        }
        .mobile-bottom-nav .nav-item.active .nav-icon-top { color: #2563eb; }
        .mobile-bottom-nav .nav-item.active .nav-text { color: #2563eb; font-weight: 600; }

        /* ========== HERO ========== */
        .hero {
          padding: 110px 0 80px;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          position: relative;
          overflow: hidden;
        }

        .hero-inner {
          display: flex;
          align-items: center;
          gap: 3rem;
        }

        .hero-text { flex: 1; }
        .hero-text h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1rem;
          color: #0f172a;
        }

        .gradient-text {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-text p {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 2rem;
          max-width: 500px;
        }

        .hero-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }

        .btn-primary-large {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 2rem;
          border-radius: 3rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-primary-large:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(37,99,235,0.3); }

        .hero-image { flex: 1; display: flex; justify-content: center; }
        .hero-image img { max-width: 100%; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }

        .hero-wave {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          width: 100%;
          line-height: 0;
        }
        .hero-wave svg { width: 100%; height: auto; display: block; }

        @media (max-width: 992px) {
          .hero-inner { flex-direction: column; text-align: center; }
          .hero-text p { max-width: 100%; margin: 0 auto 2rem; }
          .hero-buttons { justify-content: center; }
          .hero-text h1 { font-size: 2.5rem; }
        }

        @media (max-width: 768px) {
          .hero { padding: 100px 0 60px; }
          .hero-text h1 { font-size: 2rem; }
          .btn-primary-large { width: 100%; justify-content: center; }
        }

        /* ========== FEATURES ========== */
        .features {
          padding: 4rem 0;
          background: white;
        }

        .features h2 {
          text-align: center;
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .section-subtitle {
          text-align: center;
          color: #64748b;
          font-size: 1rem;
          margin-bottom: 2.5rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .feature-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          text-align: center;
          transition: all 0.3s ease;
        }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 10px 30px rgba(0,0,0,0.06); }

        .feature-card .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: #2563eb;
          font-size: 1.5rem;
        }

        .feature-card h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
        .feature-card p { font-size: 0.85rem; color: #64748b; line-height: 1.6; }

        @media (max-width: 992px) {
          .feature-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .feature-grid { grid-template-columns: 1fr; }
          .features h2 { font-size: 1.8rem; }
        }

        /* ========== PRICING ========== */
        .pricing {
          padding: 4rem 0;
          background: #f8fafc;
        }

        .pricing h2 {
          text-align: center;
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .price-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          text-align: center;
          transition: all 0.3s ease;
        }
        .price-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
        .price-card.featured {
          border-color: #2563eb;
          background: #f8faff;
          transform: scale(1.02);
        }
        .price-card.featured:hover { transform: scale(1.02) translateY(-4px); }

        .price-card h3 { font-size: 1.2rem; font-weight: 700; color: #0f172a; }
        .price-card .price {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 1rem 0;
        }
        .price-card .price span { font-size: 0.9rem; color: #64748b; }

        .price-card ul {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
          text-align: right;
        }
        .price-card ul li {
          padding: 0.4rem 0;
          color: #475569;
          font-size: 0.85rem;
        }

        .price-card .btn-outline,
        .price-card .btn-primary {
          display: inline-block;
          width: 100%;
          padding: 0.7rem;
          border-radius: 2rem;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .price-card .btn-outline {
          border: 2px solid #2563eb;
          color: #2563eb;
          background: transparent;
        }
        .price-card .btn-outline:hover { background: #2563eb; color: white; }
        .price-card .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
        }
        .price-card .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.3); }

        @media (max-width: 992px) {
          .pricing-grid { grid-template-columns: 1fr 1fr; }
          .price-card.featured { transform: scale(1); }
          .price-card.featured:hover { transform: translateY(-4px); }
        }

        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing h2 { font-size: 1.8rem; }
        }

        /* ========== CONTACT ========== */
        .contact {
          padding: 4rem 0;
          background: white;
        }

        .contact h2 {
          text-align: center;
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .contact-status {
          max-width: 600px;
          margin: 0 auto 1.5rem;
          padding: 0.8rem 1.5rem;
          border-radius: 0.75rem;
          text-align: center;
          font-weight: 500;
        }
        .contact-status.success { background: #d1fae5; color: #065f46; }
        .contact-status.error { background: #fee2e2; color: #991b1b; }

        .contact-form {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .contact-form input,
        .contact-form textarea {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
        }
        .contact-form input:focus,
        .contact-form textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .contact-form textarea { resize: vertical; }

        .contact-form .btn-primary {
          padding: 0.9rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        .contact-form .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37,99,235,0.3);
        }
        .contact-form .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .contact h2 { font-size: 1.8rem; }
        }

        /* ========== FOOTER ========== */
        .footer.minimal {
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          padding: 2.5rem 0 1.5rem;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0.5rem;
        }
        .footer-logo img { height: 40px; width: auto; }
        .footer-logo span {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .footer-description {
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.5;
          display: block;
        }

        .footer-social {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .footer-social a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          color: #6b7280;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .footer-social a:hover { background: #2563eb; color: white; border-color: #2563eb; transform: translateY(-3px); }

        .footer-quick-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .quick-links-column h5 {
          font-size: 0.95rem;
          color: #1f2937;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .quick-links-column a,
        .quick-links-column div {
          display: block;
          color: #6b7280;
          text-decoration: none;
          font-size: 0.85rem;
          margin-bottom: 0.4rem;
          transition: color 0.3s ease;
          cursor: pointer;
        }
        .quick-links-column a:hover,
        .quick-links-column div:hover { color: #2563eb; }

        .footer-contact h5 {
          font-size: 0.95rem;
          color: #1f2937;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          color: #6b7280;
          font-size: 0.85rem;
        }
        .contact-item svg { color: #2563eb; }

        .footer-line {
          border: none;
          height: 1px;
          background: #e5e7eb;
          margin: 1.5rem 0;
        }

        .copyright {
          text-align: center;
        }
        .copyright p {
          color: #6b7280;
          font-size: 0.85rem;
        }

        @media (max-width: 992px) {
          .footer-main { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 768px) {
          .footer-main {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .footer-logo { justify-content: center; }
          .footer-social { justify-content: center; }
          .footer-quick-links { grid-template-columns: 1fr; }
          .contact-item { justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default Landing;