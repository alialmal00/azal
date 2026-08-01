// backend/controllers/ticketController.js
const db = require('../config/db');

// ========== دریافت دسته‌بندی‌ها ==========
const getCategories = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, name_fa, icon, sort_order 
      FROM ticket_categories 
      ORDER BY sort_order
    `);
    
    res.json({ success: true, data: { categories: result.rows } });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت دسته‌بندی‌ها' });
  }
};

// ========== ثبت تیکت جدید ==========
const submitTicket = async (req, res) => {
  try {
    const { full_name, phone, subject, message, category, priority } = req.body;
    const userId = req.user.id;

    console.log('📝 Submitting ticket for user:', userId);
    console.log('Subject:', subject);
    console.log('Message length:', message?.length);

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'موضوع تیکت الزامی است' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'متن پیام الزامی است' });
    }

    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const query = `
      INSERT INTO tickets (
        user_id, full_name, phone, subject, message, 
        category, priority, ip_address, user_agent, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
      RETURNING id, created_at, status
    `;

    const values = [
      userId,
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
    const ticket = result.rows[0];

    console.log('✅ Ticket created with ID:', ticket.id);

    res.status(201).json({
      success: true,
      message: 'تیکت شما با موفقیت ثبت شد',
      data: { ticket }
    });
  } catch (error) {
    console.error('Submit ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت تیکت: ' + error.message });
  }
};

// ========== دریافت تیکت‌های من (کاربر) ==========
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category } = req.query;

    console.log('📋 Getting tickets for user:', userId);

    let query = `
      SELECT 
        t.id, t.user_id, t.full_name, t.phone, t.subject, t.message,
        t.category, t.priority, t.status, t.created_at, t.updated_at,
        t.answered_at, t.closed_at,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id)::int as replies_count,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id AND is_admin = true)::int as admin_replies_count
      FROM tickets t
      WHERE t.user_id = $1
    `;
    
    const values = [userId];
    let idx = 2;

    if (status && status !== 'all') {
      query += ` AND t.status = $${idx++}`;
      values.push(status);
    }
    if (category && category !== 'all') {
      query += ` AND t.category = $${idx++}`;
      values.push(category);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, values);
    
    // آمار
    const statsQuery = `
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
      WHERE user_id = $1
    `;
    const statsResult = await db.query(statsQuery, [userId]);
    
    // دسته‌بندی‌ها
    const categoriesResult = await db.query(`
      SELECT id, name, name_fa, icon, sort_order 
      FROM ticket_categories 
      ORDER BY sort_order
    `);

    console.log(`✅ Found ${result.rows.length} tickets for user ${userId}`);

    res.json({
      success: true,
      data: { 
        tickets: result.rows, 
        stats: statsResult.rows[0] || { total: 0, pending: 0, answered: 0, closed: 0, urgent: 0, high: 0, medium: 0, low: 0 },
        categories: categoriesResult.rows
      }
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تیکت‌ها' });
  }
};

// ========== دریافت یک تیکت (کاربر) ==========
const getTicketById = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log(`📋 Getting ticket ${ticketId} for user ${userId}`);

    const ticketQuery = `
      SELECT 
        t.*,
        COALESCE(u.name, 'کاربر ناشناس') as user_name,
        COALESCE(u.email, 'ایمیل نامشخص') as user_email,
        COALESCE(u.role, 'user') as user_role
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1 AND t.user_id = $2
    `;
    const ticketResult = await db.query(ticketQuery, [ticketId, userId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    }

    const ticket = ticketResult.rows[0];

    const repliesQuery = `
      SELECT 
        tr.*,
        COALESCE(u.name, 'کاربر') as user_name,
        COALESCE(u.role, 'user') as user_role,
        CASE
          WHEN tr.is_admin = true THEN 'پشتیبانی آزمونیک'
          WHEN u.role = 'admin' THEN 'ادمین سیستم'
          ELSE COALESCE(u.name, 'کاربر')
        END as display_name,
        tr.is_admin as is_admin
      FROM ticket_replies tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.ticket_id = $1
      ORDER BY tr.created_at ASC
    `;
    const repliesResult = await db.query(repliesQuery, [ticketId]);
    ticket.replies = repliesResult.rows;

    res.json({ success: true, data: { ticket } });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تیکت: ' + error.message });
  }
};

// ========== افزودن پاسخ به تیکت (کاربر) ==========
const addReply = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { message } = req.body;
    const userId = req.user.id;

    console.log(`💬 Adding reply to ticket ${ticketId} by user ${userId}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'لطفاً پاسخ را وارد کنید' });
    }

    // بررسی وجود تیکت و دسترسی کاربر
    const ticketCheck = await db.query(
      'SELECT id, status, user_id FROM tickets WHERE id = $1 AND user_id = $2',
      [ticketId, userId]
    );
    
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد یا دسترسی ندارید' });
    }

    const ticket = ticketCheck.rows[0];

    // ذخیره پاسخ
    const insertQuery = `
      INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin, created_at)
      VALUES ($1, $2, $3, false, NOW())
      RETURNING id, ticket_id, user_id, message, is_admin, created_at
    `;
    const insertResult = await db.query(insertQuery, [ticketId, userId, message.trim()]);

    // به‌روزرسانی وضعیت تیکت (اگر کاربر پاسخ دهد، وضعیت به pending برمی‌گردد)
    await db.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      ['pending', ticketId]
    );

    // دریافت اطلاعات کاربر
    const userResult = await db.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'پاسخ شما با موفقیت ثبت شد',
      data: { 
        reply: {
          ...insertResult.rows[0],
          display_name: user?.name || 'کاربر',
          is_admin: false,
          user_name: user?.name,
          user_role: user?.role
        }
      }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت پاسخ: ' + error.message });
  }
};

// ========== بستن تیکت توسط کاربر ==========
const closeTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log(`🔒 Closing ticket ${ticketId} by user ${userId}`);

    const result = await db.query(
      `UPDATE tickets 
       SET status = 'closed', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'closed'
       RETURNING *`,
      [ticketId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد یا قبلاً بسته شده است' });
    }

    res.json({ success: true, message: 'تیکت با موفقیت بسته شد' });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در بستن تیکت' });
  }
};

// ========== باز کردن مجدد تیکت توسط کاربر ==========
const reopenTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log(`🔓 Reopening ticket ${ticketId} by user ${userId}`);

    const result = await db.query(
      `UPDATE tickets 
       SET status = 'pending', closed_at = NULL, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'closed'
       RETURNING *`,
      [ticketId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد یا باز است' });
    }

    res.json({ success: true, message: 'تیکت با موفقیت باز شد' });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در باز کردن تیکت' });
  }
};

// ========== دریافت همه تیکت‌ها برای ادمین ==========
const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;

    console.log('📋 Admin getting all tickets - filters:', { status, priority, category, search });

    let query = `
      SELECT 
        t.id, t.user_id, t.full_name, t.phone, t.subject, t.message,
        t.category, t.priority, t.status, t.created_at, t.updated_at,
        t.answered_at, t.closed_at,
        COALESCE(u.name, 'کاربر ناشناس') as user_name,
        COALESCE(u.email, 'ایمیل نامشخص') as user_email,
        COALESCE(u.role, 'user') as user_role,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id)::int as replies_count,
        (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id AND is_admin = true)::int as admin_replies_count
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    
    const values = [];
    let idx = 1;

    if (status && status !== 'all') {
      query += ` AND t.status = $${idx++}`;
      values.push(status);
    }
    if (priority && priority !== 'all') {
      query += ` AND t.priority = $${idx++}`;
      values.push(priority);
    }
    if (category && category !== 'all') {
      query += ` AND t.category = $${idx++}`;
      values.push(category);
    }
    if (search) {
      query += ` AND (t.full_name ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR t.subject ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, values);
    
    // آمار کلی
    const statsQuery = `
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
    const statsResult = await db.query(statsQuery);
    
    // دسته‌بندی‌ها
    const categoriesResult = await db.query(`
      SELECT id, name, name_fa, icon, sort_order 
      FROM ticket_categories 
      ORDER BY sort_order
    `);

    console.log(`✅ Found ${result.rows.length} tickets for admin`);

    res.json({
      success: true,
      data: { 
        tickets: result.rows, 
        stats: statsResult.rows[0] || { total: 0, pending: 0, answered: 0, closed: 0, urgent: 0, high: 0, medium: 0, low: 0 },
        categories: categoriesResult.rows
      }
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تیکت‌ها: ' + error.message });
  }
};

// ========== دریافت یک تیکت برای ادمین ==========
const getAdminTicketById = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    console.log(`📋 Admin getting ticket ${ticketId}`);

    const ticketQuery = `
      SELECT 
        t.*,
        COALESCE(u.name, 'کاربر ناشناس') as user_name,
        COALESCE(u.email, 'ایمیل نامشخص') as user_email,
        COALESCE(u.role, 'user') as user_role
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;
    const ticketResult = await db.query(ticketQuery, [ticketId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    }

    const ticket = ticketResult.rows[0];

    const repliesQuery = `
      SELECT 
        tr.*,
        COALESCE(u.name, 'کاربر') as user_name,
        COALESCE(u.role, 'user') as user_role,
        CASE
          WHEN tr.is_admin = true THEN 'پشتیبانی آزمونیک'
          WHEN u.role = 'admin' THEN 'ادمین سیستم'
          ELSE COALESCE(u.name, 'کاربر')
        END as display_name,
        tr.is_admin as is_admin
      FROM ticket_replies tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.ticket_id = $1
      ORDER BY tr.created_at ASC
    `;
    const repliesResult = await db.query(repliesQuery, [ticketId]);
    ticket.replies = repliesResult.rows;

    res.json({ success: true, data: { ticket } });
  } catch (error) {
    console.error('Get admin ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تیکت: ' + error.message });
  }
};

// ========== افزودن پاسخ به تیکت توسط ادمین ==========
const addAdminReply = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { message } = req.body;
    const adminId = req.user.id;

    console.log(`💬 Admin adding reply to ticket ${ticketId}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'لطفاً پاسخ را وارد کنید' });
    }

    // بررسی وجود تیکت
    const ticketCheck = await db.query('SELECT id, status FROM tickets WHERE id = $1', [ticketId]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    }

    // بررسی وجود کاربر سیستمی با ID 0
    const userCheck = await db.query('SELECT id FROM users WHERE id = 0');
    if (userCheck.rows.length === 0) {
      await db.query(`
        INSERT INTO users (id, name, email, password, role, is_active, created_at)
        VALUES (0, 'سیستم', 'system@azmoonik.com', '', 'system', true, NOW())
      `);
      console.log('✅ System user created with ID 0');
    }

    // ذخیره پاسخ با user_id = 0
    const insertQuery = `
      INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin, created_at)
      VALUES ($1, 0, $2, true, NOW())
      RETURNING id, ticket_id, user_id, message, is_admin, created_at
    `;
    const insertResult = await db.query(insertQuery, [ticketId, message.trim()]);

    // به‌روزرسانی وضعیت تیکت
    await db.query(
      `UPDATE tickets 
       SET status = 'answered', updated_at = NOW(), answered_at = NOW() 
       WHERE id = $1`,
      [ticketId]
    );

    console.log('✅ Admin reply saved:', insertResult.rows[0]);

    res.json({
      success: true,
      message: 'پاسخ با موفقیت ثبت شد',
      data: { 
        reply: {
          ...insertResult.rows[0],
          display_name: 'پشتیبانی آزمونیک (ادمین)',
          is_admin: true,
          user_name: 'ادمین',
          user_role: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت پاسخ: ' + error.message });
  }
};

// ========== به‌روزرسانی تیکت توسط ادمین ==========
const updateTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { category, priority, status } = req.body;

    console.log(`✏️ Admin updating ticket ${ticketId}:`, { category, priority, status });

    const updates = [];
    const values = [];
    let idx = 1;

    if (category) {
      updates.push(`category = $${idx++}`);
      values.push(category);
    }
    if (priority) {
      updates.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای به‌روزرسانی وجود ندارد' });
    }

    values.push(ticketId);
    const query = `
      UPDATE tickets 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    }

    res.json({
      success: true,
      message: 'تیکت با موفقیت به‌روزرسانی شد',
      data: { ticket: result.rows[0] }
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی تیکت' });
  }
};

// ========== حذف تیکت توسط ادمین ==========
const deleteTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    console.log(`🗑️ Admin deleting ticket ${ticketId}`);

    // حذف پاسخ‌ها
    await db.query('DELETE FROM ticket_replies WHERE ticket_id = $1', [ticketId]);
    // حذف تیکت
    const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد' });
    }

    res.json({ success: true, message: 'تیکت با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف تیکت' });
  }
};

module.exports = {
  getCategories,
  submitTicket,
  getMyTickets,
  getTicketById,
  addReply,
  closeTicket,
  reopenTicket,
  getAllTickets,
  getAdminTicketById,
  addAdminReply,
  updateTicket,
  deleteTicket
};