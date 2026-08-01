// components/ExamView.tsx
import React, { useState, useEffect } from 'react';
import type { Exam, UserAnswers, Question as QuestionType } from '../types';
import { 
  Check, ArrowLeft, ArrowRight, Clock, AlertCircle, 
  Timer, BookOpen, HelpCircle, ChevronLeft, ChevronRight, Star,
  Send, AlertTriangle, X
} from 'lucide-react';

interface Props {
  examData: Exam;
  onSubmit: (answers: UserAnswers, timeSpent: number) => void;
  duration?: number;
  limits?: {
    maxQuestions: number;
  };
}

const QuestionCard: React.FC<{ 
  question: QuestionType; 
  questionNumber: number;
  totalQuestions: number;
  userAnswer: any; 
  onAnswer: (answer: any) => void; 
}> = ({ question, questionNumber, totalQuestions, userAnswer, onAnswer }) => {
    const getTypeLabel = (type: string) => {
      const types: Record<string, string> = {
        'mcq': 'چهارگزینه‌ای',
        'tf': 'درست/نادرست',
        'fitb': 'جای‌خالی',
        'short': 'پاسخ کوتاه'
      };
      return types[type] || type;
    };

    const getDifficultyLabel = (difficulty: number) => {
      if (difficulty <= 2) return { text: 'آسان', color: '#10B981', bg: '#D1FAE5' };
      if (difficulty <= 3) return { text: 'متوسط', color: '#F59E0B', bg: '#FEF3C7' };
      return { text: 'سخت', color: '#EF4444', bg: '#FEE2E2' };
    };

    const difficulty = getDifficultyLabel(question.difficulty || 3);

    const renderInput = () => {
      switch (question.type) {
        case 'mcq':
        case 'tf':
          return (
            <div className="options-container">
              {question.options?.map((opt, idx) => {
                const isSelected = userAnswer === opt.id;
                const optionLetter = String.fromCharCode(65 + idx);
                return (
                  <label 
                    key={opt.id} 
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={question.q_id}
                      value={opt.id}
                      checked={isSelected}
                      onChange={(e) => onAnswer(e.target.value)}
                      className="hidden-radio"
                    />
                    <div className="option-marker">{optionLetter}</div>
                    <div className="option-content">
                      <span className="option-text">{opt.text}</span>
                    </div>
                    <div className={`option-check ${isSelected ? 'visible' : ''}`}>
                      <Check size={18} />
                    </div>
                  </label>
                );
              })}
            </div>
          );
          
        case 'fitb':
        case 'short':
          return (
            <div className="text-input-wrapper">
              <textarea
                value={userAnswer || ''}
                onChange={(e) => onAnswer(e.target.value)}
                className="answer-textarea"
                placeholder="✍️ پاسخ خود را اینجا بنویسید..."
                rows={4}
                dir="rtl"
              />
              <div className="char-count">
                {(userAnswer || '').length} کاراکتر
              </div>
            </div>
          );
          
        default:
          return null;
      }
    };

    return (
      <div className="question-master-card">
        <div className="question-top-bar">
          <div className="question-meta">
            <div className="meta-item">
              <BookOpen size={14} />
              <span>سوال {questionNumber} از {totalQuestions}</span>
            </div>
            <div className="meta-item">
              <HelpCircle size={14} />
              <span>{getTypeLabel(question.type)}</span>
            </div>
          </div>
          
          <div className="question-tags">
            <span 
              className="difficulty-badge"
              style={{ 
                color: difficulty.color, 
                backgroundColor: difficulty.bg 
              }}
            >
              {difficulty.text}
            </span>
            <span className="points-badge">
              <Star size={12} />
              {question.points || 1} امتیاز
            </span>
          </div>
        </div>

        <div className="question-body">
          <p className="question-prompts">{question.prompt}</p>
          
          {question.concept_tags && question.concept_tags.length > 0 && (
            <div className="concept-tags">
              {question.concept_tags.map((tag, idx) => (
                <span key={idx} className="concept-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="question-input-section">
          {renderInput()}
        </div>
      </div>
    );
};

const ExamView: React.FC<Props> = ({ examData, onSubmit, duration = 30, limits }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [startTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{ score: number; total: number; percentage: number; correctCount: number; wrongCount: number } | null>(null);

  // محدودیت تعداد سوالات
  const maxQuestions = limits?.maxQuestions || 5;
  const totalQuestions = examData.questions.length;

  // اگر تعداد سوالات بیشتر از حد مجاز باشه
  if (totalQuestions > maxQuestions) {
    return (
      <div className="exam-limit-error">
        <AlertCircle size={48} />
        <h3>⚠️ تعداد سوالات بیشتر از حد مجاز</h3>
        <p>
          این آزمون {totalQuestions} سوال دارد، اما پلن شما اجازه {maxQuestions} سوال را می‌دهد.
        </p>
        <button onClick={() => window.location.href = '/dashboard/subscription'}>
          ارتقا اشتراک
        </button>
        <button onClick={() => window.history.back()}>
          بازگشت
        </button>
        <style>{`
          .exam-limit-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
            gap: 16px;
            min-height: 400px;
          }
          .exam-limit-error h3 {
            color: #ef4444;
            margin: 0;
          }
          .exam-limit-error p {
            color: #64748b;
            max-width: 400px;
          }
          .exam-limit-error button {
            padding: 10px 24px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
          }
          .exam-limit-error button:first-of-type {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
          }
          .exam-limit-error button:last-of-type {
            background: #e2e8f0;
            color: #475569;
          }
        `}</style>
      </div>
    );
  }

  // تایمر
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleAutoSubmit = () => {
    if (!isSubmitted) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = examData.questions.length;
      
      if (answeredCount < totalQuestions) {
        setShowConfirmModal(true);
      } else {
        finishExam(timeSpent);
      }
    }
  };

  const finishExam = (timeSpent: number) => {
    setIsSubmitted(true);
    
    let score = 0;
    let totalPoints = 0;
    let correctCount = 0;
    let wrongCount = 0;
    
    examData.questions.forEach(question => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.q_id];
      let isCorrect = false;
      
      switch (question.type) {
        case 'mcq':
        case 'tf':
          const correctOption = question.options?.find(o => o.is_correct);
          isCorrect = correctOption?.id === userAnswer;
          break;
        case 'fitb':
        case 'short':
          isCorrect = typeof userAnswer === 'string' && 
                     userAnswer.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();
          break;
      }
      
      if (isCorrect) {
        score += question.points || 1;
        correctCount++;
      } else {
        wrongCount++;
      }
    });
    
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    setResultData({ score, total: totalPoints, percentage, correctCount, wrongCount });
    setShowResultModal(true);
  };

  const handleAnswer = (answer: string | boolean) => {
    const currentQuestionId = examData.questions[currentQuestionIndex].q_id;
    setAnswers(prev => ({ ...prev, [currentQuestionId]: answer }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitClick = () => {
    const unansweredCount = examData.questions.filter(q => !answers.hasOwnProperty(q.q_id)).length;
    if (unansweredCount > 0) {
      setShowConfirmModal(true);
    } else {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      finishExam(timeSpent);
    }
  };

  const handleSubmitExam = () => {
    if (isSubmitted) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    finishExam(timeSpent);
    setShowConfirmModal(false);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onSubmit(answers, timeSpent);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const getTimerStatus = () => {
    if (timeLeft < 60) return 'critical';
    if (timeLeft < 300) return 'warning';
    return 'normal';
  };

  const timerStatus = getTimerStatus();
  const unansweredCount = totalQuestions - answeredCount;

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { title: 'عالی!', message: 'شگفت‌انگیز! شما تسلط کامل بر مباحث دارید.', color: '#10b981', icon: '🏆' };
    if (percentage >= 75) return { title: 'خیلی خوب!', message: 'عملکرد بسیار خوبی داشتید. با کمی تمرین به تسلط کامل می‌رسید.', color: '#3b82f6', icon: '🎉' };
    if (percentage >= 60) return { title: 'خوب!', message: 'نتیجه قابل قبول. روی نقاط ضعف تمرکز کنید.', color: '#8b5cf6', icon: '👍' };
    if (percentage >= 45) return { title: 'متوسط', message: 'نیاز به تمرین بیشتر دارید. می‌توانید بهتر از این باشید.', color: '#f59e0b', icon: '📚' };
    if (percentage >= 25) return { title: 'نیاز به تلاش', message: 'توصیه می‌کنم مباحث را مرور کنید و دوباره تلاش کنید.', color: '#ef4444', icon: '💪' };
    return { title: 'نیاز به تمرین', message: 'ناامید نشوید! با مطالعه بیشتر موفق می‌شوید.', color: '#dc2626', icon: '📖' };
  };

  const performance = getPerformanceMessage(resultData?.percentage || 0);

  // ... بقیه کد ExamView به همان صورت قبلی ...

  return (
    <div className="exam-container">
      {/* هدر آزمون */}
      <div className="exam-header-card">
        <div className="exam-title-section">
          <h1 className="exam-title">{examData.title || 'آزمون'}</h1>
          <div className="exam-stats-row">
            <div className="stat-chip">
              <BookOpen size={14} />
              <span>{totalQuestions} سوال</span>
            </div>
            <div className="stat-chip answered">
              <Check size={14} />
              <span>{answeredCount} پاسخ داده شده</span>
            </div>
            {unansweredCount > 0 && (
              <div className="stat-chip unanswered">
                <AlertCircle size={14} />
                <span>{unansweredCount} باقی‌مانده</span>
              </div>
            )}
          </div>
        </div>

        {/* تایمر */}
        <div className={`timer-widget ${timerStatus}`}>
          <div className="timer-icon">
            <Clock size={20} />
          </div>
          <div className="timer-display">
            <span className="timer-value">{formatTime(timeLeft)}</span>
            <span className="timer-label">زمان باقی‌مانده</span>
          </div>
        </div>
      </div>

      {/* نوار پیشرفت */}
      <div className="progress-section">
        <div className="progress-info">
          <span>پیشرفت آزمون</span>
          <span className="progress-percent">{progressPercentage}%</span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* هشدار زمان کم */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className={`time-warning ${timerStatus}`}>
          <AlertTriangle size={18} />
          <span>
            {timeLeft < 60 
              ? `⚠️ فقط ${formatTime(timeLeft)} زمان باقی‌مانده!` 
              : `⏰ ${formatTime(timeLeft)} تا پایان آزمون فرصت دارید`
            }
          </span>
        </div>
      )}

      {/* کارت سوال */}
      <QuestionCard
        question={examData.questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        userAnswer={answers[examData.questions[currentQuestionIndex].q_id]}
        onAnswer={handleAnswer}
      />

      {/* دکمه‌های ناوبری */}
      <div className="navigation-buttons">
        <button
          onClick={goToPrev}
          disabled={currentQuestionIndex === 0 || isSubmitted}
          className="nav-btn prev-btn"
        >
          <ChevronRight size={20} />
          <span>قبلی</span>
        </button>

        <div className="nav-center">
          <div className="question-dots">
            {examData.questions.map((q, index) => {
              const isAnswered = answers.hasOwnProperty(q.q_id);
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={index}
                  onClick={() => !isSubmitted && setCurrentQuestionIndex(index)}
                  disabled={isSubmitted}
                  className={`question-dot ${
                    isCurrent ? 'current' : isAnswered ? 'answered' : ''
                  }`}
                  title={`سوال ${index + 1}${isAnswered ? ' - پاسخ داده شده' : ''}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmitClick}
            disabled={isSubmitted}
            className="submit-btn"
          >
            <Send size={18} />
            <span>پایان آزمون</span>
          </button>
        ) : (
          <button
            onClick={goToNext}
            disabled={isSubmitted}
            className="nav-btn next-btn"
          >
            <span>بعدی</span>
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* مودال تأیید پایان */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning">
              <AlertCircle size={48} />
            </div>
            <h3>پایان آزمون</h3>
            <p className="modal-message">
              شما به <strong>{unansweredCount} سوال</strong> پاسخ نداده‌اید.
            </p>
            <p className="modal-hint">
              آیا مطمئن هستید که می‌خواهید آزمون را به پایان برسانید?
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                بازگشت به آزمون
              </button>
              <button 
                className="modal-btn submit-btn-modal"
                onClick={handleSubmitExam}
              >
                ثبت نهایی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال نتیجه */}
      {showResultModal && resultData && (
        <div className="modal-overlay">
          <div className="result-modal">
            <button className="result-close-btn" onClick={handleCloseResultModal}>
              <X size={24} />
            </button>
            <div className="result-icon" style={{ background: performance.color }}>
              <span style={{ fontSize: '48px' }}>{performance.icon}</span>
            </div>
            <h2 style={{ color: performance.color }}>{performance.title}</h2>
            <p className="result-message">{performance.message}</p>
            
            <div className="result-stats">
              <div className="result-stat">
                <span className="stat-label">امتیاز شما</span>
                <span className="stat-value">{resultData.score}/{resultData.total}</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">درصد موفقیت</span>
                <span className="stat-value" style={{ color: performance.color }}>{resultData.percentage}%</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">پاسخ صحیح</span>
                <span className="stat-value" style={{ color: '#10b981' }}>{resultData.correctCount}</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">پاسخ غلط</span>
                <span className="stat-value" style={{ color: '#ef4444' }}>{resultData.wrongCount}</span>
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-label">عملکرد کلی</div>
              <div className="progress-track">
                <div className="progress-fill-result" style={{ width: `${resultData.percentage}%`, background: performance.color }} />
              </div>
            </div>
            
            <button className="result-btn" onClick={handleCloseResultModal}>
              مشاهده جزئیات کامل
            </button>
          </div>
        </div>
      )}

      <style>{`
        .exam-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 16px;
          direction: rtl;
          font-family: 'Vazirmatn', sans-serif;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .exam-header-card {
          background: linear-gradient(135deg, #1E293B, #0F172A);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .exam-title-section {
          flex: 1;
          min-width: 200px;
        }

        .exam-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .exam-stats-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stat-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          color: #CBD5E1;
          font-size: 0.8rem;
        }

        .stat-chip.answered {
          background: rgba(16,185,129,0.2);
          color: #34D399;
        }

        .stat-chip.unanswered {
          background: rgba(245,158,11,0.2);
          color: #FBBF24;
        }

        .timer-widget {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          border-radius: 16px;
          min-width: 160px;
          justify-content: center;
          border: 2px solid;
        }

        .timer-widget.normal {
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.3);
          color: #34D399;
        }

        .timer-widget.warning {
          background: rgba(245,158,11,0.1);
          border-color: rgba(245,158,11,0.3);
          color: #FBBF24;
          animation: timerPulse 1s ease-in-out infinite;
        }

        .timer-widget.critical {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.3);
          color: #FCA5A5;
          animation: timerPulse 0.5s ease-in-out infinite;
        }

        .timer-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 2px;
        }

        .timer-label {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .progress-section {
          margin-bottom: 20px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.85rem;
          color: #64748B;
        }

        .progress-percent {
          font-weight: 700;
          color: #3B82F6;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: #E2E8F0;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3B82F6, #8B5CF6);
          border-radius: 10px;
          transition: width 0.5s ease;
        }

        .time-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 14px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .time-warning.warning {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FBBF24;
        }

        .time-warning.critical {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #EF4444;
          animation: shake 0.5s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .question-master-card {
          background: white;
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #E2E8F0;
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .question-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .question-meta {
          display: flex;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748B;
          font-size: 0.85rem;
        }

        .question-tags {
          display: flex;
          gap: 8px;
        }

        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .points-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: #F1F5F9;
          border-radius: 20px;
          font-size: 0.75rem;
          color: #475569;
        }

        .question-prompts {
          font-size: 1.15rem;
          line-height: 1.8;
          color: #1E293B;
          margin-bottom: 16px;
        }

        .concept-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .concept-tag {
          padding: 3px 10px;
          background: #EFF6FF;
          color: #2563EB;
          border-radius: 15px;
          font-size: 0.7rem;
        }

        .options-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .option-card:hover {
          border-color: #93C5FD;
          background: #F8FAFC;
          transform: translateX(-4px);
        }

        .option-card.selected {
          border-color: #3B82F6;
          background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
          box-shadow: 0 4px 12px rgba(59,130,246,0.15);
        }

        .hidden-radio {
          display: none;
        }

        .option-marker {
          width: 40px;
          height: 40px;
          background: #F1F5F9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #64748B;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .option-card.selected .option-marker {
          background: #3B82F6;
          color: white;
        }

        .option-content {
          flex: 1;
        }

        .option-text {
          font-size: 1rem;
          color: #334155;
        }

        .option-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3B82F6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transform: scale(0);
          transition: all 0.3s ease;
        }

        .option-check.visible {
          opacity: 1;
          transform: scale(1);
        }

        .text-input-wrapper {
          position: relative;
        }

        .answer-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          font-size: 1rem;
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
          resize: vertical;
          transition: all 0.3s ease;
          background: #F8FAFC;
        }

        .answer-textarea:focus {
          outline: none;
          border-color: #3B82F6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .char-count {
          text-align: left;
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 8px;
        }

        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          border: 2px solid #E2E8F0;
          border-radius: 14px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: #475569;
          transition: all 0.3s ease;
          font-family: 'Vazirmatn', sans-serif;
        }

        .nav-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #3B82F6;
          color: #3B82F6;
          transform: translateY(-2px);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .nav-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .question-dots {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .question-dot {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 2px solid #E2E8F0;
          background: white;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748B;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Vazirmatn', sans-serif;
        }

        .question-dot.answered {
          background: #D1FAE5;
          border-color: #10B981;
          color: #065F46;
        }

        .question-dot.current {
          background: #3B82F6;
          border-color: #3B82F6;
          color: white;
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
          font-family: 'Vazirmatn', sans-serif;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16,185,129,0.3);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

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
          padding: 20px;
        }

        .confirm-modal {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          animation: modalPop 0.3s ease;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .result-modal {
          background: white;
          border-radius: 28px;
          padding: 32px;
          width: 90%;
          max-width: 450px;
          text-align: center;
          animation: modalPop 0.4s ease;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          position: relative;
        }

        .result-close-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
          padding: 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-close-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .result-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
        }

        .result-modal h2 {
          font-size: 1.8rem;
          margin: 0 0 8px 0;
        }

        .result-message {
          color: #64748b;
          margin-bottom: 24px;
        }

        .result-stats {
          display: flex;
          justify-content: space-around;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .result-stat {
          text-align: center;
          flex: 1;
          background: #f8fafc;
          padding: 12px;
          border-radius: 16px;
        }

        .stat-label {
          display: block;
          font-size: 0.7rem;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .progress-bar-container {
          margin-bottom: 24px;
        }

        .progress-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 6px;
          text-align: right;
        }

        .progress-track {
          height: 10px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill-result {
          height: 100%;
          border-radius: 10px;
          transition: width 1s ease;
        }

        .result-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .result-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37,99,235,0.3);
        }

        @keyframes modalPop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-icon.warning {
          width: 80px;
          height: 80px;
          background: #FEF3C7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #F59E0B;
        }

        .confirm-modal h3 {
          font-size: 1.3rem;
          margin: 0 0 8px 0;
          color: #1E293B;
        }

        .modal-message {
          color: #64748B;
          margin: 8px 0;
        }

        .modal-message strong {
          color: #EF4444;
          font-size: 1.2rem;
        }

        .modal-hint {
          color: #94A3B8;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          font-family: 'Vazirmatn', sans-serif;
        }

        .cancel-btn {
          background: #F1F5F9;
          color: #475569;
        }

        .cancel-btn:hover {
          background: #E2E8F0;
        }

        .submit-btn-modal {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: white;
        }

        .submit-btn-modal:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239,68,68,0.3);
        }

        @media (max-width: 768px) {
          .exam-container { padding: 12px; }
          .exam-header-card { padding: 18px; flex-direction: column; text-align: center; }
          .exam-title { font-size: 1.2rem; }
          .exam-stats-row { justify-content: center; }
          .question-master-card { padding: 18px; }
          .question-top-bar { flex-direction: column; align-items: flex-start; }
          .question-prompts { font-size: 1rem; }
          .option-card { padding: 12px 14px; }
          .option-marker { width: 36px; height: 36px; }
          .navigation-buttons { flex-direction: column; gap: 12px; }
          .nav-btn, .submit-btn { width: 100%; justify-content: center; }
          .nav-center { order: -1; }
          .question-dots { gap: 6px; }
          .question-dot { width: 32px; height: 32px; font-size: 0.7rem; }
          .timer-widget { width: 100%; }
          .result-stats { flex-direction: column; }
        }

        @media (max-width: 480px) {
          .exam-header-card { padding: 14px; border-radius: 18px; }
          .exam-title { font-size: 1.1rem; }
          .stat-chip { font-size: 0.7rem; padding: 4px 10px; }
          .question-master-card { padding: 14px; border-radius: 18px; }
          .question-prompts { font-size: 0.95rem; line-height: 1.7; }
          .option-card { padding: 10px 12px; }
          .option-text { font-size: 0.9rem; }
          .question-dot { width: 28px; height: 28px; font-size: 0.65rem; border-radius: 8px; }
          .confirm-modal { padding: 24px; }
          .modal-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default ExamView;