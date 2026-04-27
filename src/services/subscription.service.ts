/**
 * subscription.service.ts — User subscription portal: real backend integration
 *
 * Backend routes:
 *   GET  /api/v1/subscriptions/plans         → list all active plans
 *   GET  /api/v1/subscriptions/me            → current user's subscription
 *   POST /api/v1/subscriptions/subscribe     → subscribe to a plan
 *   POST /api/v1/subscriptions/{id}/cancel   → cancel subscription
 *   GET  /api/v1/analytics/quota/me          → quota / usage for billing display
 *   GET  /api/v1/subscriptions/addons        → list add-on packages
 *   POST /api/v1/subscriptions/addons/purchase → purchase add-on
 *
 * NOTE: Payment method CRUD (Stripe-managed) is not yet implemented on the
 * backend. Those functions fall back gracefully.
 */
import api from './api';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

/* ══════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════ */

export interface PaymentMethod {
    id: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
}

export interface SubscriptionPlanDisplay {
    key: string;
    name: string;
    price: number;
    creditBudget: string;
    features: { text: string; included: boolean }[];
}

// ── Backend shapes ────────────────────────────────────────────────────────────

interface BPlan {
    plan_id: string;
    plan_key: string;
    name: string;
    monthly_price: number;
    features: string[] | null;
    excluded_features: string[] | null;
}

interface BSub {
    subscription_id: string;
    plan_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    billing_cycle: string;
    cancelled_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/subscriptions/plans */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanDisplay[]> {
    try {
        const { data } = await api.get<BPlan[]>('/subscriptions/plans');
        if (data.length === 0) return _fallbackPlans();
        return data.map((p) => {
            const key  = p.plan_key.toUpperCase() as 'FREE' | 'PRO' | 'MAX';
            const cons = SUBSCRIPTION_PLANS[key] ?? SUBSCRIPTION_PLANS.FREE;
            return {
                key:          p.plan_key,
                name:         p.name,
                price:        p.monthly_price,
                creditBudget: cons.creditBudget ?? `$${p.monthly_price}/mo`,
                features: [
                    ...(p.features ?? []).map((t) => ({ text: t, included: true })),
                    ...(p.excluded_features ?? []).map((t) => ({ text: t, included: false })),
                ],
            };
        });
    } catch {
        return _fallbackPlans();
    }
}

/** GET /api/v1/subscriptions/me */
export async function getCurrentSubscription(): Promise<BSub | null> {
    try {
        const { data } = await api.get<BSub | null>('/subscriptions/me');
        return data;
    } catch {
        return null;
    }
}

/** POST /api/v1/subscriptions/subscribe */
export async function upgradePlan(planKey: string): Promise<{ success: boolean }> {
    await api.post('/subscriptions/subscribe', {
        plan_key:      planKey.toLowerCase(),
        billing_cycle: 'MONTHLY',
    });
    return { success: true };
}

/** POST /api/v1/subscriptions/{id}/cancel */
export async function downgradePlan(planKey: string): Promise<{ success: boolean }> {
    // Get current subscription first
    const sub = await getCurrentSubscription();
    if (!sub) throw new Error('No active subscription to cancel');
    await api.post(`/subscriptions/${sub.subscription_id}/cancel`, {
        reason: `Downgrading to ${planKey}`,
    });
    return { success: true };
}

// ── Payment Methods (Stripe — not yet implemented on backend) ─────────────────

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    // TODO: wire to Stripe payment method API when Module P (payments) is complete
    return [];
}

export async function addPaymentMethod(
    last4: string,
    brand = 'Visa'
): Promise<PaymentMethod> {
    // TODO: create Stripe SetupIntent and confirm
    return {
        id:          `card-${Date.now()}`,
        last4,
        brand,
        expiryMonth: 12,
        expiryYear:  2029,
        isDefault:   true,
    };
}

export async function deletePaymentMethod(
    _id: string
): Promise<{ success: boolean }> {
    // TODO: detach Stripe payment method
    return { success: true };
}

// ── Fallback plans (when no plans seeded in DB) ───────────────────────────────

function _fallbackPlans(): SubscriptionPlanDisplay[] {
    return [
        {
            key: 'FREE', name: SUBSCRIPTION_PLANS.FREE.name,
            price: SUBSCRIPTION_PLANS.FREE.price,
            creditBudget: SUBSCRIPTION_PLANS.FREE.creditBudget,
            features: [
                { text: '$0.50 monthly credit budget', included: true },
                { text: 'Basic entity anonymization', included: true },
                { text: 'GPT-4o-mini & Gemini Flash only', included: true },
                { text: '3 chat sessions/day', included: true },
                { text: 'File uploads', included: false },
                { text: 'Context-aware anonymization', included: false },
                { text: 'KB/RAG context', included: false },
                { text: 'Speech-to-text', included: false },
                { text: 'Chat history (7 days)', included: true },
            ],
        },
        {
            key: 'PRO', name: SUBSCRIPTION_PLANS.PRO.name,
            price: SUBSCRIPTION_PLANS.PRO.price,
            creditBudget: SUBSCRIPTION_PLANS.PRO.creditBudget,
            features: [
                { text: '$25.00 monthly credit budget', included: true },
                { text: 'Per-word billing — pay for what you use', included: true },
                { text: 'Full context-aware anonymization', included: true },
                { text: 'All AI models', included: true },
                { text: 'File uploads & KB/RAG context', included: true },
                { text: 'Speech-to-text input', included: true },
                { text: '90-day chat history', included: true },
            ],
        },
        {
            key: 'MAX', name: SUBSCRIPTION_PLANS.MAX.name,
            price: SUBSCRIPTION_PLANS.MAX.price,
            creditBudget: SUBSCRIPTION_PLANS.MAX.creditBudget,
            features: [
                { text: '$80.00 monthly credit budget', included: true },
                { text: 'Everything in Pro', included: true },
                { text: 'Extended context window', included: true },
                { text: 'API access', included: true },
                { text: 'Higher chat history limit', included: true },
                { text: 'Early access to new features', included: true },
                { text: 'Dedicated support', included: true },
            ],
        },
    ];
}
