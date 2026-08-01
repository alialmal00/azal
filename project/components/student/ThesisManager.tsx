// src/components/student/ThesisManager.tsx
import React, { useState } from 'react';
import { 
  FiAward, FiCalendar, FiCheckCircle, FiClock, FiFileText, 
  FiPlus, FiTarget, FiEdit2, FiTrash2, FiX, FiSave,
  FiUser, FiBookOpen, FiTrendingUp, FiAlertCircle
} from 'react-icons/fi';

interface ThesisManagerProps {
  userId: number;
  userName: string;
}

interface Milestone {
  id: number;
  title: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
}

interface Reference {
  id: number;
  title: string;
  authors: string;
  year: number;
  type: 'book' | 'article' | 'thesis' | 'conference';
  url?: string;
}

const ThesisManager: React.FC<ThesisManagerProps> = ({ userId, userName }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'references'>('overview');
  const [proposal, setProposal] = useState({
    title: '',
    advisor: '',
    co_advisor: '',
    field: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: 'انتخاب موضوع و تعیین استاد راهنما', deadline: '۱۴۰۴/۰۲/۱۵', status: 'completed' },
    { id: 2, title: 'نگارش پروپوزال', deadline: '۱۴۰۴/۰۳/۰۱', status: 'in_progress' },
    { id: 3, title: 'جمع‌آوری و مطالعه منابع', deadline: '۱۴۰۴/۰۴/۱۰', status: 'pending' },
    { id: 4, title: 'نگارش فصل اول (مقدمه)', deadline: '۱۴۰۴/۰۵/۰۱', status: 'pending' },
    { id: 5, title: 'نگارش فصل دوم (مرور ادبیات)', deadline: '۱۴۰۴/۰۶/۰۱', status: 'pending' },
    { id: 6, title: 'نگارش فصل سوم (روش تحقیق)', deadline: '۱۴۰۴/۰۷/۰۱', status: 'pending' },
  ]);
  const [references, setReferences] = useState<Reference[]>([
    { id: 1, title: 'روش تحقیق در علوم تربیتی', authors: 'دکتر علی محمدی', year: 1400, type: 'book' },
    { id: 2, title: 'مقاله مروری بر روش‌های تحقیق', authors: 'سارا کریمی', year: 1401, type: 'article' },
  ]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', deadline: '', description: '' });
  const [newReference, setNewReference] = useState({ title: '', authors: '', year: new Date().getFullYear(), type: 'book' as const, url: '' });
  const [editingProposal, setEditingProposal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);

  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) {
      setMessage({ type: 'error', text: 'لطفاً عنوان مایلستون را وارد کنید' });
      return;
    }
    const newId = Math.max(...milestones.map(m => m.id), 0) + 1;
    setMilestones([...milestones, { ...newMilestone, id: newId, status: 'pending' }]);
    setNewMilestone({ title: '', deadline: '', description: '' });
    setShowAddMilestone(false);
    setMessage({ type: 'success', text: 'مایلستون با موفقیت اضافه شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateMilestoneStatus = (id: number, status: 'pending' | 'in_progress' | 'completed') => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, status } : m));
    setMessage({ type: 'success', text: 'وضعیت مایلستون به‌روزرسانی شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteMilestone = (id: number) => {
    if (!confirm('آیا از حذف این مایلستون اطمینان دارید؟')) return;
    setMilestones(milestones.filter(m => m.id !== id));
    setMessage({ type: 'success', text: 'مایلستون حذف شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddReference = () => {
    if (!newReference.title.trim() || !newReference.authors.trim()) {
      setMessage({ type: 'error', text: 'لطفاً عنوان و نویسنده را وارد کنید' });
      return;
    }
    const newId = Math.max(...references.map(r => r.id), 0) + 1;
    setReferences([...references, { ...newReference, id: newId }]);
    setNewReference({ title: '', authors: '', year: new Date().getFullYear(), type: 'book', url: '' });
    setShowAddReference(false);
    setMessage({ type: 'success', text: 'منبع با موفقیت اضافه شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteReference = (id: number) => {
    if (!confirm('آیا از حذف این منبع اطمینان دارید؟')) return;
    setReferences(references.filter(r => r.id !== id));
    setMessage({ type: 'success', text: 'منبع حذف شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProposal = () => {
    if (!proposal.title.trim() || !proposal.advisor.trim()) {
      setMessage({ type: 'error', text: 'لطفاً عنوان پایان‌نامه و نام استاد راهنما را وارد کنید' });
      return;
    }
    setEditingProposal(false);
    setMessage({ type: 'success', text: 'اطلاعات پروپوزال ذخیره شد' });
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      default: return '⏳';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      default: return 'pending';
    }
  };

  const getReferenceTypeLabel = (type: string) => {
    switch (type) {
      case 'book': return '📚 کتاب';
      case 'article': return '📝 مقاله';
      case 'thesis': return '🎓 پایان‌نامه';
      case 'conference': return '🎤 کنفرانس';
      default: return '📄';
    }
  };

  return (
    <div className="thesis-container">
      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="thesis-header">
        <div className="header-content">
          <div className="header-icon"><FiAward size={32} /></div>
          <div className="header-text">
            <h1>📝 پایان‌نامه یار</h1>
            <p>{userName} عزیز، پایان‌نامه خود را مدیریت کنید</p>
          </div>
        </div>
      </div>

      <div className="thesis-stats">
        <div className="stat-card"><div className="stat-icon purple"><FiTarget /></div><div className="stat-info"><h3>{progressPercentage}%</h3><p>پیشرفت کلی</p></div></div>
        <div className="stat-card"><div className="stat-icon orange"><FiClock /></div><div className="stat-info"><h3>{totalMilestones - completedMilestones}</h3><p>تسک باقیمانده</p></div></div>
        <div className="stat-card"><div className="stat-icon green"><FiCheckCircle /></div><div className="stat-info"><h3>{completedMilestones}</h3><p>تسک انجام شده</p></div></div>
        <div className="stat-card"><div className="stat-icon blue"><FiBookOpen /></div><div className="stat-info"><h3>{references.length}</h3><p>منابع ثبت شده</p></div></div>
      </div>

      <div className="progress-section">
        <div className="progress-label">پیشرفت کلی پایان‌نامه</div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPercentage}%` }} /><span className="progress-text">{progressPercentage}%</span></div>
      </div>

      <div className="thesis-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><FiFileText /> پروپوزال</button>
        <button className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => setActiveTab('milestones')}><FiTarget /> مایلستون‌ها</button>
        <button className={`tab-btn ${activeTab === 'references' ? 'active' : ''}`} onClick={() => setActiveTab('references')}><FiBookOpen /> منابع</button>
      </div>

      {activeTab === 'overview' && (
        <div className="proposal-section">
          <div className="section-header"><h3>📄 اطلاعات پروپوزال</h3>{!editingProposal && <button className="btn-edit" onClick={() => setEditingProposal(true)}><FiEdit2 /> ویرایش</button>}</div>
          {editingProposal ? (
            <div className="proposal-form">
              <div className="form-group"><label>عنوان پایان‌نامه *</label><input type="text" value={proposal.title} onChange={(e) => setProposal({...proposal, title: e.target.value})} placeholder="عنوان پایان‌نامه" /></div>
              <div className="form-row"><div className="form-group"><label>استاد راهنما *</label><input type="text" value={proposal.advisor} onChange={(e) => setProposal({...proposal, advisor: e.target.value})} placeholder="نام استاد راهنما" /></div>
              <div className="form-group"><label>استاد مشاور</label><input type="text" value={proposal.co_advisor} onChange={(e) => setProposal({...proposal, co_advisor: e.target.value})} placeholder="نام استاد مشاور" /></div></div>
              <div className="form-row"><div className="form-group"><label>رشته تحصیلی</label><input type="text" value={proposal.field} onChange={(e) => setProposal({...proposal, field: e.target.value})} placeholder="رشته تحصیلی" /></div>
              <div className="form-group"><label>تاریخ شروع</label><input type="text" value={proposal.start_date} onChange={(e) => setProposal({...proposal, start_date: e.target.value})} placeholder="۱۴۰۴/۰۱/۰۱" /></div>
              <div className="form-group"><label>تاریخ پایان</label><input type="text" value={proposal.end_date} onChange={(e) => setProposal({...proposal, end_date: e.target.value})} placeholder="۱۴۰۴/۱۲/۲۹" /></div></div>
              <div className="form-group"><label>توضیحات</label><textarea value={proposal.description} onChange={(e) => setProposal({...proposal, description: e.target.value})} rows={4} placeholder="خلاصه پایان‌نامه..." /></div>
              <div className="form-actions"><button className="btn-cancel" onClick={() => setEditingProposal(false)}>انصراف</button><button className="btn-save" onClick={handleSaveProposal}><FiSave /> ذخیره</button></div>
            </div>
          ) : (
            <div className="proposal-view">
              {!proposal.title ? (
                <div className="empty-proposal"><FiAlertCircle size={48} /><p>هنوز اطلاعات پروپوزال ثبت نشده است</p><button className="btn-primary" onClick={() => setEditingProposal(true)}>ثبت اطلاعات پروپوزال</button></div>
              ) : (
                <div className="proposal-details"><div className="detail-row"><span className="detail-label">عنوان:</span><span className="detail-value">{proposal.title}</span></div><div className="detail-row"><span className="detail-label">استاد راهنما:</span><span className="detail-value">{proposal.advisor}</span></div>{proposal.co_advisor && <div className="detail-row"><span className="detail-label">استاد مشاور:</span><span className="detail-value">{proposal.co_advisor}</span></div>}<div className="detail-row"><span className="detail-label">رشته تحصیلی:</span><span className="detail-value">{proposal.field || 'ثبت نشده'}</span></div><div className="detail-row"><span className="detail-label">بازه زمانی:</span><span className="detail-value">{proposal.start_date || '?'} تا {proposal.end_date || '?'}</span></div><div className="detail-row"><span className="detail-label">توضیحات:</span><span className="detail-value">{proposal.description || 'ثبت نشده'}</span></div></div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="milestones-section">
          <div className="section-header"><h3>🎯 مایلستون‌ها</h3><button className="btn-add" onClick={() => setShowAddMilestone(true)}><FiPlus /> افزودن مایلستون</button></div>
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className={`timeline-item ${getStatusClass(milestone.status)}`}>
                <div className="timeline-marker"><span className="marker-icon">{getStatusIcon(milestone.status)}</span><div className="timeline-line" /></div>
                <div className="timeline-content"><div className="timeline-header"><h4>{milestone.title}</h4><div className="timeline-actions"><select value={milestone.status} onChange={(e) => handleUpdateMilestoneStatus(milestone.id, e.target.value as any)} className="status-select"><option value="pending">⏳ در انتظار</option><option value="in_progress">🔄 در حال انجام</option><option value="completed">✅ انجام شده</option></select><button className="delete-btn" onClick={() => handleDeleteMilestone(milestone.id)}><FiTrash2 /></button></div></div><p className="timeline-date"><FiCalendar /> ددلاین: {milestone.deadline || 'نامشخص'}</p>{milestone.description && <p className="timeline-desc">{milestone.description}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'references' && (
        <div className="references-section">
          <div className="section-header"><h3>📚 منابع و مراجع</h3><button className="btn-add" onClick={() => setShowAddReference(true)}><FiPlus /> افزودن منبع</button></div>
          <div className="references-list">{references.length === 0 ? <div className="empty-state"><FiBookOpen size={48} /><p>هنوز منبعی ثبت نشده است</p></div> : references.map(ref => (<div key={ref.id} className="reference-card"><div className="reference-type">{getReferenceTypeLabel(ref.type)}</div><div className="reference-info"><h4>{ref.title}</h4><p className="reference-authors">{ref.authors}</p><p className="reference-year">سال انتشار: {ref.year}</p>{ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="reference-url">مشاهده منبع</a>}</div><button className="delete-btn" onClick={() => handleDeleteReference(ref.id)}><FiTrash2 /></button></div>))}</div>
        </div>
      )}

      {showAddMilestone && (<div className="modal-overlay" onClick={() => setShowAddMilestone(false)}><div className="modal-container" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>➕ افزودن مایلستون جدید</h3><button onClick={() => setShowAddMilestone(false)}><FiX /></button></div><div className="modal-body"><div className="form-group"><label>عنوان مایلستون</label><input type="text" value={newMilestone.title} onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})} placeholder="عنوان" /></div><div className="form-group"><label>ددلاین</label><input type="text" value={newMilestone.deadline} onChange={(e) => setNewMilestone({...newMilestone, deadline: e.target.value})} placeholder="مثال: ۱۴۰۴/۰۳/۰۱" /></div><div className="form-group"><label>توضیحات</label><textarea value={newMilestone.description} onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})} rows={3} placeholder="توضیحات اضافی..." /></div></div><div className="modal-footer"><button className="btn-cancel" onClick={() => setShowAddMilestone(false)}>انصراف</button><button className="btn-save" onClick={handleAddMilestone}>افزودن مایلستون</button></div></div></div>)}

      {showAddReference && (<div className="modal-overlay" onClick={() => setShowAddReference(false)}><div className="modal-container" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>📚 افزودن منبع جدید</h3><button onClick={() => setShowAddReference(false)}><FiX /></button></div><div className="modal-body"><div className="form-group"><label>عنوان منبع</label><input type="text" value={newReference.title} onChange={(e) => setNewReference({...newReference, title: e.target.value})} placeholder="عنوان کتاب/مقاله" /></div><div className="form-group"><label>نویسنده(ها)</label><input type="text" value={newReference.authors} onChange={(e) => setNewReference({...newReference, authors: e.target.value})} placeholder="نام نویسنده" /></div><div className="form-row"><div className="form-group"><label>نوع منبع</label><select value={newReference.type} onChange={(e) => setNewReference({...newReference, type: e.target.value as any})}><option value="book">📚 کتاب</option><option value="article">📝 مقاله</option><option value="thesis">🎓 پایان‌نامه</option><option value="conference">🎤 کنفرانس</option></select></div><div className="form-group"><label>سال انتشار</label><input type="number" value={newReference.year} onChange={(e) => setNewReference({...newReference, year: parseInt(e.target.value)})} /></div></div><div className="form-group"><label>لینک (اختیاری)</label><input type="url" value={newReference.url} onChange={(e) => setNewReference({...newReference, url: e.target.value})} placeholder="https://..." /></div></div><div className="modal-footer"><button className="btn-cancel" onClick={() => setShowAddReference(false)}>انصراف</button><button className="btn-save" onClick={handleAddReference}>افزودن منبع</button></div></div></div>)}

      <style>{`
        .thesis-container { max-width: 1000px; margin: 0 auto; }
        .thesis-header { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 24px; padding: 24px 32px; margin-bottom: 24px; color: white; }
        .thesis-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .thesis-stats .stat-card { background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; }
        .thesis-stats .stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .thesis-stats .stat-icon.purple { background: #ede9fe; color: #8b5cf6; }
        .thesis-stats .stat-icon.orange { background: #fef3c7; color: #f59e0b; }
        .thesis-stats .stat-icon.green { background: #d1fae5; color: #10b981; }
        .thesis-stats .stat-icon.blue { background: #dbeafe; color: #2563eb; }
        .thesis-stats .stat-info h3 { margin: 0; font-size: 1.3rem; }
        .thesis-stats .stat-info p { margin: 0; font-size: 0.7rem; color: #64748b; }
        .progress-section { background: white; border-radius: 16px; padding: 16px; margin-bottom: 24px; }
        .progress-label { font-size: 0.85rem; margin-bottom: 8px; color: #475569; }
        .progress-track { background: #e2e8f0; border-radius: 10px; height: 10px; position: relative; }
        .progress-fill { background: linear-gradient(90deg, #2563eb, #8b5cf6); border-radius: 10px; height: 100%; transition: width 0.5s; }
        .progress-text { position: absolute; right: 0; top: -20px; font-size: 0.7rem; color: #64748b; }
        .thesis-tabs { display: flex; gap: 10px; background: white; padding: 8px; border-radius: 20px; margin-bottom: 24px; }
        .tab-btn { flex: 1; padding: 12px; border: none; background: transparent; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .tab-btn.active { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-header h3 { margin: 0; }
        .btn-add { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .btn-edit { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .proposal-section, .milestones-section, .references-section { background: white; border-radius: 20px; padding: 24px; }
        .proposal-form, .proposal-view { margin-top: 16px; }
        .proposal-details { background: #f8fafc; border-radius: 16px; padding: 20px; }
        .detail-row { display: flex; margin-bottom: 12px; flex-wrap: wrap; }
        .detail-label { width: 120px; font-weight: 600; color: #475569; }
        .detail-value { flex: 1; color: #1e293b; }
        .empty-proposal { text-align: center; padding: 40px; color: #94a3b8; }
        .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer; margin-top: 16px; }
        .timeline { position: relative; }
        .timeline-item { display: flex; gap: 20px; margin-bottom: 24px; }
        .timeline-marker { position: relative; width: 40px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
        .marker-icon { font-size: 1.5rem; }
        .timeline-line { width: 2px; height: 100%; background: #e2e8f0; margin-top: 8px; }
        .timeline-item:last-child .timeline-line { display: none; }
        .timeline-content { flex: 1; background: #f8fafc; border-radius: 16px; padding: 16px; }
        .timeline-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
        .timeline-header h4 { margin: 0; }
        .status-select { padding: 4px 8px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; }
        .timeline-date { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #64748b; margin: 8px 0; }
        .timeline-desc { font-size: 0.85rem; color: #475569; margin-top: 8px; }
        .timeline-item.completed .timeline-content { background: #d1fae5; }
        .timeline-item.in-progress .timeline-content { background: #dbeafe; }
        .references-list { display: flex; flex-direction: column; gap: 12px; }
        .reference-card { display: flex; align-items: center; gap: 16px; background: #f8fafc; border-radius: 16px; padding: 16px; }
        .reference-type { width: 80px; font-size: 0.8rem; }
        .reference-info { flex: 1; }
        .reference-info h4 { margin: 0 0 4px 0; }
        .reference-authors { font-size: 0.8rem; color: #64748b; margin: 0; }
        .reference-year { font-size: 0.7rem; color: #94a3b8; margin: 4px 0 0; }
        .reference-url { font-size: 0.7rem; color: #2563eb; text-decoration: none; }
        .empty-state { text-align: center; padding: 60px; color: #94a3b8; }
        .form-actions { display: flex; gap: 12px; margin-top: 16px; }
        .toast-message { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 12px; z-index: 2000; animation: slideIn 0.3s ease; }
        .toast-message.success { background: #10b981; color: white; }
        .toast-message.error { background: #ef4444; color: white; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-container { background: white; border-radius: 24px; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; }
        .btn-cancel { flex: 1; padding: 10px; background: #e2e8f0; border: none; border-radius: 12px; cursor: pointer; }
        .btn-save { flex: 1; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; }
        .form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .thesis-stats { grid-template-columns: repeat(2, 1fr); }
          .form-row { grid-template-columns: 1fr; }
          .timeline-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default ThesisManager;