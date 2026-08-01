// backend/models/ClassExam.js
const db = require('../config/db');

class ClassExam {
  static async create(data) {
    const { class_id, teacher_id, title, description, exam_data, config } = data;
    
    console.log('📝 Model create received:', {
      class_id,
      teacher_id,
      title,
      exam_data_type: typeof exam_data,
      is_exam_data_string: typeof exam_data === 'string',
      questions_count: exam_data?.questions?.length
    });
    
    // ✅ اصلاح: فقط اگر string نبود JSON.stringify کن
    let examDataJson;
    let configJson = null;
    
    try {
      // بررسی exam_data
      if (exam_data === null || exam_data === undefined) {
        examDataJson = JSON.stringify({ questions: [] });
      } else if (typeof exam_data === 'string') {
        // اگر قبلاً string است، همان را استفاده کن (نیاز به JSON.stringify نیست)
        examDataJson = exam_data;
        // امتحان کن ببین قابل parse هست یا نه
        try {
          JSON.parse(examDataJson);
        } catch (e) {
          // اگر قابل parse نبود، خودش یک JSON نامعتبر است
          examDataJson = JSON.stringify({ questions: [] });
        }
      } else if (typeof exam_data === 'object') {
        // اگر object است، stringify کن
        examDataJson = JSON.stringify(exam_data);
      } else {
        examDataJson = JSON.stringify({ questions: [] });
      }
      
      // بررسی config
      if (config) {
        if (typeof config === 'string') {
          configJson = config;
          try {
            JSON.parse(configJson);
          } catch (e) {
            configJson = null;
          }
        } else if (typeof config === 'object') {
          configJson = JSON.stringify(config);
        }
      }
    } catch (err) {
      console.error('JSON stringify error:', err);
      examDataJson = JSON.stringify({ questions: [] });
    }
    
    console.log('📝 After processing - examDataJson length:', examDataJson?.length);
    console.log('📝 examDataJson preview:', examDataJson?.substring(0, 100));
    
    const query = `
      INSERT INTO class_exams (class_id, teacher_id, title, description, exam_data, config, status, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, NOW())
      RETURNING *
    `;
    
    const values = [
      class_id, 
      teacher_id, 
      title || 'آزمون جدید', 
      description || '', 
      examDataJson, 
      configJson, 
      'draft'
    ];
    
    try {
      const result = await db.query(query, values);
      const newExam = result.rows[0];
      
      // ✅ فقط در صورتی که data از نوع string باشد parse کن
      if (newExam.exam_data && typeof newExam.exam_data === 'string') {
        newExam.exam_data = JSON.parse(newExam.exam_data);
      }
      if (newExam.config && typeof newExam.config === 'string') {
        newExam.config = JSON.parse(newExam.config);
      }
      
      console.log('✅ Exam created with ID:', newExam.id);
      return newExam;
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      throw dbError;
    }
  }

  static async findByClassId(classId, teacherId = null) {
    let query = `
      SELECT ce.*, 
             (SELECT COUNT(*) FROM class_exam_submissions WHERE exam_id = ce.id) as submission_count,
             (SELECT COALESCE(AVG(score_percentage), 0) FROM class_exam_submissions WHERE exam_id = ce.id) as avg_score
      FROM class_exams ce
      WHERE ce.class_id = $1
    `;
    const params = [classId];
    
    if (teacherId) {
      query += ` AND ce.teacher_id = $2`;
      params.push(teacherId);
    }
    
    query += ` ORDER BY ce.created_at DESC`;
    
    const result = await db.query(query, params);
    
    result.rows.forEach(row => {
      if (row.exam_data && typeof row.exam_data === 'string') {
        try {
          row.exam_data = JSON.parse(row.exam_data);
        } catch (e) {
          console.error('Error parsing exam_data:', e);
        }
      }
      if (row.config && typeof row.config === 'string') {
        try {
          row.config = JSON.parse(row.config);
        } catch (e) {
          console.error('Error parsing config:', e);
        }
      }
    });
    
    return result.rows;
  }

  static async findById(examId, teacherId = null) {
    let query = `
      SELECT ce.*, c.name as class_name, c.class_code,
             u.name as teacher_name
      FROM class_exams ce
      JOIN classes c ON ce.class_id = c.id
      JOIN users u ON ce.teacher_id = u.id
      WHERE ce.id = $1
    `;
    const params = [examId];
    
    if (teacherId) {
      query += ` AND ce.teacher_id = $2`;
      params.push(teacherId);
    }
    
    const result = await db.query(query, params);
    
    if (result.rows[0]) {
      if (result.rows[0].exam_data && typeof result.rows[0].exam_data === 'string') {
        try {
          result.rows[0].exam_data = JSON.parse(result.rows[0].exam_data);
        } catch (e) {}
      }
      if (result.rows[0].config && typeof result.rows[0].config === 'string') {
        try {
          result.rows[0].config = JSON.parse(result.rows[0].config);
        } catch (e) {}
      }
    }
    
    return result.rows[0];
  }

  static async update(examId, teacherId, updates) {
    const { exam_data, config, status, title, description } = updates;
    
    let examDataJson = null;
    let configJson = null;
    
    if (exam_data) {
      if (typeof exam_data === 'string') {
        examDataJson = exam_data;
      } else {
        examDataJson = JSON.stringify(exam_data);
      }
    }
    
    if (config) {
      if (typeof config === 'string') {
        configJson = config;
      } else {
        configJson = JSON.stringify(config);
      }
    }
    
    const query = `
      UPDATE class_exams 
      SET exam_data = COALESCE($1, exam_data),
          config = COALESCE($2, config),
          status = COALESCE($3, status),
          title = COALESCE($4, title),
          description = COALESCE($5, description),
          updated_at = NOW()
      WHERE id = $6 AND teacher_id = $7
      RETURNING *
    `;
    const values = [
      examDataJson,
      configJson,
      status,
      title,
      description,
      examId,
      teacherId
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows[0]) {
      if (result.rows[0].exam_data && typeof result.rows[0].exam_data === 'string') {
        try {
          result.rows[0].exam_data = JSON.parse(result.rows[0].exam_data);
        } catch (e) {}
      }
      if (result.rows[0].config && typeof result.rows[0].config === 'string') {
        try {
          result.rows[0].config = JSON.parse(result.rows[0].config);
        } catch (e) {}
      }
    }
    
    return result.rows[0];
  }

  static async publish(examId, teacherId) {
    const query = `
      UPDATE class_exams 
      SET status = 'published', published_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND teacher_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [examId, teacherId]);
    
    if (result.rows[0]) {
      if (result.rows[0].exam_data && typeof result.rows[0].exam_data === 'string') {
        try {
          result.rows[0].exam_data = JSON.parse(result.rows[0].exam_data);
        } catch (e) {}
      }
      if (result.rows[0].config && typeof result.rows[0].config === 'string') {
        try {
          result.rows[0].config = JSON.parse(result.rows[0].config);
        } catch (e) {}
      }
    }
    
    return result.rows[0];
  }

  static async delete(examId, teacherId) {
    const query = 'DELETE FROM class_exams WHERE id = $1 AND teacher_id = $2 RETURNING id';
    const result = await db.query(query, [examId, teacherId]);
    return result.rows[0];
  }

  static async getStudentExams(studentId, classId = null) {
    let query = `
      SELECT ce.*, c.name as class_name, c.class_code, c.teacher_id,
             u.name as teacher_name,
             cs.id as submission_id, cs.score, cs.score_percentage, cs.status as submission_status,
             cs.submitted_at
      FROM class_exams ce
      JOIN classes c ON ce.class_id = c.id
      JOIN class_members cm ON c.id = cm.class_id
      JOIN users u ON ce.teacher_id = u.id
      LEFT JOIN class_exam_submissions cs ON ce.id = cs.exam_id AND cs.student_id = $1
      WHERE cm.user_id = $1 AND cm.status = 'active'
        AND ce.status = 'published'
    `;
    const params = [studentId];
    
    if (classId) {
      query += ` AND c.id = $2`;
      params.push(classId);
    }
    
    query += ` ORDER BY ce.created_at DESC`;
    
    const result = await db.query(query, params);
    
    result.rows.forEach(row => {
      if (row.exam_data && typeof row.exam_data === 'string') {
        try {
          row.exam_data = JSON.parse(row.exam_data);
        } catch (e) {}
      }
      if (row.config && typeof row.config === 'string') {
        try {
          row.config = JSON.parse(row.config);
        } catch (e) {}
      }
    });
    
    return result.rows;
  }
}

module.exports = ClassExam;