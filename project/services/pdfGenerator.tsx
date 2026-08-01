// services/pdfGenerator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// تبدیل اعداد به فارسی
const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// فرمت زمان
const formatTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return '۰ ثانیه';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${toPersianNumber(mins)} دقیقه و ${toPersianNumber(secs)} ثانیه`;
  return `${toPersianNumber(secs)} ثانیه`;
};

interface PDFData {
  examTitle: string;
  questions: any[];
  userAnswers: Record<string, any>;
  score: number;
  totalPoints: number;
  correctAnswersCount: number;
  scorePercentage: number;
  userName?: string;
  timeSpent?: number;
  questionAnalysis?: any[];
  strongTopics?: { topic: string; count: number }[];
  weakTopics?: { topic: string; count: number }[];
}

/**
 * تولید PDF کارنامه آزمون با استفاده از HTML2Canvas (پشتیبانی کامل از فارسی)
 */
export const generateExamPDF = async (data: PDFData): Promise<void> => {
  try {
    // ایجاد یک المنت موقتی برای رندر HTML
    const container = document.createElement('div');
    container.style.direction = 'rtl';
    container.style.fontFamily = 'Vazirmatn, IRANSans, Tahoma, sans-serif';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '30px';
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';
    container.style.borderRadius = '16px';
    
    // ========== ساخت HTML کارنامه ==========
    const getScoreColor = (percentage: number): string => {
      if (percentage >= 70) return '#10b981';
      if (percentage >= 50) return '#f59e0b';
      return '#ef4444';
    };

    const getPerformanceText = (percentage: number): string => {
      if (percentage >= 90) return 'عالی';
      if (percentage >= 75) return 'خیلی خوب';
      if (percentage >= 60) return 'خوب';
      if (percentage >= 45) return 'متوسط';
      if (percentage >= 25) return 'نیاز به تلاش';
      return 'ضعیف';
    };

    const wrongCount = data.questions.length - data.correctAnswersCount;
    const performanceText = getPerformanceText(data.scorePercentage);
    const scoreColor = getScoreColor(data.scorePercentage);
    
    container.innerHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @font-face {
            font-family: 'Vazirmatn';
            src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-Medium.ttf') format('truetype');
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Vazirmatn', 'IRANSans', Tahoma, sans-serif;
            background: white;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .header p {
            opacity: 0.9;
            font-size: 14px;
          }
          .info-bar {
            display: flex;
            justify-content: space-between;
            padding: 16px 24px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            flex-wrap: wrap;
            gap: 10px;
          }
          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #475569;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            padding: 24px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 16px;
            text-align: center;
            border-top: 4px solid;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .progress-section {
            padding: 0 24px 24px 24px;
          }
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #475569;
          }
          .progress-bar {
            height: 12px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            padding: 0 24px;
            margin: 20px 0 12px 0;
          }
          .topics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            padding: 0 24px 24px 24px;
          }
          .topics-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 16px;
          }
          .topics-card.strength h3 { color: #10b981; }
          .topics-card.weakness h3 { color: #ef4444; }
          .topics-card h3 {
            font-size: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .topic-list {
            list-style: none;
          }
          .topic-list li {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .topic-badge {
            background: white;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          }
          .questions-list {
            padding: 0 24px 24px 24px;
          }
          .question-item {
            background: #f8fafc;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 12px;
            border-right: 4px solid;
          }
          .question-item.correct { border-right-color: #10b981; background: #f0fdf4; }
          .question-item.wrong { border-right-color: #ef4444; background: #fef2f2; }
          .question-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .question-number {
            font-weight: 700;
            font-size: 14px;
          }
          .question-status {
            font-size: 12px;
            padding: 2px 10px;
            border-radius: 20px;
          }
          .question-status.correct { background: #d1fae5; color: #065f46; }
          .question-status.wrong { background: #fee2e2; color: #991b1b; }
          .question-text {
            font-size: 14px;
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .answer-row {
            font-size: 12px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(0,0,0,0.05);
          }
          .user-answer { color: #64748b; }
          .correct-answer { color: #10b981; margin-top: 4px; }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>📊 کارنامه آزمون</h1>
            <p>${data.examTitle || 'آزمون'}</p>
          </div>
          
          <div class="info-bar">
            <div class="info-item">👤 نام: ${data.userName || 'کاربر'}</div>
            <div class="info-item">📅 تاریخ: ${new Date().toLocaleDateString('fa-IR')}</div>
            ${data.timeSpent ? `<div class="info-item">⏱ زمان: ${formatTime(data.timeSpent)}</div>` : ''}
          </div>
          
          <div class="stats-grid">
            <div class="stat-card" style="border-top-color: #3b82f6">
              <div class="stat-value">${toPersianNumber(data.score)}/${toPersianNumber(data.totalPoints)}</div>
              <div class="stat-label">امتیاز</div>
            </div>
            <div class="stat-card" style="border-top-color: ${scoreColor}">
              <div class="stat-value">${toPersianNumber(data.scorePercentage)}%</div>
              <div class="stat-label">درصد موفقیت</div>
            </div>
            <div class="stat-card" style="border-top-color: #22c55e">
              <div class="stat-value">${toPersianNumber(data.correctAnswersCount)}</div>
              <div class="stat-label">پاسخ صحیح</div>
            </div>
            <div class="stat-card" style="border-top-color: #ef4444">
              <div class="stat-value">${toPersianNumber(wrongCount)}</div>
              <div class="stat-label">پاسخ غلط</div>
            </div>
          </div>
          
          <div class="progress-section">
            <div class="progress-label">
              <span>عملکرد کلی</span>
              <span style="color: ${scoreColor}">${performanceText}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${data.scorePercentage}%; background: ${scoreColor}"></div>
            </div>
          </div>
          
          ${(data.strongTopics?.length || 0) > 0 || (data.weakTopics?.length || 0) > 0 ? `
          <div class="section-title">📈 تحلیل عملکرد</div>
          <div class="topics-grid">
            ${(data.strongTopics?.length || 0) > 0 ? `
            <div class="topics-card strength">
              <h3>✅ نقاط قوت</h3>
              <ul class="topic-list">
                ${data.strongTopics!.map(t => `
                  <li><span>${t.topic}</span><span class="topic-badge" style="color:#10b981">${toPersianNumber(t.count)} صحیح</span></li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
            ${(data.weakTopics?.length || 0) > 0 ? `
            <div class="topics-card weakness">
              <h3>📚 نیاز به تمرین</h3>
              <ul class="topic-list">
                ${data.weakTopics!.map(t => `
                  <li><span>${t.topic}</span><span class="topic-badge" style="color:#ef4444">${toPersianNumber(t.count)} غلط</span></li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="section-title">📝 پاسخ‌های شما</div>
          <div class="questions-list">
            ${data.questionAnalysis?.map((q, idx) => `
              <div class="question-item ${q.isCorrect ? 'correct' : 'wrong'}">
                <div class="question-header">
                  <span class="question-number">سوال ${toPersianNumber(idx + 1)}</span>
                  <span class="question-status ${q.isCorrect ? 'correct' : 'wrong'}">${q.isCorrect ? '✓ صحیح' : '✗ غلط'}</span>
                </div>
                <div class="question-text">${q.prompt || ''}</div>
                <div class="answer-row user-answer">📝 پاسخ شما: ${q.userAnswerText || 'پاسخی ثبت نشده'}</div>
                ${!q.isCorrect ? `<div class="answer-row correct-answer">✅ پاسخ صحیح: ${q.correctAnswerText || ''}</div>` : ''}
              </div>
            `).join('') || '<div style="text-align:center; padding:40px;">هیچ سوالی یافت نشد</div>'}
          </div>
          
          <div class="footer">
            تولید شده توسط آزمونیک - پلتفرم هوشمند آزمون‌سازی
          </div>
        </div>
      </body>
      </html>
    `;
    
    document.body.appendChild(container);
    
    // تبدیل HTML به تصویر
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    
    // حذف المنت موقتی
    document.body.removeChild(container);
    
    // ایجاد PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    
    // ذخیره PDF
    const fileName = `کارنامه_${data.userName || 'کاربر'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ PDF با موفقیت تولید شد:', fileName);
  } catch (error: any) {
    console.error('❌ خطا در تولید PDF:', error);
    throw new Error('خطا در تولید PDF. لطفاً دوباره تلاش کنید.');
  }
};

export default { generateExamPDF };