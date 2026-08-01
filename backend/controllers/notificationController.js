// controllers/notificationController.js
const Notification = require('../models/Notification');
const NotificationSetting = require('../models/NotificationSetting');

// دریافت لیست اعلان‌های کاربر
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        const notifications = await Notification.getUserNotifications(userId, limit, offset);
        const unreadCount = await Notification.getUnreadCount(userId);
        res.json({
            success: true,
            data: { notifications, unreadCount }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
    }
};

// علامت زدن یک اعلان به عنوان خوانده شده
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        const notification = await Notification.markAsRead(notificationId, userId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
        }
        res.json({ success: true, message: 'اعلان به عنوان خوانده شده علامت زده شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بروزرسانی اعلان' });
    }
};

// علامت زدن همه اعلان‌ها به عنوان خوانده شده
const markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'همه اعلان‌ها خوانده شدند' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بروزرسانی اعلان‌ها' });
    }
};

// دریافت تنظیمات اعلان کاربر
const getSettings = async (req, res) => {
    try {
        const settings = await NotificationSetting.getUserSettings(req.user.id);
        res.json({ success: true, data: { settings } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات' });
    }
};

// به‌روزرسانی تنظیمات اعلان
const updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const updated = await NotificationSetting.updateSettings(req.user.id, settings);
        res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد', data: { settings: updated } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ذخیره تنظیمات' });
    }
};

// (ادمین) ارسال نوتیفیکیشن عمومی به همه کاربران
const sendSystemNotification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'دسترسی محدود' });
        }
        const { title, message, link } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'عنوان و متن الزامی است' });
        }
        // دریافت همه کاربران (به جز ادمین)
        const users = await db.query('SELECT id FROM users WHERE role != $1', ['admin']);
        for (const user of users.rows) {
            await Notification.create(user.id, 'system', title, message, link || null);
        }
        res.json({ success: true, message: 'اعلان عمومی ارسال شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ارسال اعلان' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getSettings,
    updateSettings,
    sendSystemNotification
};