// src/pages/FAQPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiSearch, FiMail, FiPhone } from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'حساب کاربری',
      questions: [
        {
          q: 'چگونه می‌توانم حساب کاربری ایجاد کنم؟',
          a: 'برای ایجاد حساب کاربری، روی دکمه "ثبت نام" در صفحه اصلی کلیک کنید، اطلاعات خود را وارد کرده و کد تأیید ارسال شده به شماره موبایل خود را وارد کنید.'
        },
        {
          q: 'آیا می‌توانم نقش کاربری خود را تغییر دهم؟',
          a: 'بله، پس از ورود به حساب کاربری، از طریق بخش "پروفایل" می‌توانید نقش خود را تغییر دهید.'
        },
        {
          q: 'چگونه می‌توانم رمز عبور خود را بازیابی کنم؟',
          a: 'در صفحه ورود، روی "فراموشی رمز عبور" کلیک کنید، شماره موبایل خود را وارد کنید و کد بازیابی را دریافت کنید.'
        }
      ]
    },
    {
      category: 'آزمون‌ها',
      questions: [
        {
          q: 'چگونه می‌توانم یک آزمون جدید بسازم؟',
          a: 'پس از ورود به پنل کاربری، روی "ساخت آزمون جدید" کلیک کنید، متن منبع خود را وارد کرده و تنظیمات آزمون را انتخاب کنید.'
        },
        {
          q: 'نتایج آزمون‌ها کجا ذخیره می‌شوند؟',
          a: 'تمام نتایج آزمون‌ها در بخش "آزمون‌های من" ذخیره می‌شوند و می‌توانید در هر زمان به آنها دسترسی داشته باشید.'
        }
      ]
    },
    {
      category: 'اشتراک‌ها',
      questions: [
        {
          q: 'چه پلن‌های اشتراکی وجود دارد؟',
          a: 'ما سه پلن رایگان، استاندارد و حرفه‌ای داریم که هر کدام امکانات متفاوتی مانند تعداد آزمون، تعداد سوال و کلاس‌های آنلاین را ارائه می‌دهند.'
        },
        {
          q: 'چگونه می‌توانم اشتراک خود را لغو کنم؟',
          a: 'در بخش "اشتراک‌ها" در پنل کاربری، می‌توانید اشتراک خود را لغو کنید. پس از لغو، تا پایان دوره فعلی از خدمات استفاده خواهید کرد.'
        }
      ]
    },
    {
      category: 'کلاس‌ها',
      questions: [
        {
          q: 'چگونه می‌توانم یک کلاس جدید ایجاد کنم؟',
          a: 'معلمان می‌توانند از بخش "مدیریت کلاس‌ها" در پنل کاربری، کلاس جدید ایجاد کرده و کد کلاس را به دانش‌آموزان خود بدهند.'
        },
        {
          q: 'چگونه به یک کلاس بپیوندم؟',
          a: 'دانش‌آموزان می‌توانند با وارد کردن کد کلاس در بخش "پیوستن به کلاس"، به کلاس مورد نظر بپیوندند.'
        }
      ]
    },
    {
      category: 'پشتیبانی',
      questions: [
        {
          q: 'چگونه می‌توانم با پشتیبانی تماس بگیرم؟',
          a: 'می‌توانید از طریق صفحه "تماس با ما"، ارسال تیکت در پنل کاربری یا ارسال ایمیل به support@azmoonik.com با ما در ارتباط باشید.'
        },
        {
          q: 'ساعات کاری پشتیبانی چگونه است؟',
          a: 'پشتیبانی از شنبه تا چهارشنبه ساعت ۹ تا ۱۷ پاسخگوی شماست. همچنین می‌توانید ۲۴ ساعته تیکت ارسال کنید.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.includes(searchTerm) || q.a.includes(searchTerm)
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="faq-page">
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
              <Link to="/contact">تماس با ما</Link>
            </nav>
            <div className="auth-buttons">
              <Link to="/login" className="btn-outline">ورود</Link>
              <Link to="/register" className="btn-primary">ثبت نام</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========== Hero ========== */}
      <section className="faq-hero">
        <div className="container">
          <div className="faq-hero-content">
            <h1>❓ سوالات <span className="gradient-text">متداول</span></h1>
            <p>پاسخ به رایج‌ترین سوالات کاربران</p>
            <div className="faq-search">
              <FiSearch />
              <input
                type="text"
                placeholder="جستجوی سوالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== FAQ Accordion ========== */}
      <section className="faq-section">
        <div className="container">
          <div className="faq-wrapper">
            {filteredFaqs.length === 0 ? (
              <div className="no-results">
                <p>نتیجه‌ای برای جستجوی شما یافت نشد</p>
              </div>
            ) : (
              filteredFaqs.map((category, catIdx) => (
                <div key={catIdx} className="faq-category">
                  <h2 className="category-title">{category.category}</h2>
                  <div className="faq-list">
                    {category.questions.map((faq, idx) => {
                      const globalIndex = catIdx * 10 + idx;
                      const isOpen = openIndex === globalIndex;
                      return (
                        <div
                          key={idx}
                          className={`faq-item ${isOpen ? 'open' : ''}`}
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        >
                          <div className="faq-question">
                            <span>{faq.q}</span>
                            {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                          </div>
                          <div className="faq-answer">
                            <p>{faq.a}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="faq-contact">
            <h3>سوال دیگری دارید؟</h3>
            <p>ما آماده پاسخگویی به شما هستیم</p>
            <div className="contact-options">
              <Link to="/contact" className="contact-option">
                <FiMail /> ارسال پیام
              </Link>
              <a href="tel:02112345678" className="contact-option">
                <FiPhone /> تماس تلفنی
              </a>
            </div>
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
        .faq-page {
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
        .faq-hero {
          padding: 130px 0 60px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white;
          text-align: center;
        }
        .faq-hero-content h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #c084fc); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .faq-hero-content p { color: #94a3b8; margin-bottom: 2rem; }
        .faq-search {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.1);
          border-radius: 2rem;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .faq-search svg { color: #94a3b8; margin-left: 0.75rem; }
        .faq-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 1rem;
          padding: 0.5rem 0;
          font-family: inherit;
        }
        .faq-search input::placeholder { color: #64748b; }

        /* ---------- FAQ ---------- */
        .faq-section { padding: 4rem 0; }
        .faq-wrapper { max-width: 800px; margin: 0 auto; }
        .faq-category { margin-bottom: 3rem; }
        .category-title {
          font-size: 1.3rem;
          color: #1e293b;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .faq-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .faq-item {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .faq-item:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .faq-item.open { box-shadow: 0 4px 20px rgba(37,99,235,0.1); border: 1px solid #bfdbfe; }
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          font-weight: 600;
          color: #1e293b;
          gap: 1rem;
        }
        .faq-question svg {
          flex-shrink: 0;
          color: #94a3b8;
          transition: transform 0.3s;
        }
        .faq-item.open .faq-question svg { color: #2563eb; }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        .faq-item.open .faq-answer {
          max-height: 300px;
          padding: 0 1.5rem 1.5rem;
        }
        .faq-answer p {
          color: #475569;
          line-height: 1.8;
          margin: 0;
        }
        .no-results {
          text-align: center;
          padding: 3rem;
          color: #94a3b8;
        }

        /* ---------- Contact ---------- */
        .faq-contact {
          max-width: 600px;
          margin: 3rem auto 0;
          text-align: center;
          padding: 2.5rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .faq-contact h3 { color: #1e293b; margin-bottom: 0.5rem; }
        .faq-contact p { color: #64748b; margin-bottom: 1.5rem; }
        .contact-options {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .contact-option {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 2rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          background: #f1f5f9;
          color: #475569;
        }
        .contact-option:hover {
          background: #2563eb;
          color: white;
          transform: translateY(-2px);
        }

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
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .container { padding: 0 1rem; }
          .main-nav { display: none; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .faq-hero-content h1 { font-size: 1.8rem; }
          .faq-question { font-size: 0.95rem; padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default FAQPage;