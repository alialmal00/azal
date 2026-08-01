import api from './api';

export interface Plan {
    id: string;
    name: string;
    panel_type: string;
    price_1m: number;
    price_3m: number;
    price_9m: number;
    max_exams_month: number;
    max_questions_exam: number;
    max_file_size_mb: number;
    max_classes: number;
    max_students_class: number;
    max_advisor_month: number;
    max_advisor_chars: number;
}

export interface Subscription {
    id: string;
    plan_id: string;
    duration: string;
    start_date: string;
    end_date: string;
    status: string;
}

export interface Usage {
    exams_used: number;
    advisor_used: number;
    storage_used_mb: number;
}

class SubscriptionService {
    // دریافت لیست پلن‌ها
    async getPlans(panelType?: string): Promise<{ success: boolean; plans?: Plan[]; message?: string }> {
        try {
            const url = panelType ? `/subscription/plans?panel=${panelType}` : '/subscription/plans';
            const response = await api.get(url);
            return { success: true, plans: response.data.data.plans };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت پلن‌ها' };
        }
    }

    // دریافت اشتراک فعلی
    async getMySubscription(): Promise<{ success: boolean; subscription?: Subscription; plan?: Plan; usage?: Usage; message?: string }> {
        try {
            const response = await api.get('/subscription/my');
            return {
                success: true,
                subscription: response.data.data.subscription,
                plan: response.data.data.plan,
                usage: response.data.data.usage
            };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت اشتراک' };
        }
    }

    // خرید اشتراک
    async purchase(planId: string, duration: string): Promise<{ success: boolean; subscription?: Subscription; message?: string }> {
        try {
            const response = await api.post('/subscription/purchase', { planId, duration });
            return { success: true, subscription: response.data.data.subscription, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در خرید اشتراک' };
        }
    }

    // دریافت مصرف ماهانه
    async getUsage(): Promise<{ success: boolean; usage?: Usage; limits?: any; message?: string }> {
        try {
            const response = await api.get('/subscription/usage');
            return { success: true, usage: response.data.data.usage, limits: response.data.data.limits };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت مصرف' };
        }
    }

    // دریافت تاریخچه صورتحساب‌ها
    async getBillingHistory(): Promise<{ success: boolean; payments?: any[]; subscriptions?: any[]; message?: string }> {
        try {
            const response = await api.get('/subscription/billing');
            return {
                success: true,
                payments: response.data.data.payments,
                subscriptions: response.data.data.subscriptions
            };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در دریافت تاریخچه' };
        }
    }

    // لغو اشتراک
    async cancel(): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await api.post('/subscription/cancel');
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'خطا در لغو اشتراک' };
        }
    }
}

export const subscriptionService = new SubscriptionService();