import { useAuth } from '../context/AuthContext';

// Feature keys matching backend PLAN_FEATURES
export type FeatureKey =
    | 'kds_enabled'
    | 'stock_enabled'
    | 'fidelity_enabled'
    | 'table_map_enabled'
    | 'multi_site_enabled'
    | 'accounting_export'
    | 'white_label'
    | 'reservations_enabled'
    | 'finance_enabled';

interface Plan {
    name: string;
    max_staff: number;
    max_tables: number;
    max_registers: number; // Caisses
    features: string[];
}

export const PLAN_FEATURES: Record<string, Plan> = {
    'TRIAL': {
        name: 'Essai Gratuit',
        max_staff: 999,
        max_tables: 999,
        max_registers: 999,
        features: ['kds_enabled', 'stock_enabled', 'fidelity_enabled', 'table_map_enabled', 'multi_site_enabled', 'accounting_export', 'white_label', 'reservations_enabled', 'finance_enabled']
    },
    'ESSENTIAL': {
        name: 'Essentiel',
        max_staff: 5, // Increased from 3
        max_tables: 15,
        max_registers: 3,
        features: [] // Basic features only
    },
    'PRO': {
        name: 'Pro',
        max_staff: 999,
        max_tables: 50,
        max_registers: 10,
        features: ['kds_enabled', 'stock_enabled', 'fidelity_enabled', 'table_map_enabled', 'reservations_enabled', 'finance_enabled']
    },
    'ELITE': {
        name: 'Élite',
        max_staff: 999,
        max_tables: 999,
        max_registers: 999,
        features: ['kds_enabled', 'stock_enabled', 'fidelity_enabled', 'table_map_enabled', 'multi_site_enabled', 'accounting_export', 'white_label', 'reservations_enabled', 'finance_enabled']
    }
};

export const useSubscription = () => {
    const { user } = useAuth();
    const tenant = user?.tenant;

    // Default to TRIAL or ESSENTIAL if no plan set, but safe fallback
    const subscriptionPlan = tenant?.subscriptionPlan;
    const currentPlanCode = (typeof subscriptionPlan === 'string' ? subscriptionPlan : 'ESSENTIAL').toUpperCase();
    const currentPlan = PLAN_FEATURES[currentPlanCode as keyof typeof PLAN_FEATURES] || PLAN_FEATURES['ESSENTIAL'];

    /**
     * Check if a feature is allowed
     */
    const can = (feature: FeatureKey): boolean => {
        if (!currentPlan || !currentPlan.features || !Array.isArray(currentPlan.features)) {
            return false;
        }
        return currentPlan.features.includes(feature as string);
    };

    /**
     * Check if staff limit reached
     */
    const isStaffLimitReached = (currentStaffCount: number): boolean => {
        const max = currentPlan?.max_staff || 3;
        return currentStaffCount >= max;
    };

    /**
     * Check if tables limit reached
     */
    const isTableLimitReached = (currentCount: number): boolean => {
        const max = currentPlan?.max_tables || 10;
        return currentCount >= max;
    };

    /**
     * Check if registers limit reached
     */
    const isRegisterLimitReached = (currentCount: number): boolean => {
        const max = currentPlan?.max_registers || 2;
        return currentCount >= max;
    };

    return {
        plan: currentPlanCode,
        planName: currentPlan.name,
        can,
        isStaffLimitReached,
        isTableLimitReached,
        isRegisterLimitReached,
        maxStaff: currentPlan.max_staff,
        maxTables: currentPlan.max_tables,
        maxRegisters: currentPlan.max_registers
    };
};
