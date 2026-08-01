// backend/models/ClassExamSubmission.js
const db = require('../config/db');

class ClassExamSubmission {
  // ثبت پاسخ‌های دانش‌آموز
  static async submit(data) {
    const { exam_id, student_id, answers, score, total_points, score_percentage, correct_count, wrong_count, time_spent } = data;
    
    // بررسی وجود submission قبلی
    const existing = await db.query(
      'SELECT * FROM class_exam_submissions WHERE exam_id = $1 AND student_id = $2',
      [exam_id, student_id]
    );
    
    const answersJson = JSON.stringify(answers);
    
    if (existing.rows.length > 0) {
      const query = `
        UPDATE class_exam_submissions 
        SET answers = $1, score = $2, total_points = $3, score_percentage = $4,
            correct_count = $5, wrong_count = $6, time_spent = $7,
            status = 'completed', submitted_at = NOW()
        WHERE exam_id = $8 AND student_id = $9
        RETURNING *
      `;
      const values = [answersJson, score, total_points, score_percentage, correct_count, wrong_count, time_spent, exam_id, student_id];
      const result = await db.query(query, values);
      return result.rows[0];
    } else {
      const query = `
        INSERT INTO class_exam_submissions (exam_id, student_id, answers, score, total_points, 
                                            score_percentage, correct_count, wrong_count, time_spent, status, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', NOW())
        RETURNING *
      `;
      const values = [exam_id, student_id, answersJson, score, total_points, score_percentage, correct_count, wrong_count, time_spent];
      const result = await db.query(query, values);
      return result.rows[0];
    }
  }

  // دریافت نتایج یک آزمون برای معلم
  static async getExamResults(examId, teacherId) {
    const query = `
      SELECT cs.*, 
             u.name as student_name, 
             u.email as student_email,
             ce.exam_data,
             ce.config,
             ce.title as exam_title,
             c.name as class_name
      FROM class_exam_submissions cs
      JOIN users u ON cs.student_id = u.id
      JOIN class_exams ce ON cs.exam_id = ce.id
      JOIN classes c ON ce.class_id = c.id
      WHERE cs.exam_id = $1 AND ce.teacher_id = $2 AND cs.status = 'completed'
      ORDER BY cs.score_percentage DESC
    `;
    
    const result = await db.query(query, [examId, teacherId]);
    
    result.rows.forEach(row => {
      if (row.answers && typeof row.answers === 'string') {
        try { row.answers = JSON.parse(row.answers); } catch(e) { row.answers = {}; }
      }
      if (row.exam_data && typeof row.exam_data === 'string') {
        try { row.exam_data = JSON.parse(row.exam_data); } catch(e) { row.exam_data = {}; }
      }
      if (row.config && typeof row.config === 'string') {
        try { row.config = JSON.parse(row.config); } catch(e) { row.config = {}; }
      }
    });
    
    return result.rows;
  }

  // دریافت نتایج دانش‌آموز
  static async getStudentResults(studentId, classId = null) {
    let query = `
      SELECT cs.*, 
             ce.title as exam_title,
             ce.exam_data,
             ce.config,
             c.name as class_name
      FROM class_exam_submissions cs
      JOIN class_exams ce ON cs.exam_id = ce.id
      JOIN classes c ON ce.class_id = c.id
      WHERE cs.student_id = $1 AND cs.status = 'completed'
    `;
    const params = [studentId];
    
    if (classId) {
      query += ` AND ce.class_id = $2`;
      params.push(classId);
    }
    
    query += ` ORDER BY cs.submitted_at DESC`;
    
    const result = await db.query(query, params);
    
    result.rows.forEach(row => {
      if (row.answers && typeof row.answers === 'string') {
        try { row.answers = JSON.parse(row.answers); } catch(e) { row.answers = {}; }
      }
      if (row.exam_data && typeof row.exam_data === 'string') {
        try { row.exam_data = JSON.parse(row.exam_data); } catch(e) { row.exam_data = {}; }
      }
      if (row.config && typeof row.config === 'string') {
        try { row.config = JSON.parse(row.config); } catch(e) { row.config = {}; }
      }
    });
    
    return result.rows;
  }

  // دریافت آمار پیشرفت کلاس برای معلم
  static async getClassProgress(classId, teacherId) {
    const query = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        COUNT(DISTINCT cs.exam_id) as total_exams,
        COALESCE(AVG(cs.score_percentage), 0) as avg_score,
        COALESCE(MAX(cs.score_percentage), 0) as max_score,
        COALESCE(MIN(cs.score_percentage), 0) as min_score
      FROM class_members cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN class_exam_submissions cs ON u.id = cs.student_id
      LEFT JOIN class_exams ce ON cs.exam_id = ce.id AND ce.teacher_id = $2
      WHERE cm.class_id = $1 AND cm.role = 'student' AND cm.status = 'active'
      GROUP BY u.id, u.name, u.email
      ORDER BY avg_score DESC
    `;
    const result = await db.query(query, [classId, teacherId]);
    return result.rows;
  }
}

module.exports = ClassExamSubmission;