// src/pages/TakeClassExam.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ExamView from '../components/ExamView';
import { classExamService } from '../services/classExamService';
import { FiArrowRight, FiAlertCircle } from 'react-icons/fi';

interface LocationState {
  examId: number;
  examTitle: string;
  examData: any;
  examConfig: any;
  classId: number;
  className: string;
  timeLimit: number;
}

const TakeClassExam: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [examData, setExamData] = useState<any>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examId, setExamId] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state || !state.examData) {
      setError('اطلاعات آزمون یافت نشد');
      setLoading(false);
      return;
    }

    setExamId(state.examId);
    setExamTitle(state.examTitle);
    setExamData(state.examData);
    setClassName(state.className);
    setTimeLimit(state.timeLimit || 30);
    setLoading(false);
  }, [state]);

  const handleSubmit = async (answers: any, timeSpent: number) => {
    if (!examId) return;

    try {
      const result = await classExamService.submitExam(examId, answers, timeSpent);
      
      if (result.success) {
        alert(`✅ آزمون با موفقیت ثبت شد!\n\nنمره شما: ${result.score}/${result.totalPoints}\nدرصد: ${result.scorePercentage}%`);
        navigate('/app');
      } else {
        alert('❌ خطا در ثبت پاسخ‌ها: ' + result.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ خطا در ارتباط با سرور');
    }
  };

  const handleBack = () => {
    navigate('/app');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ marginRight: '10px' }}>در حال بارگذاری آزمون...</p>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
        <FiAlertCircle size={48} color="#ef4444" />
        <h3>خطا</h3>
        <p>{error || 'اطلاعات آزمون یافت نشد'}</p>
        <button onClick={handleBack} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <FiArrowRight style={{ display: 'inline', marginLeft: '8px' }} /> بازگشت به کلاس‌ها
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '16px 24px', background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>
          ← بازگشت
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{examTitle}</h2>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>کلاس: {className}</p>
        </div>
      </div>
      
      <ExamView
        examData={examData}
        onSubmit={handleSubmit}
        duration={timeLimit}
      />
    </div>
  );
};

export default TakeClassExam;