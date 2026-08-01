// components/ConfigurationForm.tsx
import React, { useState } from 'react';
import type { ExamConfig, ExamType, Difficulty } from '../types';
import { FileText, Settings, User, Book, Hash, BarChart3, Clock, Edit3, AlertCircle } from 'lucide-react';
import '../styles/exam-config.css';

interface Props {
  onStartExam: (config: ExamConfig) => void;
  initialConfig: ExamConfig;
  error: string | null;
  limits?: {
    maxExams: number;
    maxQuestions: number;
    maxFileSize: number;
    examsUsed: number;
  };
}

const TIME_OPTIONS = [
  { value: 5, label: '۵ دقیقه' },
  { value: 10, label: '۱۰ دقیقه' },
  { value: 15, label: '۱۵ دقیقه' },
  { value: 20, label: '۲۰ دقیقه' },
  { value: 30, label: '۳۰ دقیقه' },
  { value: 45, label: '۴۵ دقیقه' },
  { value: 60, label: '۱ ساعت' },
  { value: 90, label: '۱.۵ ساعت' },
  { value: 120, label: '۲ ساعت' },
  { value: 0, label: '⏱️ زمان دلخواه' }
];

const ConfigurationForm: React.FC<Props> = ({ 
  onStartExam, 
  initialConfig, 
  error,
  limits 
}) => {
  const [config, setConfig] = useState<ExamConfig>({
    ...initialConfig,
    exam_duration: initialConfig.exam_duration || 30
  });
  const [sourceMethod, setSourceMethod] = useState<'text' | 'file'>('text');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [customTime, setCustomTime] = useState<boolean>(false);
  const [customTimeValue, setCustomTimeValue] = useState<number>(30);
  const [fileSize, setFileSize] = useState<number>(0);

  // محدودیت‌ها از پلن کاربر
  const maxQuestions = limits?.maxQuestions || 5;
  const maxFileSize = limits?.maxFileSize || 1.5;
  const maxExams = limits?.maxExams || 2;
  const examsUsed = limits?.examsUsed || 0;
  const remainingExams = maxExams - examsUsed;
  const isExamLimitReached = remainingExams <= 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      setFileSize(fileSizeMB);

      if (fileSizeMB > maxFileSize) {
        alert(`❌ حجم فایل (${fileSizeMB.toFixed(2)} MB) از حد مجاز ${maxFileSize} MB بیشتر است!`);
        return;
      }

      setFileName(file.name);
      setIsProcessingFile(true);
      setConfig(prev => ({ ...prev, source_text: '' }));

      try {
        let text = '';
        if (file.type === 'application/pdf') {
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('PDF library is not loaded.');
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const pageTexts = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
            pageTexts.push(pageText);
          }
          text = pageTexts.join('\n\n');
        } else if (file.type.startsWith('text/')) {
          text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
          });
        } else {
          alert(`فایل با فرمت ${file.type} پشتیبانی نمی‌شود. لطفاً فایل متنی یا PDF بارگذاری کنید.`);
        }
        setConfig(prev => ({ ...prev, source_text: text }));
      } catch (err) {
        console.error("Error processing file:", err);
        alert("خطا در پردازش فایل. لطفاً فایل دیگری را امتحان کنید.");
        setFileName('');
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleTimeChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue === 0) {
      setCustomTime(true);
    } else {
      setCustomTime(false);
      setConfig(prev => ({ ...prev, exam_duration: numValue }));
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomTimeValue(value);
      setConfig(prev => ({ ...prev, exam_duration: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isExamLimitReached) {
      alert(`⚠️ سقف ${maxExams} آزمون ماهانه شما کامل شده است. برای ساخت آزمون جدید، اشتراک خود را ارتقا دهید.`);
      return;
    }

    if (!config.source_text || config.source_text.trim() === '') {
      alert("لطفاً یک منبع متنی (متن یا فایل) ارائه دهید.");
      return;
    }

    onStartExam(config);
  };

  const renderInputField = (id: string, label: string, Icon: React.ElementType, children: React.ReactNode) => (
    <div className="exam-config-field">
      <label htmlFor={id} className="exam-config-label">
        <Icon className="w-5 h-5" />
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="exam-config-wrapper">
      <div className="exam-config-card">
        <h2 className="exam-config-title">آزمون ساز هوشمند</h2>
        <p className="exam-config-subtitle">تنظیمات آزمون خود را مشخص کنید</p>
        
        {/* نمایش محدودیت‌ها */}
        <div className="exam-limits-bar">
          <div className="limit-item">
            <span>📊 آزمون باقی‌مانده: {remainingExams} از {maxExams}</span>
            {isExamLimitReached && <span className="limit-full">⛔ کامل شده</span>}
          </div>
          <div className="limit-item">
            <span>📝 حداکثر سوال: {maxQuestions}</span>
          </div>
          <div className="limit-item">
            <span>💾 حداکثر حجم فایل: {maxFileSize} MB</span>
          </div>
        </div>

        {error && <div className="exam-config-error">{error}</div>}

        {/* هشدار محدودیت */}
        {isExamLimitReached && (
          <div className="exam-limit-banner">
            <AlertCircle size={20} />
            <span>
              ⚠️ سقف {maxExams} آزمون ماهانه شما کامل شده است. 
              برای ساخت آزمون جدید، اشتراک خود را ارتقا دهید.
            </span>
            <button onClick={() => window.location.href = '/dashboard/subscription'}>
              ارتقا اشتراک
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="exam-config-section">
            <h3 className="exam-config-section-title"><FileText className="ml-2" size={20}/>منبع آزمون</h3>
            <div className="exam-config-source-buttons">
              <button type="button" onClick={() => setSourceMethod('text')} className={`exam-config-source-btn ${sourceMethod === 'text' ? 'active' : 'inactive'}`}>
                متن ورودی
              </button>
              <button type="button" onClick={() => setSourceMethod('file')} className={`exam-config-source-btn ${sourceMethod === 'file' ? 'active' : 'inactive'}`}>
                بارگذاری فایل
              </button>
            </div>
            
            {sourceMethod === 'text' ? (
              <textarea
                id="source_text"
                className="exam-config-textarea"
                placeholder="متن کتاب، جزوه یا مقاله خود را اینجا وارد کنید..."
                value={config.source_text}
                onChange={(e) => setConfig(prev => ({ ...prev, source_text: e.target.value }))}
                disabled={isExamLimitReached}
              />
            ) : (
              <div className="exam-config-upload-area">
                <label htmlFor="file-upload" style={{ cursor: isProcessingFile ? 'wait' : 'pointer', display: 'block' }}>
                  {isProcessingFile ? (
                    <div>
                      <div className="spinner" style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        margin: '0 auto 12px',
                        animation: 'spin 0.8s linear infinite'
                      }}></div>
                      <p style={{ color: '#64748b', fontSize: '14px' }}>در حال پردازش فایل...</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="upload-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p><span className="font-semibold">برای انتخاب فایل کلیک کنید</span></p>
                      <p className="text-xs" style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>PDF, TXT, MD (حداکثر {maxFileSize} MB)</p>
                    </div>
                  )}
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.text,.pdf" disabled={isProcessingFile || isExamLimitReached} style={{ display: 'none' }} />
                </label>
              </div>
            )}
            {sourceMethod === 'file' && fileName && (
              <p className="text-sm text-gray-600 mt-3 text-center">فایل انتخاب شده: {fileName}</p>
            )}
          </div>

          <div className="exam-config-grid">
            {renderInputField('exam_type', 'نوع آزمون', Settings, (
              <select 
                id="exam_type" 
                value={config.exam_type} 
                onChange={(e) => setConfig(prev => ({...prev, exam_type: e.target.value as ExamType}))} 
                className="exam-config-select"
                disabled={isExamLimitReached}
              >
                <option>ترکیبی</option>
                <option>چهارگزینه‌ای</option>
                <option>جای‌خالی</option>
                <option>درست/نادرست</option>
                <option>پاسخ‌کوتاه</option>
              </select>
            ))}
            
            {renderInputField('difficulty', 'سطح دشواری', BarChart3, (
              <select 
                id="difficulty" 
                value={config.difficulty} 
                onChange={(e) => setConfig(prev => ({...prev, difficulty: e.target.value as Difficulty}))} 
                className="exam-config-select"
                disabled={isExamLimitReached}
              >
                <option>آسان</option>
                <option>متوسط</option>
                <option>سخت</option>
              </select>
            ))}
            
            {renderInputField('num_questions', 'تعداد سوالات', Hash, (
              <div>
                <input 
                  type="number" 
                  id="num_questions" 
                  value={config.num_questions} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val <= maxQuestions && val > 0) {
                      setConfig(prev => ({...prev, num_questions: val}));
                    } else if (val > maxQuestions) {
                      alert(`حداکثر ${maxQuestions} سوال در پلن شما مجاز است.`);
                    }
                  }} 
                  min="1" 
                  max={maxQuestions}
                  className="exam-config-input"
                  disabled={isExamLimitReached}
                />
                <span className="field-hint">حداکثر: {maxQuestions} سوال</span>
              </div>
            ))}
            
            {renderInputField('exam_duration', 'زمان آزمون', Clock, (
              <div className="space-y-3">
                <select 
                  id="exam_duration" 
                  value={customTime ? 0 : config.exam_duration} 
                  onChange={(e) => handleTimeChange(e.target.value)} 
                  className="exam-config-select"
                  disabled={isExamLimitReached}
                >
                  {TIME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {customTime && (
                  <div className="flex items-center gap-2 mt-2">
                    <Edit3 className="w-5 h-5 text-blue-500" />
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={customTimeValue}
                      onChange={handleCustomTimeChange}
                      className="exam-config-input flex-1"
                      placeholder="زمان دلخواه به دقیقه"
                      disabled={isExamLimitReached}
                    />
                    <span className="text-sm text-gray-600">دقیقه</span>
                  </div>
                )}
              </div>
            ))}
            
            {renderInputField('chapter_filter', 'فصل یا بخش (اختیاری)', Book, (
              <input 
                type="text" 
                id="chapter_filter" 
                value={config.chapter_filter} 
                onChange={(e) => setConfig(prev => ({...prev, chapter_filter: e.target.value}))} 
                placeholder="مثال: فصل دوم" 
                className="exam-config-input"
                disabled={isExamLimitReached}
              />
            ))}
            
            {renderInputField('user_name', 'نام شما (اختیاری)', User, (
              <input 
                type="text" 
                id="user_name" 
                value={config.user_name} 
                onChange={(e) => setConfig(prev => ({...prev, user_name: e.target.value}))} 
                placeholder="برای بازخورد شخصی‌سازی شده" 
                className="exam-config-input"
                disabled={isExamLimitReached}
              />
            ))}
          </div>

          <div className="text-center pt-4">
            <button 
              type="submit" 
              disabled={isProcessingFile || !config.source_text || isExamLimitReached} 
              className={`exam-config-submit-btn ${isExamLimitReached ? 'disabled' : ''}`}
            >
              {isExamLimitReached ? 'سقف آزمون ماهانه کامل شده' : 
               isProcessingFile ? 'در حال پردازش...' : 'شروع ساخت آزمون'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .exam-limits-bar {
          display: flex;
          gap: 20px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          border: 1px solid #e2e8f0;
        }

        .limit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #475569;
        }

        .limit-full {
          color: #ef4444;
          font-weight: 700;
        }

        .exam-limit-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          margin-bottom: 16px;
          color: #991b1b;
          flex-wrap: wrap;
        }

        .exam-limit-banner button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          margin-right: auto;
        }

        .exam-limit-banner button:hover {
          background: #dc2626;
        }

        .exam-config-submit-btn.disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .field-hint {
          display: block;
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .exam-limits-bar {
            flex-direction: column;
            gap: 8px;
          }
          .exam-limit-banner {
            flex-direction: column;
            text-align: center;
          }
          .exam-limit-banner button {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfigurationForm;