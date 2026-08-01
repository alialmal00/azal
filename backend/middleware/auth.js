// middleware/auth.js
const jwt = require('jsonwebtoken');

// =============================================
// 🔐 میدلور اصلی احراز هویت
// =============================================
const authMiddleware = (req, res, next) => {
    console.log('🔐 Auth middleware - Checking token...');
    
    let token = req.cookies?.token;
    
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    
    if (!token) {
        console.log('❌ No token found');
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized - No token provided' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`✅ Auth successful for user: ${decoded.id} (${decoded.role})`);
        next();
    } catch (err) {
        console.log('❌ Invalid token:', err.message);
        res.clearCookie('token', { path: '/' });
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// =============================================
// 🎭 میدلور بررسی نقش کاربر
// =============================================
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Please login first' 
            });
        }
        
        // ادمین به همه چیز دسترسی داره
        if (req.user.role === 'admin') {
            console.log('👑 Admin access granted');
            return next();
        }
        
        if (roles.includes(req.user.role)) {
            console.log(`✅ Role check passed: ${req.user.role}`);
            return next();
        }
        
        console.log(`❌ Role check failed: ${req.user.role} not in [${roles.join(', ')}]`);
        return res.status(403).json({ 
            success: false, 
            message: 'شما مجوز دسترسی به این بخش را ندارید' 
        });
    };
};

// =============================================
// 🛡️ میدلور مخصوص ادمین (اضافه شد)
// =============================================
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized' 
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'دسترسی فقط برای ادمین' 
        });
    }
    
    next();
};

module.exports = {
    authMiddleware,
    roleMiddleware,
    adminMiddleware
};