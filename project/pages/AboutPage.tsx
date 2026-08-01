// src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiAward, FiTarget, FiTrendingUp, FiCheckCircle,
  FiClock, FiBookOpen, FiStar, FiCalendar, FiTwitter, FiMail, 
  FiMapPin, FiPhone, FiLinkedin, FiInstagram, FiGlobe,
  FiZap, FiShield, FiHeart, FiSmile, FiBriefcase, FiCode
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const AboutPage: React.FC = () => {
  const teamMembers = [
    { 
      name: 'دکتر علی محمدی', 
      role: 'مدیر ارشد فناوری', 
      bio: 'متخصص هوش مصنوعی با ۱۵ سال تجربه در حوزه یادگیری ماشین', 
      image: '/assets/images/team1.jpg',
      social: { linkedin: '#', twitter: '#' }
    },
    { 
      name: 'مهسا کریمی', 
      role: 'مدیر آموزش', 
      bio: 'دکترای تکنولوژی آموزشی از دانشگاه تهران، نویسنده ۳ کتاب', 
      image: '/assets/images/team2.jpg',
      social: { linkedin: '#', twitter: '#' }
    },
    { 
      name: 'رضا حسینی', 
      role: 'توسعه‌دهنده ارشد', 
      bio: 'کارشناس ارشد مهندسی نرم‌افزار، متخصص React و Node.js', 
      image: '/assets/images/team3.jpg',
      social: { linkedin: '#', twitter: '#' }
    },
    { 
      name: 'سارا احمدی', 
      role: 'طراح تجربه کاربری', 
      bio: 'متخصص طراحی UI/UX با ۸ سال تجربه در محصولات آموزشی', 
      image: '/assets/images/team4.jpg',
      social: { linkedin: '#', twitter: '#' }
    }
  ];

  const milestones = [
    { year: '۱۴۰۰', title: 'شروع پروژه', desc: 'ایده اولیه آزمونیک با هدف تحول در آموزش شکل گرفت', icon: '🚀' },
    { year: '۱۴۰۱', title: 'نسخه بتا', desc: 'اولین نسخه آزمایشی با ۱۰۰ کاربر منتشر شد', icon: '🧪' },
    { year: '۱۴۰۲', title: 'پیشرفت چشمگیر', desc: '۱۰,۰۰۰ کاربر فعال به سیستم پیوستند', icon: '📈' },
    { year: '۱۴۰۳', title: 'نسخه کامل', desc: 'امکانات پیشرفته و کلاس‌های آنلاین اضافه شد', icon: '🎯' },
    { year: '۱۴۰۴', title: 'پیشرو در آموزش هوشمند', desc: 'بزرگترین پلتفرم هوشمند آموزشی خاورمیانه', icon: '🏆' }
  ];

  const stats = [
    { value: '۱۰,۰۰۰+', label: 'کاربر فعال', icon: <FiUsers />, color: '#2563eb' },
    { value: '۵۰,۰۰۰+', label: 'آزمون برگزار شده', icon: <FiBookOpen />, color: '#7c3aed' },
    { value: '۹۵٪', label: 'رضایت کاربران', icon: <FiSmile />, color: '#10b981' },
    { value: '۴.۹', label: 'امتیاز کاربران', icon: <FiStar />, color: '#f59e0b' }
  ];

  const values = [
    { icon: <FiHeart />, title: 'تعهد به کیفیت', desc: 'ارائه بهترین تجربه یادگیری با بالاترین استانداردها' },
    { icon: <FiZap />, title: 'نوآوری مداوم', desc: 'استفاده از جدیدترین فناوری‌های هوش مصنوعی' },
    { icon: <FiShield />, title: 'امنیت و اعتماد', desc: 'حفاظت کامل از اطلاعات کاربران با بالاترین سطح امنیت' },
    { icon: <FiGlobe />, title: 'دسترسی همگانی', desc: 'یادگیری برای همه، بدون محدودیت جغرافیایی' }
  ];

  return (
    <div className="about-page">
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
              <Link to="/about" className="active">درباره ما</Link>
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

      {/* ========== Hero Section ========== */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">✨ داستان ما</div>
              <h1>درباره <span className="gradient-text">آزمونیک</span></h1>
              <p className="hero-text">
                ما با مأموریت تحول در یادگیری و ارزیابی تحصیلی، از تکنولوژی هوش مصنوعی برای شخصی‌سازی فرآیند یادگیری استفاده می‌کنیم. 
                هر دانش‌آموز منحصر به فرد است و نیاز به روش یادگیری خاص خود دارد.
              </p>
              <div className="hero-buttons">
                <Link to="/register" className="btn-primary-lg">
                  <FiCheckCircle /> شروع کنید
                </Link>
                <Link to="/contact" className="btn-outline-lg">
                  <FiMail /> تماس با ما
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-cards">
                <div className="floating-card card-1">🎓</div>
                <div className="floating-card card-2">🤖</div>
                <div className="floating-card card-3">📊</div>
              </div>
              <div className="hero-stat-circle">
                <div className="circle-content">
                  <span className="circle-number">۹۵٪</span>
                  <span className="circle-label">رضایت کاربران</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 55C120 50 240 40 360 45C480 50 600 70 720 75C840 80 960 70 1080 60C1200 50 1320 40 1380 35L1440 30V120H1380C1320 120 1200 120 1080 120H720C600 120 480 120 360 120H60L0 120V60Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ========== آمار ========== */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card" style={{ borderTopColor: stat.color }}>
                <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Mission & Values ========== */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">ارزش‌های ما</span>
            <h2>چیزی که ما به آن <span className="gradient-text">باور داریم</span></h2>
            <p>اصول و ارزش‌هایی که مسیر ما را شکل می‌دهند</p>
          </div>
          <div className="values-grid">
            {values.map((item, idx) => (
              <div key={idx} className="value-card">
                <div className="value-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Mission & Vision ========== */}
      <section className="mission-vision">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card mission">
              <div className="mv-icon">🎯</div>
              <h3>ماموریت ما</h3>
              <p>ارائه بهترین تجربه یادگیری شخصی‌سازی شده با استفاده از هوش مصنوعی پیشرفته برای دانش‌آموزان، معلمان و دانشجویان</p>
            </div>
            <div className="mv-card vision">
              <div className="mv-icon">🔭</div>
              <h3>چشم‌انداز ما</h3>
              <p>تبدیل شدن به بزرگترین پلتفرم هوشمند آموزشی در خاورمیانه و ایجاد تحول در روش‌های یادگیری و ارزیابی</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Milestones ========== */}
      <section className="milestones-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">نشانه‌های پیشرفت</span>
            <h2>گام‌های <span className="gradient-text">موفقیت</span></h2>
            <p>مسیری که تا امروز پیموده‌ایم</p>
          </div>
          <div className="timeline">
            {milestones.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker">
                  <span className="marker-icon">{item.icon}</span>
                  <div className="timeline-line"></div>
                </div>
                <div className="timeline-content">
                  <div className="timeline-year">{item.year}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Team ========== */}
      <section className="team-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">تیم ما</span>
            <h2>افراد <span className="gradient-text">پشت صحنه</span></h2>
            <p>متخصصانی که آزمونیک را می‌سازند</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-avatar">
                  <div className="avatar-placeholder">{member.name.charAt(0)}</div>
                  <div className="avatar-ring"></div>
                </div>
                <h4>{member.name}</h4>
                <p className="team-role">{member.role}</p>
                <p className="team-bio">{member.bio}</p>
                <div className="team-social">
                  <a href={member.social.linkedin}><FiLinkedin /></a>
                  <a href={member.social.twitter}><FiTwitter /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>آماده شروع یادگیری هوشمند هستید؟</h2>
            <p>به جمع هزاران دانش‌آموز و معلم بپیوندید</p>
            <Link to="/register" className="btn-cta">
              <FiCheckCircle /> شروع رایگان
            </Link>
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
        /* ============================================
           استایل‌های کامل و حرفه‌ای AboutPage
           ============================================ */
        
        /* ---------- متغیرها ---------- */
        :root {
          --primary: #2563eb;
          --primary-dark: #1d4ed8;
          --secondary: #7c3aed;
          --gradient: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899);
          --shadow: 0 20px 60px rgba(0,0,0,0.1);
          --shadow-hover: 0 30px 80px rgba(0,0,0,0.15);
          --radius: 24px;
        }

        .about-page {
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
          overflow-x: hidden;
          background: #f8fafc;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

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
        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .logo img { height: 45px; width: auto; }
        .logo span {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .main-nav {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        .main-nav a {
          text-decoration: none;
          color: #4b5563;
          font-weight: 500;
          transition: all 0.3s;
          position: relative;
        }
        .main-nav a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          right: 0;
          width: 0;
          height: 2px;
          background: var(--gradient);
          transition: width 0.3s;
        }
        .main-nav a:hover::after,
        .main-nav a.active::after {
          width: 100%;
        }
        .main-nav a:hover { color: #2563eb; }
        .main-nav a.active { color: #2563eb; }

        .auth-buttons { display: flex; gap: 1rem; }
        .btn-outline {
          padding: 0.6rem 1.5rem;
          border-radius: 2rem;
          text-decoration: none;
          font-weight: 600;
          border: 2px solid #2563eb;
          color: #2563eb;
          transition: all 0.3s;
        }
        .btn-outline:hover { background: #2563eb; color: white; }
        .btn-primary {
          padding: 0.6rem 1.5rem;
          border-radius: 2rem;
          text-decoration: none;
          font-weight: 600;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          transition: all 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.3); }

        /* ---------- Hero ---------- */
        .about-hero {
          padding: 140px 0 80px;
          background: linear-gradient(135deg, #0f172a, #1e293b, #0f172a);
          position: relative;
          overflow: hidden;
        }
        .about-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 50%, rgba(37,99,235,0.1), transparent 60%);
          animation: rotate 30s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(37,99,235,0.2);
          color: #60a5fa;
          padding: 0.4rem 1.2rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }
        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .gradient-text {
          background: linear-gradient(135deg, #60a5fa, #c084fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-text {
          color: #94a3b8;
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 2rem;
        }
        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn-primary-lg {
          padding: 0.9rem 2.5rem;
          border-radius: 3rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }
        .btn-primary-lg:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(37,99,235,0.3);
        }
        .btn-outline-lg {
          padding: 0.9rem 2.5rem;
          border-radius: 3rem;
          border: 2px solid rgba(255,255,255,0.3);
          color: white;
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }
        .btn-outline-lg:hover {
          border-color: #2563eb;
          background: rgba(37,99,235,0.1);
        }

        /* ---------- Hero Visual ---------- */
        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
        .floating-cards {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .floating-card {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          animation: float 6s ease-in-out infinite;
        }
        .floating-card.card-1 { top: 0; right: 20%; animation-delay: 0s; }
        .floating-card.card-2 { bottom: 20%; left: 10%; animation-delay: 2s; }
        .floating-card.card-3 { top: 30%; left: 30%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .hero-stat-circle {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2));
          border: 2px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          position: relative;
          margin-top: 2rem;
        }
        .circle-content { text-align: center; }
        .circle-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
        }
        .circle-label {
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .hero-wave {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
        }
        .hero-wave svg { width: 100%; display: block; }

        /* ---------- Stats ---------- */
        .stats-section {
          padding: 4rem 0;
          background: white;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .stat-card {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: var(--radius);
          border-top: 4px solid;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .stat-card:hover { transform: translateY(-8px); box-shadow: var(--shadow); }
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
        }
        .stat-label { color: #64748b; font-size: 0.9rem; }

        /* ---------- Values ---------- */
        .values-section {
          padding: 4rem 0;
          background: #f8fafc;
        }
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .section-badge {
          display: inline-block;
          background: linear-gradient(135deg, #dbeafe, #ede9fe);
          color: #2563eb;
          padding: 0.3rem 1.2rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
        }
        .section-header p { color: #64748b; }
        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .value-card {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: var(--radius);
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .value-card:hover { transform: translateY(-8px); box-shadow: var(--shadow); }
        .value-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #dbeafe, #ede9fe);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 2rem;
          color: #2563eb;
        }
        .value-card h3 { color: #1e293b; margin-bottom: 0.5rem; }
        .value-card p { color: #64748b; line-height: 1.7; }

        /* ---------- Mission Vision ---------- */
        .mission-vision {
          padding: 4rem 0;
          background: white;
        }
        .mv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .mv-card {
          padding: 3rem;
          border-radius: var(--radius);
          text-align: center;
          transition: all 0.3s;
        }
        .mv-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .mv-card.mission {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
        }
        .mv-card.vision {
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          border: 1px solid #ddd6fe;
        }
        .mv-icon { font-size: 3rem; margin-bottom: 1rem; }
        .mv-card h3 { color: #1e293b; margin-bottom: 0.5rem; }
        .mv-card p { color: #475569; line-height: 1.8; }

        /* ---------- Milestones ---------- */
        .milestones-section {
          padding: 4rem 0;
          background: #f8fafc;
        }
        .timeline {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }
        .timeline::before {
          content: '';
          position: absolute;
          right: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #2563eb, #7c3aed);
          transform: translateX(50%);
        }
        .timeline-item {
          display: flex;
          justify-content: flex-end;
          padding: 1rem 0;
          position: relative;
          width: 50%;
        }
        .timeline-item:nth-child(odd) { padding-left: 3rem; }
        .timeline-item:nth-child(even) {
          padding-right: 3rem;
          margin-right: auto;
          flex-direction: row-reverse;
        }
        .timeline-marker {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .timeline-item:nth-child(odd) .timeline-marker { right: -12px; }
        .timeline-item:nth-child(even) .timeline-marker { left: -12px; }
        .marker-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1;
        }
        .timeline-content {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 300px;
        }
        .timeline-year {
          color: #2563eb;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .timeline-content h4 { color: #1e293b; margin: 0.25rem 0; }
        .timeline-content p { color: #64748b; font-size: 0.85rem; margin: 0; }

        /* ---------- Team ---------- */
        .team-section {
          padding: 4rem 0;
          background: white;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .team-card {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: var(--radius);
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .team-card:hover { transform: translateY(-8px); box-shadow: var(--shadow); }
        .team-avatar {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 1.5rem;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 700;
          color: white;
        }
        .avatar-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #2563eb;
          animation: spin 4s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .team-role {
          color: #2563eb;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .team-bio {
          color: #64748b;
          font-size: 0.85rem;
          margin: 0.5rem 0;
        }
        .team-social {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        .team-social a {
          color: #94a3b8;
          transition: color 0.3s;
          font-size: 1.2rem;
        }
        .team-social a:hover { color: #2563eb; }

        /* ---------- CTA ---------- */
        .cta-section {
          padding: 4rem 0;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          text-align: center;
          color: white;
        }
        .cta-content h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .cta-content p { color: #94a3b8; margin-bottom: 2rem; }
        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 3rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-radius: 3rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }
        .btn-cta:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(37,99,235,0.3); }

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
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .footer-logo img { height: 40px; width: auto; }
        .footer-logo span {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .footer-social {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .footer-social a {
          color: #64748b;
          transition: all 0.3s;
          font-size: 1.2rem;
        }
        .footer-social a:hover { color: #60a5fa; transform: translateY(-2px); }
        .footer-col h4 { color: white; margin-bottom: 1rem; }
        .footer-col a {
          display: block;
          color: #94a3b8;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
        }
        .footer-col a:hover { color: #60a5fa; transform: translateX(-4px); }
        .footer-col p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .footer-bottom {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #1e293b;
          font-size: 0.85rem;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 2rem; }
          .hero-content h1 { font-size: 2.8rem; }
          .hero-buttons { justify-content: center; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .values-grid { grid-template-columns: repeat(2, 1fr); }
          .mv-grid { grid-template-columns: 1fr; }
          .team-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .container { padding: 0 1rem; }
          .main-nav { display: none; }
          .hero-content h1 { font-size: 2rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .values-grid { grid-template-columns: 1fr; }
          .team-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .footer-logo { justify-content: center; }
          .footer-social { justify-content: center; }
          .timeline::before { right: 20px; }
          .timeline-item { width: 100%; padding-right: 3rem !important; justify-content: flex-start; }
          .timeline-item:nth-child(even) { padding-right: 3rem !important; flex-direction: row; }
          .timeline-item:nth-child(odd) .timeline-marker { right: -4px; }
          .timeline-item:nth-child(even) .timeline-marker { right: -4px; left: auto; }
          .timeline-content { max-width: 100%; }
          .hero-stat-circle { width: 140px; height: 140px; }
          .circle-number { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;