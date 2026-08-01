// backend/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classRoutes = require('./routes/classRoutes');
const classExamRoutes = require('./routes/classExamRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// ============================================
// 🔥 CORS - تنظیمات کامل
// ============================================
const allowedOrigins = [
    'https://azmoonik.ir',
    'https://www.azmoonik.ir',
    'http://localhost:6484',
    'http://localhost:5173',
    'http://localhost:5000'
];

const corsOptions = {
    origin: function (origin, callback) {
        // اجازه دادن به درخواست‌های بدون origin (مثل mobile apps)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Blocked CORS from:', origin);
            callback(null, true); // برای تست - بعداً حذف کن
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie', 'Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// ============================================
// 📌 Middleware اضافی برای CORS
// ============================================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// ============================================
// 📦 Middleware
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ============================================
// 🚀 Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/class-exams', classExamRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/subscription', subscriptionRoutes);

// ============================================
// 💚 Health Check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 5001
    });
});

// ============================================
// ❌ 404 Handler
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============================================
// ⚠️ Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
});

// ============================================
// 🚀 Start Server
// ============================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server is running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}\n`);
});