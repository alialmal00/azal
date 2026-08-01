// services/smsService.js
const axios = require('axios');
require('dotenv').config();

class SmsService {
    constructor() {
        this.apiKey = process.env.SMS_API_KEY || '5UgT0M6R28i0gAPOPyqanUINJLkeSgvJeKILhmt0OuH7ryJ6';
        this.baseUrl = 'https://api.sms.ir/v1';
        this.verifyTemplateId = parseInt(process.env.SMS_VERIFY_TEMPLATE_ID) || 870521;
        this.resetTemplateId = parseInt(process.env.SMS_RESET_TEMPLATE_ID) || 814186;
        this.isSandbox = process.env.SMS_SANDBOX_MODE === 'true';
        
        console.log('📱 SMS Service Initialized:');
        console.log(`   Mode: ${this.isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
        console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : '❌ NOT SET'}`);
        console.log(`   Verify Template ID: ${this.verifyTemplateId}`);
        console.log(`   Reset Template ID: ${this.resetTemplateId}`);
    }

    async sendVerificationCode(mobile, code) {
        try {
            const mobileNumber = this.normalizeMobile(mobile);
            
            console.log(`📤 Sending verification code to ${mobileNumber}`);
            console.log(`📋 Code: ${code}`);
            console.log(`📋 Template ID: ${this.verifyTemplateId}`);

            if (this.isSandbox) {
                console.log(`📱 [SANDBOX] Verification code for ${mobileNumber}: ${code}`);
                return {
                    success: true,
                    message: 'کد تأیید در محیط تست ارسال شد (Sandbox)',
                    testCode: code,
                    isSandbox: true
                };
            }

            if (!this.apiKey || this.apiKey.length < 10) {
                console.error('❌ Invalid API Key');
                return {
                    success: false,
                    message: 'کلید API نامعتبر است',
                    error: 'INVALID_API_KEY'
                };
            }

            const payload = {
                mobile: mobileNumber,
                templateId: this.verifyTemplateId,
                parameters: [
                    {
                        name: 'Code',
                        value: String(code)
                    }
                ]
            };

            console.log('📋 Payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(
                `${this.baseUrl}/send/verify`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    timeout: 15000
                }
            );

            console.log('✅ SMS API Response:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.status === 1) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message || 'کد تأیید با موفقیت ارسال شد'
                };
            } else {
                return {
                    success: false,
                    message: response.data?.message || 'خطا در ارسال پیامک',
                    error: response.data
                };
            }

        } catch (error) {
            console.error('❌ SMS Error Details:');
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
                
                if (error.response.status === 401) {
                    return {
                        success: false,
                        message: '❌ کلید API نامعتبر است. لطفاً کلید خود را از پنل SMS.ir بررسی کنید.',
                        error: 'INVALID_API_KEY'
                    };
                }
                
                if (error.response.status === 400) {
                    return {
                        success: false,
                        message: error.response?.data?.message || '❌ اطلاعات ارسالی ناقص است. شناسه قالب را بررسی کنید.',
                        error: 'INVALID_INPUT'
                    };
                }
                
                if (error.response.status === 429) {
                    return {
                        success: false,
                        message: '❌ تعداد درخواست‌های شما زیاد شده است. لطفاً چند دقیقه بعد تلاش کنید.',
                        error: 'RATE_LIMIT'
                    };
                }
            } else if (error.request) {
                console.error('   No response received:', error.request);
            } else {
                console.error('   Error:', error.message);
            }

            console.log(`📱 [FALLBACK] Verification code for ${mobile}: ${code}`);
            
            return {
                success: false,
                message: error.response?.data?.message || '❌ خطا در ارسال پیامک. لطفاً دوباره تلاش کنید.',
                error: error.response?.data || error.message,
                testCode: code
            };
        }
    }

    async sendResetCode(mobile, code) {
        try {
            const mobileNumber = this.normalizeMobile(mobile);
            
            console.log(`📤 Sending reset code to ${mobileNumber}`);
            console.log(`📋 Code: ${code}`);
            console.log(`📋 Template ID: ${this.resetTemplateId}`);

            if (this.isSandbox) {
                console.log(`📱 [SANDBOX] Reset code for ${mobileNumber}: ${code}`);
                return {
                    success: true,
                    message: 'کد بازیابی در محیط تست ارسال شد (Sandbox)',
                    testCode: code,
                    isSandbox: true
                };
            }

            const payload = {
                mobile: mobileNumber,
                templateId: this.resetTemplateId,
                parameters: [
                    {
                        name: 'Code',
                        value: String(code)
                    }
                ]
            };

            const response = await axios.post(
                `${this.baseUrl}/send/verify`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    timeout: 15000
                }
            );

            if (response.data && response.data.status === 1) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message || 'کد بازیابی با موفقیت ارسال شد'
                };
            } else {
                return {
                    success: false,
                    message: response.data?.message || 'خطا در ارسال پیامک',
                    error: response.data
                };
            }

        } catch (error) {
            console.error('❌ Reset SMS Error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || '❌ خطا در ارسال پیامک',
                error: error.response?.data || error.message,
                testCode: code
            };
        }
    }

    // ============================================
    // ✅ اصلاح شده: شماره را با 0 اول نگه می‌دارد
    // ============================================
    normalizeMobile(mobile) {
        let cleaned = String(mobile).replace(/\s/g, '').replace(/[^0-9]/g, '');
        
        // ✅ اگر با 0 شروع می‌شود، همان را نگه دار
        // ✅ اگر با 98 شروع شد، به 0 تبدیل کن
        if (cleaned.startsWith('98')) {
            cleaned = '0' + cleaned.substring(2);
        }
        // ✅ اگر با +98 شروع شد، به 0 تبدیل کن
        else if (cleaned.startsWith('+98')) {
            cleaned = '0' + cleaned.substring(3);
        }
        // ✅ اگر با 0 شروع نشد و 11 رقم نیست، 0 اضافه کن
        else if (!cleaned.startsWith('0') && cleaned.length === 10) {
            cleaned = '0' + cleaned;
        }
        
        return cleaned;
    }

    async testConnection() {
        try {
            console.log('🔍 Testing SMS.ir connection...');
            
            const response = await axios.get(
                `${this.baseUrl}/credit`,
                {
                    headers: {
                        'x-api-key': this.apiKey
                    },
                    timeout: 10000
                }
            );
            
            console.log('✅ SMS.ir connection successful:', response.data);
            return {
                success: true,
                data: response.data,
                isSandbox: this.isSandbox
            };
        } catch (error) {
            console.error('❌ SMS.ir connection failed:');
            console.error('   Status:', error.response?.status);
            console.error('   Message:', error.response?.data?.message || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'خطا در ارتباط با SMS.ir',
                status: error.response?.status,
                isSandbox: this.isSandbox
            };
        }
    }
}

module.exports = new SmsService();