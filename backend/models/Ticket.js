// backend/models/Ticket.js
const db = require('../config/db');

class Ticket {
  // ========== ایجاد تیکت جدید ==========
  static async create(data) {
    const {
      user_id, full_name, phone, subject, message,
      category, priority, ipAddress, userAgent
    } = data;

    const query = `
      INSERT INTO tickets (
        user_id, full_name, phone, subject, message,
        category, priority, ip_address, user_agent, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
      RETURNING id, created_at, status
    `;

    const values = [
      user_id,
      full_name || null,
      phone || null,
      subject.trim(),
      message.trim(),
      category || 'general',
      priority || 'medium',
      ipAddress || 'unknown',
      userAgent || 'unknown'
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // ========== دریافت تیکت‌های کاربر ==========
  static async getByUser(userId, filters = {}) {
    let query = `
      SELECT 
        t.id, t.user_id, t.full_name, t.phone, t.subject, t.message,
        t.category, t.priority, t.status, t.created_at, t.updated_at,
        t.answered_at, t.closed_at,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as replies_count,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id AND is_admin = true) as admin_replies_count
      FROM tickets t
      WHERE t.user_id = $1
    `;
    const values = [userId];
    let idx = 2;

    if (filters.status && filters.status !== 'all') {
      query += ` AND t.status = $${idx++}`;
      values.push(filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      query += ` AND t.category = $${idx++}`;
      values.push(filters.category);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, values);
    return result.rows;
  }

  // ========== دریافت همه تیکت‌ها برای ادمین ==========
  static async getAllForAdmin(filters = {}) {
    let query = `
      SELECT 
        t.id, t.user_id, t.full_name, t.phone, t.subject, t.message,
        t.category, t.priority, t.status, t.created_at, t.updated_at,
        t.answered_at, t.closed_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as replies_count,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id AND is_admin = true) as admin_replies_count
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (filters.status && filters.status !== 'all') {
      query += ` AND t.status = $${idx++}`;
      values.push(filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      query += ` AND t.priority = $${idx++}`;
      values.push(filters.priority);
    }
    if (filters.category && filters.category !== 'all') {
      query += ` AND t.category = $${idx++}`;
      values.push(filters.category);
    }
    if (filters.search) {
      query += ` AND (t.full_name ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR t.subject ILIKE $${idx})`;
      values.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, values);
    return result.rows;
  }

  // ========== دریافت یک تیکت با جزئیات کامل ==========
  static async getById(ticketId, userId = null, isAdmin = false) {
    let query = `
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;
    const values = [ticketId];

    if (!isAdmin && userId) {
      query += ` AND t.user_id = $2`;
      values.push(userId);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) return null;

    const ticket = result.rows[0];

    // دریافت پاسخ‌ها
    const repliesQuery = `
      SELECT tr.*,
        u.name as user_name,
        u.role as user_role,
        CASE
          WHEN tr.is_admin = true THEN 'پشتیبانی آزمونیک'
          WHEN u.role = 'admin' THEN 'ادمین سیستم'
          ELSE u.name
        END as display_name,
        tr.is_admin as is_admin
      FROM ticket_replies tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.ticket_id = $1
      ORDER BY tr.created_at ASC
    `;
    const repliesResult = await db.query(repliesQuery, [ticketId]);
    ticket.replies = repliesResult.rows;

    return ticket;
  }

  // ========== افزودن پاسخ ==========
  static async addReply(ticketId, userId, message, isAdmin = false) {
    // بررسی وجود تیکت
    const ticketCheck = await db.query('SELECT id, status, user_id FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) {
      throw new Error('تیکت یافت نشد');
    }

    const ticket = ticketCheck.rows[0];

    // بررسی دسترسی
    if (!isAdmin && ticket.user_id !== userId) {
      throw new Error('شما دسترسی به این تیکت ندارید');
    }

    // ذخیره پاسخ
    const insertQuery = `
      INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const insertResult = await db.query(insertQuery, [ticketId, userId, message.trim(), isAdmin]);

    // به‌روزرسانی وضعیت تیکت
    const newStatus = isAdmin ? 'answered' : 'pending';
    await db.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, ticketId]
    );

    if (isAdmin) {
      await db.query(
        'UPDATE tickets SET answered_at = NOW() WHERE id = $1 AND answered_at IS NULL',
        [ticketId]
      );
    }

    // دریافت اطلاعات کاربر برای پاسخ
    const userResult = await db.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    return {
      ...insertResult.rows[0],
      display_name: isAdmin ? 'پشتیبانی آزمونیک' : (user?.role === 'admin' ? 'ادمین سیستم' : user?.name || 'کاربر'),
      is_admin: isAdmin,
      user_name: user?.name
    };
  }

  // ========== بستن تیکت توسط کاربر ==========
  static async close(ticketId, userId) {
    const query = `
      UPDATE tickets
      SET status = 'closed', closed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status != 'closed'
      RETURNING *
    `;
    const result = await db.query(query, [ticketId, userId]);
    return result.rows[0];
  }

  // ========== باز کردن مجدد تیکت ==========
  static async reopen(ticketId, userId) {
    const query = `
      UPDATE tickets
      SET status = 'pending', closed_at = NULL, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'closed'
      RETURNING *
    `;
    const result = await db.query(query, [ticketId, userId]);
    return result.rows[0];
  }

  // ========== به‌روزرسانی تیکت توسط ادمین ==========
  static async update(ticketId, updates) {
    const allowedFields = ['category', 'priority', 'status'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) return null;

    values.push(ticketId);
    const query = `
      UPDATE tickets
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // ========== حذف تیکت (فقط ادمین) ==========
  static async delete(ticketId) {
    // ابتدا پاسخ‌ها را حذف کن
    await db.query('DELETE FROM ticket_replies WHERE ticket_id = $1', [ticketId]);
    // سپس تیکت را حذف کن
    const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [ticketId]);
    return result.rows[0];
  }

  // ========== آمار تیکت‌ها ==========
  static async getStats(userId = null) {
    let query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low
      FROM tickets
    `;
    const values = [];

    if (userId) {
      query += ' WHERE user_id = $1';
      values.push(userId);
    }

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // ========== دریافت دسته‌بندی‌ها ==========
  static async getCategories() {
    const result = await db.query(
      'SELECT id, name, name_fa, icon, sort_order FROM ticket_categories ORDER BY sort_order'
    );
    return result.rows;
  }
}

module.exports = Ticket;