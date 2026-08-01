// src/pages/BlogPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiUser, FiTag, FiClock, FiArrowLeft, FiArrowRight, 
  FiSearch, FiMail, FiPhone, FiMapPin, FiTwitter, FiLinkedin, 
  FiInstagram, FiGlobe, FiMessageSquare, FiHome, FiBookOpen,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import logoImg from '../assets/images/logo.png';

const BlogPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [searchTerm, setSearchTerm] = useState('');

  const posts = [
    {
      id: 1,
      title: 'چگونه با هوش مصنوعی یادگیری را متحول کنیم؟',
      excerpt: 'هوش مصنوعی در حال تغییر روش یادگیری است. در این مقاله به بررسی تأثیر AI بر آموزش می‌پردازیم.',
      image: '/assets/images/blog1.jpg',
      category: 'هوش مصنوعی',
      author: 'دکتر علی محمدی',
      date: '۱۴۰۴/۰۱/۱۵',
      readTime: '۵ دقیقه',
      tags: ['هوش مصنوعی', 'یادگیری', 'فناوری']
    },
    {
      id: 2,
      title: '۱۰ تکنیک طلایی برای مطالعه مؤثر',
      excerpt: 'روش‌های علمی مطالعه که به شما کمک می‌کنند در کمترین زمان بیشترین بازدهی را داشته باشید.',
      image: '/assets/images/blog2.jpg',
      category: 'مطالعه',
      author: 'مهسا کریمی',
      date: '۱۴۰۴/۰۱/۱۲',
      readTime: '۷ دقیقه',
      tags: ['مطالعه', 'یادگیری', 'تمرکز']
    },
    {
      id: 3,
      title: 'نقش آزمون‌های هوشمند در ارزیابی تحصیلی',
      excerpt: 'چگونه آزمون‌های هوشمند می‌توانند نقاط قوت و ضعف دانش‌آموزان را دقیق‌تر شناسایی کنند.',
      image: '/assets/images/blog3.jpg',
      category: 'آزمون',
      author: 'رضا حسینی',
      date: '۱۴۰۴/۰۱/۱۰',
      readTime: '۶ دقیقه',
      tags: ['آزمون', 'ارزیابی', 'هوش مصنوعی']
    },
    {
      id: 4,
      title: 'مدیریت زمان در دوران امتحانات',
      excerpt: 'چگونه با برنامه‌ریزی صحیح، استرس امتحانات را کاهش دهید و بهترین نتیجه را بگیرید.',
      image: '/assets/images/blog4.jpg',
      category: 'برنامه‌ریزی',
      author: 'سارا احمدی',
      date: '۱۴۰۴/۰۱/۰۸',
      readTime: '۴ دقیقه',
      tags: ['مدیریت زمان', 'امتحان', 'استرس']
    },
    {
      id: 5,
      title: 'آینده آموزش با واقعیت مجازی و افزوده',
      excerpt: 'واقعیت مجازی و افزوده چگونه کلاس‌های درس را متحول می‌کنند و تجربه یادگیری را بهبود می‌بخشند.',
      image: '/assets/images/blog5.jpg',
      category: 'فناوری',
      author: 'دکتر علی محمدی',
      date: '۱۴۰۴/۰۱/۰۵',
      readTime: '۸ دقیقه',
      tags: ['واقعیت مجازی', 'واقعیت افزوده', 'آموزش']
    },
    {
      id: 6,
      title: 'چگونه انگیزه مطالعه را در خود تقویت کنیم؟',
      excerpt: 'راه‌کارهای عملی برای افزایش انگیزه و لذت بردن از فرآیند یادگیری و مطالعه.',
      image: '/assets/images/blog6.jpg',
      category: 'انگیزه',
      author: 'مهسا کریمی',
      date: '۱۴۰۴/۰۱/۰۳',
      readTime: '۵ دقیقه',
      tags: ['انگیزه', 'مطالعه', 'یادگیری']
    }
  ];

  const categories = ['همه', 'هوش مصنوعی', 'مطالعه', 'آزمون', 'برنامه‌ریزی', 'فناوری', 'انگیزه'];

  const filteredPosts = posts.filter(post => {
    const matchCategory = activeCategory === 'همه' || post.category === activeCategory;
    const matchSearch = post.title.includes(searchTerm) || post.excerpt.includes(searchTerm) || post.tags.some(tag => tag.includes(searchTerm));
    return matchCategory && matchSearch;
  });

  return (
    <div className="blog-page">
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
              <Link to="/blog" className="active">وبلاگ</Link>
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
      <section className="blog-hero">
        <div className="container">
          <div className="blog-hero-content">
            <div className="hero-badge">📝 آخرین مطالب</div>
            <h1>وبلاگ <span className="gradient-text">آزمونیک</span></h1>
            <p>جدیدترین مطالب و مقالات آموزشی در حوزه یادگیری، هوش مصنوعی و تکنولوژی</p>
            <div className="blog-search">
              <FiSearch />
              <input
                type="text"
                placeholder="جستجوی مطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== Categories ========== */}
      <section className="blog-categories">
        <div className="container">
          <div className="categories-wrapper">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Blog Grid ========== */}
      <section className="blog-grid-section">
        <div className="container">
          {filteredPosts.length === 0 ? (
            <div className="no-results">
              <FiSearch size={48} />
              <h3>نتیجه‌ای یافت نشد</h3>
              <p>سعی کنید با کلمات دیگری جستجو کنید</p>
            </div>
          ) : (
            <>
              <div className="blog-grid">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="blog-card">
                    <div className="blog-image">
                      <div className="image-placeholder">{post.category}</div>
                      <span className="blog-category">{post.category}</span>
                    </div>
                    <div className="blog-content">
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <div className="blog-meta">
                        <span><FiUser /> {post.author}</span>
                        <span><FiCalendar /> {post.date}</span>
                        <span><FiClock /> {post.readTime}</span>
                      </div>
                      <div className="blog-tags">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="tag">#{tag}</span>
                        ))}
                      </div>
                      <Link to={`/blog/${post.id}`} className="read-more">
                        ادامه مطلب <FiArrowLeft />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========== Pagination ========== */}
              <div className="blog-pagination">
                <button className="pagination-btn"><FiChevronRight /></button>
                <button className="pagination-btn active">۱</button>
                <button className="pagination-btn">۲</button>
                <button className="pagination-btn">۳</button>
                <button className="pagination-btn"><FiChevronLeft /></button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========== Newsletter ========== */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-wrapper">
            <div className="newsletter-content">
              <h3>📬 عضویت در خبرنامه</h3>
              <p>با عضویت در خبرنامه، از جدیدترین مطالب و مقالات ما مطلع شوید</p>
              <div className="newsletter-form">
                <input type="email" placeholder="ایمیل خود را وارد کنید" />
                <button>عضویت</button>
              </div>
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
        /* ============================================
           استایل‌های کامل و حرفه‌ای BlogPage
           ============================================ */

        .blog-page {
          direction: rtl;
          font-family: 'Vazirmatn', 'IRANSans', sans-serif;
          background: #f8fafc;
          overflow-x: hidden;
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
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          transition: width 0.3s;
        }
        .main-nav a:hover::after,
        .main-nav a.active::after {
          width: 100%;
        }
        .main-nav a:hover { color: #2563eb; }
        .main-nav a.active { color: #2563eb; }

        .auth-buttons {
          display: flex;
          gap: 1rem;
        }
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
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37,99,235,0.3);
        }

        /* ---------- Hero ---------- */
        .blog-hero {
          padding: 140px 0 60px;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .blog-hero::before {
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

        .blog-hero-content {
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
          margin-bottom: 1rem;
        }
        .blog-hero-content h1 {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }
        .gradient-text {
          background: linear-gradient(135deg, #60a5fa, #c084fc);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .blog-hero-content p {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }
        .blog-search {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.08);
          border-radius: 3rem;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s;
        }
        .blog-search:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .blog-search svg {
          color: #94a3b8;
          margin-left: 0.75rem;
        }
        .blog-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 1rem;
          padding: 0.5rem 0;
          font-family: inherit;
        }
        .blog-search input::placeholder {
          color: #64748b;
        }

        /* ---------- Categories ---------- */
        .blog-categories {
          padding: 2rem 0;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 70px;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
        .categories-wrapper {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .category-btn {
          padding: 0.5rem 1.5rem;
          border-radius: 2rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .category-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
          transform: translateY(-2px);
        }
        .category-btn.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(37,99,235,0.3);
        }

        /* ---------- Blog Grid ---------- */
        .blog-grid-section {
          padding: 4rem 0;
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }
        .blog-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .blog-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        }
        .blog-image {
          position: relative;
          height: 220px;
          background: linear-gradient(135deg, #dbeafe, #ede9fe);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .image-placeholder {
          font-size: 3rem;
          font-weight: 700;
          color: #2563eb;
          opacity: 0.2;
        }
        .blog-category {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(10px);
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 2rem;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .blog-content {
          padding: 1.5rem;
        }
        .blog-content h3 {
          font-size: 1.2rem;
          color: #1e293b;
          margin-bottom: 0.75rem;
          line-height: 1.5;
          font-weight: 700;
        }
        .blog-content h3:hover {
          color: #2563eb;
        }
        .blog-content p {
          color: #64748b;
          line-height: 1.8;
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }
        .blog-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .blog-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .blog-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .tag {
          padding: 0.2rem 0.75rem;
          background: #f1f5f9;
          border-radius: 2rem;
          font-size: 0.7rem;
          color: #475569;
          transition: all 0.3s;
        }
        .tag:hover {
          background: #2563eb;
          color: white;
        }
        .read-more {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        .read-more:hover {
          gap: 1rem;
          color: #1d4ed8;
        }

        /* ---------- Pagination ---------- */
        .blog-pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 3rem;
        }
        .pagination-btn {
          padding: 0.5rem 1rem;
          min-width: 40px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pagination-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
          transform: translateY(-2px);
        }
        .pagination-btn.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(37,99,235,0.3);
        }

        /* ---------- No Results ---------- */
        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 24px;
        }
        .no-results svg {
          color: #94a3b8;
          margin-bottom: 1rem;
        }
        .no-results h3 {
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .no-results p {
          color: #94a3b8;
        }

        /* ---------- Newsletter ---------- */
        .newsletter-section {
          padding: 2rem 0 4rem;
        }
        .newsletter-wrapper {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 24px;
          padding: 3rem;
          text-align: center;
          color: white;
        }
        .newsletter-content h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .newsletter-content p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }
        .newsletter-form {
          display: flex;
          max-width: 450px;
          margin: 0 auto;
          gap: 0.75rem;
        }
        .newsletter-form input {
          flex: 1;
          padding: 0.75rem 1.25rem;
          border-radius: 2rem;
          border: none;
          font-size: 1rem;
          font-family: inherit;
          background: rgba(255,255,255,0.1);
          color: white;
          outline: none;
          transition: all 0.3s;
        }
        .newsletter-form input::placeholder {
          color: #94a3b8;
        }
        .newsletter-form input:focus {
          background: rgba(255,255,255,0.15);
        }
        .newsletter-form button {
          padding: 0.75rem 2rem;
          border-radius: 2rem;
          border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          white-space: nowrap;
        }
        .newsletter-form button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37,99,235,0.3);
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
        .footer-social a:hover {
          color: #60a5fa;
          transform: translateY(-2px);
        }
        .footer-col h4 {
          color: white;
          margin-bottom: 1rem;
        }
        .footer-col a {
          display: block;
          color: #94a3b8;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
        }
        .footer-col a:hover {
          color: #60a5fa;
          transform: translateX(-4px);
        }
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
          .blog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }
          .main-nav {
            display: none;
          }
          .blog-grid {
            grid-template-columns: 1fr;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .blog-hero-content h1 {
            font-size: 2rem;
          }
          .blog-hero-content p {
            font-size: 0.95rem;
          }
          .newsletter-form {
            flex-direction: column;
          }
          .newsletter-wrapper {
            padding: 2rem 1.5rem;
          }
          .categories-wrapper {
            gap: 0.5rem;
          }
          .category-btn {
            padding: 0.4rem 1rem;
            font-size: 0.75rem;
          }
        }
        @media (max-width: 480px) {
          .blog-card {
            border-radius: 16px;
          }
          .blog-image {
            height: 160px;
          }
          .blog-content {
            padding: 1rem;
          }
          .blog-content h3 {
            font-size: 1rem;
          }
          .blog-meta {
            font-size: 0.65rem;
            gap: 0.5rem;
          }
          .pagination-btn {
            min-width: 35px;
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogPage;