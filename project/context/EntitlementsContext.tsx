// context/EntitlementsContext.tsx
// ============================================
// 🏛️ Context مرکزی اشتراک و محدودیت‌ها
// --------------------------------------------
// تمام کامپوننت‌ها به‌جای fetch جداگانه یا Hard-code،
// از این Context میزهای پلن کاربر را می‌خوانند.
// ============================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../index';
import {
    fetchEntitlements,
    toLegacyLimits,
    type EntitlementsPayload,
    type FeatureEntitlement,
} from '../services/entitlements';

interface EntitlementsContextType {
    entitlements: EntitlementsPayload | null;
    loading: boolean;
    refresh: () => Promise<void>;
    /** آیا فیچر فعال است؟ (برای flag ها و هر نوع فیچر) */
    can: (featureKey: string) => boolean;
    /** سقف عددی فیچر (null = نامحدود) */
    limit: (featureKey: string) => number | null;
    /** باقی‌مانده فیچر مصرف‌محور */
    remaining: (featureKey: string) => number | null;
    /** خود فیچر */
    feature: (featureKey: string) => FeatureEntitlement | undefined;
    /** شکل سازگار با ساختار قدیمی userLimits */
    legacy: ReturnType<typeof toLegacyLimits> | null;
}

const EntitlementsContext = createContext<EntitlementsContextType>({
    entitlements: null,
    loading: true,
    refresh: async () => {},
    can: () => false,
    limit: () => null,
    remaining: () => null,
    feature: () => undefined,
    legacy: null,
});

export const EntitlementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const [entitlements, setEntitlements] = useState<EntitlementsPayload | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) {
            setEntitlements(null);
            setLoading(false);
            return;
        }
        const data = await fetchEntitlements();
        setEntitlements(data);
        setLoading(false);
    }, [isAuthenticated]);

    useEffect(() => {
        setLoading(true);
        refresh();
    }, [refresh, user?.id]);

    const feature = useCallback(
        (key: string) => entitlements?.features?.[key],
        [entitlements]
    );

    const can = useCallback(
        (key: string): boolean => {
            if (entitlements?.unlimited) return true;
            const f = entitlements?.features?.[key];
            if (!f) return true; // فیچر تعریف‌نشده = بدون محدودیت
            return f.is_enabled;
        },
        [entitlements]
    );

    const limit = useCallback(
        (key: string): number | null => {
            if (entitlements?.unlimited) return null;
            return entitlements?.features?.[key]?.limit ?? null;
        },
        [entitlements]
    );

    const remaining = useCallback(
        (key: string): number | null => {
            if (entitlements?.unlimited) return null;
            return entitlements?.features?.[key]?.remaining ?? null;
        },
        [entitlements]
    );

    const legacy = useMemo(
        () => (entitlements && !entitlements.unlimited ? toLegacyLimits(entitlements) : null),
        [entitlements]
    );

    const value = useMemo(
        () => ({ entitlements, loading, refresh, can, limit, remaining, feature, legacy }),
        [entitlements, loading, refresh, can, limit, remaining, feature, legacy]
    );

    return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
};

export const useEntitlements = () => useContext(EntitlementsContext);

export default EntitlementsContext;
