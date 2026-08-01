// services/entitlements.ts
// ============================================
// 🎫 لایه دسترسی به Entitlements (منبع مرکزی: بک‌اند)
// ============================================
import api from './api';

export type FeatureKind = 'metered' | 'cap' | 'flag';

export interface FeatureEntitlement {
    key: string;
    kind: FeatureKind;
    label: string;
    unit: string | null;
    is_enabled: boolean;
    limit: number | null;      // null = نامحدود
    used: number | null;       // فقط برای metered
    remaining: number | null;  // فقط برای metered
    reset_period: 'monthly' | 'none';
}

export interface EntitlementsPayload {
    plan: {
        id: number | null;
        name: string;
        panel_type?: string;
        is_free: boolean;
        price_1m?: number;
        price_3m?: number;
        price_9m?: number;
        description?: string | null;
    } | null;
    subscription: {
        id: number;
        plan_id: number;
        plan_name: string;
        duration: string;
        start_date: string;
        end_date: string;
        status: string;
    } | null;
    usage: {
        exams_used: number;
        questions_used: number;
        advisor_used: number;
        classes_used: number;
    };
    features: Record<string, FeatureEntitlement>;
    unlimited?: boolean;
}

// ============================================
// 📥 دریافت Entitlements از سرور
// ============================================
export async function fetchEntitlements(): Promise<EntitlementsPayload | null> {
    try {
        const response = await api.get('/subscription/entitlements');
        if (response.data?.success && response.data?.data) {
            return response.data.data as EntitlementsPayload;
        }
        return null;
    } catch (error: any) {
        console.warn('⚠️ fetchEntitlements failed:', error?.response?.status || error?.message);
        return null;
    }
}

// ============================================
// 🧩 شکل سازگار با قرارداد قدیمی getUserLimits
// (برای کامپوننت‌هایی که هنوز با plan.max_* کار می‌کنند)
// ============================================
export function toLegacyLimits(ent: EntitlementsPayload) {
    const f = ent.features;
    const lim = (key: string): number | null => f[key]?.limit ?? null;
    return {
        plan: {
            id: ent.plan?.id,
            name: ent.plan?.name,
            is_free: ent.plan?.is_free,
            max_exams_month: lim('exam_generation'),
            max_questions_exam: lim('exam_questions_per_exam'),
            max_file_size_mb: lim('file_upload_size'),
            max_classes: lim('class_create'),
            max_students_class: lim('class_students_per_class'),
            max_advisor_month: lim('advisor_chat'),
            max_advisor_chars: lim('advisor_message_chars'),
        },
        usage: ent.usage,
        limits: ent.usage ? {
            exams_remaining: f.exam_generation?.remaining ?? null,
            advisor_remaining: f.advisor_chat?.remaining ?? null,
            classes_remaining: f.class_create?.remaining ?? null,
        } : {},
        features: ent.features, // نگاشت کامل فیچرها
        subscription: ent.subscription,
    };
}
