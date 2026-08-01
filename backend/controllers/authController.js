// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SmsService = require('../services/smsService');

// =============================================
// 🔑 توابع کمکی
// =============================================
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role || 'student' },
    process.env.JWT_SECRET || 'azmoonik_secret_key_2024',
    { expiresIn: '7d' }
  );
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearTokenCookie = (res) => {
  res.clearCookie('token', { path: '/' });
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const CODE_EXPIRY_MINUTES = 15;

// =============================================
// 🎁 فعال‌سازی خودکار پلن رایگان
// =============================================
const activateFreePlan = async (userId, role) => {
  try {
    // بررسی اشتراک فعال فعلی
    const existingSub = await db.query(
      `SELECT s.id FROM subscriptions s
       WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE`,
      [userId]
    );

    if (existingSub.rows.length > 0) {
      console.log(`ℹ️  User ${userId} already has an active subscription`);
      return;
    }

    // پیدا کردن پلن رایگان
    const freePlan = await db.query(
      `SELECT id FROM plans WHERE panel_type = $1 AND name = 'رایگان' AND is_active = true`,
      [role]
    );

    if (freePlan.rows.length === 0) {
      console.warn(`⚠️  No free plan found for role: ${role}`);
      return;
    }

    // ایجاد اشتراک رایگان
    await db.query(
      `INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status, created_at)
       VALUES ($1, $2, '1m', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', NOW())`,
      [userId, freePlan.rows[0].id]
    );

    console.log(`✅ Free plan activated for user ${userId} (role: ${role})`);
  } catch (error) {
    console.error('⚠️  Error activating free plan:', error.message);
    // خطای پلن نباید جلوی کار اصلی رو بگیره
  }
};

// =============================================
// 📝 ثبت‌نام
// =============================================
const register = async (req, res) => {
  try {
    const { name, phone, password, agreeTerms } = req.body;
    console.log('📝 Register request:', { name, phone });

    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً با قوانین و حریم خصوصی موافقت کنید'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل الزامی است'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور باید حداقل ۸ کاراکتر باشد'
      });
    }

    const existingUser = await db.query(
      'SELECT id, name, phone, is_verified, is_active FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: '❌ این شماره موبایل قبلاً ثبت‌نام و تأیید شده است. لطفاً وارد شوید.',
          redirect: '/login'
        });
      }
      console.log(`🗑️  Removing unverified user: ${cleanPhone}`);
      await db.query('DELETE FROM users WHERE id = $1', [user.id]);
      await db.query('DELETE FROM verification_codes WHERE phone = $1', [cleanPhone]);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO users (name, phone, password, role, role_selected, is_active, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, phone, role, role_selected, is_active, is_verified`,
      [name, cleanPhone, hashedPassword, 'student', false, true, false]
    );

    console.log(`✅ New user created with ID: ${newUser.rows[0].id} (unverified)`);

    const code = generateCode();
    await db.query(
      `INSERT INTO verification_codes (phone, code, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes', NOW())`,
      [cleanPhone, code]
    );

    const smsResult = await SmsService.sendVerificationCode(cleanPhone, code);
    console.log(`✅ Verification code sent to ${cleanPhone}: ${code}`);
    console.log(`📱 SMS Result:`, smsResult);

    res.status(200).json({
      success: true,
      message: smsResult.success
        ? '✅ کد تأیید به شماره موبایل شما ارسال شد. لطفاً کد را وارد کنید.'
        : '⚠️ ثبت‌نام انجام شد اما ارسال کد تأیید با مشکل مواجه شد. لطفاً از گزینه "ارسال مجدد کد" استفاده کنید.',
      data: {
        phone: cleanPhone,
        testCode: process.env.NODE_ENV === 'development' ? code : undefined,
        smsSent: smsResult.success,
        expiresIn: CODE_EXPIRY_MINUTES
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت‌نام: ' + error.message
    });
  }
};

// =============================================
// ✅ تأیید کد
// =============================================
const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    console.log('✅ Verifying code for:', phone);

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل و کد تأیید الزامی است'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const cleanCode = code.trim();

    const verification = await db.query(
      `SELECT * FROM verification_codes
       WHERE phone = $1 AND code = $2
       AND expires_at > NOW()
       AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanPhone, cleanCode]
    );

    if (verification.rows.length === 0) {
      const expiredCheck = await db.query(
        `SELECT * FROM verification_codes
         WHERE phone = $1 AND code = $2
         AND is_used = false
         ORDER BY created_at DESC
         LIMIT 1`,
        [cleanPhone, cleanCode]
      );
      if (expiredCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '❌ کد تأیید منقضی شده است. لطفاً از گزینه "ارسال مجدد کد" استفاده کنید.'
        });
      }
      return res.status(400).json({
        success: false,
        message: '❌ کد تأیید نامعتبر است. لطفاً دوباره تلاش کنید.'
      });
    }

    const user = await db.query(
      `UPDATE users
       SET is_verified = true, updated_at = NOW()
       WHERE phone = $1
       RETURNING id, name, phone, role, role_selected, is_active, is_verified`,
      [cleanPhone]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ کاربر یافت نشد. لطفاً دوباره ثبت‌نام کنید.'
      });
    }

    await db.query(
      'UPDATE verification_codes SET is_used = true, used_at = NOW() WHERE id = $1',
      [verification.rows[0].id]
    );

    // 🎁 فعال‌سازی پلن رایگان پس از تأیید
    await activateFreePlan(user.rows[0].id, user.rows[0].role || 'student');

    const token = generateToken(user.rows[0]);
    setTokenCookie(res, token);

    console.log(`✅ User verified: ${cleanPhone}`);

    res.json({
      success: true,
      message: '✅ حساب کاربری شما با موفقیت تأیید شد',
      data: {
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          phone: user.rows[0].phone,
          role: user.rows[0].role,
          role_selected: user.rows[0].role_selected || false,
          is_verified: true
        }
      }
    });
  } catch (error) {
    console.error('❌ Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تأیید کد: ' + error.message
    });
  }
};

// =============================================
// 🔄 ارسال مجدد کد
// =============================================
const resendVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    console.log('🔄 Resend verification for:', phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل الزامی است'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    const user = await db.query(
      'SELECT id, name, phone, is_verified FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ کاربری با این شماره موبایل یافت نشد. لطفاً ثبت‌نام کنید.'
      });
    }

    if (user.rows[0].is_verified) {
      return res.status(400).json({
        success: false,
        message: '✅ حساب کاربری شما قبلاً تأیید شده است. لطفاً وارد شوید.'
      });
    }

    const attempts = await db.query(
      `SELECT COUNT(*) as count FROM verification_codes
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [cleanPhone]
    );

    if (parseInt(attempts.rows[0].count) >= 5) {
      return res.status(429).json({
        success: false,
        message: '⏳ تعداد درخواست‌های شما زیاد شده است. لطفاً ۱ ساعت بعد تلاش کنید.'
      });
    }

    await db.query(
      'DELETE FROM verification_codes WHERE phone = $1 AND is_used = false',
      [cleanPhone]
    );

    const code = generateCode();
    await db.query(
      `INSERT INTO verification_codes (phone, code, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes', NOW())`,
      [cleanPhone, code]
    );

    const smsResult = await SmsService.sendVerificationCode(cleanPhone, code);
    console.log(`✅ Verification code resent to ${cleanPhone}: ${code}`);

    res.json({
      success: true,
      message: smsResult.success
        ? '✅ کد تأیید مجدداً با موفقیت ارسال شد'
        : '⚠️ خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.',
      data: {
        testCode: process.env.NODE_ENV === 'development' ? code : undefined,
        expiresIn: CODE_EXPIRY_MINUTES
      }
    });
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال مجدد کد: ' + error.message
    });
  }
};

// =============================================
// 🔐 ورود
// =============================================
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log('🔐 Login request:', { phone });

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل و رمز عبور الزامی است'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '❌ شماره موبایل یا رمز عبور اشتباه است'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: '⛔ حساب کاربری شما غیرفعال شده است'
      });
    }

    if (!user.is_verified) {
      try {
        await db.query(
          'DELETE FROM verification_codes WHERE phone = $1 AND is_used = false',
          [cleanPhone]
        );
        const code = generateCode();
        await db.query(
          `INSERT INTO verification_codes (phone, code, expires_at, created_at)
           VALUES ($1, $2, NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes', NOW())`,
          [cleanPhone, code]
        );
        const smsResult = await SmsService.sendVerificationCode(cleanPhone, code);
        console.log(`📱 SMS Result for ${cleanPhone}:`, smsResult);

        if (!smsResult.success) {
          console.warn(`⚠️  SMS failed for ${cleanPhone}: ${smsResult.message}`);
        }

        return res.status(403).json({
          success: false,
          message: '⚠️ حساب کاربری شما تأیید نشده است. کد تأیید جدید به شماره موبایل شما ارسال شد.',
          requiresVerification: true,
          redirect: '/verify',
          data: {
            phone: cleanPhone,
            testCode: process.env.NODE_ENV === 'development' ? code : undefined,
            smsSent: smsResult.success,
            expiresIn: CODE_EXPIRY_MINUTES
          }
        });
      } catch (smsError) {
        console.error('❌ Error in verification flow:', smsError);
        return res.status(403).json({
          success: false,
          message: '⚠️ حساب کاربری شما تأیید نشده است. لطفاً از گزینه "ارسال مجدد کد" استفاده کنید.',
          requiresVerification: true,
          redirect: '/verify',
          data: { phone: cleanPhone }
        });
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '❌ شماره موبایل یا رمز عبور اشتباه است'
      });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // 🎁 فعال‌سازی پلن رایگان هنگام ورود (در صورت نداشتن اشتراک)
    await activateFreePlan(user.id, user.role || 'student');

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: '✅ ورود موفقیت‌آمیز بود',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          role_selected: user.role_selected || false,
          is_verified: user.is_verified || false
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ورود: ' + error.message
    });
  }
};

// =============================================
// 🔑 فراموشی رمز عبور
// =============================================
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    console.log('🔑 Forgot password for:', phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل الزامی است'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    const user = await db.query(
      'SELECT id, name, phone, is_verified FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ کاربری با این شماره موبایل یافت نشد'
      });
    }

    if (!user.rows[0].is_verified) {
      return res.status(400).json({
        success: false,
        message: '⚠️ حساب کاربری شما تأیید نشده است. ابتدا ثبت‌نام خود را تکمیل کنید.',
        redirect: '/verify'
      });
    }

    const attempts = await db.query(
      `SELECT COUNT(*) as count FROM password_resets
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [cleanPhone]
    );

    if (parseInt(attempts.rows[0].count) >= 5) {
      return res.status(429).json({
        success: false,
        message: '⏳ تعداد درخواست‌های شما زیاد شده است. لطفاً ۱ ساعت بعد تلاش کنید.'
      });
    }

    await db.query(
      'DELETE FROM password_resets WHERE phone = $1 AND is_used = false',
      [cleanPhone]
    );

    const code = generateCode();
    await db.query(
      `INSERT INTO password_resets (phone, code, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes', NOW())`,
      [cleanPhone, code]
    );

    const smsResult = await SmsService.sendResetCode(cleanPhone, code);
    console.log(`✅ Password reset code sent to ${cleanPhone}: ${code}`);

    res.json({
      success: true,
      message: smsResult.success
        ? '✅ کد بازیابی رمز عبور به شماره موبایل شما ارسال شد'
        : '⚠️ خطا در ارسال کد بازیابی. لطفاً دوباره تلاش کنید.',
      data: {
        testCode: process.env.NODE_ENV === 'development' ? code : undefined,
        expiresIn: CODE_EXPIRY_MINUTES
      }
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال کد بازیابی: ' + error.message
    });
  }
};

// =============================================
// 🔓 بازیابی رمز عبور
// =============================================
const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    console.log('🔓 Reset password for:', phone);

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل، کد بازیابی و رمز عبور جدید الزامی است'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const cleanCode = code.trim();

    const reset = await db.query(
      `SELECT * FROM password_resets
       WHERE phone = $1 AND code = $2
       AND expires_at > NOW()
       AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanPhone, cleanCode]
    );

    if (reset.rows.length === 0) {
      const expiredCheck = await db.query(
        `SELECT * FROM password_resets
         WHERE phone = $1 AND code = $2
         AND is_used = false
         ORDER BY created_at DESC
         LIMIT 1`,
        [cleanPhone, cleanCode]
      );
      if (expiredCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '❌ کد بازیابی منقضی شده است. لطفاً دوباره درخواست کنید.'
        });
      }
      return res.status(400).json({
        success: false,
        message: '❌ کد بازیابی نامعتبر است.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE phone = $2',
      [hashedPassword, cleanPhone]
    );

    await db.query(
      'UPDATE password_resets SET is_used = true, used_at = NOW() WHERE id = $1',
      [reset.rows[0].id]
    );

    console.log(`✅ Password reset for: ${cleanPhone}`);

    res.json({
      success: true,
      message: '✅ رمز عبور شما با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر رمز عبور: ' + error.message
    });
  }
};

// =============================================
// 👤 دریافت اطلاعات کاربر
// =============================================
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await db.query(
      `SELECT id, name, phone, role, role_selected, avatar, is_active, is_verified, last_login, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: { user: userResult.rows[0] }
    });
  } catch (error) {
    console.error('❌ Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات کاربر: ' + error.message
    });
  }
};

// =============================================
// 🚪 خروج
// =============================================
const logout = async (req, res) => {
  clearTokenCookie(res);
  res.json({
    success: true,
    message: 'با موفقیت خارج شدید'
  });
};

// =============================================
// 🎭 انتخاب نقش + فعال‌سازی پلن رایگان
// =============================================
const selectRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    const validRoles = ['student', 'teacher', 'university'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نقش نامعتبر است'
      });
    }

    const updatedUser = await db.query(
      `UPDATE users
       SET role = $1, role_selected = true, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, phone, role, role_selected`,
      [role, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    const user = updatedUser.rows[0];

    // 🎁 فعال‌سازی پلن رایگان برای نقش جدید
    await activateFreePlan(userId, role);

    const newToken = generateToken(user);
    setTokenCookie(res, newToken);

    res.json({
      success: true,
      message: 'نقش کاربری با موفقیت انتخاب شد',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Select role error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در انتخاب نقش: ' + error.message
    });
  }
};

// =============================================
// 📤 صادر کردن
// =============================================
module.exports = {
  register,
  verifyCode,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  selectRole
};