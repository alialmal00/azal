// src/components/SavedExamsList.tsx
import React, { useState, useEffect } from 'react';
import { 
    FiFileText, FiStar, FiTrash2, FiEye, FiDownload,
    FiBarChart2, FiCalendar, FiMoreVertical, FiCopy,
    FiShare2, FiMail, FiMessageCircle, FiLink,
    FiCheck, FiX, FiRefreshCw
} from 'react-icons/fi';
import { examStorageService, SavedExam, SavedExamDetail } from '../services/examStorageService';
import { toPersianNumbers } from '../utils/persianUtils';

interface Props {
    onViewExam: (examId: number) => void;
    onRecreateExam: (config: any) => void;
}

const SavedExamsList: React.FC<Props> = ({ onViewExam, onRecreateExam }) => {
    const [exams, setExams] = useState<SavedExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
    const [selectedExam, setSelectedExam] = useState<number | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadExams();
        loadStats();
    }, [filter]);

    const loadExams = async () => {
        setRefreshing(true);
        const result = await examStorageService.getUserExams({
            is_favorite: filter === 'favorites' ? true : undefined,
            limit: filter === 'recent' ? 10 : undefined
        });
        
        if (result.success && result.exams) {
            setExams(result.exams);
        }
        setRefreshing(false);
        setLoading(false);
    };

    const loadStats = async () => {
        const result = await examStorageService.getUserStats();
        if (result.success && result.stats) {
            setStats(result.stats);
        }
    };

    const handleToggleFavorite = async (examId: number, currentValue: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await examStorageService.updateExam(examId, { is_favorite: !currentValue });
        
        if (result.success) {
            setExams(exams.map(e => 
                e.id === examId ? { ...e, is_favorite: !currentValue } : e
            ));
            setMessage({ type: 'success', text: currentValue ? 'از موارد علاقه‌مندی حذف شد' : 'به موارد علاقه‌مندی اضافه شد' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteExam = async (examId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('آیا از حذف این آزمون اطمینان دارید؟')) return;
        
        const result = await examStorageService.deleteExam(examId);
        if (result.success) {
            setExams(exams.filter(e => e.id !== examId));
            if (selectedExam === examId) setSelectedExam(null);
            setMessage({ type: 'success', text: 'آزمون با موفقیت حذف شد' });
            setTimeout(() => setMessage(null), 3000);
            loadStats();
        }
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 70) return 'text-green-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'ترکیبی': 'mixed',
            'چهارگزینه‌ای': 'mcq',
            'جای‌خالی': 'fitb',
            'درست/نادرست': 'tf',
            'پاسخ‌کوتاه': 'short'
        };
        return types[type] || type;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="saved-exams-container">
            {/* پیام وضعیت */}
            {message && (
                <div className={`message-toast ${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.type === 'success' ? <FiCheck /> : <FiX />}
                    {message.text}
                </div>
            )}

            {/* آمار کلی */}
            {stats && (
                <div className="stats-grid mb-8">
                    <div className="stat-card">
                        <FiFileText className="stat-icon" />
                        <div>
                            <h4>{toPersianNumbers(stats.totalExams || 0)}</h4>
                            <p>تعداد آزمون‌ها</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FiBarChart2 className="stat-icon" />
                        <div>
                            <h4>{toPersianNumbers(Math.round(stats.averageScore || 0))}%</h4>
                            <p>میانگین نمره</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <h4>{toPersianNumbers(stats.totalCorrect || 0)}</h4>
                        </div>
                        <p>پاسخ صحیح</p>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">✗</span>
                            <h4>{toPersianNumbers(stats.totalWrong || 0)}</h4>
                        </div>
                        <p>پاسخ غلط</p>
                    </div>
                </div>
            )}

            {/* فیلترها */}
            <div className="filters mb-6">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    همه آزمون‌ها
                </button>
                <button
                    className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
                    onClick={() => setFilter('favorites')}
                >
                    <FiStar /> مورد علاقه
                </button>
                <button
                    className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
                    onClick={() => setFilter('recent')}
                >
                    <FiCalendar /> آخرین
                </button>
                <button
                    className={`filter-btn ${refreshing ? 'refreshing' : ''}`}
                    onClick={loadExams}
                >
                    <FiRefreshCw /> بروزرسانی
                </button>
            </div>

            {/* لیست آزمون‌ها */}
            {exams.length === 0 ? (
                <div className="empty-state">
                    <FiFileText size={48} />
                    <h3>هنوز آزمونی ذخیره نکرده‌اید</h3>
                    <p>پس از اتمام هر آزمون، نتایج آن در اینجا ذخیره می‌شود</p>
                </div>
            ) : (
                <div className="exams-grid">
                    {exams.map((exam) => (
                        <div key={exam.id} className={`exam-card ${exam.is_favorite ? 'favorite' : ''}`}>
                            <div className="exam-header">
                                <div className="exam-type-badge" data-type={getTypeLabel(exam.exam_type)}>
                                    {exam.exam_type}
                                </div>
                                <button
                                    className={`favorite-btn ${exam.is_favorite ? 'active' : ''}`}
                                    onClick={(e) => handleToggleFavorite(exam.id, exam.is_favorite, e)}
                                >
                                    <FiStar />
                                </button>
                            </div>

                            <h3 className="exam-title">{exam.exam_title}</h3>

                            <div className="exam-meta">
                                <span className="difficulty-badge" data-difficulty={exam.difficulty}>
                                    {exam.difficulty}
                                </span>
                                <span className="exam-date">
                                    {new Date(exam.created_at).toLocaleDateString('fa-IR')}
                                </span>
                            </div>

                            <div className="exam-stats">
                                <div className="score-circle" style={{
                                    background: `conic-gradient(${
                                        exam.score_percentage >= 70 ? '#10b981' :
                                        exam.score_percentage >= 50 ? '#f59e0b' : '#ef4444'
                                    } ${exam.score_percentage * 3.6}deg, #e5e7eb 0deg)`
                                }}>
                                    <span className={getScoreColor(exam.score_percentage)}>
                                        {toPersianNumbers(Math.round(exam.score_percentage || 0))}%
                                    </span>
                                </div>

                                <div className="stats-detail">
                                    <div className="stat-row">
                                        <span>صحیح:</span>
                                        <span className="correct">
                                            {toPersianNumbers(exam.correct_count || 0)}
                                        </span>
                                    </div>
                                    <div className="stat-row">
                                        <span>غلط:</span>
                                        <span className="wrong">
                                            {toPersianNumbers(exam.wrong_count || 0)}
                                        </span>
                                    </div>
                                    <div className="stat-row">
                                        <span>امتیاز:</span>
                                        <span>
                                            {toPersianNumbers(exam.score || 0)}/{toPersianNumbers(exam.total_points || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* دکمه‌های اقدام - فقط مشاهده و حذف */}
                            <div className="exam-actions">
                                <button
                                    className="action-btn view"
                                    onClick={() => onViewExam(exam.id)}
                                    title="مشاهده نتایج"
                                >
                                    <FiEye />
                                </button>
                                
                                <button
                                    className="action-btn delete"
                                    onClick={(e) => handleDeleteExam(exam.id, e)}
                                    title="حذف آزمون"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .saved-exams-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                    position: relative;
                }
                .message-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 12px 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    border-right: 4px solid;
                }
                .message-toast.success { border-right-color: #10b981; color: #065f46; }
                .message-toast.error { border-right-color: #ef4444; color: #991b1b; }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    border: 1px solid #e5e7eb;
                }
                .stat-icon { font-size: 24px; color: #2563eb; }
                .stat-card h4 { font-size: 1.5rem; font-weight: 700; margin: 0; }
                .stat-card p { margin: 0; color: #6b7280; font-size: 0.9rem; }
                .filters {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    padding: 10px 20px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                .filter-btn:hover { background: #f3f4f6; }
                .filter-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
                .filter-btn.refreshing { opacity: 0.6; cursor: wait; }
                .exams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .exam-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    border: 1px solid #e5e7eb;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .exam-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
                .exam-card.favorite { border-color: #fbbf24; }
                .exam-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .exam-type-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .exam-type-badge[data-type="mixed"] { background: #e0f2fe; color: #0369a1; }
                .exam-type-badge[data-type="mcq"] { background: #dcfce7; color: #166534; }
                .exam-type-badge[data-type="fitb"] { background: #fef9c3; color: #854d0e; }
                .exam-type-badge[data-type="tf"] { background: #f3e8ff; color: #6b21a8; }
                .exam-type-badge[data-type="short"] { background: #ffe4e6; color: #9f1239; }
                .favorite-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #9ca3af;
                    transition: all 0.3s ease;
                }
                .favorite-btn.active { color: #fbbf24; }
                .exam-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    color: #1f2937;
                }
                .exam-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .difficulty-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .difficulty-badge[data-difficulty="آسان"] { background: #dcfce7; color: #166534; }
                .difficulty-badge[data-difficulty="متوسط"] { background: #fef9c3; color: #854d0e; }
                .difficulty-badge[data-difficulty="سخت"] { background: #fee2e2; color: #991b1b; }
                .exam-date { color: #6b7280; font-size: 0.8rem; }
                .exam-stats {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .score-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.2rem;
                    background: #e5e7eb;
                    flex-shrink: 0;
                }
                .stats-detail { flex: 1; }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 0.9rem;
                }
                .stat-row .correct { color: #10b981; font-weight: 600; }
                .stat-row .wrong { color: #ef4444; font-weight: 600; }
                .exam-actions {
                    display: flex;
                    gap: 8px;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 15px;
                }
                .action-btn {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .action-btn.view:hover { background: #2563eb; color: white; border-color: #2563eb; }
                .action-btn.delete:hover { background: #ef4444; color: white; border-color: #ef4444; }
                .empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
                .empty-state svg { margin-bottom: 20px; color: #d1d5db; }
                .empty-state h3 { color: #4b5563; margin-bottom: 10px; }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .exams-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default SavedExamsList;