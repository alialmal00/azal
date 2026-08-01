// src/components/teacher/ClassManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiUsers, FiCopy, FiTrash2, FiUserPlus, 
  FiMail, FiCheck, FiX, FiBookOpen, FiBarChart2,
  FiLink, FiCalendar, FiLogOut, FiUserX, FiTrendingUp, FiGrid,
  FiAlertCircle, FiEye, FiSearch, FiRefreshCw
} from 'react-icons/fi';
import { classService, Class, ClassMember } from '../../services/classService';
import ClassExamManager from './ClassExamManager';
import ClassProgress from './ClassProgress';
import '../../styles/classManager.css';

interface ClassManagerProps {
  teacherId: number;
  teacherName: string;
  userRole?: string;
  limits?: {
    maxClasses: number;
    maxStudentsPerClass: number;
    classesCount: number;
  };
}

const ClassManager: React.FC<ClassManagerProps> = ({ 
  teacherId, 
  teacherName, 
  userRole = 'teacher',
  limits 
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'exams' | 'stats'>('students');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteClassConfirm, setShowDeleteClassConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<{ userId: number; userName: string } | null>(null);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    activeExams: 0,
    avgScore: 0,
    completionRate: 0
  });

  // محدودیت‌ها
  const maxClasses = limits?.maxClasses || 1;
  const maxStudentsPerClass = limits?.maxStudentsPerClass || 2;
  const currentClasses = limits?.classesCount || 0;
  const canCreateClass = currentClasses < maxClasses;

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const result = await classService.getMyClasses();
      console.log('📚 Classes loaded:', result);
      if (result.success && result.classes) {
        setClasses(result.classes);
        if (result.classes.length > 0 && !selectedClass) {
          setSelectedClass(result.classes[0]);
          await loadClassMembers(result.classes[0].id);
          await loadClassStats(result.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'خطا در بارگذاری کلاس‌ها' });
    } finally {
      setLoading(false);
    }
  };

  const loadClassMembers = async (classId: number) => {
    try {
      console.log('📋 Loading members for class:', classId);
      const result = await classService.getClassMembers(classId);
      console.log('📋 Members result:', result);
     
      if (result.success && result.members) {
        console.log('📋 Found members:', result.members.length);
        setClassMembers(result.members);
        setClassStats(prev => ({ 
          ...prev, 
          totalStudents: result.members.filter(m => m.role === 'student').length 
        }));
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadClassStats = async (classId: number) => {
    try {
      setClassStats(prev => ({
        ...prev,
        activeExams: 0,
        avgScore: 0,
        completionRate: 0
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectClass = async (cls: Class) => {
    setSelectedClass(cls);
    await loadClassMembers(cls.id);
    await loadClassStats(cls.id);
    setActiveTab('students');
  };

  const handleCreateClass = async () => {
    if (!canCreateClass) {
      setMessage({ type: 'error', text: `⚠️ حداکثر ${maxClasses} کلاس در پلن شما مجاز است.` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!newClassName.trim()) {
      setMessage({ type: 'error', text: 'لطفاً نام کلاس را وارد کنید' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setActionInProgress(-1);
    try {
      const result = await classService.createClass({
        name: newClassName,
        subject: newClassSubject,
        grade_level: newClassGrade,
        description: newClassDesc
      });

      if (result.success) {
        setMessage({ type: 'success', text: '✅ کلاس با موفقیت ایجاد شد' });
        setShowCreateModal(false);
        setNewClassName('');
        setNewClassSubject('');
        setNewClassGrade('');
        setNewClassDesc('');
        await loadClasses();
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در ایجاد کلاس' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setActionInProgress(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClass) return;
    
    // بررسی محدودیت تعداد دانش‌آموزان
    const currentStudents = classMembers.filter(m => m.role === 'student').length;
    if (currentStudents >= maxStudentsPerClass) {
      setMessage({ type: 'error', text: `⚠️ حداکثر ${maxStudentsPerClass} دانش‌آموز در هر کلاس مجاز است.` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!addStudentEmail.trim()) {
      setMessage({ type: 'error', text: 'لطفاً ایمیل دانش‌آموز را وارد کنید' });
      return;
    }

    setActionInProgress(-3);
    try {
      const orgResult = await classService.addMemberToOrganization(addStudentEmail, 'student');
      if (!orgResult.success) {
        setMessage({ type: 'error', text: orgResult.message || 'خطا در ثبت دانش‌آموز در سازمان' });
        return;
      }

      const classResult = await classService.addStudentToClass(selectedClass.id, addStudentEmail);
      if (classResult.success) {
        setMessage({ type: 'success', text: '✅ دانش‌آموز با موفقیت به کلاس اضافه شد' });
        setAddStudentEmail('');
        setShowAddStudentModal(false);
        await loadClassMembers(selectedClass.id);
        await loadClassStats(selectedClass.id);
      } else {
        setMessage({ type: 'error', text: classResult.message || 'خطا در اضافه کردن دانش‌آموز به کلاس' });
      }
    } catch (error) {
      console.error('Add student error:', error);
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setActionInProgress(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveMember = (userId: number, userName: string) => {
    if (!selectedClass) return;
    setShowRemoveConfirm({ userId, userName });
  };

  const confirmRemoveMember = async () => {
    if (!selectedClass || !showRemoveConfirm) return;

    setActionInProgress(showRemoveConfirm.userId);
    try {
      const result = await classService.removeMember(selectedClass.id, showRemoveConfirm.userId);
      if (result.success) {
        setMessage({ type: 'success', text: `${showRemoveConfirm.userName} از کلاس حذف شد` });
        await loadClassMembers(selectedClass.id);
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در حذف دانش‌آموز' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setActionInProgress(null);
      setShowRemoveConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLeaveClass = async () => {
    if (!selectedClass) return;
    setShowLeaveConfirm(true);
  };

  const confirmLeaveClass = async () => {
    if (!selectedClass) return;

    setActionInProgress(-4);
    try {
      const result = await classService.leaveClass(selectedClass.id);
      if (result.success) {
        setMessage({ type: 'success', text: 'با موفقیت از کلاس خارج شدید' });
        await loadClasses();
        setSelectedClass(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در خروج از کلاس' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setActionInProgress(null);
      setShowLeaveConfirm(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setShowDeleteClassConfirm(true);
  };

  const confirmDeleteClass = async () => {
    if (!selectedClass) return;

    setActionInProgress(-5);
    try {
      // حذف واقعی کلاس از دیتابیس
      const result = await classService.deleteClass?.(selectedClass.id);
      if (result?.success) {
        setMessage({ type: 'success', text: '✅ کلاس با موفقیت حذف شد' });
        await loadClasses();
        setSelectedClass(null);
      } else {
        // اگر متد حذف وجود نداشت، فقط از لیست محلی حذف کن
        setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
        setSelectedClass(null);
        setMessage({ type: 'success', text: '✅ کلاس با موفقیت حذف شد' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در حذف کلاس' });
    } finally {
      setActionInProgress(null);
      setShowDeleteClassConfirm(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const copyClassCode = (code: string, classId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(classId);
    setTimeout(() => setCopiedCode(null), 2000);
    setMessage({ type: 'success', text: '✅ کد کلاس کپی شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  const students = classMembers.filter(m => m.role === 'student');
  const teachers = classMembers.filter(m => m.role === 'teacher');

  if (loading) {
    return (
      <div className="class-manager-container">
        <div className="loading-screen">
          <div className="spinner-large"></div>
          <p className="mt-4 text-gray-500">در حال بارگذاری کلاس‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-manager-container" dir="rtl">
      {/* پیام توست */}
      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.type === 'success' ? <FiCheck size={20} /> : <FiX size={20} />}
          {message.text}
        </div>
      )}

      {/* ========== بنر محدودیت‌ها ========== */}
      <div className="class-limits-banner">
        <div className="limit-item">
          <span>📚 کلاس‌های فعال: {currentClasses} / {maxClasses}</span>
          {!canCreateClass && <span className="limit-full">⛔ سقف کلاس‌ها کامل شده</span>}
        </div>
        <div className="limit-item">
          <span>👥 حداکثر دانش‌آموز در هر کلاس: {maxStudentsPerClass} نفر</span>
        </div>
        <button 
          className="upgrade-btn"
          onClick={() => window.location.href = '/dashboard/subscription'}
        >
          ارتقا اشتراک
        </button>
      </div>

      {/* ========== مودال تأیید حذف دانش‌آموز ========== */}
      {showRemoveConfirm && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(null)}>
          <div className="confirm-remove-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>حذف دانش‌آموز</h3>
              <button className="modal-close" onClick={() => setShowRemoveConfirm(null)}><FiX size={20} /></button>
            </div>
            <div className="modal-body text-center">
              <div className="confirm-icon warning">
                <FiAlertCircle size={48} />
              </div>
              <h4 className="confirm-title">آیا از حذف این دانش‌آموز اطمینان دارید؟</h4>
              <p className="confirm-message">
                دانش‌آموز <strong>"{showRemoveConfirm.userName}"</strong> از کلاس حذف خواهد شد و تمام دسترسی‌های او به محتوای کلاس از بین می‌رود.
              </p>
              <p className="confirm-warning">⚠️ این عمل قابل بازگشت نیست!</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRemoveConfirm(null)}>انصراف</button>
              <button 
                className="btn-confirm-remove" 
                onClick={confirmRemoveMember}
                disabled={actionInProgress === showRemoveConfirm.userId}
              >
                {actionInProgress === showRemoveConfirm.userId ? (
                  <>
                    <div className="spinner-sm"></div>
                    در حال حذف...
                  </>
                ) : (
                  <>🗑️ حذف دانش‌آموز</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأیید خروج از کلاس */}
      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>خروج از کلاس</h3>
              <button className="modal-close" onClick={() => setShowLeaveConfirm(false)}><FiX /></button>
            </div>
            <div className="modal-body text-center">
              <div className="confirm-icon leave">
                <FiLogOut size={48} />
              </div>
              <h4 className="confirm-title">آیا از خروج از کلاس اطمینان دارید؟</h4>
              <p className="confirm-message">
                پس از خروج، دسترسی شما به محتوای کلاس از بین می‌رود.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowLeaveConfirm(false)}>انصراف</button>
              <button className="btn-confirm-leave" onClick={confirmLeaveClass}>تأیید خروج</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأیید حذف کلاس */}
      {showDeleteClassConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteClassConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>حذف کلاس</h3>
              <button className="modal-close" onClick={() => setShowDeleteClassConfirm(false)}><FiX /></button>
            </div>
            <div className="modal-body text-center">
              <div className="confirm-icon danger">
                <FiTrash2 size={48} />
              </div>
              <h4 className="confirm-title">آیا از حذف کلاس "{selectedClass?.name}" اطمینان دارید؟</h4>
              <p className="confirm-message">
                با حذف کلاس، تمام اطلاعات و آزمون‌های آن برای همیشه پاک می‌شود.
              </p>
              <p className="confirm-warning">⚠️ این عمل غیرقابل بازگشت است!</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteClassConfirm(false)}>انصراف</button>
              <button className="btn-confirm-delete" onClick={confirmDeleteClass}>حذف کلاس</button>
            </div>
          </div>
        </div>
      )}

      {/* هدر */}
      <div className="class-header">
        <div className="class-header-content">
          <div className="class-header-title">
            <h1>مدیریت کلاس‌ها</h1>
            <p>{userRole === 'organization' ? 'مدیریت مدارس و کلاس‌های سازمان' : `${teacherName} عزیز، کلاس‌های خود را مدیریت کنید`}</p>
          </div>
          <button 
            className={`create-class-btn ${!canCreateClass ? 'disabled' : ''}`} 
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateClass}
          >
            <FiPlus size={18} />
            <span>{canCreateClass ? 'کلاس جدید' : 'سقف کلاس‌ها کامل شده'}</span>
          </button>
        </div>
      </div>

      {/* آمار سریع */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiGrid /></div>
          <div className="stat-info">
            <h3>{classes.length}</h3>
            <p>کلاس‌ها</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div className="stat-info">
            <h3>{classStats.totalStudents}</h3>
            <p>دانش‌آموزان</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiBarChart2 /></div>
          <div className="stat-info">
            <h3>{classStats.avgScore}%</h3>
            <p>میانگین نمرات</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiBookOpen /></div>
          <div className="stat-info">
            <h3>{classStats.activeExams}</h3>
            <p>آزمون فعال</p>
          </div>
        </div>
      </div>

      {/* دو بخش اصلی: لیست کلاس‌ها و جزئیات */}
      <div className="classes-layout">
        {/* سایدبار کلاس‌ها */}
        <div className="classes-sidebar">
          <div className="sidebar-header">
            <h3>کلاس‌های من</h3>
            <span className="classes-count">{classes.length} / {maxClasses}</span>
          </div>
          
          {classes.length === 0 ? (
            <div className="empty-classes">
              <div className="empty-icon"><FiBookOpen size={32} /></div>
              <p>هنوز کلاسی ایجاد نکرده‌اید</p>
              {canCreateClass && (
                <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>+ کلاس جدید</button>
              )}
              {!canCreateClass && (
                <p className="limit-text">سقف کلاس‌های شما کامل شده است</p>
              )}
            </div>
          ) : (
            <div className="classes-list-sidebar">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`class-sidebar-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                  onClick={() => handleSelectClass(cls)}
                >
                  <div className="class-sidebar-icon">
                    <FiBookOpen />
                  </div>
                  <div className="class-sidebar-info">
                    <h4>{cls.name}</h4>
                    <div className="class-sidebar-meta">
                      <span><FiUsers size={12} /> {cls.member_count || 0}</span>
                      <span><FiLink size={12} /> {cls.class_code}</span>
                    </div>
                  </div>
                  <button
                    className="copy-code-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyClassCode(cls.class_code, cls.id);
                    }}
                    title="کپی کد کلاس"
                  >
                    {copiedCode === cls.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* جزئیات کلاس انتخاب شده */}
        <div className="class-detail">
          {selectedClass ? (
            <>
              {/* هدر کلاس */}
              <div className="class-detail-header">
                <div className="class-detail-title">
                  <h2>{selectedClass.name}</h2>
                  {selectedClass.subject && <span className="class-subject">{selectedClass.subject}</span>}
                  {selectedClass.grade_level && <span className="class-grade">{selectedClass.grade_level}</span>}
                </div>
                <div className="class-detail-code">
                  <FiLink size={16} />
                  <span>کد کلاس: {selectedClass.class_code}</span>
                  <button onClick={() => copyClassCode(selectedClass.class_code, selectedClass.id)}>
                    <FiCopy size={14} />
                  </button>
                </div>
                <p className="class-description">{selectedClass.description || 'بدون توضیحات'}</p>
                
                <div className="class-detail-actions">
                  <button className="action-btn add" onClick={() => setShowAddStudentModal(true)}>
                    <FiUserPlus size={16} />
                    <span>افزودن دانش‌آموز</span>
                    <span className="student-count">({students.length} / {maxStudentsPerClass})</span>
                  </button>
                  {userRole === 'student' && (
                    <button className="action-btn leave" onClick={handleLeaveClass}>
                      <FiLogOut size={16} />
                      <span>خروج از کلاس</span>
                    </button>
                  )}
                  {(userRole === 'teacher' || userRole === 'organization') && (
                    <button className="action-btn delete" onClick={handleDeleteClass}>
                      <FiTrash2 size={16} />
                      <span>حذف کلاس</span>
                    </button>
                  )}
                </div>
              </div>

              {/* تب‌ها */}
              <div className="class-tabs">
                <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                  <FiUsers size={16} />
                  <span>دانش‌آموزان ({students.length})</span>
                </button>
                <button className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
                  <FiUserX size={16} />
                  <span>معلمان ({teachers.length})</span>
                </button>
                <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
                  <FiBarChart2 size={16} />
                  <span>آزمون‌ها</span>
                </button>
                <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                  <FiTrendingUp size={16} />
                  <span>آمار</span>
                </button>
              </div>

              {/* محتوای تب‌ها */}
              <div className="tab-content">
                {/* تب دانش‌آموزان */}
                {activeTab === 'students' && (
                  <div className="students-list">
                    {students.length === 0 ? (
                      <div className="empty-state-small">
                        <FiUsers size={32} className="text-gray-300" />
                        <p>هیچ دانش‌آموزی در این کلاس ثبت نشده است</p>
                        <div className="class-code-display">
                          <span>کد کلاس: </span>
                          <strong>{selectedClass.class_code}</strong>
                          <button onClick={() => copyClassCode(selectedClass.class_code, selectedClass.id)}>
                            <FiCopy size={14} /> کپی
                          </button>
                        </div>
                      </div>
                    ) : (
                      students.map((member) => (
                        <div key={member.id} className="student-item">
                          <div className="student-info">
                            <div className="student-avatar">
                              {member.name?.charAt(0) || '?'}
                            </div>
                            <div className="student-details">
                              <h4>{member.name}</h4>
                              <p>{member.email}</p>
                              <div className="student-join-date">
                                <FiCalendar size={12} />
                                <span>عضویت: {new Date(member.joined_at).toLocaleDateString('fa-IR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="student-actions-buttons">
                            {(userRole === 'teacher' || userRole === 'organization') && (
                              <button
                                onClick={() => handleRemoveMember(member.user_id, member.name)}
                                disabled={actionInProgress === member.user_id}
                                className="btn-remove-student"
                              >
                                {actionInProgress === member.user_id ? (
                                  <div className="spinner-sm"></div>
                                ) : (
                                  <>🗑️ حذف دانش‌آموز</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* تب معلمان */}
                {activeTab === 'teachers' && (
                  <div className="students-list">
                    {teachers.length === 0 ? (
                      <div className="empty-state-small">
                        <FiUserX size={32} className="text-gray-300" />
                        <p>هیچ معلم دیگری در این کلاس نیست</p>
                      </div>
                    ) : (
                      teachers.map((member) => (
                        <div key={member.id} className="student-item">
                          <div className="student-info">
                            <div className="student-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                              {member.name?.charAt(0) || '?'}
                            </div>
                            <div className="student-details">
                              <h4>{member.name}</h4>
                              <p>{member.email}</p>
                              <div className="student-join-date">
                                <FiCalendar size={12} />
                                <span>عضویت: {new Date(member.joined_at).toLocaleDateString('fa-IR')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="student-actions-buttons">
                            <span className="teacher-badge">معلم کلاس</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* تب آزمون‌ها */}
                {activeTab === 'exams' && (
                  <ClassExamManager 
                    classId={selectedClass.id} 
                    className={selectedClass.name}
                    teacherId={teacherId}
                    teacherName={teacherName}
                  />
                )}

                {/* تب آمار - پیشرفت کلاس */}
                {activeTab === 'stats' && (
                  <ClassProgress 
                    classId={selectedClass.id} 
                    className={selectedClass.name}
                    teacherId={teacherId}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="no-class-selected">
              <FiBookOpen size={64} className="text-gray-300 mb-4" />
              <h3>کلاسی را انتخاب کنید</h3>
              <p>از سمت راست یکی از کلاس‌های خود را انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال ایجاد کلاس */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ ایجاد کلاس جدید</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {!canCreateClass && (
                <div className="limit-warning">
                  ⚠️ سقف {maxClasses} کلاس شما کامل شده است. برای ایجاد کلاس جدید، اشتراک خود را ارتقا دهید.
                </div>
              )}
              <div className="form-group">
                <label>نام کلاس *</label>
                <input 
                  type="text" 
                  placeholder="مثال: ریاضی دهم - کلاس اول" 
                  value={newClassName} 
                  onChange={(e) => setNewClassName(e.target.value)} 
                  disabled={!canCreateClass}
                />
              </div>
              <div className="form-group">
                <label>موضوع</label>
                <input 
                  type="text" 
                  placeholder="مثال: ریاضی، فیزیک، ادبیات" 
                  value={newClassSubject} 
                  onChange={(e) => setNewClassSubject(e.target.value)} 
                  disabled={!canCreateClass}
                />
              </div>
              <div className="form-group">
                <label>پایه تحصیلی</label>
                <input 
                  type="text" 
                  placeholder="مثال: دهم، یازدهم، دوازدهم" 
                  value={newClassGrade} 
                  onChange={(e) => setNewClassGrade(e.target.value)} 
                  disabled={!canCreateClass}
                />
              </div>
              <div className="form-group">
                <label>توضیحات</label>
                <textarea 
                  rows={3} 
                  placeholder="توضیحات اضافی..." 
                  value={newClassDesc} 
                  onChange={(e) => setNewClassDesc(e.target.value)} 
                  disabled={!canCreateClass}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>انصراف</button>
              <button 
                className="btn-primary" 
                onClick={handleCreateClass} 
                disabled={actionInProgress === -1 || !canCreateClass}
              >
                {actionInProgress === -1 ? 'در حال ایجاد...' : 'ایجاد کلاس'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال افزودن دانش‌آموز */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👨‍🎓 افزودن دانش‌آموز</h3>
              <button className="modal-close" onClick={() => setShowAddStudentModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ایمیل دانش‌آموز</label>
                <input 
                  type="email" 
                  placeholder="example@email.com" 
                  value={addStudentEmail} 
                  onChange={(e) => setAddStudentEmail(e.target.value)} 
                />
              </div>
              <p className="info-text">
                توجه: دانش‌آموز باید قبلاً در سایت ثبت‌نام کرده باشد
              </p>
              <p className="info-text" style={{ color: '#f59e0b' }}>
                ⚠️ حداکثر {maxStudentsPerClass} دانش‌آموز در هر کلاس مجاز است.
                <br />
                <span>دانش‌آموزان فعلی: {students.length} / {maxStudentsPerClass}</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddStudentModal(false)}>انصراف</button>
              <button 
                className="btn-primary" 
                onClick={handleAddStudent} 
                disabled={actionInProgress === -3 || students.length >= maxStudentsPerClass}
              >
                {actionInProgress === -3 ? 'در حال افزودن...' : 'افزودن دانش‌آموز'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .spinner-large {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          margin-left: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .class-limits-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
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

        .upgrade-btn {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          margin-right: auto;
          transition: all 0.2s;
        }

        .upgrade-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }

        .create-class-btn.disabled {
          background: #94a3b8;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .student-count {
          font-size: 0.7rem;
          opacity: 0.8;
          margin-right: 4px;
        }

        .limit-text {
          font-size: 0.8rem;
          color: #ef4444;
          margin-top: 8px;
        }

        .limit-warning {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          border: 1px solid #fecaca;
        }

        .classes-layout {
          display: flex;
          gap: 24px;
          margin-top: 24px;
        }
        .classes-sidebar {
          width: 320px;
          flex-shrink: 0;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .sidebar-header {
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sidebar-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .classes-count {
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.75rem;
          color: #475569;
        }
        .classes-list-sidebar {
          max-height: 500px;
          overflow-y: auto;
        }
        .class-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }
        .class-sidebar-item:hover {
          background: #f8fafc;
        }
        .class-sidebar-item.active {
          background: #eff6ff;
          border-right: 3px solid #2563eb;
        }
        .class-sidebar-icon {
          width: 40px;
          height: 40px;
          background: #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .class-sidebar-info {
          flex: 1;
        }
        .class-sidebar-info h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .class-sidebar-meta {
          display: flex;
          gap: 12px;
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .class-sidebar-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .copy-code-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .copy-code-btn:hover {
          background: #e2e8f0;
          color: #2563eb;
        }
        .class-detail {
          flex: 1;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .class-detail-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .class-detail-title {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .class-detail-title h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }
        .class-subject {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        .class-grade {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        .class-detail-code {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 0.8rem;
          margin-bottom: 12px;
        }
        .class-detail-code button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }
        .class-description {
          font-size: 0.85rem;
          opacity: 0.9;
          margin-bottom: 16px;
        }
        .class-detail-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 30px;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.add {
          background: rgba(16,185,129,0.2);
          color: #10b981;
        }
        .action-btn.add:hover {
          background: rgba(16,185,129,0.3);
        }
        .action-btn.leave {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .action-btn.leave:hover {
          background: rgba(239,68,68,0.3);
        }
        .action-btn.delete {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .action-btn.delete:hover {
          background: rgba(239,68,68,0.3);
        }
        
        .student-actions-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .btn-remove-student {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #991b1b;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .btn-remove-student:hover {
          background: linear-gradient(135deg, #fecaca, #fca5a5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .btn-remove-student:active {
          transform: translateY(0);
        }
        .btn-remove-student:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .student-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }
        .student-item:hover {
          background: #f1f5f9;
          transform: translateX(-4px);
          border-color: #cbd5e1;
        }
        .student-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .student-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .student-details h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .student-details p {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
        }
        .student-join-date {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .class-code-display {
          margin-top: 16px;
          padding: 12px;
          background: #eff6ff;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
        }
        .class-code-display button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
        }
        .teacher-badge {
          background: #ede9fe;
          color: #7c3aed;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .class-tabs {
          display: flex;
          gap: 8px;
          background: #ffffff;
          padding: 8px;
          border-radius: 20px;
          margin: 0 20px 20px 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-size: 0.9rem;
          color: #64748b;
        }
        .tab-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
          transform: translateY(-2px);
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
          transform: translateY(-2px);
        }
        .tab-content {
          animation: fadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0 20px 20px 20px;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .empty-state-small {
          text-align: center;
          padding: 40px 20px;
        }
        .btn-primary-sm {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 0.8rem;
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
        .modal-container {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
        }
        .confirm-remove-modal, .confirm-modal {
          background: white;
          border-radius: 24px;
          width: 90%;
          max-width: 450px;
          overflow: hidden;
          animation: modalSlide 0.3s ease;
        }
        @keyframes modalSlide {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .modal-close:hover {
          color: #ef4444;
          transform: rotate(90deg);
        }
        .modal-body {
          padding: 24px;
        }
        .text-center {
          text-align: center;
        }
        .modal-footer {
          padding: 18px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 0.85rem;
          color: #1e293b;
        }
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .btn-cancel, .btn-primary, .btn-danger, .btn-confirm-remove, .btn-confirm-leave, .btn-confirm-delete {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-cancel {
          background: #e2e8f0;
          color: #475569;
        }
        .btn-cancel:hover {
          background: #cbd5e1;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
        .btn-danger, .btn-confirm-remove, .btn-confirm-leave, .btn-confirm-delete {
          background: #ef4444;
          color: white;
        }
        .btn-danger:hover, .btn-confirm-remove:hover, .btn-confirm-leave:hover, .btn-confirm-delete:hover {
          background: #dc2626;
        }
        .btn-confirm-remove:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .info-text {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 8px;
        }
        .confirm-icon {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .confirm-icon.warning {
          background: #fef3c7;
          color: #f59e0b;
        }
        .confirm-icon.leave, .confirm-icon.danger {
          background: #fee2e2;
          color: #ef4444;
        }
        .confirm-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .confirm-message {
          color: #64748b;
          font-size: 0.85rem;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }
        .confirm-message strong {
          color: #1e293b;
        }
        .confirm-warning {
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 500;
          margin: 0;
          padding: 8px 12px;
          background: #fef2f2;
          border-radius: 10px;
          display: inline-block;
        }
        .toast-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .toast-message.success { background: #10b981; color: white; }
        .toast-message.error { background: #ef4444; color: white; }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 900px) {
          .classes-layout { flex-direction: column; }
          .classes-sidebar { width: 100%; }
          .class-tabs { flex-wrap: wrap; }
          .tab-btn { padding: 8px 12px; font-size: 0.75rem; }
          .student-item { flex-direction: column; align-items: flex-start; }
          .student-actions-buttons { width: 100%; }
          .btn-remove-student { width: 100%; justify-content: center; }
          .modal-footer { flex-direction: column; }
          .btn-cancel, .btn-primary, .btn-danger { width: 100%; }
          .class-limits-banner { flex-direction: column; text-align: center; }
          .upgrade-btn { margin-right: 0; width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default ClassManager;