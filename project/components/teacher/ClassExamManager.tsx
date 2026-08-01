// src/components/teacher/ClassExamManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiTrash2, FiSend, FiCheckCircle, 
  FiClock, FiUsers, FiBarChart2, FiEye, FiX,
  FiVideo, FiEdit2, FiSave, FiCopy, FiArrowUp, FiArrowDown,
  FiAlertCircle
} from 'react-icons/fi';
import { classExamService, ClassExam } from '../../services/classExamService';
import ConfigurationForm from '../ConfigurationForm';
import type { ExamConfig, GeminiResponse } from '../../types';
import { generateExam } from '../../services/geminiService';
import api from '../../services/api';

interface ClassExamManagerProps {
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
}

interface TeacherLimits {
  exams_used: number;
  max_exams: number;
  questions_used: number;
  max_questions: number;
  exams_remaining: number;
  questions_remaining: number;
}

const ClassExamManager: React.FC<ClassExamManagerProps> = ({ classId, className, teacherId, teacherName }) => {
  const [activeTab, setActiveTab] = useState<'exams'>('exams');
  const [exams, setExams] = useState<ClassExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [examStats, setExamStats] = useState<any>(null);
  const [showResults, setShowResults] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<GeminiResponse | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  
  const [editingExam, setEditingExam] = useState<ClassExam | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<any[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    source_text: '',
    exam_type: 'ترکیبی',
    difficulty: 'متوسط',
    num_questions: 5,
    chapter_filter: '',
    user_name: teacherName,
    exam_duration: 30
  });

  // ========== محدودیت‌های معلم ==========
  const [teacherLimits, setTeacherLimits] = useState<TeacherLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  useEffect(() => {
    loadData();
    loadTeacherLimits();
  }, [classId]);

  // ========== دریافت محدودیت‌های معلم ==========
  const loadTeacherLimits = async () => {
    setLoadingLimits(true);
    try {
      const response = await api.get('/class-exams/teacher/limits');
      if (response.data.success) {
        setTeacherLimits(response.data.data.usage);
        console.log('📊 Teacher limits loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading teacher limits:', error);
    } finally {
      setLoadingLimits(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await loadExams();
    setLoading(false);
  };

  const loadExams = async () => {
    const result = await classExamService.getClassExams(classId);
    if (result.success && result.exams) {
      setExams(result.exams);
    }
  };

  // ========== بررسی محدودیت قبل از ساخت آزمون ==========
  const canCreateExam = () => {
    if (!teacherLimits) return true;
    return teacherLimits.exams_remaining > 0;
  };

  const getRemainingQuestions = () => {
    if (!teacherLimits) return 15;
    return teacherLimits.questions_remaining;
  };

  const handleStartExam = async (config: ExamConfig) => {
    // ✅ بررسی محدودیت تعداد سوالات
    if (config.num_questions > getRemainingQuestions()) {
      setMessage({ 
        type: 'error', 
        text: `⚠️ شما فقط ${getRemainingQuestions()} سوال دیگر در این ماه مجاز هستید.` 
      });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    // ✅ بررسی محدودیت تعداد آزمون‌ها
    if (!canCreateExam()) {
      setMessage({ 
        type: 'error', 
        text: `⚠️ سقف ${teacherLimits?.max_exams} آزمون ماهانه شما کامل شده است.` 
      });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    if (!config.source_text || config.source_text.trim() === '') {
      setErrorDetail('لطفاً متن منبع را وارد کنید');
      setMessage({ type: 'error', text: '❌ متن منبع نمی‌تواند خالی باشد' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    
    setExamConfig(config);
    setIsGenerating(true);
    setErrorDetail(null);
    
    try {
      const response = await generateExam(config);
      setGeneratedExam(response);
      setEditingQuestions(JSON.parse(JSON.stringify(response.exam.questions || [])));
      setExamTitle(response.exam.title || '');
      setMessage({ type: 'success', text: '✨ آزمون با موفقیت ساخته شد! حالا می‌توانید آن را ویرایش کنید.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setErrorDetail(error.message);
      setMessage({ type: 'error', text: `❌ ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditExam = (exam: ClassExam) => {
    setEditingExam(exam);
    const questions = exam.exam_data?.questions || [];
    setEditingQuestions(JSON.parse(JSON.stringify(questions)));
    setExamTitle(exam.title || '');
    setExamDescription(exam.description || '');
    setIsEditing(true);
    setSelectedQuestionIndex(null);
    setShowExamModal(true);
  };

  const handleSaveToClass = async () => {
    if (!generatedExam && !isEditing) return;

    if (editingQuestions.length === 0) {
      setMessage({ type: 'error', text: '❌ هیچ سوالی برای ذخیره وجود ندارد' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // ✅ بررسی محدودیت تعداد سوالات قبل از ذخیره
    if (editingQuestions.length > getRemainingQuestions()) {
      setMessage({ 
        type: 'error', 
        text: `⚠️ شما فقط ${getRemainingQuestions()} سوال دیگر در این ماه مجاز هستید.` 
      });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    const validQuestions = editingQuestions.map((q, idx) => ({
      q_id: q.q_id || `q_${idx + 1}`,
      type: q.type || 'mcq',
      prompt: q.prompt || `سوال ${idx + 1}`,
      options: q.options || (q.type === 'mcq' ? [
        { id: 'a', text: 'گزینه ۱', is_correct: false },
        { id: 'b', text: 'گزینه ۲', is_correct: false },
        { id: 'c', text: 'گزینه ۳', is_correct: false },
        { id: 'd', text: 'گزینه ۴', is_correct: true }
      ] : (q.type === 'tf' ? [
        { id: 'true', text: 'درست', is_correct: true },
        { id: 'false', text: 'نادرست', is_correct: false }
      ] : [])),
      correct_answer: q.correct_answer || '',
      concept_tags: q.concept_tags || [],
      difficulty: q.difficulty || 3,
      points: q.points || 2
    }));

    const examDataToSave = {
      class_id: classId,
      title: examTitle || (generatedExam?.exam?.title) || 'آزمون جدید',
      description: examDescription || `آزمون ${examConfig.exam_type} - سطح ${examConfig.difficulty}`,
      exam_data: {
        id: generatedExam?.exam?.id || `exam_${Date.now()}`,
        title: examTitle || (generatedExam?.exam?.title) || 'آزمون جدید',
        type: examConfig.exam_type,
        difficulty: examConfig.difficulty,
        questions: validQuestions
      },
      config: {
        exam_type: examConfig.exam_type,
        difficulty: examConfig.difficulty,
        num_questions: validQuestions.length,
        user_name: teacherName,
        exam_duration: examConfig.exam_duration || 30
      }
    };

    const result = await classExamService.createExam(examDataToSave);
    
    if (result.success) {
      setMessage({ type: 'success', text: '✅ آزمون در کلاس ذخیره شد' });
      setShowExamModal(false);
      setGeneratedExam(null);
      setEditingExam(null);
      setEditingQuestions([]);
      loadExams();
      loadTeacherLimits(); // بروزرسانی محدودیت‌ها
    } else {
      setMessage({ type: 'error', text: result.message || '❌ خطا در ذخیره آزمون' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveExamChanges = async () => {
    if (!editingExam) return;
    
    for (let i = 0; i < editingQuestions.length; i++) {
      const q = editingQuestions[i];
      if (!q.prompt || q.prompt.trim() === '') {
        setMessage({ type: 'error', text: `سوال ${i + 1} متن ندارد` });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      if ((q.type === 'mcq' || q.type === 'tf') && (!q.options || q.options.length < 2)) {
        setMessage({ type: 'error', text: `سوال ${i + 1} گزینه کافی ندارد` });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      if ((q.type === 'fitb' || q.type === 'short') && (!q.correct_answer || q.correct_answer.trim() === '')) {
        setMessage({ type: 'error', text: `سوال ${i + 1} پاسخ صحیح ندارد` });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
    }
    
    const updatedExamData = {
      exam_data: {
        ...editingExam.exam_data,
        questions: editingQuestions
      },
      title: examTitle,
      description: examDescription
    };
    
    const result = await classExamService.updateExam(editingExam.id, updatedExamData);
    
    if (result.success) {
      setMessage({ type: 'success', text: '✅ تغییرات با موفقیت ذخیره شد' });
      setIsEditing(false);
      setEditingExam(null);
      setEditingQuestions([]);
      setShowExamModal(false);
      loadExams();
    } else {
      setMessage({ type: 'error', text: result.message || 'خطا در ذخیره تغییرات' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: any) => {
    const newQuestions = [...editingQuestions];
    newQuestions[index] = updatedQuestion;
    setEditingQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    // ✅ بررسی محدودیت تعداد سوالات
    if (editingQuestions.length >= getRemainingQuestions()) {
      setMessage({ 
        type: 'error', 
        text: `⚠️ شما فقط ${getRemainingQuestions()} سوال دیگر در این ماه مجاز هستید.` 
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newQuestion = {
      q_id: `q_${Date.now()}`,
      type: 'mcq',
      prompt: 'سوال جدید',
      options: [
        { id: 'a', text: 'گزینه ۱', is_correct: false },
        { id: 'b', text: 'گزینه ۲', is_correct: false },
        { id: 'c', text: 'گزینه ۳', is_correct: false },
        { id: 'd', text: 'گزینه ۴', is_correct: true }
      ],
      correct_answer: '',
      concept_tags: [],
      difficulty: 3,
      points: 2
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
    setSelectedQuestionIndex(editingQuestions.length);
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToCopy = JSON.parse(JSON.stringify(editingQuestions[index]));
    questionToCopy.q_id = `q_${Date.now()}_copy`;
    const newQuestions = [...editingQuestions];
    newQuestions.splice(index + 1, 0, questionToCopy);
    setEditingQuestions(newQuestions);
    setMessage({ type: 'success', text: '✅ سوال کپی شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...editingQuestions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    } else if (direction === 'down' && index < editingQuestions.length - 1) {
      [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];
    }
    setEditingQuestions(newQuestions);
    if (selectedQuestionIndex === index) {
      setSelectedQuestionIndex(direction === 'up' ? index - 1 : index + 1);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (window.confirm('آیا از حذف این سوال اطمینان دارید؟')) {
      const newQuestions = editingQuestions.filter((_, i) => i !== index);
      setEditingQuestions(newQuestions);
      if (selectedQuestionIndex === index) {
        setSelectedQuestionIndex(null);
      } else if (selectedQuestionIndex !== null && selectedQuestionIndex > index) {
        setSelectedQuestionIndex(selectedQuestionIndex - 1);
      }
    }
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const newQuestions = [...editingQuestions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options[optionIndex] = {
        ...newQuestions[questionIndex].options[optionIndex],
        [field]: value
      };
      setEditingQuestions(newQuestions);
    }
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...editingQuestions];
    if (newQuestions[questionIndex].options) {
      const newId = String.fromCharCode(97 + newQuestions[questionIndex].options.length);
      newQuestions[questionIndex].options.push({
        id: newId,
        text: `گزینه ${newId}`,
        is_correct: false
      });
      setEditingQuestions(newQuestions);
    }
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...editingQuestions];
    if (newQuestions[questionIndex].options && newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_: any, i: number) => i !== optionIndex);
      setEditingQuestions(newQuestions);
    } else {
      setMessage({ type: 'error', text: 'سوال باید حداقل ۲ گزینه داشته باشد' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSetCorrectOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...editingQuestions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.map((opt: any, idx: number) => ({
        ...opt,
        is_correct: idx === optionIndex
      }));
      setEditingQuestions(newQuestions);
    }
  };

  const handlePublishExam = async (examId: number) => {
    const result = await classExamService.publishExam(examId);
    if (result.success) {
      setMessage({ type: 'success', text: '✅ آزمون منتشر شد و دانش‌آموزان می‌توانند آن را مشاهده کنند' });
      loadExams();
    } else {
      setMessage({ type: 'error', text: result.message || 'خطا در انتشار' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteExam = async (examId: number) => {
    if (!window.confirm('آیا از حذف این آزمون اطمینان دارید؟')) return;
    
    const result = await classExamService.deleteExam(examId);
    if (result.success) {
      setMessage({ type: 'success', text: '✅ آزمون حذف شد' });
      loadExams();
    } else {
      setMessage({ type: 'error', text: result.message || 'خطا در حذف' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleViewResults = async (examId: number) => {
    try {
      const result = await classExamService.getExamResults(examId);
      if (result.success) {
        setExamResults(result.results || []);
        setExamStats(result.stats);
        setShowResults(examId);
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در دریافت نتایج' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در دریافت نتایج' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') return <span className="badge published">📢 منتشر شده</span>;
    if (status === 'draft') return <span className="badge draft">✏️ پیش‌نویس</span>;
    return <span className="badge archived">📦 بایگانی</span>;
  };

  if (loading) {
    return (
      <div className="exam-loading">
        <div className="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="exam-container">
      {message && (
        <div className={`exam-toast ${message.type}`}>
          {message.type === 'success' ? <FiCheckCircle size={18} /> : <FiX size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><FiX size={14} /></button>
        </div>
      )}

      {/* ========== بنر محدودیت‌های معلم ========== */}
      {!loadingLimits && teacherLimits && (
        <div className="teacher-limits-banner">
          <div className="limit-item">
            <span>📊 آزمون‌های باقی‌مانده:</span>
            <strong className={teacherLimits.exams_remaining <= 0 ? 'warning' : 'success'}>
              {teacherLimits.exams_remaining}
            </strong>
            <span>از {teacherLimits.max_exams}</span>
          </div>
          <div className="limit-item">
            <span>📝 سوالات باقی‌مانده:</span>
            <strong className={teacherLimits.questions_remaining <= 0 ? 'warning' : 'success'}>
              {teacherLimits.questions_remaining}
            </strong>
            <span>از {teacherLimits.max_questions}</span>
          </div>
          {teacherLimits.exams_remaining <= 0 && (
            <div className="limit-warning">
              <FiAlertCircle size={16} />
              ⚠️ سقف آزمون ماهانه شما کامل شده است!
              <button 
                onClick={() => window.location.href = '/dashboard/subscription'}
                className="upgrade-btn-small"
              >
                ارتقا اشتراک
              </button>
            </div>
          )}
          {teacherLimits.questions_remaining <= 0 && teacherLimits.exams_remaining > 0 && (
            <div className="limit-warning">
              <FiAlertCircle size={16} />
              ⚠️ سقف سوالات ماهانه شما کامل شده است!
            </div>
          )}
        </div>
      )}

      <div className="exams-content">
        <div className="section-header">
          <h3>📚 آزمون‌های کلاس {className}</h3>
          <button 
            className={`btn-create ${!canCreateExam() ? 'disabled' : ''}`} 
            onClick={() => {
              if (!canCreateExam()) {
                setMessage({ 
                  type: 'error', 
                  text: `⚠️ سقف ${teacherLimits?.max_exams} آزمون ماهانه شما کامل شده است.` 
                });
                setTimeout(() => setMessage(null), 3000);
                return;
              }
              setShowExamModal(true);
              setIsEditing(false);
              setEditingExam(null);
              setGeneratedExam(null);
              setEditingQuestions([]);
              setExamTitle('');
              setExamDescription('');
            }}
            disabled={!canCreateExam()}
          >
            <FiPlus size={16} /> 
            {canCreateExam() ? 'ساخت آزمون جدید' : 'سقف آزمون کامل شده'}
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>هنوز آزمونی ایجاد نشده است</p>
            {canCreateExam() ? (
              <button className="btn-primary" onClick={() => setShowExamModal(true)}>✨ ساخت اولین آزمون</button>
            ) : (
              <p className="limit-text">سقف آزمون ماهانه شما کامل شده است</p>
            )}
          </div>
        ) : (
          <div className="exams-list">
            {exams.map(exam => (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <div>
                    <h4>{exam.title}</h4>
                    {exam.description && <p>{exam.description}</p>}
                  </div>
                  {getStatusBadge(exam.status)}
                </div>
                <div className="exam-card-stats">
                  <span><FiUsers size={14} /> {exam.submission_count || 0} شرکت‌کننده</span>
                  <span><FiBarChart2 size={14} /> میانگین: {exam.avg_score || 0}%</span>
                  <span><FiClock size={14} /> {new Date(exam.created_at).toLocaleDateString('fa-IR')}</span>
                </div>
                <div className="exam-card-actions">
                  <button className="btn-edit" onClick={() => handleEditExam(exam)}>
                    <FiEdit2 size={14} /> ویرایش سوالات
                  </button>
                  {exam.status === 'draft' && (
                    <button className="btn-publish" onClick={() => handlePublishExam(exam.id)}>
                      <FiSend size={14} /> انتشار در کلاس
                    </button>
                  )}
                  <button className="btn-results" onClick={() => handleViewResults(exam.id)}>
                    <FiEye size={14} /> نتایج
                  </button>
                  <button className="btn-delete" onClick={() => handleDeleteExam(exam.id)}>
                    <FiTrash2 size={14} /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال ساخت/ویرایش آزمون */}
      {showExamModal && (
        <div className="modal-overlay" onClick={() => {
          setShowExamModal(false);
          setIsEditing(false);
          setGeneratedExam(null);
          setEditingExam(null);
        }}>
          <div className="exam-modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? '✏️ ویرایش آزمون' : (generatedExam ? '✏️ ویرایش آزمون ساخته شده' : '✨ ساخت آزمون هوشمند')}</h3>
              <button onClick={() => {
                setShowExamModal(false);
                setIsEditing(false);
                setGeneratedExam(null);
                setEditingExam(null);
              }}><FiX size={20} /></button>
            </div>
            <div className="modal-body">
              {/* نمایش محدودیت‌ها در مودال */}
              {teacherLimits && (
                <div className="modal-limits-info">
                  <span>📝 سوالات باقی‌مانده: <strong>{teacherLimits.questions_remaining}</strong></span>
                  <span>📊 آزمون‌های باقی‌مانده: <strong>{teacherLimits.exams_remaining}</strong></span>
                </div>
              )}

              {errorDetail && (
                <div className="error-box">
                  <FiX size={20} />
                  <div><strong>خطا:</strong><p>{errorDetail}</p></div>
                </div>
              )}
              
              {isGenerating && (
                <div className="generating-overlay">
                  <div className="spinner"></div>
                  <p>🤖 در حال ساخت آزمون با هوش مصنوعی...</p>
                </div>
              )}
              
              {!generatedExam && !isEditing && !isGenerating && (
                <ConfigurationForm 
                  onStartExam={handleStartExam} 
                  initialConfig={examConfig} 
                  error={null}
                  limits={{
                    maxExams: teacherLimits?.exams_remaining || 5,
                    maxQuestions: teacherLimits?.questions_remaining || 15,
                    maxFileSize: 1.5,
                    examsUsed: 0
                  }}
                />
              )}
              
              {(generatedExam || isEditing) && !isGenerating && (
                <div className="exam-editor">
                  <div className="exam-info-section">
                    <div className="form-row">
                      <div className="form-group">
                        <label>عنوان آزمون</label>
                        <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="عنوان آزمون" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>توضیحات</label>
                      <textarea value={examDescription} onChange={(e) => setExamDescription(e.target.value)} placeholder="توضیحات آزمون..." rows={2} />
                    </div>
                  </div>

                  <div className="edit-exam-body">
                    <div className="edit-sidebar">
                      <div className="questions-list-header">
                        <span>سوالات ({editingQuestions.length})</span>
                        <button 
                          className="add-question-btn" 
                          onClick={handleAddQuestion}
                          disabled={editingQuestions.length >= (teacherLimits?.questions_remaining || 15)}
                        >
                          <FiPlus size={14} /> سوال جدید
                        </button>
                      </div>
                      <div className="questions-list">
                        {editingQuestions.map((q: any, idx: number) => (
                          <div key={idx} className={`question-item ${selectedQuestionIndex === idx ? 'active' : ''}`} onClick={() => setSelectedQuestionIndex(idx)}>
                            <span className="q-num">{idx + 1}</span>
                            <span className="q-preview">{q.prompt?.substring(0, 35) || 'بدون متن'}...</span>
                            <div className="question-actions">
                              <button onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'up'); }} disabled={idx === 0}><FiArrowUp size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveQuestion(idx, 'down'); }} disabled={idx === editingQuestions.length - 1}><FiArrowDown size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDuplicateQuestion(idx); }}><FiCopy size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }}><FiTrash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="edit-main">
                      {selectedQuestionIndex !== null && editingQuestions[selectedQuestionIndex] && (
                        <div className="question-editor">
                          <div className="form-group">
                            <label>متن سوال</label>
                            <textarea value={editingQuestions[selectedQuestionIndex].prompt || ''} onChange={(e) => handleUpdateQuestion(selectedQuestionIndex, { ...editingQuestions[selectedQuestionIndex], prompt: e.target.value })} rows={3} placeholder="متن سوال..." />
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label>نوع سوال</label>
                              <select value={editingQuestions[selectedQuestionIndex].type || 'mcq'} onChange={(e) => {
                                const newType = e.target.value;
                                const currentQ = editingQuestions[selectedQuestionIndex];
                                let updatedQ = { ...currentQ, type: newType };
                                if (newType === 'mcq') {
                                  updatedQ.options = [
                                    { id: 'a', text: 'گزینه ۱', is_correct: false },
                                    { id: 'b', text: 'گزینه ۲', is_correct: false },
                                    { id: 'c', text: 'گزینه ۳', is_correct: false },
                                    { id: 'd', text: 'گزینه ۴', is_correct: true }
                                  ];
                                  updatedQ.correct_answer = '';
                                } else if (newType === 'tf') {
                                  updatedQ.options = [
                                    { id: 'true', text: 'درست', is_correct: true },
                                    { id: 'false', text: 'نادرست', is_correct: false }
                                  ];
                                  updatedQ.correct_answer = '';
                                } else {
                                  updatedQ.options = [];
                                }
                                handleUpdateQuestion(selectedQuestionIndex, updatedQ);
                              }}>
                                <option value="mcq">چهارگزینه‌ای</option>
                                <option value="tf">درست/نادرست</option>
                                <option value="fitb">جای خالی</option>
                                <option value="short">پاسخ کوتاه</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>سطح دشواری (۱-۵)</label>
                              <input type="number" min="1" max="5" value={editingQuestions[selectedQuestionIndex].difficulty || 3} onChange={(e) => handleUpdateQuestion(selectedQuestionIndex, { ...editingQuestions[selectedQuestionIndex], difficulty: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                              <label>امتیاز</label>
                              <input type="number" min="1" max="10" value={editingQuestions[selectedQuestionIndex].points || 2} onChange={(e) => handleUpdateQuestion(selectedQuestionIndex, { ...editingQuestions[selectedQuestionIndex], points: parseInt(e.target.value) })} />
                            </div>
                          </div>
                          
                          {(editingQuestions[selectedQuestionIndex].type === 'mcq' || editingQuestions[selectedQuestionIndex].type === 'tf') && (
                            <div className="options-editor">
                              <label>گزینه‌ها</label>
                              {editingQuestions[selectedQuestionIndex].options?.map((opt: any, optIdx: number) => (
                                <div key={optIdx} className="option-row">
                                  <span className="option-letter">{opt.id || String.fromCharCode(97 + optIdx)}</span>
                                  <input type="text" value={opt.text} onChange={(e) => handleUpdateOption(selectedQuestionIndex, optIdx, 'text', e.target.value)} placeholder={`گزینه ${optIdx + 1}`} />
                                  <button className={`correct-btn ${opt.is_correct ? 'active' : ''}`} onClick={() => handleSetCorrectOption(selectedQuestionIndex, optIdx)}>
                                    {opt.is_correct ? '✓ پاسخ صحیح' : 'تعیین به عنوان صحیح'}
                                  </button>
                                  {editingQuestions[selectedQuestionIndex].options.length > 2 && (
                                    <button className="remove-option" onClick={() => handleRemoveOption(selectedQuestionIndex, optIdx)}><FiTrash2 size={14} /></button>
                                  )}
                                </div>
                              ))}
                              {editingQuestions[selectedQuestionIndex].type === 'mcq' && (
                                <button className="add-option-btn" onClick={() => handleAddOption(selectedQuestionIndex)}><FiPlus size={14} /> افزودن گزینه</button>
                              )}
                            </div>
                          )}
                          
                          {(editingQuestions[selectedQuestionIndex].type === 'fitb' || editingQuestions[selectedQuestionIndex].type === 'short') && (
                            <div className="form-group">
                              <label>پاسخ صحیح</label>
                              <input type="text" value={editingQuestions[selectedQuestionIndex].correct_answer || ''} onChange={(e) => handleUpdateQuestion(selectedQuestionIndex, { ...editingQuestions[selectedQuestionIndex], correct_answer: e.target.value })} placeholder="پاسخ صحیح را وارد کنید" />
                            </div>
                          )}
                          
                          <div className="form-group">
                            <label>برچسب‌های مفهومی (با کاما جدا کنید)</label>
                            <input type="text" value={editingQuestions[selectedQuestionIndex].concept_tags?.join(', ') || ''} onChange={(e) => handleUpdateQuestion(selectedQuestionIndex, { ...editingQuestions[selectedQuestionIndex], concept_tags: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t) })} placeholder="مثال: جبر, معادله" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setShowExamModal(false)}>انصراف</button>
                    <button className="btn-save" onClick={isEditing ? handleSaveExamChanges : handleSaveToClass}>
                      <FiSave size={16} /> {isEditing ? '💾 ذخیره تغییرات' : '📤 ذخیره در کلاس'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* مودال نتایج آزمون */}
      {showResults && (
        <div className="modal-overlay" onClick={() => setShowResults(null)}>
          <div className="results-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 نتایج آزمون</h3>
              <button onClick={() => setShowResults(null)}><FiX size={20} /></button>
            </div>
            
            {examStats && (
              <div className="results-stats">
                <div className="stat-item">
                  <span>📊 میانگین</span>
                  <strong>{examStats.avg_score || 0}%</strong>
                </div>
                <div className="stat-item">
                  <span>🏆 بالاترین</span>
                  <strong>{examStats.max_score || 0}%</strong>
                </div>
                <div className="stat-item">
                  <span>📉 کمترین</span>
                  <strong>{examStats.min_score || 0}%</strong>
                </div>
                <div className="stat-item">
                  <span>✅ قبول شدگان</span>
                  <strong>{examStats.passed_count || 0} نفر</strong>
                </div>
              </div>
            )}
            
            <div className="results-list">
              {examResults.length === 0 ? (
                <div className="empty-results">
                  <p>هنوز هیچ دانش‌آموزی در این آزمون شرکت نکرده است</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>دانش‌آموز</th>
                        <th>نمره</th>
                        <th>درصد</th>
                        <th>تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.map(r => (
                        <tr key={r.id}>
                          <td>{r.student_name}</td>
                          <td>{r.score}/{r.total_points}</td>
                          <td className={r.score_percentage >= 50 ? 'success' : 'danger'}>
                            {r.score_percentage}%
                          </td>
                          <td>{new Date(r.submitted_at).toLocaleDateString('fa-IR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowResults(null)}>بستن</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .exam-container {
          padding: 16px;
          direction: rtl;
        }

        .exam-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1100;
          animation: slideIn 0.3s ease;
        }

        .exam-toast.success { background: #10b981; color: white; }
        .exam-toast.error { background: #ef4444; color: white; }
        .exam-toast button { background: none; border: none; color: white; cursor: pointer; }

        /* ========== بنر محدودیت‌های معلم ========== */
        .teacher-limits-banner {
          display: flex;
          gap: 24px;
          padding: 12px 20px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
          align-items: center;
        }

        .teacher-limits-banner .limit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #475569;
        }

        .teacher-limits-banner .limit-item strong {
          font-size: 1.1rem;
          font-weight: 700;
          padding: 0 4px;
        }

        .teacher-limits-banner .limit-item .warning {
          color: #ef4444;
        }

        .teacher-limits-banner .limit-item .success {
          color: #10b981;
        }

        .teacher-limits-banner .limit-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #991b1b;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #fecaca;
          flex-wrap: wrap;
        }

        .upgrade-btn-small {
          background: #ef4444;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .upgrade-btn-small:hover {
          background: #dc2626;
        }

        /* ========== مودال محدودیت‌ها ========== */
        .modal-limits-info {
          display: flex;
          gap: 20px;
          padding: 10px 16px;
          background: #eff6ff;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          color: #1e40af;
          flex-wrap: wrap;
        }

        .modal-limits-info strong {
          font-weight: 700;
        }

        /* ========== دکمه ساخت آزمون غیرفعال ========== */
        .btn-create.disabled {
          background: #94a3b8;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-create.disabled:hover {
          background: #94a3b8;
        }

        .limit-text {
          color: #ef4444;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 { margin: 0; font-size: 1rem; color: #1e293b; }

        .btn-create {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .btn-create:hover:not(.disabled) {
          background: #1d4ed8;
        }

        .exams-list { display: flex; flex-direction: column; gap: 12px; }

        .exam-card {
          background: white;
          border-radius: 14px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .exam-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .exam-card-header h4 { margin: 0 0 4px 0; font-size: 1rem; }
        .exam-card-header p { margin: 0; color: #64748b; font-size: 0.75rem; }

        .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .badge.published { background: #d1fae5; color: #065f46; }
        .badge.draft { background: #fef3c7; color: #92400e; }

        .exam-card-stats {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 12px;
          font-size: 0.75rem;
          color: #64748b;
          flex-wrap: wrap;
        }

        .exam-card-stats span { display: flex; align-items: center; gap: 5px; }

        .exam-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .btn-publish, .btn-results, .btn-delete, .btn-edit {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.7rem;
        }

        .btn-publish { background: #10b981; color: white; }
        .btn-results { background: #3b82f6; color: white; }
        .btn-delete { background: #ef4444; color: white; }
        .btn-edit { background: #8b5cf6; color: white; }

        .empty-state {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 14px;
          color: #94a3b8;
        }

        .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; }

        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .exam-modal-large, .results-modal {
          background: white;
          border-radius: 24px;
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .results-modal { max-width: 650px; }

        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 { margin: 0; font-size: 1.1rem; }
        .modal-header button { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #94a3b8; }

        .modal-body { padding: 20px; }
        .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; }

        .exam-editor { display: flex; flex-direction: column; gap: 20px; }
        .exam-info-section { background: #f8fafc; padding: 16px; border-radius: 12px; }

        .edit-exam-body { display: flex; gap: 20px; min-height: 400px; max-height: 500px; overflow: hidden; }

        .edit-sidebar {
          width: 350px;
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .questions-list-header {
          padding: 12px;
          background: #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .questions-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .question-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
        }

        .question-item.active { background: #eff6ff; border-color: #2563eb; }

        .q-num {
          width: 28px;
          height: 28px;
          background: #e2e8f0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .question-item.active .q-num { background: #2563eb; color: white; }

        .q-preview { flex: 1; font-size: 0.8rem; color: #475569; }

        .question-actions { display: flex; gap: 4px; }
        .question-actions button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #94a3b8; }
        .question-actions button:hover { background: #e2e8f0; }
        .question-actions button:disabled { opacity: 0.3; cursor: not-allowed; }

        .edit-main {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .question-editor { display: flex; flex-direction: column; gap: 16px; }

        .options-editor { background: #f8fafc; padding: 16px; border-radius: 12px; }

        .option-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .option-letter { width: 30px; font-weight: 600; color: #475569; }
        .option-row input { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; }

        .correct-btn {
          padding: 6px 12px;
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.7rem;
          white-space: nowrap;
        }

        .correct-btn.active { background: #10b981; color: white; }

        .remove-option { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
        .remove-option:hover { color: #ef4444; }

        .add-option-btn, .add-question-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.7rem;
        }

        .add-question-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.8rem; font-weight: 500; color: #475569; }
        .form-group input, .form-group textarea, .form-group select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
        }

        .btn-cancel {
          flex: 1;
          padding: 10px;
          background: #e2e8f0;
          color: #475569;
          border: none;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-save {
          flex: 1;
          padding: 10px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-close { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

        .results-stats {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f1f5f9;
          flex-wrap: wrap;
        }

        .results-stats .stat-item {
          flex: 1;
          background: white;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }

        .results-stats .stat-item span { display: block; font-size: 0.7rem; color: #64748b; }
        .results-stats .stat-item strong { display: block; font-size: 1.2rem; margin-top: 4px; }

        .results-list { padding: 16px; overflow-x: auto; }
        .table-wrapper { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; }
        th { background: #f8fafc; font-weight: 600; }
        td.success { color: #10b981; font-weight: bold; }
        td.danger { color: #ef4444; font-weight: bold; }

        .empty-results { text-align: center; padding: 40px; color: #94a3b8; }

        .error-box {
          background: #fee2e2;
          border-right: 4px solid #ef4444;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 20px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .generating-overlay { text-align: center; padding: 40px 20px; }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .exam-loading { text-align: center; padding: 40px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        @media (max-width: 900px) {
          .edit-exam-body { flex-direction: column; }
          .edit-sidebar { width: 100%; max-height: 250px; }
          .form-row { grid-template-columns: 1fr; }
          .exam-modal-large { width: 98%; }
          .results-stats { flex-direction: column; }
          .option-row { flex-wrap: wrap; }
          .teacher-limits-banner { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>
    </div>
  );
};

export default ClassExamManager;