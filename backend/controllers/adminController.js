// controllers/adminController.js
const db = require('../config/db');

// ========== آمار داشبورد ==========
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard stats...');

    const usersStats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
        COUNT(CASE WHEN role = 'university' THEN 1 END) as total_university,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_users_today
      FROM users WHERE id > 0
    `);

    const messagesStats = await db.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages
      FROM contact_messages
    `);

    const examsStats = await db.query(`
      SELECT 
        COUNT(*) as total_exams,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_exams,
        COALESCE(AVG(score_percentage), 0) as avg_score
      FROM saved_exams
    `);

    const monthlyProgress = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' AND id > 0
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `);

    const roleDistribution = await db.query(`
      SELECT 
        role,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM users WHERE id > 0
      GROUP BY role
    `);

    const topUsers = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.role,
        COUNT(s.id) as exam_count,
        COALESCE(AVG(s.score_percentage), 0) as avg_score,
        COALESCE(SUM(s.score_percentage), 0) as total_score
      FROM users u
      LEFT JOIN saved_exams s ON u.id = s.user_id AND s.status = 'completed'
      WHERE u.id > 0
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY exam_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: {
          users: usersStats.rows[0] || {},
          messages: messagesStats.rows[0] || {},
          exams: examsStats.rows[0] || {}
        },
        progress: {
          monthly: monthlyProgress.rows
        },
        distribution: roleDistribution.rows,
        topUsers: topUsers.rows
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار داشبورد: ' + error.message
    });
  }
};

// ========== دریافت لیست کاربران ==========
const getUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, name, email, role, is_active, created_at, last_login,
        role_selected, phone, avatar
      FROM users 
      WHERE id > 0
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: { users: result.rows }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کاربران: ' + error.message
    });
  }
};

// ========== دریافت یک کاربر ==========
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id, name, email, role, is_active, created_at, last_login,
        role_selected, phone, avatar,
        (SELECT COUNT(*) FROM saved_exams WHERE user_id = u.id) as exam_count,
        (SELECT COALESCE(AVG(score_percentage), 0) FROM saved_exams WHERE user_id = u.id AND status = 'completed') as avg_score
      FROM users u
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }
    
    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کاربر'
    });
  }
};

// ========== تغییر وضعیت کاربر ==========
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    await db.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [is_active, id]
    );
    
    res.json({
      success: true,
      message: 'وضعیت کاربر با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر وضعیت کاربر'
    });
  }
};

// ========== تغییر نقش کاربر ==========
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const validRoles = ['student', 'teacher', 'university', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نقش نامعتبر است'
      });
    }
    
    await db.query(
      'UPDATE users SET role = $1, role_selected = true, updated_at = NOW() WHERE id = $2',
      [role, id]
    );
    
    res.json({
      success: true,
      message: 'نقش کاربر با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر نقش کاربر'
    });
  }
};

// ========== حذف کاربر ==========
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'نمی‌توانید حساب کاربری خود را حذف کنید'
      });
    }
    
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف کاربر'
    });
  }
};

// ========== دریافت پیام‌ها ==========
const getMessages = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, subject, message, is_read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: { messages: result.rows }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت پیام‌ها'
    });
  }
};

// ========== علامت زدن پیام به عنوان خوانده شده ==========
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE contact_messages SET is_read = true, read_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'پیام به عنوان خوانده شده علامت زده شد'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی پیام'
    });
  }
};

// ========== حذف پیام ==========
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM contact_messages WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'پیام با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف پیام'
    });
  }
};

// ========== دریافت تیکت‌ها ==========
const getTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    
    res.json({
      success: true,
      data: { tickets: result.rows }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تیکت‌ها'
    });
  }
};

// ========== تغییر وضعیت تیکت ==========
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    
    res.json({
      success: true,
      message: 'وضعیت تیکت با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر وضعیت تیکت'
    });
  }
};

// ========== حذف تیکت ==========
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tickets WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'تیکت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف تیکت'
    });
  }
};

// ========== دریافت اشتراک‌های کاربران ==========
const getAllSubscriptions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, u.name as user_name, u.email as user_email, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
    `);
    
    res.json({
      success: true,
      data: { subscriptions: result.rows }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اشتراک‌ها'
    });
  }
};

// ========== دریافت آمار آزمون‌ها ==========
const getExamStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(score_percentage) as avg_score
      FROM saved_exams
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      data: { stats: result.rows }
    });
  } catch (error) {
    console.error('Get exam stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار آزمون‌ها'
    });
  }
};

// ========== دریافت آمار فعالیت ==========
const getActivityStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_activities
      FROM saved_exams
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      success: true,
      data: { dailyActivity: result.rows }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار فعالیت‌ها'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getMessages,
  markMessageAsRead,
  deleteMessage,
  getTickets,
  updateTicketStatus,
  deleteTicket,
  getAllSubscriptions,
  getExamStats,
  getActivityStats
};