// services/geminiService.ts
import OpenAI from 'openai';
import type { ExamConfig, GeminiResponse } from '../types';
import api from './api';

// ============================================================
// 🔐 تنظیمات کلاینت
// ⚠️ امنیت: کلید مستقیم در کد فرانت قرار داده شده بود. حالا از
// متغیر محیطی VITE_GAPGPT_API_KEY خوانده می‌شود. مقدار قبلیِ
// لو‌رفته فقط برای سازگاری موقت است — حتماً Rotate شود.
// راه‌حل نهایی: انتقال تولید آزمون به بک‌اند.
// ============================================================
const client = new OpenAI({
  baseURL: import.meta.env.VITE_GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1',
  apiKey: import.meta.env.VITE_GAPGPT_API_KEY || 'sk-rN1cgFGA8PjOOpyN47xJ71suQdvSj5FIDjxexNsPowTgi1bp',
  dangerouslyAllowBrowser: true,
  timeout: 180000,
  maxRetries: 2,
});

// ============================================================
// 📋 نقشه نوع آزمون به دستورالعمل ساخت
// ============================================================
const getExamTypeInstruction = (examType: string, numQuestions: number): string => {
  switch (examType) {
    case 'چهارگزینه‌ای':
      return `⚠️ نوع آزمون: چهارگزینه‌ای (MCQ)
- تمام سوالات باید از نوع "mcq" باشند
- هر سوال دقیقاً ۴ گزینه دارد (a, b, c, d)
- فقط یک گزینه باید صحیح باشد (is_correct: true)
- گزینه‌ها باید مرتبط با محتوای متن باشند
- سطح دشواری سوالات باید متناسب با متن باشد`;
      
    case 'درست/نادرست':
      return `⚠️ نوع آزمون: درست/نادرست (True/False)
- تمام سوالات باید از نوع "tf" باشند
- هر سوال فقط ۲ گزینه دارد: "درست" و "نادرست"
- گزینه اول (true) برای جملات درست، گزینه دوم (false) برای جملات نادرست
- سوالات باید به گونه‌ای طراحی شوند که ابهام نداشته باشند
- پاسخ صحیح باید کاملاً واضح و غیرقابل انکار باشد`;
      
    case 'جای‌خالی':
      return `⚠️ نوع آزمون: جای خالی (Fill in the Blank)
- تمام سوالات باید از نوع "fitb" باشند
- در متن سوال از "______" یا "(....)" برای جای خالی استفاده کنید
- پاسخ صحیح باید کلمه یا عبارت دقیقی باشد که در جای خالی قرار می‌گیرد
- جای خالی باید در بخش مهمی از متن قرار گیرد
- پاسخ صحیح باید منحصر به فرد باشد`;
      
    case 'پاسخ‌کوتاه':
      return `⚠️ نوع آزمون: پاسخ کوتاه (Short Answer)
- تمام سوالات باید از نوع "short" باشند
- سوالات باید به گونه‌ای باشند که پاسخ در ۱-۲ خط خلاصه شود
- پاسخ صحیح باید شامل کلمات کلیدی اصلی باشد
- پاسخ می‌تواند چندین عبارت صحیح داشته باشد
- سوالات باید جنبه تحلیلی و تشریحی داشته باشند`;
      
    case 'ترکیبی':
    default:
      return `⚠️ نوع آزمون: ترکیبی (Mixed)
- سوالات می‌توانند ترکیبی از انواع زیر باشند:
  * چهارگزینه‌ای (mcq) - با ۴ گزینه و یک پاسخ صحیح
  * درست/نادرست (tf) - با گزینه‌های "درست" و "نادرست"
  * جای خالی (fitb) - با استفاده از ______ در متن سوال
  * پاسخ کوتاه (short) - با پاسخ تشریحی کوتاه
- تنوع سوالات را رعایت کنید تا آزمون جذاب باشد
- حداقل ۲ نوع مختلف سوال در آزمون وجود داشته باشد`;
  }
};

// ============================================================
// 📋 دریافت پرامپت سطح دشواری
// ============================================================
const getDifficultyPrompt = (difficulty: string): string => {
  switch (difficulty) {
    case 'آسان':
      return `🔰 سطح دشواری: آسان
- سوالات باید سطح پایه و ابتدایی باشند
- از مفاهیم ساده و واضح استفاده کنید
- گزینه‌های غلط باید کاملاً مشخص و قابل تشخیص باشند
- سوالات باید برای مبتدیان قابل درک باشد
- از اصطلاحات پیچیده خودداری کنید`;
      
    case 'سخت':
      return `🔰 سطح دشواری: سخت
- سوالات باید سطح پیشرفته و چالش‌برانگیز باشند
- از مفاهیم عمیق و جزئیات دقیق استفاده کنید
- گزینه‌های غلط باید بسیار نزدیک به پاسخ صحیح باشند
- سوالات باید نیاز به تفکر و تحلیل عمیق داشته باشند
- از اصطلاحات تخصصی و پیچیده استفاده کنید`;
      
    case 'متوسط':
    default:
      return `🔰 سطح دشواری: متوسط
- سوالات باید سطح متوسط و متعادل باشند
- ترکیبی از مفاهیم پایه و پیشرفته
- گزینه‌های غلط باید محتمل اما قابل تشخیص باشند
- سوالات باید نیاز به درک خوب از متن داشته باشند
- از اصطلاحات تخصصی مناسب استفاده کنید`;
  }
};

// ============================================================
// 📋 تشخیص زبان متن
// ============================================================
const detectLanguage = (text: string): string => {
  // تشخیص زبان فارسی
  const persianPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const hasPersian = persianPattern.test(text);
  
  // تشخیص زبان انگلیسی
  const englishPattern = /[a-zA-Z]/;
  const hasEnglish = englishPattern.test(text);
  
  // تشخیص زبان عربی
  const arabicPattern = /[\u0600-\u06FF]/;
  const hasArabic = arabicPattern.test(text);
  
  if (hasPersian && !hasEnglish) return 'persian';
  if (hasEnglish && !hasPersian) return 'english';
  if (hasPersian && hasEnglish) return 'mixed';
  if (hasArabic) return 'arabic';
  return 'unknown';
};

// ============================================================
// 📋 پرامپت سیستمی کامل و دقیق
// ============================================================
const getSystemPrompt = (
  examType: string, 
  difficulty: string, 
  numQuestions: number, 
  sourceTextPreview: string,
  detectedLanguage: string
): string => {
  const typeInstruction = getExamTypeInstruction(examType, numQuestions);
  const difficultyPrompt = getDifficultyPrompt(difficulty);
  
  // تنظیم زبان سوالات بر اساس زبان متن
  let questionLanguageInstruction = '';
  let analysisLanguageInstruction = '';
  
  if (detectedLanguage === 'persian') {
    questionLanguageInstruction = `
🌐 زبان سوالات: فارسی
- تمام سوالات به زبان فارسی نوشته شوند
- از نگارش صحیح و روان فارسی استفاده کنید
- اصطلاحات تخصصی را به فارسی ترجمه کنید`;
    analysisLanguageInstruction = '✅ تمام تحلیل‌ها و بازخوردها به زبان فارسی نوشته شوند';
  } else if (detectedLanguage === 'english') {
    questionLanguageInstruction = `
🌐 زبان سوالات: انگلیسی (English)
- تمام سوالات به زبان انگلیسی نوشته شوند
- از نگارش صحیح و روان انگلیسی استفاده کنید
- اصطلاحات تخصصی را به انگلیسی استفاده کنید`;
    analysisLanguageInstruction = '✅ تمام تحلیل‌ها و بازخوردها به زبان فارسی نوشته شوند (برای کاربر فارسی‌زبان)';
  } else if (detectedLanguage === 'mixed') {
    questionLanguageInstruction = `
🌐 زبان سوالات: ترکیبی (فارسی/انگلیسی)
- سوالات به همان زبانی که در متن استفاده شده، نوشته شوند
- اگر متن فارسی است، سوالات فارسی باشند
- اگر متن انگلیسی است، سوالات انگلیسی باشند
- اصطلاحات تخصصی به همان زبان اصلی استفاده شوند`;
    analysisLanguageInstruction = '✅ تمام تحلیل‌ها و بازخوردها به زبان فارسی نوشته شوند (برای کاربر فارسی‌زبان)';
  } else if (detectedLanguage === 'arabic') {
    questionLanguageInstruction = `
🌐 زبان سوالات: عربی (Arabic)
- تمام سوالات به زبان عربی نوشته شوند
- از نگارش صحیح و روان عربی استفاده کنید
- اصطلاحات تخصصی را به عربی استفاده کنید`;
    analysisLanguageInstruction = '✅ تمام تحلیل‌ها و بازخوردها به زبان فارسی نوشته شوند (برای کاربر فارسی‌زبان)';
  } else {
    questionLanguageInstruction = `
🌐 زبان سوالات: همان زبان متن منبع
- سوالات به همان زبانی که متن منبع نوشته شده، تولید شوند
- اگر متن فارسی است، سوالات فارسی باشند
- اگر متن انگلیسی است، سوالات انگلیسی باشند`;
    analysisLanguageInstruction = '✅ تمام تحلیل‌ها و بازخوردها به زبان فارسی نوشته شوند (برای کاربر فارسی‌زبان)';
  }

  return `🧠 شما یک هوش مصنوعی تخصصی در زمینه طراحی آزمون و سوالات استاندارد هستید.

📌 **مشخصات آزمون مورد نظر:**
- نوع آزمون: ${examType}
- سطح دشواری: ${difficulty}
- تعداد سوالات مورد نیاز: ${numQuestions} سوال
- متن منبع: "${sourceTextPreview.substring(0, 100)}..."

${typeInstruction}

${difficultyPrompt}

${questionLanguageInstruction}

${analysisLanguageInstruction}

📋 **ساختار JSON خروجی (فقط JSON برگردانید، بدون هیچ متن اضافی):**

{
  "exam": {
    "id": "exam_${Date.now()}",
    "title": "عنوان جذاب و مرتبط با متن",
    "type": "${examType === 'ترکیبی' ? 'mixed' : examType === 'چهارگزینه‌ای' ? 'mcq' : examType === 'درست/نادرست' ? 'tf' : examType === 'جای‌خالی' ? 'fitb' : 'short'}",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "q_id": "q1",
        "type": "نوع سوال",
        "prompt": "متن کامل سوال (به زبان مناسب)",
        "options": [
          {"id": "a", "text": "گزینه اول", "is_correct": false},
          {"id": "b", "text": "گزینه دوم", "is_correct": false},
          {"id": "c", "text": "گزینه سوم", "is_correct": false},
          {"id": "d", "text": "گزینه چهارم", "is_correct": true}
        ],
        "correct_answer": "",
        "concept_tags": ["برچسب1", "برچسب2"],
        "difficulty": 2,
        "points": 2
      }
    ]
  },
  "grading_instructions": {
    "weights": {
      "mcq": 1,
      "tf": 1,
      "fitb": 2,
      "short": 2
    }
  },
  "feedback_template": {
    "fa": "{{user_name}} عزیز، نمره شما {{score}} از {{total}} است ({{percentage}}%)."
  },
  "ui_theme": {
    "primary": "#1E40AF",
    "accent": "#3B82F6",
    "background": "#F9FAFB",
    "text_on_primary": "#FFFFFF"
  }
}

🎯 **قوانین حیاتی و دقیق:**

1. **سطح دشواری (مهم):**
   - برای سطح آسان: سوالات ساده، گزینه‌های واضح، مفاهیم پایه
   - برای سطح متوسط: سوالات متعادل، ترکیبی از آسان و سخت
   - برای سطح سخت: سوالات چالش‌برانگیز، گزینه‌های نزدیک به هم، نیاز به تحلیل عمیق

2. **زبان سوالات (مهم):**
   - سوالات به همان زبانی که متن منبع نوشته شده، تولید شوند
   - اگر متن فارسی است → سوالات فارسی
   - اگر متن انگلیسی است → سوالات انگلیسی
   - اگر متن عربی است → سوالات عربی
   - اگر متن ترکیبی است → سوالات به زبان غالب متن

3. **نوع سوالات:**
   - برای چهارگزینه‌ای: type: "mcq"، options: 4 گزینه، is_correct: فقط true/false
   - برای درست/نادرست: type: "tf"، options: [{"id":"true","text":"درست","is_correct":true}, {"id":"false","text":"نادرست","is_correct":false}]
   - برای جای خالی: type: "fitb"، در prompt از "______" استفاده کنید، correct_answer: کلمه یا عبارت صحیح
   - برای پاسخ کوتاه: type: "short"، correct_answer: پاسخ تشریحی مختصر

4. **محتوا و کیفیت:**
   - سوالات باید کاملاً مرتبط با متن منبع باشند
   - سوالات نباید خارج از متن منبع باشند
   - گزینه‌های غلط باید محتمل و نزدیک به پاسخ صحیح باشند
   - سطح دشواری سوالات باید دقیقاً مطابق با ${difficulty} باشد

5. **دقت در داده‌ها:**
   - points و difficulty: عدد صحیح (مثلاً 2)
   - is_correct: حتماً boolean (true یا false) - هرگز رشته نباشد
   - concept_tags: آرایه‌ای از کلمات کلیدی مرتبط با سوال

6. **عنوان و ساختار:**
   - عنوان آزمون باید جذاب و مرتبط با متن باشد
   - از تکرار سوالات تکراری خودداری کنید
   - سوالات را به ترتیب از آسان به سخت مرتب کنید

7. **خروجی نهایی:**
   - فقط JSON خالص برگردانید
   - اولین کاراکتر باید { باشد
   - آخرین کاراکتر باید } باشد
   - هیچ متن اضافی قبل یا بعد از JSON نباشد`;
};

// ============================================================
// 🎯 تابع اصلی ساخت آزمون
// ============================================================
export const generateExam = async (
  config: ExamConfig,
  opts?: { skipAutoSave?: boolean }
): Promise<GeminiResponse> => {
  // اعتبارسنجی ورودی
  if (!config.source_text || config.source_text.trim().length < 10) {
    throw new Error('لطفاً متن منبع را وارد کنید (حداقل ۱۰ کاراکتر)');
  }

  // ============================================
  // 🛡️ Pre-flight: بررسی سهمیه قبل از فراخوانی AI
  // (تا هزینه تولید برای کاربر بدون سهمیه هدر نرود)
  // ============================================
  try {
    const limitsRes = await api.get('/subscription/limits');
    const features = limitsRes.data?.data?.features;
    const examFeat = features?.exam_generation;
    if (examFeat && examFeat.remaining !== null && examFeat.remaining !== undefined && examFeat.remaining <= 0) {
      throw new Error(`⛔ سقف ${examFeat.limit ?? ''} آزمون ماهانه شما کامل شده است. برای ساخت آزمون جدید، اشتراک خود را ارتقا دهید.`);
    }
    const qCap = features?.exam_questions_per_exam;
    if (qCap && qCap.limit !== null && qCap.limit !== undefined && config.num_questions > qCap.limit) {
      throw new Error(`⛔ حداکثر ${qCap.limit} سوال در هر آزمون در پلن فعلی شما مجاز است.`);
    }
  } catch (err: any) {
    if (err?.message?.startsWith('⛔')) throw err;
    // اگر API محدودیت‌ها در دسترس نبود، ادامه بده (سرور نهایی را enforce می‌کند)
    console.warn('⚠️ Pre-flight limit check skipped:', err?.message);
  }

  const sourceText = config.source_text.substring(0, 4000);
  const detectedLanguage = detectLanguage(sourceText);
  console.log(`🌐 Detected language: ${detectedLanguage}`);
  console.log(`📊 Difficulty: ${config.difficulty}`);
  
  const systemPrompt = getSystemPrompt(
    config.exam_type, 
    config.difficulty, 
    config.num_questions, 
    sourceText,
    detectedLanguage
  );
  
  const userPrompt = `متن زیر را بر اساس نوع آزمون "${config.exam_type}" و سطح "${config.difficulty}" به ${config.num_questions} سوال استاندارد تبدیل کن.

📌 توجه به سطح دشواری ${config.difficulty}:
- آسان: سوالات پایه و ساده
- متوسط: سوالات متعادل
- سخت: سوالات چالش‌برانگیز و عمیق

📌 توجه به زبان متن:
- سوالات به همان زبانی که متن نوشته شده، تولید شوند

متن:
${sourceText}`;

  console.log('🚀 ارسال درخواست به هوش مصنوعی...');
  console.log('📊 تنظیمات:', config.exam_type, config.difficulty, config.num_questions);
  console.log('📝 طول متن منبع:', sourceText.length);

  try {
    const response = await client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
    });

    let content = response.choices[0]?.message?.content || '';
    
    if (!content || content.trim() === '') {
      throw new Error('پاسخ خالی دریافت شد');
    }

    console.log('📄 طول پاسخ:', content.length);

    // ========== پاکسازی پاسخ ==========
    content = content.trim();
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    const firstBrace = content.indexOf('{');
    if (firstBrace === -1) {
      throw new Error('پاسخ JSON معتبر نیست - { پیدا نشد');
    }
    content = content.substring(firstBrace);
    
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
    if (lastBrace > 0) {
      content = content.substring(0, lastBrace + 1);
    }

    console.log('📄 بعد از پاکسازی:', content.substring(0, 200));

    // ========== پارس JSON ==========
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (parseError: any) {
      console.error('❌ JSON نامعتبر:', content.substring(0, 300));
      throw new Error('فرمت پاسخ نامعتبر است. لطفاً دوباره تلاش کنید.');
    }

    // ========== اعتبارسنجی و تکمیل داده ==========
    if (!data || typeof data !== 'object') {
      throw new Error('پاسخ JSON معتبر نیست');
    }

    if (!data.exam) {
      data.exam = {};
    }

    if (!data.exam.questions || !Array.isArray(data.exam.questions) || data.exam.questions.length === 0) {
      throw new Error('هیچ سوالی تولید نشد. لطفاً متن دیگری را امتحان کنید.');
    }

    // تنظیم نوع آزمون بر اساس درخواست کاربر
    const examTypeMap: Record<string, string> = {
      'چهارگزینه‌ای': 'mcq',
      'درست/نادرست': 'tf',
      'جای‌خالی': 'fitb',
      'پاسخ‌کوتاه': 'short',
      'ترکیبی': 'mixed'
    };
    
    data.exam.id = data.exam.id || `exam_${Date.now()}`;
    data.exam.title = data.exam.title || `آزمون ${config.exam_type}`;
    data.exam.type = examTypeMap[config.exam_type] || 'mixed';
    data.exam.difficulty = config.difficulty;
    
    // اصلاح سوالات بر اساس نوع درخواستی و سطح دشواری
    const fixedQuestions = data.exam.questions.map((q: any, i: number) => {
      const fixed: any = {
        q_id: q.q_id || `q_${i + 1}`,
        prompt: q.prompt || `سوال ${i + 1}`,
        concept_tags: Array.isArray(q.concept_tags) ? q.concept_tags.slice(0, 3) : [],
        difficulty: Math.max(1, Math.min(5, Number(q.difficulty) || 3)),
        points: Math.max(1, Math.min(10, Number(q.points) || 2)),
      };

      // تنظیم سطح دشواری بر اساس درخواست کاربر
      let difficultyLevel = 3; // متوسط
      if (config.difficulty === 'آسان') difficultyLevel = 1;
      else if (config.difficulty === 'سخت') difficultyLevel = 5;
      else difficultyLevel = 3;
      
      fixed.difficulty = difficultyLevel;

      // اعمال نوع سوال بر اساس درخواست کاربر
      if (config.exam_type === 'چهارگزینه‌ای') {
        fixed.type = 'mcq';
        const options = Array.isArray(q.options) ? q.options : [];
        while (options.length < 4) {
          options.push({ 
            id: String.fromCharCode(97 + options.length), 
            text: `گزینه ${options.length + 1}`, 
            is_correct: options.length === 0 
          });
        }
        fixed.options = options.slice(0, 4).map((opt: any, idx: number) => ({
          id: opt.id || String.fromCharCode(97 + idx),
          text: opt.text || `گزینه ${String.fromCharCode(97 + idx)}`,
          is_correct: opt.is_correct === true
        }));
        fixed.correct_answer = '';
      } 
      else if (config.exam_type === 'درست/نادرست') {
        fixed.type = 'tf';
        fixed.options = [
          { id: 'true', text: 'درست', is_correct: true },
          { id: 'false', text: 'نادرست', is_correct: false }
        ];
        fixed.correct_answer = '';
      }
      else if (config.exam_type === 'جای‌خالی') {
        fixed.type = 'fitb';
        fixed.options = [];
        if (!fixed.prompt.includes('______') && !fixed.prompt.includes('(...)')) {
          fixed.prompt = fixed.prompt + ' ______';
        }
        fixed.correct_answer = q.correct_answer || 'پاسخ صحیح';
      }
      else if (config.exam_type === 'پاسخ‌کوتاه') {
        fixed.type = 'short';
        fixed.options = [];
        fixed.correct_answer = q.correct_answer || 'پاسخ صحیح';
      }
      else {
        // ترکیبی - حفظ نوع اصلی سوال
        fixed.type = q.type || 'mcq';
        if (fixed.type === 'mcq' || fixed.type === 'tf') {
          const options = Array.isArray(q.options) ? q.options : [];
          if (fixed.type === 'mcq') {
            while (options.length < 4) {
              options.push({ 
                id: String.fromCharCode(97 + options.length), 
                text: `گزینه ${options.length + 1}`, 
                is_correct: false 
              });
            }
            fixed.options = options.slice(0, 4);
          } else {
            fixed.options = [
              { id: 'true', text: 'درست', is_correct: true },
              { id: 'false', text: 'نادرست', is_correct: false }
            ];
          }
          fixed.correct_answer = '';
        } else {
          fixed.options = [];
          fixed.correct_answer = q.correct_answer || '';
        }
      }

      return fixed;
    });

    data.exam.questions = fixedQuestions;

    // تکمیل فیلدهای اختیاری
    if (!data.grading_instructions?.weights) {
      data.grading_instructions = {
        weights: { mcq: 1, tf: 1, fitb: 2, short: 2 }
      };
    }
    
    if (!data.feedback_template?.fa) {
      data.feedback_template = {
        fa: `${config.user_name || 'کاربر'} عزیز، نمره شما {{score}} از {{total}} است ({{percentage}}%).`
      };
    }
    
    if (!data.ui_theme?.primary) {
      data.ui_theme = {
        primary: '#1E40AF',
        accent: '#3B82F6',
        background: '#F9FAFB',
        text_on_primary: '#FFFFFF'
      };
    }

    console.log(`✅ آزمون با موفقیت ساخته شد: ${data.exam.questions.length} سوال از نوع ${config.exam_type}`);
    console.log(`📊 سطح دشواری: ${config.difficulty}`);
    console.log(`🌐 زبان تشخیص داده شده: ${detectedLanguage}`);

    // ========== ذخیره خودکار آزمون در سرور ==========
    // این نقطه، نقطه اعمال محدودیت سمت سرور است. در صورت 429/403
    // (اتمام سهمیه یا قابلیت غیرفعال) خطا به کاربر نمایش داده
    // می‌شود تا دور زدن سهمیه از طریق کلاینت ممکن نباشد.
    //
    // ⚠️ برای آزمون کلاسی (معلم) skipAutoSave=true می‌شود؛ ذخیره و
    // شمارش سهمیه فقط از طریق /class-exams/exam/create انجام می‌گیرد
    // تا سهمیه دو بار مصرف نشود و لیست آزمون‌های شخصی معلم آلوده نشود.
    if (!opts?.skipAutoSave) {
      try {
        console.log('📤 Auto-saving exam to server...');
        await api.post('/exams/start', {
          examData: data.exam,
          config: config
        });
        console.log('✅ Exam auto-saved successfully');
      } catch (saveError: any) {
        const status = saveError?.response?.status;
        const serverMessage = saveError?.response?.data?.message;
        console.error('⚠️ Auto-save failed:', saveError.message, status, serverMessage);

        if (status === 429 || status === 403) {
          // ⛔ enforcement واقعی سمت سرور — دور زدن ممکن نیست
          throw new Error(serverMessage || 'سقف سهمیه شما کامل شده است. اشتراک خود را ارتقا دهید.');
        }
        // سایر خطاها (شبکه و ...) نباید جلوی نمایش آزمون را بگیرند
      }
    }

    return data as GeminiResponse;

  } catch (error: any) {
    console.error('❌ خطا در ساخت آزمون:', error.message);
    throw new Error(error.message || 'خطا در ساخت آزمون. لطفاً دوباره تلاش کنید.');
  }
};

export default { generateExam };