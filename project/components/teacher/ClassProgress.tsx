// src/components/teacher/ClassProgress.tsx
import React, { useState, useEffect } from 'react';
import { FiUsers, FiBarChart2, FiAward, FiTarget } from 'react-icons/fi';
import { classExamService } from '../../services/classExamService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface ClassProgressProps {
  classId: number;
  className: string;
  teacherId: number;
}

const ClassProgress: React.FC<ClassProgressProps> = ({ classId, className }) => {
  const [progress, setProgress] = useState<any[]>([]);
  const [classStats, setClassStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [classId]);

  const loadProgress = async () => {
    setLoading(true);
    const result = await classExamService.getClassProgress(classId);
    if (result.success) {
      setProgress(result.progress || []);
      setClassStats(result.classStats);
    }
    setLoading(false);
  };

  const getChartData = () => {
    if (!progress.length) return [];
    return progress.map(student => ({
      name: student.student_name,
      score: Math.round(student.avg_score || 0),
      exams: student.total_exams || 0
    }));
  };

  const getScoreDistribution = () => {
    const distribution = [
      { range: '۰-۲۰', count: 0, color: '#ef4444' },
      { range: '۲۱-۴۰', count: 0, color: '#f59e0b' },
      { range: '۴۱-۶۰', count: 0, color: '#eab308' },
      { range: '۶۱-۸۰', count: 0, color: '#10b981' },
      { range: '۸۱-۱۰۰', count: 0, color: '#2563eb' }
    ];
    
    progress.forEach(student => {
      const score = student.avg_score || 0;
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });
    
    return distribution;
  };

  if (loading) {
    return <div className="progress-loading"><div className="spinner"></div><p>در حال بارگذاری آمار...</p></div>;
  }

  return (
    <div className="progress-content">
      {/* کارت‌های آمار کلی */}
      {classStats && (
        <div className="progress-stats-cards">
          <div className="stat-card">
            <div className="stat-icon green"><FiUsers size={24} /></div>
            <div className="stat-info">
              <h3>{classStats.total_students || 0}</h3>
              <p>کل دانش‌آموزان</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><FiBarChart2 size={24} /></div>
            <div className="stat-info">
              <h3>{classStats.avg_class_score || 0}%</h3>
              <p>میانگین نمره کلاس</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><FiAward size={24} /></div>
            <div className="stat-info">
              <h3>{classStats.top_students?.length || 0}</h3>
              <p>دانش‌آموزان برتر</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><FiTarget size={24} /></div>
            <div className="stat-info">
              <h3>{classStats.total_exams || 0}</h3>
              <p>تعداد آزمون‌ها</p>
            </div>
          </div>
        </div>
      )}

      {/* نمودار میله‌ای */}
      <div className="chart-card">
        <h4>📊 مقایسه نمرات دانش‌آموزان</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getChartData()} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip formatter={(value) => [`${value}%`, 'نمره']} />
            <Legend />
            <Bar dataKey="score" fill="#2563eb" name="درصد موفقیت" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* نمودار دایره‌ای */}
      <div className="chart-card">
        <h4>🎯 توزیع نمرات دانش‌آموزان</h4>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={getScoreDistribution()}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ range, count }) => `${range}: ${count} نفر`}
              outerRadius={120}
              dataKey="count"
            >
              {getScoreDistribution().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} نفر`, 'تعداد']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* جدول جزئیات */}
      <div className="progress-table">
        <h4>📋 جزئیات عملکرد دانش‌آموزان</h4>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>نام دانش‌آموز</th>
                <th>تعداد آزمون</th>
                <th>میانگین نمره</th>
                <th>بالاترین نمره</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>{student.student_name}</td>
                  <td>{student.total_exams || 0}</td>
                  <td className={student.avg_score >= 70 ? 'high-score' : student.avg_score >= 50 ? 'mid-score' : 'low-score'}>
                    {Math.round(student.avg_score || 0)}%
                  </td>
                  <td>{Math.round(student.max_score || 0)}%</td>
                  <td>
                    {student.avg_score >= 70 ? (
                      <span className="status-good">🌟 عالی</span>
                    ) : student.avg_score >= 50 ? (
                      <span className="status-mid">📈 خوب</span>
                    ) : (
                      <span className="status-bad">⚠️ نیاز به تلاش بیشتر</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .progress-content {
          padding: 20px;
        }
        .progress-stats-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .progress-stats-cards .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .progress-stats-cards .stat-icon {
          width: 55px;
          height: 55px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-stats-cards .stat-icon.green { background: #d1fae5; color: #10b981; }
        .progress-stats-cards .stat-icon.blue { background: #dbeafe; color: #2563eb; }
        .progress-stats-cards .stat-icon.purple { background: #ede9fe; color: #8b5cf6; }
        .progress-stats-cards .stat-icon.orange { background: #fef3c7; color: #f59e0b; }
        .progress-stats-cards .stat-info h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .progress-stats-cards .stat-info p {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
        }
        .chart-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .chart-card h4 {
          margin: 0 0 20px 0;
          font-size: 1rem;
          color: #1e293b;
        }
        .progress-table {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .progress-table h4 {
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: #1e293b;
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .progress-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .progress-table th, .progress-table td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .progress-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
        }
        .progress-table td.high-score { color: #10b981; font-weight: bold; }
        .progress-table td.mid-score { color: #f59e0b; font-weight: bold; }
        .progress-table td.low-score { color: #ef4444; font-weight: bold; }
        .status-good { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 20px; font-size: 0.7rem; }
        .status-mid { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 20px; font-size: 0.7rem; }
        .status-bad { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 20px; font-size: 0.7rem; }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        .progress-loading {
          text-align: center;
          padding: 40px;
        }
        @media (max-width: 900px) {
          .progress-stats-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ClassProgress;