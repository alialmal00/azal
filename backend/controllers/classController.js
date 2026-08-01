// controllers/classController.js
const db = require('../config/db');
const crypto = require('crypto');
const UsageCounter = require('../models/UsageCounter');

// ========== تابع کمکی برای تولید کد کلاس ==========
const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// ========== تابع کمکی برای تولید توکن ==========
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// =====================================================
// ========== مدیریت سازمان/مدرسه ==========
// =====================================================

// ایجاد سازمان جدید
const createOrganization = async (req, res) => {
    try {
        const { name, address, phone, email } = req.body;
        const userId = req.user.id;
        
        console.log('🏢 Creating organization for user:', userId);
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'نام سازمان الزامی است'
            });
        }
        
        const code = generateClassCode();
        
        const query = `
            INSERT INTO organizations (name, code, address, phone, email, created_by, subscription_type, max_teachers, max_students, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [name.trim(), code, address || '', phone || '', email || '', userId, 'free', 10, 200, 'active'];
        
        const result = await db.query(query, values);
        const organization = result.rows[0];
        
        await db.query(
            `INSERT INTO organization_members (organization_id, user_id, role, status) 
             VALUES ($1, $2, $3, $4)`,
            [organization.id, userId, 'admin', 'active']
        );
        
        await db.query('UPDATE users SET organization_id = $1 WHERE id = $2', [organization.id, userId]);
        
        console.log('✅ Organization created:', organization.id);
        
        res.status(201).json({
            success: true,
            message: 'سازمان با موفقیت ایجاد شد',
            data: { organization }
        });
        
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ایجاد سازمان: ' + error.message
        });
    }
};

// دریافت اعضای سازمان
const getOrganizationMembers = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userOrg = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [userId]
        );
        
        const organizationId = userOrg.rows[0]?.organization_id;
        
        if (!organizationId) {
            return res.json({
                success: true,
                data: { members: [] }
            });
        }
        
        const result = await db.query(
            `SELECT om.*, u.name, u.email, u.phone, u.avatar
             FROM organization_members om
             JOIN users u ON om.user_id = u.id
             WHERE om.organization_id = $1 AND om.status = 'active'
             ORDER BY 
                 CASE om.role 
                     WHEN 'admin' THEN 1 
                     WHEN 'teacher' THEN 2 
                     WHEN 'student' THEN 3 
                     ELSE 4 
                 END,
                 u.name ASC`,
            [organizationId]
        );
        
        res.json({
            success: true,
            data: { members: result.rows }
        });
        
    } catch (error) {
        console.error('Get organization members error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اعضای سازمان'
        });
    }
};

// دریافت لیست کامل اعضای سازمان با جزئیات
const getOrganizationFullMembers = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userOrg = await db.query(
            'SELECT organization_id, role FROM organization_members WHERE user_id = $1 AND status = $2',
            [userId, 'active']
        );
        
        if (userOrg.rows.length === 0) {
            return res.json({
                success: true,
                data: { members: [], userRole: null, organizationId: null, stats: null }
            });
        }
        
        const organizationId = userOrg.rows[0].organization_id;
        const userRole = userOrg.rows[0].role;
        
        const members = await db.query(
            `SELECT om.*, 
                    u.name, u.email, u.phone, u.avatar, u.created_at as user_created_at,
                    (SELECT COUNT(*) FROM classes WHERE teacher_id = u.id AND status = 'active') as teacher_classes_count,
                    (SELECT COUNT(*) FROM class_members cm2 WHERE cm2.user_id = u.id AND cm2.status = 'active') as student_classes_count
             FROM organization_members om
             JOIN users u ON om.user_id = u.id
             WHERE om.organization_id = $1 AND om.status = 'active'
             ORDER BY 
                 CASE om.role 
                     WHEN 'admin' THEN 1 
                     WHEN 'teacher' THEN 2 
                     WHEN 'student' THEN 3 
                     ELSE 4 
                 END,
                 u.name ASC`,
            [organizationId]
        );
        
        const stats = await db.query(
            `SELECT 
                COUNT(CASE WHEN om.role = 'admin' THEN 1 END) as admins,
                COUNT(CASE WHEN om.role = 'teacher' THEN 1 END) as teachers,
                COUNT(CASE WHEN om.role = 'student' THEN 1 END) as students,
                COUNT(CASE WHEN om.role = 'staff' THEN 1 END) as staff,
                (SELECT COUNT(*) FROM classes WHERE organization_id = $1 AND status = 'active') as active_classes
             FROM organization_members om
             WHERE om.organization_id = $1 AND om.status = 'active'`,
            [organizationId]
        );
        
        res.json({
            success: true,
            data: {
                members: members.rows,
                stats: stats.rows[0],
                userRole,
                organizationId
            }
        });
        
    } catch (error) {
        console.error('Get organization full members error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اعضای سازمان'
        });
    }
};

// اضافه کردن عضو به سازمان
const addMemberToOrganization = async (req, res) => {
    try {
        const { email, role } = req.body;
        const userId = req.user.id;
        
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'ایمیل و نقش الزامی است'
            });
        }
        
        const userOrg = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [userId]
        );
        
        const organizationId = userOrg.rows[0]?.organization_id;
        
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'شما عضو هیچ سازمانی نیستید'
            });
        }
        
        const targetUser = await db.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (targetUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'کاربری با این ایمیل یافت نشد. لطفاً ابتدا کاربر ثبت‌نام کند.'
            });
        }
        
        const newMember = targetUser.rows[0];
        
        const existingMember = await db.query(
            'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [organizationId, newMember.id]
        );
        
        if (existingMember.rows.length > 0) {
            if (existingMember.rows[0].status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'این کاربر قبلاً عضو سازمان است'
                });
            } else {
                await db.query(
                    'UPDATE organization_members SET status = $1, role = $2 WHERE id = $3',
                    ['active', role, existingMember.rows[0].id]
                );
            }
        } else {
            await db.query(
                `INSERT INTO organization_members (organization_id, user_id, role, status) 
                 VALUES ($1, $2, $3, $4)`,
                [organizationId, newMember.id, role, 'active']
            );
        }
        
        await db.query(
            'UPDATE users SET organization_id = $1, role = $2 WHERE id = $3',
            [organizationId, role, newMember.id]
        );
        
        res.json({
            success: true,
            message: `${newMember.name} با موفقیت به سازمان اضافه شد`,
            data: { user: newMember }
        });
        
    } catch (error) {
        console.error('Add member to organization error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در اضافه کردن عضو: ' + error.message
        });
    }
};

// خروج از سازمان
const leaveOrganization = async (req, res) => {
    try {
        const userId = req.user.id;
        const { organizationId } = req.body;
        
        console.log(`🚪 User ${userId} leaving organization ${organizationId}`);
        
        const memberCheck = await db.query(
            'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
            [organizationId, userId, 'active']
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'شما عضو این سازمان نیستید'
            });
        }
        
        const member = memberCheck.rows[0];
        
        if (member.role === 'admin') {
            const adminCount = await db.query(
                'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = $2 AND status = $3 AND user_id != $4',
                [organizationId, 'admin', 'active', userId]
            );
            
            if (parseInt(adminCount.rows[0].count) === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'شما تنها ادمین سازمان هستید. ابتدا ادمین دیگری تعیین کنید.'
                });
            }
        }
        
        await db.query(
            `UPDATE organization_members 
             SET status = $1, left_at = NOW() 
             WHERE id = $2`,
            ['left', member.id]
        );
        
        await db.query(
            'UPDATE users SET organization_id = NULL WHERE id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'با موفقیت از سازمان خارج شدید'
        });
        
    } catch (error) {
        console.error('Leave organization error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در خروج از سازمان: ' + error.message
        });
    }
};

// اخراج معلم از سازمان (فقط ادمین)
const expelTeacher = async (req, res) => {
    try {
        const { organizationId, teacherId } = req.params;
        const adminId = req.user.id;
        
        const adminCheck = await db.query(
            'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
            [organizationId, adminId, 'admin', 'active']
        );
        
        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما مجوز اخراج معلم را ندارید'
            });
        }
        
        const teacherCheck = await db.query(
            'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
            [organizationId, teacherId]
        );
        
        if (teacherCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'این معلم عضو این سازمان نیست'
            });
        }
        
        const teacher = teacherCheck.rows[0];
        
        await db.query(
            `UPDATE organization_members 
             SET status = $1, expelled_at = NOW(), expelled_by = $2
             WHERE id = $3`,
            ['expelled', adminId, teacher.id]
        );
        
        await db.query(
            'UPDATE users SET organization_id = NULL WHERE id = $1',
            [teacherId]
        );
        
        await db.query(
            'UPDATE classes SET status = $1 WHERE teacher_id = $2 AND organization_id = $3',
            ['archived', teacherId, organizationId]
        );
        
        res.json({
            success: true,
            message: 'معلم با موفقیت از سازمان اخراج شد'
        });
        
    } catch (error) {
        console.error('Expel teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در اخراج معلم: ' + error.message
        });
    }
};

// تغییر نقش عضو سازمان
const changeMemberRole = async (req, res) => {
    try {
        const { organizationId, memberId } = req.params;
        const { newRole } = req.body;
        const adminId = req.user.id;
        
        const validRoles = ['admin', 'teacher', 'student', 'staff'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: 'نقش نامعتبر است'
            });
        }
        
        const adminCheck = await db.query(
            'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
            [organizationId, adminId, 'admin', 'active']
        );
        
        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما مجوز تغییر نقش را ندارید'
            });
        }
        
        await db.query(
            'UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3',
            [newRole, organizationId, memberId]
        );
        
        await db.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            [newRole, memberId]
        );
        
        res.json({
            success: true,
            message: 'نقش کاربر با موفقیت تغییر کرد'
        });
        
    } catch (error) {
        console.error('Change member role error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تغییر نقش کاربر: ' + error.message
        });
    }
};

// =====================================================
// ========== مدیریت کلاس‌ها ==========
// =====================================================

// ✅ ایجاد کلاس جدید با بررسی محدودیت
const createClass = async (req, res) => {
    try {
        console.log('📚 createClass called');
        console.log('📋 Request body:', req.body);
        console.log('👤 User:', req.user);

        const { name, description, subject, grade_level } = req.body;
        const teacherId = req.user.id;

        // ✅ اعتبارسنجی اولیه
        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: 'لطفاً وارد حساب کاربری خود شوید'
            });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'نام کلاس الزامی است'
            });
        }

        // ✅ دریافت organization_id کاربر
        const userOrg = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [teacherId]
        );
        const organizationId = userOrg.rows[0]?.organization_id || null;

        console.log('🏢 Organization ID:', organizationId);

        // ✅ تولید کد کلاس یکتا
        let classCode = generateClassCode();
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const existing = await db.query(
                'SELECT id FROM classes WHERE class_code = $1',
                [classCode]
            );
            if (existing.rows.length === 0) {
                isUnique = true;
            } else {
                classCode = generateClassCode();
                attempts++;
            }
        }

        console.log('🔑 Generated class code:', classCode);

        // ✅ ذخیره در دیتابیس
        const query = `
            INSERT INTO classes (organization_id, teacher_id, name, description, subject, grade_level, class_code, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *
        `;
        const values = [
            organizationId,
            teacherId,
            name.trim(),
            description || '',
            subject || '',
            grade_level || '',
            classCode,
            'active'
        ];

        const result = await db.query(query, values);
        const newClass = result.rows[0];

        console.log('✅ Class created in database:', newClass.id);

        // ✅ اضافه کردن معلم به class_members
        await db.query(
            `INSERT INTO class_members (class_id, user_id, role, status, joined_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [newClass.id, teacherId, 'teacher', 'active']
        );

        console.log('✅ Teacher added to class members');

        // ============================================
        // 🔹 افزایش شمارنده کلاس‌های ساخته‌شده
        // ============================================
        await UsageCounter.incrementClassUsage(teacherId);

        // دریافت مجدد مصرف برای نمایش در پاسخ
        const updatedUsage = await UsageCounter.getCurrentUsage(teacherId);
        const plan = req.plan || { max_classes: 1 };

        // ✅ پاسخ موفق
        res.status(201).json({
            success: true,
            message: 'کلاس با موفقیت ایجاد شد',
            data: {
                class: {
                    id: newClass.id,
                    name: newClass.name,
                    description: newClass.description,
                    subject: newClass.subject,
                    grade_level: newClass.grade_level,
                    class_code: newClass.class_code,
                    teacher_id: newClass.teacher_id,
                    organization_id: newClass.organization_id,
                    status: newClass.status,
                    created_at: newClass.created_at
                },
                usage: {
                    classes_used: updatedUsage.classes_used,
                    max_classes: plan.max_classes || 1,
                    classes_remaining: Math.max(0, (plan.max_classes || 1) - updatedUsage.classes_used)
                }
            }
        });

    } catch (error) {
        console.error('❌ Create class error:', error);
        console.error('❌ Error stack:', error.stack);

        // ✅ بررسی خطاهای خاص دیتابیس
        if (error.code === '23505') { // unique violation
            return res.status(400).json({
                success: false,
                message: 'کد کلاس تکراری است. لطفاً دوباره تلاش کنید.'
            });
        }

        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({
                success: false,
                message: 'کاربر معلم یافت نشد. لطفاً دوباره وارد شوید.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'خطا در ایجاد کلاس: ' + error.message
        });
    }
};

// دریافت کلاس‌های من
const getMyClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        console.log('📚 Get my classes for user:', userId, 'role:', userRole);
        
        let classes = [];
        
        if (userRole === 'teacher') {
            const result = await db.query(
                `SELECT c.*, 
                        u.name as teacher_name, 
                        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND role = 'student' AND status = 'active') as member_count
                 FROM classes c
                 JOIN users u ON c.teacher_id = u.id
                 WHERE c.teacher_id = $1 AND c.status = 'active'
                 ORDER BY c.created_at DESC`,
                [userId]
            );
            classes = result.rows;
        } else {
            const result = await db.query(
                `SELECT c.*, 
                        u.name as teacher_name, 
                        cm.joined_at,
                        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND role = 'student' AND status = 'active') as member_count
                 FROM classes c
                 JOIN class_members cm ON c.id = cm.class_id
                 JOIN users u ON c.teacher_id = u.id
                 WHERE cm.user_id = $1 AND cm.status = 'active' AND c.status = 'active'
                 ORDER BY c.created_at DESC`,
                [userId]
            );
            classes = result.rows;
        }
        
        res.json({
            success: true,
            data: { classes }
        });
        
    } catch (error) {
        console.error('Get my classes error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت کلاس‌ها: ' + error.message
        });
    }
};

// دریافت اطلاعات یک کلاس
const getClassById = async (req, res) => {
    try {
        const classId = req.params.id;
        
        const result = await db.query(
            `SELECT c.*, u.name as teacher_name, u.email as teacher_email
             FROM classes c
             JOIN users u ON c.teacher_id = u.id
             WHERE c.id = $1`,
            [classId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'کلاس یافت نشد'
            });
        }
        
        res.json({
            success: true,
            data: { class: result.rows[0] }
        });
        
    } catch (error) {
        console.error('Get class error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت کلاس: ' + error.message
        });
    }
};

// پیوستن به کلاس با کد
const joinClassByCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        
        console.log('🔍 Join class request:', { code, userId });
        
        if (!code || code.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'لطفاً کد کلاس را وارد کنید'
            });
        }
        
        const cleanCode = code.trim().toUpperCase();
        
        const classResult = await db.query(
            `SELECT c.*, u.name as teacher_name, u.email as teacher_email
             FROM classes c
             JOIN users u ON c.teacher_id = u.id
             WHERE UPPER(c.class_code) = $1 AND c.status = 'active'`,
            [cleanCode]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'کلاس با این کد یافت نشد. کد را بررسی کنید.'
            });
        }
        
        const classData = classResult.rows[0];
        
        if (classData.teacher_id === userId) {
            return res.status(400).json({
                success: false,
                message: 'شما معلم این کلاس هستید'
            });
        }
        
        const existingMember = await db.query(
            'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2',
            [classData.id, userId]
        );
        
        if (existingMember.rows.length > 0) {
            const member = existingMember.rows[0];
            if (member.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'شما قبلاً عضو این کلاس هستید'
                });
            } else {
                await db.query(
                    'UPDATE class_members SET status = $1, joined_at = NOW() WHERE id = $2',
                    ['active', member.id]
                );
                return res.json({
                    success: true,
                    message: 'با موفقیت دوباره به کلاس پیوستید',
                    data: { class: classData }
                });
            }
        }
        
        await db.query(
            `INSERT INTO class_members (class_id, user_id, role, joined_at, status) 
             VALUES ($1, $2, $3, NOW(), $4)`,
            [classData.id, userId, 'student', 'active']
        );
        
        console.log('✅ Member added to class:', classData.id);
        
        res.json({
            success: true,
            message: 'با موفقیت به کلاس پیوستید',
            data: { class: classData }
        });
        
    } catch (error) {
        console.error('Join class error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در پیوستن به کلاس: ' + error.message
        });
    }
};

// دعوت به کلاس
const inviteToClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const { email } = req.body;
        const teacherId = req.user.id;
        
        const classCheck = await db.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما اجازه دعوت به این کلاس را ندارید'
            });
        }
        
        const token = generateToken();
        
        const query = `
            INSERT INTO class_invitations (class_id, invited_email, invited_by, token, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
            RETURNING *
        `;
        const result = await db.query(query, [classId, email, teacherId, token]);
        
        res.json({
            success: true,
            message: 'دعوت‌نامه با موفقیت ارسال شد',
            data: { invitation: result.rows[0] }
        });
        
    } catch (error) {
        console.error('Invite to class error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ارسال دعوت‌نامه: ' + error.message
        });
    }
};

// پذیرش دعوت‌نامه
const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;
        
        const inviteResult = await db.query(
            'SELECT * FROM class_invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
            [token, 'pending']
        );
        
        if (inviteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'دعوت‌نامه نامعتبر یا منقضی شده است'
            });
        }
        
        const invitation = inviteResult.rows[0];
        
        await db.query(
            `INSERT INTO class_members (class_id, user_id, role, status) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (class_id, user_id) DO UPDATE SET status = 'active'`,
            [invitation.class_id, userId, 'student', 'active']
        );
        
        await db.query(
            'UPDATE class_invitations SET status = $1 WHERE id = $2',
            ['accepted', invitation.id]
        );
        
        res.json({
            success: true,
            message: 'با موفقیت به کلاس پیوستید'
        });
        
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در پذیرش دعوت‌نامه: ' + error.message
        });
    }
};

// دریافت اعضای کلاس
const getClassMembers = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user.id;
        
        console.log(`📋 Getting members for class ${classId} by user ${userId}`);
        
        // ✅ بررسی دسترسی
        const accessCheck = await db.query(
            `SELECT id, teacher_id FROM classes 
             WHERE id = $1 AND (teacher_id = $2 OR status = 'active')`,
            [classId, userId]
        );
        
        if (accessCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما دسترسی به این کلاس ندارید'
            });
        }
        
        const isTeacher = accessCheck.rows[0].teacher_id === userId;
        
        let query = `
            SELECT 
                cm.id,
                cm.user_id,
                cm.role,
                cm.status,
                cm.joined_at,
                u.name,
                u.email,
                u.avatar,
                u.is_active,
                u.role as user_role
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.class_id = $1
        `;
        
        if (!isTeacher) {
            query += ` AND cm.user_id = $2`;
        }
        
        query += ` AND cm.status = 'active' AND u.is_active = true`;
        query += ` ORDER BY 
            CASE cm.role 
                WHEN 'teacher' THEN 1 
                WHEN 'student' THEN 2 
                ELSE 3 
            END,
            u.name ASC`;
        
        const params = isTeacher ? [classId] : [classId, userId];
        const result = await db.query(query, params);
        
        console.log(`✅ Found ${result.rows.length} members for class ${classId}`);
        
        const stats = {
            total: result.rows.length,
            students: result.rows.filter(m => m.role === 'student').length,
            teachers: result.rows.filter(m => m.role === 'teacher').length,
            active: result.rows.filter(m => m.is_active).length
        };
        
        res.json({
            success: true,
            data: { 
                members: result.rows,
                isTeacher: isTeacher,
                stats: stats
            }
        });
        
    } catch (error) {
        console.error('❌ Get class members error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اعضای کلاس: ' + error.message
        });
    }
};

// خروج از کلاس (برای دانش‌آموز)
const leaveClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user.id;
        
        const memberCheck = await db.query(
            'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2 AND status = $3',
            [classId, userId, 'active']
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'شما عضو این کلاس نیستید'
            });
        }
        
        const member = memberCheck.rows[0];
        
        if (member.role === 'teacher') {
            return res.status(400).json({
                success: false,
                message: 'شما معلم این کلاس هستید. برای خروج، ابتدا کلاس را حذف کنید.'
            });
        }
        
        await db.query(
            `UPDATE class_members 
             SET status = $1, left_at = NOW() 
             WHERE id = $2`,
            ['left', member.id]
        );
        
        res.json({
            success: true,
            message: 'با موفقیت از کلاس خارج شدید'
        });
        
    } catch (error) {
        console.error('Leave class error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در خروج از کلاس: ' + error.message
        });
    }
};

// اخراج دانش‌آموز از کلاس (فقط معلم)
const expelStudent = async (req, res) => {
    try {
        const classId = req.params.id;
        const studentId = req.params.studentId;
        const teacherId = req.user.id;
        
        const classCheck = await db.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما مجوز اخراج دانش‌آموز از این کلاس را ندارید'
            });
        }
        
        const memberCheck = await db.query(
            'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2',
            [classId, studentId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'این دانش‌آموز عضو این کلاس نیست'
            });
        }
        
        const member = memberCheck.rows[0];
        
        await db.query(
            `UPDATE class_members 
             SET status = $1, expelled_at = NOW(), expelled_by = $2
             WHERE id = $3`,
            ['expelled', teacherId, member.id]
        );
        
        res.json({
            success: true,
            message: 'دانش‌آموز با موفقیت از کلاس اخراج شد'
        });
        
    } catch (error) {
        console.error('Expel student error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در اخراج دانش‌آموز: ' + error.message
        });
    }
};

// حذف عضو از کلاس (معلم می‌تواند حذف کند)
const removeMember = async (req, res) => {
    try {
        const classId = req.params.id;
        const memberId = req.params.userId;
        const teacherId = req.user.id;
        
        const classCheck = await db.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );
        
        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما مجوز حذف عضو از این کلاس را ندارید'
            });
        }
        
        await db.query(
            'UPDATE class_members SET status = $1 WHERE class_id = $2 AND user_id = $3',
            ['removed', classId, memberId]
        );
        
        res.json({
            success: true,
            message: 'عضو با موفقیت از کلاس حذف شد'
        });
        
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف عضو: ' + error.message
        });
    }
};

// دریافت آزمون‌های کلاس
const getClassExams = async (req, res) => {
    try {
        const classId = req.params.id;
        
        const result = await db.query(
            `SELECT * FROM class_exams 
             WHERE class_id = $1 
             ORDER BY created_at DESC`,
            [classId]
        );
        
        res.json({
            success: true,
            data: { exams: result.rows }
        });
        
    } catch (error) {
        console.error('Get class exams error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آزمون‌های کلاس: ' + error.message
        });
    }
};

// =====================================================
// ========== صادر کردن ماژول‌ها ==========
// =====================================================

module.exports = {
    // سازمان
    createOrganization,
    getOrganizationMembers,
    getOrganizationFullMembers,
    addMemberToOrganization,
    leaveOrganization,
    expelTeacher,
    changeMemberRole,
    
    // کلاس
    createClass,
    getMyClasses,
    getClassById,
    joinClassByCode,
    inviteToClass,
    acceptInvitation,
    getClassMembers,
    leaveClass,
    expelStudent,
    removeMember,
    getClassExams
};