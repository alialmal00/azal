// controllers/advisorController.js
const OpenAI = require('openai');
const UsageCounter = require('../models/UsageCounter');

const client = new OpenAI({
  baseURL: process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1',
  apiKey: process.env.GAPGPT_API_KEY
});

// System Prompts بر اساس نقش کاربر
const getSystemPrompt = (role, userName = '') => {
  const basePrompts = {
    student: `تو یک مشاور درسی حرفه‌ای به نام "آرمان" هستی. وظیفه تو کمک به دانش‌آموزان در زمینه‌های زیر است:
🎯 **حوزه‌های تخصصی تو:**
- حل مسائل درسی (ریاضی، علوم، زبان، ادبیات و ...)
- روش‌های مطالعه صحیح و برنامه‌ریزی درسی
- رفع اشکال و رفع ابهامات درسی
- تقویت انگیزه و اعتماد به نفس تحصیلی
- مدیریت زمان و کاهش استرس امتحان
- تکنیک‌های یادگیری سریع و مؤثر

📋 **قوانین مهم:**
1. فقط به سوالات مرتبط با درس، روش مطالعه و مشکلات یادگیری پاسخ بده
2. پاسخ‌ها را کوتاه، مفید، دقیق و با لحنی گرم، صمیمی و تشویق‌کننده بده
3. نام کاربر "${userName || 'دانش‌آموز عزیز'}" است، با احترام و صمیمیت باهاش صحبت کن
4. راهکارهای عملی و قابل اجرا بده`,
    teacher: `تو یک مشاور آموزشی حرفه‌ای به نام "دکتر آرمان" هستی. وظیفه تو کمک به معلمان در زمینه‌های زیر است:
🎯 **حوزه‌های تخصصی تو:**
- روش‌های نوین تدریس و تکنیک‌های کلاس‌داری
- طراحی آزمون‌های استاندارد
- ارزیابی عملکرد دانش‌آموزان و ارائه بازخورد مؤثر
- مدیریت رفتار در کلاس و ایجاد انگیزه در دانش‌آموزان

📋 **قوانین مهم:**
1. پاسخ‌ها را حرفه‌ای، دقیق و کاربردی بده
2. نام کاربر "${userName || 'استاد گرامی'}" است، با احترام و شایستگی باهاش صحبت کن
3. راهکارهای عملی و قابل اجرا در کلاس واقعی بده`,
    university: `تو یک مشاور دانشگاهی و پژوهشی حرفه‌ای به نام "دکتر آرمان" هستی. وظیفه تو کمک به دانشجویان در زمینه‌های زیر است:
🎯 **حوزه‌های تخصصی تو:**
- حل مسائل تخصصی رشته‌های دانشگاهی
- روش‌های تحقیق و پژوهش علمی
- نگارش مقالات علمی، پایان‌نامه و پروپوزال
- آمادگی برای کنکور کارشناسی ارشد و دکتری

📋 **قوانین مهم:**
1. پاسخ‌ها را علمی، دقیق، مستند و با ذکر منابع معتبر بده
2. نام کاربر "${userName || 'دانشجوی گرامی'}" است، با احترام و در سطح دانشگاهی باهاش صحبت کن
3. راهکارهای عملی، قابل اجرا و مبتنی بر روش‌های علمی بده`
  };
  return basePrompts[role] || basePrompts.student;
};

// ============================================
// 💬 تابع اصلی چت (با اعمال محدودیت‌ها)
// ============================================
const chat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, userRole, history, userName } = req.body;

    console.log('💬 Advisor chat request from user:', userId);

    if (!message || !userRole) {
      return res.status(400).json({
        success: false,
        reply: 'لطفاً پیام و نقش کاربر را مشخص کنید'
      });
    }

    const validRoles = ['student', 'teacher', 'university'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        reply: 'نقش کاربری نامعتبر است'
      });
    }

    // ============================================
    // 🔒 بررسی محدودیت تعداد پیام ماهانه
    // ============================================
    const advisorCheck = await UsageCounter.checkLimits(userId, 'advisor', 1);
    if (!advisorCheck.allowed) {
      return res.status(429).json({
        success: false,
        reply: `⚠️ ${advisorCheck.message}\nبرای ادامه، اشتراک خود را ارتقا دهید.`,
        error: 'ADVISOR_LIMIT_REACHED',
        limit: advisorCheck,
        redirect: '/dashboard/subscription'
      });
    }

    // ============================================
    // 🔒 بررسی محدودیت کاراکتر هر پیام
    // ============================================
    const maxChars = advisorCheck.limit?.max_advisor_chars || 500;
    if (message.length > maxChars) {
      return res.status(429).json({
        success: false,
        reply: `⚠️ حداکثر ${maxChars} کاراکتر در هر پیام مجاز است. پیام شما ${message.length} کاراکتر دارد.`,
        error: 'ADVISOR_CHAR_LIMIT',
        maxChars: maxChars,
        currentLength: message.length
      });
    }

    const chatHistory = (history || []).slice(-20).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const systemPrompt = getSystemPrompt(userRole, userName);

    console.log(`📞 Advisor chat - Role: ${userRole}, User: ${userName || 'Unknown'}`);

    const completion = await client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    let reply = completion.choices[0]?.message?.content;

    if (!reply || reply.trim() === '') {
      reply = 'متأسفانه نتوانستم پاسخی پیدا کنم. لطفاً سوال خود را واضح‌تر مطرح کنید. 🙏';
    }

    console.log(`✅ Reply generated (${reply.length} chars)`);

    // ============================================
    // ✅ افزایش شمارنده پیام‌های مشاور
    // ============================================
    await UsageCounter.incrementAdvisorUsage(userId);

    res.json({
      success: true,
      reply: reply
    });
  } catch (error) {
    console.error('❌ Advisor chat error:', error);
    let errorReply = 'در حال حاضر قادر به پاسخگویی نیستم. لطفاً چند دقیقه دیگر تلاش کنید. 🙏';
    if (error.status === 401) {
      errorReply = 'خطای احراز هویت. لطفاً با پشتیبانی تماس بگیرید. 🔒';
    } else if (error.status === 429) {
      errorReply = 'تعداد درخواست‌ها زیاد شده. لطفاً کمی صبر کنید. ⏳';
    } else if (error.status === 503) {
      errorReply = 'سرویس موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید. 🚧';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorReply = 'ارتباط با سرور هوش مصنوعی برقرار نیست. 🌐';
    }
    res.status(500).json({
      success: false,
      reply: errorReply
    });
  }
};

// ============================================
// 📤 صادر کردن توابع
// ============================================
module.exports = {
  chat: chat
};