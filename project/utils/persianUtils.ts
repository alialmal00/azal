// utils/persianUtils.ts

/**
 * تبدیل متن فارسی به فرمت قابل نمایش در jsPDF
 * مشکل وارونه‌نویسی و جدا شدن حروف را حل می‌کند
 */
export const fixPersianText = (text: string): string => {
  if (!text) return '';
  
  // جدول تبدیل حروف عربی به فارسی
  const arabicToPersian: { [key: string]: string } = {
    'ي': 'ی',
    'ك': 'ک',
    'ة': 'ه',
    'ۀ': 'ه',
    'ى': 'ی'
  };
  
  // جایگزینی کاراکترهای عربی با فارسی
  let fixed = text.split('').map(char => arabicToPersian[char] || char).join('');
  
  // برگرداندن متن (jsPDF خودکار جهت راست‌چین را اعمال می‌کند)
  return fixed;
};

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (text: string | number): string => {
  if (text === null || text === undefined) return '';
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(text).replace(/[0-9]/g, (match) => persianDigits[parseInt(match)]);
};

/**
 * معکوس کردن متن برای نمایش صحیح در jsPDF
 */
export const reversePersianText = (text: string): string => {
  if (!text) return '';
  
  // جدا کردن کلمات و معکوس کردن ترتیب آنها
  const words = text.split(' ');
  return words.reverse().join(' ');
};

/**
 * آماده‌سازی متن برای jsPDF
 */
export const preparePersianText = (text: string): string => {
  if (!text) return '';
  
  // 1. اصلاح حروف عربی
  let fixed = fixPersianText(text);
  
  // 2. تبدیل اعداد به فارسی
  fixed = toPersianNumbers(fixed);
  
  // 3. معکوس کردن متن برای نمایش صحیح
  fixed = reversePersianText(fixed);
  
  return fixed;
};

/**
 * تشخیص اینکه آیا متن شامل حروف فارسی است
 */
export const hasPersian = (text: string): boolean => {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
};