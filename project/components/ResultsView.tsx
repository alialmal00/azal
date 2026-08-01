// components/ResultsView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import type { GeminiResponse, UserAnswers } from '../types';
import { generateExamPDF } from '../services/pdfGenerator';
import { examStorageService } from '../services/examStorageService';
import api from '../services/api';
import {
  Award, Lightbulb, Download, RefreshCw,
  CheckCircle, XCircle, Star, AlertCircle,
  BookOpen, Clock, Target, Timer,
  Medal, ThumbsUp, Smile, Frown,
  ChartBar, FileText, Save, TrendingUp, TrendingDown,
  Zap, Brain, Sparkles, BarChart3, PieChart, Activity
} from 'lucide-react';
import '../styles/results.css';

interface Props {
  response: GeminiResponse;
  userAnswers: UserAnswers;
  userName?: string;
  onRestart: () => void;
  timeSpent?: number;
  examDuration?: number;
  savedExamId?: number | null; // ✅ اضافه شد
}

const ResultsView: React.FC<Props> = ({ 
  response, 
  userAnswers, 
  userName, 
  onRestart, 
  timeSpent = 0, 
  examDuration = 30,
  savedExamId = null 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedId, setSavedId] = useState<number | null>(savedExamId);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'feedback'>('overview');
  const { exam } = response;

  // ========== محاسبات ==========
  const results = useMemo(() => {
    let score = 0;
    let totalPoints = 0;
    let correctAnswersCount = 0;
    const weakMap = new Map<string, number>();
    const strongMap = new Map<string, number>();
    
    const analysis = exam.questions.map((q, idx) => {
      totalPoints += q.points || 1;
      const userAnswer = userAnswers[q.q_id];
      let isCorrect = false;
      let userAnswerText = '';
      let correctAnswerText = '';

      switch (q.type) {
        case 'mcq': 
        case 'tf':
          const correctOpt = q.options?.find(o => o.is_correct);
          correctAnswerText = correctOpt?.text || '';
          const selectedOpt = q.options?.find(o => o.id === userAnswer);
          userAnswerText = selectedOpt?.text || 'بدون پاسخ';
          isCorrect = correctOpt?.id === userAnswer;
          break;
        case 'fitb': 
        case 'short':
          correctAnswerText = q.correct_answer || '';
          userAnswerText = userAnswer?.toString() || 'بدون پاسخ';
          isCorrect = typeof userAnswer === 'string' && 
                     userAnswer.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
          break;
        default:
          isCorrect = false;
          userAnswerText = 'پاسخ نامشخص';
          correctAnswerText = 'پاسخ نامشخص';
      }

      if (isCorrect) { 
        score += q.points || 1; 
        correctAnswersCount++; 
      }
      
      if (q.concept_tags && Array.isArray(q.concept_tags)) {
        q.concept_tags.forEach(tag => {
          if (isCorrect) strongMap.set(tag, (strongMap.get(tag) || 0) + 1);
          else weakMap.set(tag, (weakMap.get(tag) || 0) + 1);
        });
      }
      
      return { 
        ...q, 
        userAnswer, 
        userAnswerText, 
        correctAnswerText, 
        isCorrect, 
        index: idx + 1 
      };
    });
    
    const wrongAnswersCount = exam.questions.length - correctAnswersCount;
    const scorePercentageValue = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    // تعیین سطح عملکرد
    let performanceLevel = '';
    let performanceMessage = '';
    let performanceColor = '';
    
    if (scorePercentageValue >= 90) {
      performanceLevel = 'عالی';
      performanceMessage = 'شگفت‌انگیز! شما تسلط کامل بر مباحث دارید. این نتیجه نشان‌دهنده آمادگی بالای شماست.';
      performanceColor = '#10b981';
    } else if (scorePercentageValue >= 75) {
      performanceLevel = 'خیلی خوب';
      performanceMessage = 'عملکرد بسیار خوبی داشتید! با کمی تمرین بیشتر می‌توانید به تسلط کامل برسید.';
      performanceColor = '#3b82f6';
    } else if (scorePercentageValue >= 60) {
      performanceLevel = 'خوب';
      performanceMessage = 'نتیجه قابل قبولی دارید. روی نقاط ضعف خود تمرکز کنید تا پیشرفت کنید.';
      performanceColor = '#8b5cf6';
    } else if (scorePercentageValue >= 45) {
      performanceLevel = 'متوسط';
      performanceMessage = 'نیاز به تمرین بیشتر دارید. مباحثی که مشکل داشتید را مرور کنید.';
      performanceColor = '#f59e0b';
    } else if (scorePercentageValue >= 25) {
      performanceLevel = 'نیاز به تلاش';
      performanceMessage = 'توصیه می‌کنم مباحث را از پایه مرور کنید و دوباره تلاش کنید.';
      performanceColor = '#ef4444';
    } else {
      performanceLevel = 'ضعیف';
      performanceMessage = 'برای موفقیت نیاز به مطالعه جدی‌تری دارید. از منابع کمک آموزشی استفاده کنید.';
      performanceColor = '#dc2626';
    }
    
    // تولید توصیه‌های شخصی‌سازی شده
    const recommendations: string[] = [];
    if (scorePercentageValue < 50) {
      recommendations.push('📚 مباحث پایه را مرور کنید');
      recommendations.push('🎯 از آزمون‌های آسان‌تر شروع کنید');
      recommendations.push('⏰ زمان مطالعه خود را افزایش دهید');
    } else if (scorePercentageValue < 75) {
      recommendations.push('🎯 روی مباحث ضعیف تمرکز کنید');
      recommendations.push('✏️ تمرین‌های بیشتری حل کنید');
      recommendations.push('👨‍🏫 از منابع کمک آموزشی استفاده کنید');
    } else {
      recommendations.push('🚀 سطح دشواری را افزایش دهید');
      recommendations.push('🏆 آزمون‌های زمان‌دار بیشتری بدهید');
      recommendations.push('📖 مباحث پیشرفته را شروع کنید');
    }
    
    const weakTopicsArray = [...weakMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => ({ topic: t, count: c }))
      .slice(0, 5);
      
    const strongTopicsArray = [...strongMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => ({ topic: t, count: c }))
      .slice(0, 5);
    
    if (weakTopicsArray.length > 0) {
      recommendations.push(`🔍 روی مباحث ${weakTopicsArray.slice(0, 2).map(t => t.topic).join(' و ')} بیشتر کار کنید`);
    }
    
    return {
      score,
      totalPoints,
      correctAnswersCount,
      wrongAnswersCount,
      scorePercentage: scorePercentageValue,
      weakTopics: weakTopicsArray,
      strongTopics: strongTopicsArray,
      questionAnalysis: analysis,
      performanceLevel,
      performanceMessage,
      performanceColor,
      recommendations
    };
  }, [exam, userAnswers]);

  // ============================================
  // ✅ تکمیل و ذخیره آزمون در سرور
  // ============================================
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // اگر قبلاً ذخیره شده، فقط تکمیل کن
      if (savedId) {
        const response = await api.post(`/exams/${savedId}/complete`, {
          userAnswers,
          timeSpent,
          results: {
            score: results.score,
            totalPoints: results.totalPoints,
            scorePercentage: results.scorePercentage,
            correctAnswersCount: results.correctAnswersCount,
            wrongAnswersCount: results.wrongAnswersCount,
            totalQuestions: exam.questions.length
          }
        });

        if (response.data.success) {
          setSaveMessage({ type: 'success', text: '✅ آزمون با موفقیت ثبت شد' });
          setSavedId(response.data.data.examId);
        } else {
          setSaveMessage({ type: 'error', text: response.data.message || '❌ خطا در ثبت آزمون' });
        }
      } else {
        // ذخیره کامل آزمون
        const result = await examStorageService.saveExam(
          exam,
          userAnswers,
          { 
            exam_type: exam.type || 'ترکیبی', 
            difficulty: exam.difficulty || 'متوسط', 
            num_questions: exam.questions.length, 
            user_name: userName || 'کاربر', 
            source_text: '', 
            exam_duration: examDuration 
          },
          { 
            score: results.score, 
            totalPoints: results.totalPoints, 
            scorePercentage: results.scorePercentage, 
            correctAnswersCount: results.correctAnswersCount, 
            wrongAnswersCount: results.wrongAnswersCount, 
            examTitle: exam.title || 'آزمون', 
            timeSpent 
          }
        );

        if (result.success) { 
          setSavedId(result.examId); 
          setSaveMessage({ type: 'success', text: '✅ آزمون با موفقیت ذخیره شد' });
        } else {
          setSaveMessage({ type: 'error', text: result.message || '❌ خطا در ذخیره آزمون' });
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: error.response?.data?.message || '❌ خطا در ذخیره آزمون' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // ============================================
  // 📄 دانلود PDF
  // ============================================
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generateExamPDF({
        examTitle: exam.title, 
        questions: exam.questions,
        userAnswers, 
        score: results.score, 
        totalPoints: results.totalPoints, 
        correctAnswersCount: results.correctAnswersCount,
        scorePercentage: results.scorePercentage, 
        userName, 
        timeSpent, 
        examDuration,
        questionAnalysis: results.questionAnalysis, 
        strongTopics: results.strongTopics, 
        weakTopics: results.weakTopics
      });
      setSaveMessage({ type: 'success', text: '✅ PDF با موفقیت دانلود شد' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('PDF download error:', error);
      setSaveMessage({ type: 'error', text: '❌ خطا در دانلود PDF' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================
  // 🔄 ذخیره خودکار در پس‌زمینه
  // ============================================
  useEffect(() => {
    // اگر savedId وجود نداشته باشه، خودکار ذخیره کن
    if (!savedId) {
      const autoSave = async () => {
        try {
          const result = await examStorageService.saveExam(
            exam,
            userAnswers,
            { 
              exam_type: exam.type || 'ترکیبی', 
              difficulty: exam.difficulty || 'متوسط', 
              num_questions: exam.questions.length, 
              user_name: userName || 'کاربر', 
              source_text: '', 
              exam_duration: examDuration 
            },
            { 
              score: results.score, 
              totalPoints: results.totalPoints, 
              scorePercentage: results.scorePercentage, 
              correctAnswersCount: results.correctAnswersCount, 
              wrongAnswersCount: results.wrongAnswersCount, 
              examTitle: exam.title || 'آزمون', 
              timeSpent 
            }
          );

          if (result.success) { 
            setSavedId(result.examId); 
            console.log('✅ Auto-saved exam with ID:', result.examId);
          }
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      };

      autoSave();
    }
  }, []); // فقط یک بار اجرا بشه

  // ============================================
  // 🎨 رندر
  // ============================================
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins} دقیقه و ${secs} ثانیه`;
    return `${secs} ثانیه`;
  };

  const getScoreEmoji = () => {
    if (results.scorePercentage >= 90) return '🏆';
    if (results.scorePercentage >= 75) return '🎉';
    if (results.scorePercentage >= 60) return '👍';
    if (results.scorePercentage >= 45) return '📘';
    if (results.scorePercentage >= 25) return '⚠️';
    return '📚';
  };

  return (
    <div className="results-container">
      {/* Toast پیام */}
      {saveMessage && (
        <div className={`results-toast ${saveMessage.type}`}>
          {saveMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Hero Section - کارت اصلی نتیجه */}
      <div className="results-hero">
        <div className="hero-content">
          <div className="hero-icon-wrapper" style={{ background: `linear-gradient(135deg, ${results.performanceColor}, ${results.performanceColor}dd)` }}>
            {getScoreEmoji() === '🏆' ? <Medal size={32} /> :
             getScoreEmoji() === '🎉' ? <Sparkles size={32} /> :
             getScoreEmoji() === '👍' ? <ThumbsUp size={32} /> :
             getScoreEmoji() === '📘' ? <BookOpen size={32} /> :
             getScoreEmoji() === '⚠️' ? <AlertCircle size={32} /> :
             <Brain size={32} />}
          </div>
          <div className="hero-text">
            <h1 style={{ color: results.performanceColor }}>{results.performanceLevel}</h1>
            <p>{results.performanceMessage}</p>
          </div>
        </div>
        <div className="hero-score">
          <div className="score-circle">
            <svg className="score-ring-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
              <circle 
                cx="60" cy="60" r="50" fill="none" 
                stroke={results.performanceColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${results.scorePercentage * 3.14} 314`} 
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 1.5s ease' }}
              />
            </svg>
            <div className="score-inner">
              <span className="score-number">{results.scorePercentage}</span>
              <span className="score-symbol">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* نوار اطلاعات */}
      <div className="results-info-bar">
        <div className="info-item"><BookOpen size={16} /><span>{exam.title || 'آزمون'}</span></div>
        <div className="info-item"><Clock size={16} /><span>{formatTime(timeSpent)}</span></div>
        <div className="info-item"><Target size={16} /><span>{results.score}/{results.totalPoints} امتیاز</span></div>
        <div className="info-item"><Zap size={16} /><span>{results.correctAnswersCount}/{exam.questions.length} صحیح</span></div>
      </div>

      {/* کارت‌های آمار پیشرفته */}
      <div className="results-stats-grid">
        <div className="stat-mini-card">
          <div className="stat-mini-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <CheckCircle size={20} />
          </div>
          <span className="stat-mini-value">{results.correctAnswersCount}</span>
          <span className="stat-mini-label">پاسخ صحیح</span>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <XCircle size={20} />
          </div>
          <span className="stat-mini-value">{results.wrongAnswersCount}</span>
          <span className="stat-mini-label">پاسخ غلط</span>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <Star size={20} />
          </div>
          <span className="stat-mini-value">{(results.score / exam.questions.length).toFixed(1)}</span>
          <span className="stat-mini-label">میانگین امتیاز</span>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
            <Timer size={20} />
          </div>
          <span className="stat-mini-value">{formatTime(timeSpent)}</span>
          <span className="stat-mini-label">زمان سپری شده</span>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="results-tabs">
        <button className={`results-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <ChartBar size={16} /> نمای کلی
        </button>
        <button className={`results-tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
          <FileText size={16} /> پاسخ‌ها
        </button>
        <button className={`results-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
          <Brain size={16} /> تحلیل هوشمند
        </button>
      </div>

      {/* ========== تب نمای کلی ========== */}
      {activeTab === 'overview' && (
        <div className="tab-content-wrapper">
          {/* نقاط قوت و ضعف */}
          <div className="analysis-columns">
            <div className="analysis-card strengths">
              <h3><CheckCircle size={18} /> نقاط قوت</h3>
              {results.strongTopics.length > 0 ? (
                <ul className="analysis-list">
                  {results.strongTopics.map((t, i) => (
                    <li key={i}>
                      <span>{t.topic}</span>
                      <span className="analysis-badge">{t.count} صحیح</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="empty-text">✨ هنوز نقطه قوتی شناسایی نشده است</p>}
            </div>
            <div className="analysis-card weaknesses">
              <h3><AlertCircle size={18} /> نیاز به تمرین</h3>
              {results.weakTopics.length > 0 ? (
                <ul className="analysis-list">
                  {results.weakTopics.map((t, i) => (
                    <li key={i}>
                      <span>{t.topic}</span>
                      <span className="analysis-badge">{t.count} غلط</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="empty-text">🎉 عالی! همه مباحث را به خوبی掌握了‌اید</p>}
            </div>
          </div>

          {/* نمودار عملکرد */}
          <div className="mini-chart-card">
            <h3>📈 نمودار عملکرد شما</h3>
            <div className="chart-row">
              <div className="chart-track">
                <div className="chart-fill-bar" style={{ width: `${results.scorePercentage}%`, background: results.performanceColor }} />
              </div>
              <span className="chart-percent">{results.scorePercentage}%</span>
            </div>
            <div className="chart-range">
              <span>۰٪</span>
              <span>۲۵٪</span>
              <span>۵۰٪</span>
              <span>۷۵٪</span>
              <span>۱۰۰٪</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== تب پاسخ‌ها ========== */}
      {activeTab === 'details' && (
        <div className="tab-content-wrapper">
          {results.questionAnalysis.map((q) => (
            <div key={q.q_id} className={`answer-item ${q.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="answer-item-header">
                <span className="answer-number">سوال {q.index}</span>
                <span className={`answer-status-badge ${q.isCorrect ? 'correct' : 'wrong'}`}>
                  {q.isCorrect ? '✓ صحیح' : '✗ غلط'}
                </span>
              </div>
              <p className="answer-question-text">{q.prompt}</p>
              <div className="answer-compare">
                <div className="answer-box">
                  <span className="answer-label">پاسخ شما:</span>
                  <span className={`answer-value ${q.isCorrect ? 'text-green' : 'text-red'}`}>{q.userAnswerText}</span>
                </div>
                {!q.isCorrect && (
                  <div className="answer-box">
                    <span className="answer-label">پاسخ صحیح:</span>
                    <span className="answer-value text-green">{q.correctAnswerText}</span>
                  </div>
                )}
              </div>
              {q.concept_tags && q.concept_tags.length > 0 && (
                <div className="question-tags">
                  {q.concept_tags.map((tag, idx) => (
                    <span key={idx} className="concept-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========== تب تحلیل هوشمند ========== */}
      {activeTab === 'feedback' && (
        <div className="tab-content-wrapper feedback-tab">
          {/* ارزیابی سطح */}
          <div className="feedback-card level-card" style={{ borderRightColor: results.performanceColor }}>
            <div className="feedback-card-icon">
              <Activity size={28} style={{ color: results.performanceColor }} />
            </div>
            <div className="feedback-card-content">
              <h3>سطح عملکرد: {results.performanceLevel}</h3>
              <p>{results.performanceMessage}</p>
            </div>
          </div>

          {/* توصیه‌های شخصی‌سازی شده */}
          <div className="feedback-card recommendations-card">
            <div className="feedback-card-icon">
              <Lightbulb size={28} style={{ color: '#f59e0b' }} />
            </div>
            <div className="feedback-card-content">
              <h3>💡 توصیه‌های هوشمند</h3>
              <ul className="recommendations-list">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* تحلیل دقیق */}
          <div className="feedback-card analysis-card">
            <div className="feedback-card-icon">
              <Brain size={28} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="feedback-card-content">
              <h3>🧠 تحلیل عمیق</h3>
              <div className="analysis-text">
                <p>شما از مجموع {exam.questions.length} سوال، {results.correctAnswersCount} سوال را پاسخ صحیح داده‌اید.</p>
                {results.weakTopics.length > 0 && (
                  <p>مباحث <strong>{results.weakTopics.map(t => t.topic).join('، ')}</strong> نیاز به تمرین بیشتری دارند.</p>
                )}
                {results.strongTopics.length > 0 && (
                  <p>در مباحث <strong>{results.strongTopics.map(t => t.topic).join('، ')}</strong> تسلط خوبی دارید.</p>
                )}
                <p className="motivation-text">
                  {results.scorePercentage >= 75 ? '🌟 عالی ادامه بده!' : 
                   results.scorePercentage >= 50 ? '📈 با کمی تمرین بیشتر به نتیجه عالی می‌رسی!' : 
                   '💪 ناامید نشو! با تمرین بیشتر موفق می‌شوی.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* دکمه‌های اقدام */}
      <div className="results-actions">
        <button className="btn-save-exam" onClick={handleSave} disabled={isSaving || !!savedId}>
          {isSaving ? <div className="btn-spinner" /> : <Save size={18} />}
          {savedId ? '✓ ذخیره شد' : isSaving ? 'در حال ذخیره...' : '💾 ذخیره آزمون'}
        </button>
        <button className="btn-download-pdf" onClick={handleDownloadPDF} disabled={isDownloading}>
          {isDownloading ? <div className="btn-spinner" /> : <Download size={18} />}
          {isDownloading ? 'در حال دانلود...' : '📄 دانلود PDF'}
        </button>
        <button className="btn-new-exam" onClick={onRestart}>
          <RefreshCw size={18} /> ✨ آزمون جدید
        </button>
      </div>

      <style>{`
        /* استایل‌های اضافی برای تب تحلیل */
        .feedback-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feedback-card {
          display: flex;
          gap: 18px;
          padding: 20px;
          background: white;
          border-radius: 20px;
          border-right: 4px solid;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .feedback-card:hover {
          transform: translateX(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .feedback-card-icon {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 16px;
        }

        .feedback-card-content {
          flex: 1;
        }

        .feedback-card-content h3 {
          margin: 0 0 8px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .feedback-card-content p {
          margin: 0;
          color: #475569;
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .recommendations-list {
          margin: 0;
          padding-right: 20px;
          color: #475569;
          line-height: 1.8;
          font-size: 0.9rem;
        }

        .recommendations-list li {
          margin-bottom: 6px;
        }

        .analysis-text p {
          margin-bottom: 12px;
        }

        .analysis-text strong {
          color: #1e293b;
        }

        .motivation-text {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-weight: 500;
          color: #2563eb !important;
        }

        .question-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .concept-tag {
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #475569;
        }

        @media (max-width: 768px) {
          .feedback-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsView;