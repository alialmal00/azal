// src/components/student/StudentClasses.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLink, FiCheck, FiX, FiUsers, FiBookOpen, 
  FiArrowRight, FiClock, FiUser, FiLogOut, FiHome,
  FiAlertCircle, FiCalendar, FiCopy, FiBarChart2, 
  FiTrendingUp, FiAward, FiEye, FiFileText, FiPlus
} from 'react-icons/fi';
import { classService, Class } from '../../services/classService';
import { classExamService, OnlineClass } from '../../services/classExamService';

interface StudentClassesProps {
  studentId: number;
  studentName: string;
  onJoinClass?: () => void;
  // ✅ دانش‌آموز محدودیت عضویت ندارد - حذف شد
}

interface Exam {
  id: number;
  title: string;
  description: string;
  exam_data: any;
  config: any;
  status: string;
  class_name: string;
  teacher_name: string;
  class_id: number;
  submission_status?: string;
  score?: number;
  score_percentage?: number;
}

interface ResultDetail {
  id: number;
  exam_title: string;
  class_name: string;
  score: number;
  total_points: number;
  score_percentage: number;
  submitted_at: string;
  answers?: any;
  exam_data?: any;
}

const StudentClasses: React.FC<StudentClassesProps> = ({ studentId, studentName, onJoinClass }) => {
  const navigate = useNavigate();
  
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<number | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classExams, setClassExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [myResults, setMyResults] = useState<ResultDetail[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'classes' | 'exams' | 'results'>('classes');
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);

  useEffect(() => {
    loadMyClasses();
    loadMyResults();
  }, []);

  const loadMyClasses = async () => {
    setLoadingClasses(true);
    try {
      const result = await classService.getMyClasses();
      console.log('📚 My classes loaded:', result);
      if (result.success && result.classes) {
        setMyClasses(result.classes);
        if (result.classes.length > 0 && !selectedClass) {
          setSelectedClass(result.classes[0]);
          await loadClassExams(result.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'خطا در بارگذاری کلاس‌ها' });
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadClassExams = async (classId: number) => {
    setLoadingExams(true);
    try {
      const result = await classExamService.getMyExams(classId);
      if (result.success && result.exams) {
        setClassExams(result.exams);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  const loadMyResults = async () => {
    setLoadingResults(true);
    try {
      const result = await classExamService.getMyResults();
      if (result.success && result.results) {
        setMyResults(result.results);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSelectClass = async (cls: Class) => {
    setSelectedClass(cls);
    await loadClassExams(cls.id);
    setActiveTab('exams');
  };

  const handleJoinClass = async () => {
    const cleanCode = classCode.trim().toUpperCase();
    if (!cleanCode) {
      setMessage({ type: 'error', text: 'لطفاً کد کلاس را وارد کنید' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await classService.joinClassByCode(cleanCode);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'با موفقیت به کلاس پیوستید!' });
        setClassCode('');
        setShowJoinModal(false);
        await loadMyClasses();
        if (onJoinClass) onJoinClass();
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در پیوستن به کلاس. لطفاً کد را بررسی کنید.' });
      }
    } catch (error: any) {
      console.error('Join error:', error);
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.message || 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleLeaveClass = async (classId: number) => {
    setShowLeaveConfirm(classId);
  };

  const confirmLeaveClass = async () => {
    if (!showLeaveConfirm) return;

    try {
      const result = await classService.leaveClass(showLeaveConfirm);
      if (result.success) {
        setMessage({ type: 'success', text: 'با موفقیت از کلاس خارج شدید' });
        await loadMyClasses();
        if (selectedClass?.id === showLeaveConfirm) {
          setSelectedClass(null);
          setClassExams([]);
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در خروج از کلاس' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setShowLeaveConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleStartExam = (exam: Exam) => {
    if (exam.submission_status === 'completed') {
      alert('❌ شما قبلاً در این آزمون شرکت کرده‌اید.');
      return;
    }

    if (!exam.exam_data || !exam.exam_data.questions) {
      alert('❌ خطا: داده‌های آزمون ناقص است');
      return;
    }
    
    navigate('/app/take-class-exam', {
      state: {
        examId: exam.id,
        examTitle: exam.title,
        examData: exam.exam_data,
        examConfig: exam.config,
        classId: exam.class_id,
        className: exam.class_name,
        timeLimit: exam.config?.exam_duration || 30
      }
    });
  };

  const handleViewAnswers = (result: ResultDetail) => {
    setSelectedResult(result);
    setShowAnswersModal(true);
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: 'کد کلاس کپی شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const totalExams = myResults.length;
  const avgScore = myResults.length > 0 
    ? Math.round(myResults.reduce((sum, r) => sum + (r.score_percentage || 0), 0) / myResults.length) 
    : 0;
  const bestScore = myResults.length > 0 
    ? Math.max(...myResults.map(r => r.score_percentage || 0)) 
    : 0;

  const isAnswerCorrect = (question: any, userAnswers: any) => {
    const userAnswer = userAnswers[question.q_id];
    if (!userAnswer) return false;
    
    if (question.type === 'mcq' || question.type === 'tf') {
      const correctOption = question.options?.find((opt: any) => opt.is_correct);
      return correctOption?.id === userAnswer;
    } else if (question.type === 'fitb' || question.type === 'short') {
      return typeof userAnswer === 'string' && 
             typeof question.correct_answer === 'string' &&
             userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
    }
    return false;
  };

  const getUserAnswerText = (question: any, userAnswers: any) => {
    const userAnswer = userAnswers[question.q_id];
    if (!userAnswer) return 'پاسخ داده نشده';
    
    if (question.type === 'mcq' || question.type === 'tf') {
      const selectedOption = question.options?.find((opt: any) => opt.id === userAnswer);
      return selectedOption?.text || userAnswer;
    } else {
      return userAnswer;
    }
  };

  const getCorrectAnswerText = (question: any) => {
    if (question.type === 'mcq' || question.type === 'tf') {
      const correctOption = question.options?.find((opt: any) => opt.is_correct);
      return correctOption?.text || 'پاسخ صحیح مشخص نشده';
    } else {
      return question.correct_answer || 'پاسخ صحیح مشخص نشده';
    }
  };

  const getExamTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ترکیبی': 'ترکیبی',
      'mcq': 'چهارگزینه‌ای',
      'tf': 'درست/نادرست',
      'fitb': 'جای خالی',
      'short': 'پاسخ کوتاه'
    };
    return types[type] || type;
  };

  return (
    <div style={styles.container}>
      {/* مودال مشاهده پاسخ‌ها */}
      {showAnswersModal && selectedResult && selectedResult.exam_data && (
        <div style={styles.modalOverlay} onClick={() => setShowAnswersModal(false)}>
          <div style={styles.answersModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 پاسخ‌های تشریحی - {selectedResult.exam_title}</h3>
              <button style={styles.modalClose} onClick={() => setShowAnswersModal(false)}><FiX size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.answersSummary}>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>نمره کسب شده</span>
                  <strong style={{ ...styles.summaryValue, color: getScoreColor(selectedResult.score_percentage) }}>
                    {selectedResult.score}/{selectedResult.total_points}
                  </strong>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>درصد موفقیت</span>
                  <strong style={{ ...styles.summaryValue, color: getScoreColor(selectedResult.score_percentage) }}>
                    {selectedResult.score_percentage}%
                  </strong>
                </div>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>تاریخ ثبت</span>
                  <strong style={styles.summaryValue}>{new Date(selectedResult.submitted_at).toLocaleDateString('fa-IR')}</strong>
                </div>
              </div>
              
              <div style={styles.answersList}>
                {selectedResult.exam_data.questions?.map((question: any, idx: number) => {
                  const isCorrect = isAnswerCorrect(question, selectedResult.answers);
                  return (
                    <div key={idx} style={{ ...styles.answerCard, borderRightColor: isCorrect ? '#10b981' : '#ef4444' }}>
                      <div style={styles.answerHeader}>
                        <span style={styles.answerNumber}>سوال {idx + 1}</span>
                        <span style={{ ...styles.answerStatus, background: isCorrect ? '#d1fae5' : '#fee2e2', color: isCorrect ? '#065f46' : '#991b1b' }}>
                          {isCorrect ? '✓ صحیح' : '✗ غلط'}
                        </span>
                      </div>
                      <div style={styles.answerText}>{question.prompt}</div>
                      <div style={styles.answerCompare}>
                        <div style={styles.userAnswerBox}>
                          <span style={styles.answerLabel}>پاسخ شما:</span>
                          <span style={{ ...styles.answerValue, color: isCorrect ? '#10b981' : '#ef4444' }}>
                            {getUserAnswerText(question, selectedResult.answers)}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div style={styles.correctAnswerBox}>
                            <span style={styles.answerLabel}>پاسخ صحیح:</span>
                            <span style={{ ...styles.answerValue, color: '#10b981' }}>
                              {getCorrectAnswerText(question)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.closeModalBtn} onClick={() => setShowAnswersModal(false)}>بستن</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأیید خروج از کلاس */}
      {showLeaveConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLeaveConfirm(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>خروج از کلاس</h3>
              <button style={styles.modalClose} onClick={() => setShowLeaveConfirm(null)}><FiX /></button>
            </div>
            <div style={styles.confirmModalBody}>
              <div style={styles.confirmIcon}>
                <FiLogOut size={40} />
              </div>
              <p>آیا از خروج از این کلاس اطمینان دارید؟</p>
              <p style={styles.confirmText}>پس از خروج، دسترسی شما به محتوای کلاس از بین می‌رود.</p>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowLeaveConfirm(null)}>انصراف</button>
              <button style={styles.confirmLeaveBtn} onClick={confirmLeaveClass}>تأیید خروج</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال پیوستن به کلاس */}
      {showJoinModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
          <div style={styles.joinModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📚 پیوستن به کلاس جدید</h3>
              <button style={styles.modalClose} onClick={() => setShowJoinModal(false)}><FiX /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.joinInputGroup}>
                <label style={styles.joinLabel}>کد کلاس</label>
                <div style={styles.joinInputWrapper}>
                  <FiLink style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="مثال: A1B2C3D4"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinClass()}
                    style={styles.joinInput}
                  />
                </div>
                <p style={styles.joinHint}>کد کلاس را از معلم خود دریافت کنید</p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowJoinModal(false)}>انصراف</button>
              <button style={styles.joinBtn} onClick={handleJoinClass} disabled={loading}>
                {loading ? (
                  <>
                    <div style={styles.spinnerSm}></div>
                    در حال پیوستن...
                  </>
                ) : (
                  <>
                    پیوستن به کلاس
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* هدر */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <FiBookOpen size={28} />
            </div>
            <div style={styles.headerText}>
              <h1 style={styles.headerTitle}>کلاس‌های من</h1>
              <p style={styles.headerSubtitle}>{studentName} عزیز، در این بخش می‌توانید کلاس‌های خود را مشاهده کنید</p>
            </div>
          </div>
          <button style={styles.joinClassBtn} onClick={() => setShowJoinModal(true)}>
            <FiLink size={16} />
            <span>پیوستن به کلاس جدید</span>
          </button>
        </div>
      </div>

      {/* پیام وضعیت */}
      {message && (
        <div style={{ ...styles.statusMessage, background: message.type === 'success' ? '#10b981' : message.type === 'error' ? '#ef4444' : '#3b82f6' }}>
          {message.type === 'success' ? <FiCheck size={18} /> : message.type === 'error' ? <FiX size={18} /> : <FiAlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* کارت‌های آمار پیشرفت */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#f3e8ff', color: '#9333ea' }}><FiBookOpen size={20} /></div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{myClasses.length}</h3>
            <p style={styles.statLabel}>کلاس‌های فعال</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#dbeafe', color: '#2563eb' }}><FiFileText size={20} /></div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{totalExams}</h3>
            <p style={styles.statLabel}>آزمون‌های شرکت شده</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#d1fae5', color: '#10b981' }}><FiTrendingUp size={20} /></div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{avgScore}%</h3>
            <p style={styles.statLabel}>میانگین نمرات</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#f59e0b' }}><FiAward size={20} /></div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{bestScore}%</h3>
            <p style={styles.statLabel}>بهترین نمره</p>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div style={styles.tabs}>
        <button 
          style={{ ...styles.tabBtn, ...(activeTab === 'classes' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('classes')}
        >
          <FiUsers size={16} />
          <span>کلاس‌های من</span>
        </button>
        <button 
          style={{ ...styles.tabBtn, ...(activeTab === 'exams' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('exams')}
        >
          <FiFileText size={16} />
          <span>آزمون‌ها</span>
        </button>
        <button 
          style={{ ...styles.tabBtn, ...(activeTab === 'results' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('results')}
        >
          <FiBarChart2 size={16} />
          <span>نتایج من</span>
        </button>
      </div>

      {/* تب کلاس‌های من */}
      {activeTab === 'classes' && (
        <>
          {loadingClasses ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinnerMd}></div>
              <p>در حال بارگذاری کلاس‌ها...</p>
            </div>
          ) : myClasses.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}><FiBookOpen size={48} /></div>
              <h3 style={styles.emptyTitle}>هنوز به کلاسی نپیوسته‌اید</h3>
              <p style={styles.emptyText}>از معلم خود کد کلاس را دریافت کنید و به کلاس بپیوندید</p>
              <button style={styles.primaryBtn} onClick={() => setShowJoinModal(true)}>پیوستن به کلاس</button>
            </div>
          ) : (
            <div style={styles.classesGrid}>
              {myClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  style={{ ...styles.classCard, ...(selectedClass?.id === cls.id ? styles.classCardSelected : {}) }}
                  onClick={() => handleSelectClass(cls)}
                >
                  <div style={{ ...styles.classCardHeader, background: `linear-gradient(135deg, #667eea, #764ba2)` }}>
                    <h3 style={styles.classCardTitle}>{cls.name}</h3>
                    <div style={styles.classCodeBadge}>
                      <FiLink size={12} />
                      <span>{cls.class_code}</span>
                      <button style={styles.copyCodeBtn} onClick={(e) => { e.stopPropagation(); copyClassCode(cls.class_code); }}>
                        <FiCopy size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={styles.classCardBody}>
                    <div style={styles.classMeta}>
                      {cls.subject && (
                        <span style={styles.metaTag}><FiBookOpen size={12} /> {cls.subject}</span>
                      )}
                      {cls.grade_level && (
                        <span style={styles.metaTag}><FiUsers size={12} /> {cls.grade_level}</span>
                      )}
                      <span style={styles.metaTag}><FiUser size={12} /> {cls.teacher_name || 'معلم'}</span>
                    </div>
                    <div style={styles.classStats}>
                      <div style={styles.classStat}>
                        <span style={styles.classStatValue}>{cls.member_count || 0}</span>
                        <span style={styles.classStatLabel}>دانش‌آموز</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.classCardFooter}>
                    <button 
                      style={styles.viewExamsBtn}
                      onClick={(e) => { e.stopPropagation(); handleSelectClass(cls); setActiveTab('exams'); }}
                    >
                      <FiEye size={14} /> مشاهده آزمون‌ها
                    </button>
                    <button 
                      style={styles.leaveBtn}
                      onClick={(e) => { e.stopPropagation(); handleLeaveClass(cls.id); }}
                    >
                      <FiLogOut size={14} /> خروج از کلاس
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* تب آزمون‌ها */}
      {activeTab === 'exams' && (
        <div style={styles.examsTab}>
          {!selectedClass ? (
            <div style={styles.emptyStateSmall}>
              <FiBookOpen size={48} style={{ color: '#cbd5e1' }} />
              <p>برای مشاهده آزمون‌ها، ابتدا یک کلاس را انتخاب کنید</p>
            </div>
          ) : loadingExams ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinnerMd}></div>
              <p>در حال بارگذاری آزمون‌ها...</p>
            </div>
          ) : classExams.filter(e => e.status === 'published').length === 0 ? (
            <div style={styles.emptyStateSmall}>
              <FiFileText size={48} style={{ color: '#cbd5e1' }} />
              <p>هیچ آزمونی برای کلاس {selectedClass.name} تعیین نشده است</p>
            </div>
          ) : (
            <div style={styles.examsList}>
              <div style={styles.examsHeader}>
                <h3 style={styles.examsHeaderTitle}>📋 آزمون‌های کلاس {selectedClass.name}</h3>
                <p style={styles.examsHeaderText}>آزمون‌هایی که معلم برای شما تعیین کرده است</p>
              </div>
              {classExams.filter(e => e.status === 'published').map((exam) => (
                <div key={exam.id} style={styles.examCard}>
                  <div style={styles.examCardHeader}>
                    <div style={styles.examIcon}><FiFileText size={24} /></div>
                    <div style={styles.examInfo}>
                      <h4 style={styles.examTitle}>{exam.title}</h4>
                      {exam.description && <p style={styles.examDescription}>{exam.description}</p>}
                      <span style={styles.examTypeBadge}>{getExamTypeLabel(exam.config?.exam_type || 'ترکیبی')}</span>
                    </div>
                    <div style={styles.examStatus}>
                      {exam.submission_status === 'completed' ? (
                        <span style={styles.statusCompleted}>✓ انجام شده</span>
                      ) : (
                        <span style={styles.statusPending}>⏳ در انتظار</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.examCardDetails}>
                    <div style={styles.detail}><FiUser size={14} /><span>{exam.teacher_name}</span></div>
                    <div style={styles.detail}><FiBookOpen size={14} /><span>{exam.exam_data?.questions?.length || 0} سوال</span></div>
                    <div style={styles.detail}><FiBarChart2 size={14} /><span>سختی: {exam.config?.difficulty || 'متوسط'}</span></div>
                  </div>
                  <div style={styles.examCardActions}>
                    {exam.submission_status === 'completed' ? (
                      <button style={styles.disabledBtn} disabled>قبلاً پاسخ داده‌اید</button>
                    ) : (
                      <button style={styles.startExamBtn} onClick={() => handleStartExam(exam)}>
                        <FiArrowRight size={14} /> شروع آزمون
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* تب نتایج من */}
      {activeTab === 'results' && (
        <div style={styles.resultsTab}>
          {loadingResults ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinnerMd}></div>
              <p>در حال بارگذاری نتایج...</p>
            </div>
          ) : myResults.length === 0 ? (
            <div style={styles.emptyStateSmall}>
              <FiBarChart2 size={48} style={{ color: '#cbd5e1' }} />
              <p>هنوز در هیچ آزمونی شرکت نکرده‌اید</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>پس از شرکت در آزمون، نتایج شما در اینجا نمایش داده می‌شود</p>
            </div>
          ) : (
            <div style={styles.resultsList}>
              <div style={styles.resultsHeader}>
                <h3 style={styles.resultsTitle}>📊 کارنامه تحصیلی</h3>
                <div style={styles.resultsSummary}>
                  <div style={styles.summaryCard}>
                    <span>میانگین نمرات</span>
                    <strong style={{ color: getScoreColor(avgScore) }}>{avgScore}%</strong>
                  </div>
                  <div style={styles.summaryCard}>
                    <span>بهترین نمره</span>
                    <strong style={{ color: getScoreColor(bestScore) }}>{bestScore}%</strong>
                  </div>
                  <div style={styles.summaryCard}>
                    <span>تعداد آزمون‌ها</span>
                    <strong>{totalExams}</strong>
                  </div>
                </div>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.resultsTable}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableTh}>عنوان آزمون</th>
                      <th style={styles.tableTh}>کلاس</th>
                      <th style={styles.tableTh}>نوع</th>
                      <th style={styles.tableTh}>نمره</th>
                      <th style={styles.tableTh}>درصد</th>
                      <th style={styles.tableTh}>تاریخ</th>
                      <th style={styles.tableTh}>وضعیت</th>
                      <th style={styles.tableTh}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myResults.map((result) => (
                      <tr key={result.id} style={styles.tableRow}>
                        <td style={styles.tableTd}>{result.exam_title}</td>
                        <td style={styles.tableTd}>{result.class_name}</td>
                        <td style={styles.tableTd}>{getExamTypeLabel(result.exam_data?.type || 'ترکیبی')}</td>
                        <td style={styles.tableTd}>{result.score}/{result.total_points}</td>
                        <td style={{ ...styles.tableTd, color: getScoreColor(result.score_percentage), fontWeight: 'bold' }}>{result.score_percentage}%</td>
                        <td style={styles.tableTd}>{new Date(result.submitted_at).toLocaleDateString('fa-IR')}</td>
                        <td style={styles.tableTd}>
                          <span style={{ ...styles.statusBadge, background: result.score_percentage >= 50 ? '#d1fae5' : '#fee2e2', color: result.score_percentage >= 50 ? '#065f46' : '#991b1b' }}>
                            {result.score_percentage >= 50 ? '✅ قبول' : '❌ مردود'}
                          </span>
                        </td>
                        <td style={styles.tableTd}>
                          <button style={styles.viewAnswersBtn} onClick={() => handleViewAnswers(result)}>
                            <FiEye size={14} /> مشاهده پاسخ‌ها
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ========== استایل‌ها ==========
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    direction: 'rtl',
    fontFamily: 'Vazirmatn, IRANSans, sans-serif',
    padding: '20px',
    position: 'relative'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  answersModal: {
    background: 'white',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '85vh',
    overflowY: 'auto',
    animation: 'modalSlideIn 0.3s ease'
  },
  joinModal: {
    background: 'white',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '420px',
    animation: 'modalSlideIn 0.3s ease'
  },
  confirmModal: {
    background: 'white',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '400px',
    animation: 'modalSlideIn 0.3s ease'
  },
  modalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '1.2rem'
  },
  modalBody: {
    padding: '24px'
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '12px'
  },
  answersSummary: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '16px',
    marginBottom: '20px',
    color: 'white'
  },
  summaryItem: {
    flex: 1,
    textAlign: 'center'
  },
  summaryLabel: {
    display: 'block',
    fontSize: '0.7rem',
    opacity: 0.8,
    marginBottom: '4px'
  },
  summaryValue: {
    fontSize: '1.2rem'
  },
  answersList: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  answerCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
    borderRight: '4px solid'
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  answerNumber: {
    fontWeight: 700,
    fontSize: '0.85rem'
  },
  answerStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  answerText: {
    fontSize: '0.9rem',
    marginBottom: '12px',
    lineHeight: 1.6,
    color: '#1e293b'
  },
  answerCompare: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '8px'
  },
  userAnswerBox: {
    padding: '10px',
    borderRadius: '10px',
    background: '#fef3c7'
  },
  correctAnswerBox: {
    padding: '10px',
    borderRadius: '10px',
    background: '#d1fae5'
  },
  answerLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    display: 'block',
    marginBottom: '4px'
  },
  answerValue: {
    fontSize: '0.85rem',
    fontWeight: 500
  },
  closeModalBtn: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    flex: 1
  },
  confirmModalBody: {
    padding: '24px',
    textAlign: 'center'
  },
  confirmIcon: {
    width: '80px',
    height: '80px',
    background: '#fee2e2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: '#ef4444'
  },
  confirmText: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '8px'
  },
  confirmLeaveBtn: {
    flex: 1,
    padding: '10px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    background: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  joinInputGroup: {
    textAlign: 'right'
  },
  joinLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#1e293b'
  },
  joinInputWrapper: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8'
  },
  joinInput: {
    width: '100%',
    padding: '12px 45px 12px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '1rem',
    textAlign: 'center',
    letterSpacing: '2px',
    fontFamily: 'monospace'
  },
  joinHint: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '8px'
  },
  joinBtn: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  header: {
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    borderRadius: '24px',
    padding: '24px 32px',
    marginBottom: '24px',
    color: 'white'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  headerIcon: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {},
  headerTitle: {
    fontSize: '1.5rem',
    margin: '0 0 4px 0'
  },
  headerSubtitle: {
    margin: 0,
    opacity: 0.8,
    fontSize: '0.85rem'
  },
  joinClassBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '12px 24px',
    borderRadius: '40px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  statusMessage: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1100,
    animation: 'slideIn 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    color: 'white'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  statIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statInfo: {},
  statValue: {
    fontSize: '1.5rem',
    margin: 0,
    fontWeight: 700,
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '0.75rem',
    margin: 0,
    color: '#64748b'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    background: 'white',
    padding: '8px',
    borderRadius: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap' as 'wrap'
  },
  tabBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    color: '#64748b'
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white'
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px'
  },
  classCard: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  classCardSelected: {
    border: '2px solid #2563eb'
  },
  classCardHeader: {
    padding: '18px',
    color: 'white'
  },
  classCardTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.1rem'
  },
  classCodeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.2)',
    padding: '5px 12px',
    borderRadius: '30px',
    fontSize: '0.7rem'
  },
  copyCodeBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer'
  },
  classCardBody: {
    padding: '16px'
  },
  classMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px'
  },
  metaTag: {
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  classStats: {
    display: 'flex',
    gap: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0'
  },
  classStat: {
    textAlign: 'center',
    flex: 1
  },
  classStatValue: {
    display: 'block',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1e293b'
  },
  classStatLabel: {
    fontSize: '0.65rem',
    color: '#94a3b8'
  },
  classCardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '10px'
  },
  viewExamsBtn: {
    flex: 1,
    padding: '8px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.75rem'
  },
  leaveBtn: {
    flex: 1,
    padding: '8px',
    background: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.75rem'
  },
  examsTab: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px'
  },
  examsList: {},
  examsHeader: {
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e2e8f0'
  },
  examsHeaderTitle: {
    margin: '0 0 4px 0',
    fontSize: '1.1rem'
  },
  examsHeaderText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#64748b'
  },
  examCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px'
  },
  examCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
    flexWrap: 'wrap' as 'wrap'
  },
  examIcon: {
    width: '50px',
    height: '50px',
    background: '#dbeafe',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2563eb'
  },
  examInfo: {
    flex: 1
  },
  examTitle: {
    margin: '0 0 4px 0',
    fontSize: '1rem'
  },
  examDescription: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#64748b'
  },
  examTypeBadge: {
    display: 'inline-block',
    background: '#e2e8f0',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.65rem',
    marginTop: '4px'
  },
  examStatus: {},
  statusCompleted: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  statusPending: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  examCardDetails: {
    display: 'flex',
    gap: '20px',
    padding: '10px 0',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '12px',
    flexWrap: 'wrap' as 'wrap'
  },
  detail: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: '#64748b'
  },
  examCardActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  startExamBtn: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '30px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem'
  },
  disabledBtn: {
    background: '#e2e8f0',
    color: '#475569',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '30px',
    cursor: 'not-allowed',
    fontSize: '0.8rem'
  },
  resultsTab: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px'
  },
  resultsList: {},
  resultsHeader: {
    marginBottom: '20px'
  },
  resultsTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.1rem'
  },
  resultsSummary: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as 'wrap'
  },
  summaryCard: {
    flex: 1,
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  resultsTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#f8fafc'
  },
  tableTh: {
    padding: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 600,
    color: '#475569'
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0'
  },
  tableTd: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '0.85rem'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  viewAnswersBtn: {
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '24px'
  },
  emptyStateSmall: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'white',
    borderRadius: '20px',
    color: '#94a3b8'
  },
  emptyIcon: {
    width: '100px',
    height: '100px',
    background: '#f1f5f9',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: '#94a3b8'
  },
  emptyTitle: {
    fontSize: '1.1rem',
    color: '#475569',
    marginBottom: '8px'
  },
  emptyText: {
    color: '#64748b',
    marginBottom: '16px'
  },
  primaryBtn: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '30px',
    cursor: 'pointer'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '20px'
  },
  spinnerMd: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto'
  },
  spinnerSm: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    display: 'inline-block'
  }
};

export default StudentClasses;