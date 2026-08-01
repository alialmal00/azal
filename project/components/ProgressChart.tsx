// src/components/ProgressChart.tsx
import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi';
import { examStorageService } from '../services/examStorageService';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';

interface ProgressChartProps {
    userId: number;
    userName: string;
    userRole: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ userId, userName }) => {
    const [exams, setExams] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalExams: 0,
        avgScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalQuestions: 0,
        totalCorrect: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        
        try {
            // دریافت آمار از API
            const statsResult = await examStorageService.getUserStats();
            console.log('📊 ProgressChart - Stats result:', statsResult);
            
            if (statsResult.success && statsResult.stats) {
                setStats({
                    totalExams: statsResult.stats.totalExams || 0,
                    avgScore: statsResult.stats.averageScore || 0,
                    bestScore: statsResult.stats.bestScore || 0,
                    worstScore: statsResult.stats.worstScore || 0,
                    totalQuestions: statsResult.stats.totalQuestions || 0,
                    totalCorrect: statsResult.stats.totalCorrect || 0
                });
            } else {
                // اگر خطایی رخ داد، مقادیر پیش‌فرض
                setStats({
                    totalExams: 0,
                    avgScore: 0,
                    bestScore: 0,
                    worstScore: 0,
                    totalQuestions: 0,
                    totalCorrect: 0
                });
            }
            
            // دریافت لیست آزمون‌ها برای نمودار زمانی
            const examsResult = await examStorageService.getUserExams({ limit: 50 });
            console.log('📊 ProgressChart - Exams result:', examsResult);
            
            if (examsResult.success && examsResult.exams) {
                // فقط آزمون‌های کامل شده را نمایش بده
                const completedExams = examsResult.exams.filter(e => e.status === 'completed');
                const sortedExams = [...completedExams].sort((a, b) => 
                    new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime()
                );
                setExams(sortedExams);
            }
        } catch (error) {
            console.error('Error loading progress chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    // داده‌های نمودار پیشرفت زمانی
    const chartData = exams.map(exam => ({
        name: new Date(exam.completed_at || exam.created_at).toLocaleDateString('fa-IR'),
        درصد: exam.score_percentage || 0,
        امتیاز: exam.score || 0
    }));

    // توزیع نمرات
    const scoreRanges = [
        { range: '۰-۲۰', count: 0, color: '#ef4444' },
        { range: '۲۱-۴۰', count: 0, color: '#f59e0b' },
        { range: '۴۱-۶۰', count: 0, color: '#eab308' },
        { range: '۶۱-۸۰', count: 0, color: '#10b981' },
        { range: '۸۱-۱۰۰', count: 0, color: '#2563eb' }
    ];
    
    exams.forEach(exam => {
        const score = exam.score_percentage || 0;
        if (score <= 20) scoreRanges[0].count++;
        else if (score <= 40) scoreRanges[1].count++;
        else if (score <= 60) scoreRanges[2].count++;
        else if (score <= 80) scoreRanges[3].count++;
        else scoreRanges[4].count++;
    });

    if (loading) {
        return (
            <div className="progress-loading">
                <div className="spinner"></div>
                <p>در حال بارگذاری...</p>
            </div>
        );
    }

    return (
        <div className="progress-chart-container">
            <div className="progress-header">
                <h1>📈 نمودار پیشرفت تحصیلی</h1>
                <p>{userName} عزیز، عملکرد خود را در طول زمان مشاهده کنید</p>
            </div>

            {/* کارت‌های آمار کلی */}
            <div className="progress-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><FiBarChart2 size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.totalExams}</h3>
                        <p>تعداد آزمون‌ها</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FiTrendingUp size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.avgScore}%</h3>
                        <p>میانگین نمرات</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><FiAward size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.bestScore}%</h3>
                        <p>بهترین نمره</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><FiTarget size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.totalCorrect}/{stats.totalQuestions}</h3>
                        <p>پاسخ‌های صحیح</p>
                    </div>
                </div>
            </div>

            {exams.length === 0 ? (
                <div className="empty-chart">
                    <FiBarChart2 size={64} />
                    <h3>هنوز داده‌ای برای نمایش وجود ندارد</h3>
                    <p>پس از شرکت در آزمون‌ها، نمودارهای پیشرفت شما در اینجا نمایش داده می‌شود</p>
                    <button className="btn-primary" onClick={() => window.location.href = '/app'}>شروع اولین آزمون</button>
                </div>
            ) : (
                <>
                    {/* نمودار خطی پیشرفت */}
                    <div className="chart-card">
                        <h3>📊 روند پیشرفت نمرات</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip formatter={(value) => [`${value}%`, 'نمره']} />
                                <Legend />
                                <Line type="monotone" dataKey="درصد" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="درصد موفقیت" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* نمودار توزیع نمرات */}
                    <div className="chart-card">
                        <h3>🎯 توزیع نمرات شما</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={scoreRanges} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value}`, 'تعداد آزمون']} />
                                <Bar dataKey="count" name="تعداد آزمون‌ها">
                                    {scoreRanges.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            <style>{`
                .progress-chart-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    direction: rtl;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                }
                .progress-header {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    border-radius: 24px;
                    padding: 24px 32px;
                    margin-bottom: 24px;
                    color: white;
                }
                .progress-header h1 { margin: 0 0 8px 0; font-size: 1.5rem; }
                .progress-header p { margin: 0; opacity: 0.8; }
                .progress-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .stat-card {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-icon.purple { background: #f3e8ff; color: #9333ea; }
                .stat-icon.green { background: #d1fae5; color: #10b981; }
                .stat-icon.orange { background: #fef3c7; color: #f59e0b; }
                .stat-icon.blue { background: #dbeafe; color: #2563eb; }
                .stat-info h3 { margin: 0; font-size: 1.5rem; font-weight: 700; }
                .stat-info p { margin: 0; font-size: 0.75rem; color: #64748b; }
                .chart-card {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .chart-card h3 { margin: 0 0 20px 0; font-size: 1.1rem; }
                .empty-chart { text-align: center; padding: 60px; background: white; border-radius: 20px; color: #94a3b8; }
                .empty-chart svg { margin-bottom: 16px; }
                .btn-primary {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 30px;
                    cursor: pointer;
                    margin-top: 16px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .progress-loading { text-align: center; padding: 60px; }
                @media (max-width: 768px) {
                    .progress-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
};

export default ProgressChart;