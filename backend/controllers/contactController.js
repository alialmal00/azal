// controllers/contactController.js
const db = require('../config/db');

// =============================================
// 📩 ارسال پیام جدید
// =============================================
const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '❌ نام، ایمیل و پیام الزامی هستند'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '❌ ایمیل معتبر نیست'
            });
        }

        const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        console.log(`📩 Saving contact message from: ${name} (${email})`);

        const query = `
            INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, created_at
        `;

        const values = [name, email, subject || '', message, ipAddress, userAgent];
        const result = await db.query(query, values);

        console.log(`✅ Message saved with ID: ${result.rows[0].id}`);

        res.status(201).json({
            success: true,
            message: '✅ پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.',
            data: {
                id: result.rows[0].id,
                created_at: result.rows[0].created_at
            }
        });

    } catch (error) {
        console.error('❌ Contact submit error:', error);
        res.status(500).json({
            success: false,
            message: '❌ خطا در ارسال پیام. لطفاً دوباره تلاش کنید.'
        });
    }
};

// =============================================
// 📋 دریافت لیست پیام‌ها
// =============================================
const getMessages = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT id, name, email, subject, message, is_read, read_at, created_at
            FROM contact_messages
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await db.query(query, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) as total FROM contact_messages');
        const total = parseInt(countResult.rows[0].total);

        const unreadResult = await db.query('SELECT COUNT(*) as unread FROM contact_messages WHERE is_read = false');
        const unread = parseInt(unreadResult.rows[0].unread);

        console.log(`📋 Found ${result.rows.length} messages (total: ${total}, unread: ${unread})`);

        res.json({
            success: true,
            data: {
                messages: result.rows,
                pagination: {
                    total,
                    limit,
                    offset,
                    unread
                }
            }
        });

    } catch (error) {
        console.error('❌ Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت پیام‌ها'
        });
    }
};

// =============================================
// 🔍 دریافت یک پیام با شناسه
// =============================================
const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT id, name, email, subject, message, is_read, read_at, created_at
            FROM contact_messages
            WHERE id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'پیام یافت نشد'
            });
        }

        res.json({
            success: true,
            data: { message: result.rows[0] }
        });

    } catch (error) {
        console.error('❌ Get message error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت پیام'
        });
    }
};

// =============================================
// ✅ علامت زدن پیام به عنوان خوانده شده
// =============================================
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE contact_messages
            SET is_read = true, read_at = NOW()
            WHERE id = $1 AND is_read = false
            RETURNING id, is_read, read_at
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'پیام یافت نشد یا قبلاً خوانده شده است'
            });
        }

        console.log(`✅ Message ${id} marked as read`);

        res.json({
            success: true,
            message: 'پیام به عنوان خوانده شده علامت زده شد',
            data: { message: result.rows[0] }
        });

    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در بروزرسانی پیام'
        });
    }
};

// =============================================
// 🗑️ حذف پیام
// =============================================
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM contact_messages WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'پیام یافت نشد'
            });
        }

        console.log(`🗑️ Message ${id} deleted`);

        res.json({
            success: true,
            message: 'پیام با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('❌ Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف پیام'
        });
    }
};

// =============================================
// 📊 دریافت آمار پیام‌ها
// =============================================
const getMessageStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
                COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
                COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yesterday
            FROM contact_messages
        `);

        res.json({
            success: true,
            data: { stats: result.rows[0] }
        });

    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آمار'
        });
    }
};

// =============================================
// 📤 صادر کردن توابع
// =============================================
module.exports = {
    submitContact,
    getMessages,
    getMessageById,
    markAsRead,
    deleteMessage,
    getMessageStats
};