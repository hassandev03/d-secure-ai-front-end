import { delay } from './api';
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
    creditBudget: string;   // e.g. "$25.00/mo" — replaces quotaTotal
    features: { text: string; included: boolean }[];
}

/* ══════════════════════════════════════════════════════
   Mock Data
   ══════════════════════════════════════════════════════ */

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'card-1', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2028, isDefault: true },
];

/* ══════════════════════════════════════════════════════
   Service Functions
   ══════════════════════════════════════════════════════ */

/** GET /api/v1/subscription/plans */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanDisplay[]> {
    await delay(200);

    return [
        {
            key: 'FREE', name: SUBSCRIPTION_PLANS.FREE.name, price: SUBSCRIPTION_PLANS.FREE.price,
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
            key: 'PRO', name: SUBSCRIPTION_PLANS.PRO.name, price: SUBSCRIPTION_PLANS.PRO.price,
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
            key: 'MAX', name: SUBSCRIPTION_PLANS.MAX.name, price: SUBSCRIPTION_PLANS.MAX.price,
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

/** GET /api/v1/billing/payment-methods */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    await delay(200);
    return [...MOCK_PAYMENT_METHODS];
}

/** POST /api/v1/billing/payment-methods */
export async function addPaymentMethod(last4: string, brand: string = 'Mastercard'): Promise<PaymentMethod> {
    await delay(400);
    return { id: `card-${Date.now()}`, last4, brand, expiryMonth: 12, expiryYear: 2029, isDefault: true };
}

/** DELETE /api/v1/billing/payment-methods/:id */
export async function deletePaymentMethod(_id: string): Promise<{ success: boolean }> {
    await delay(300);
    return { success: true };
}

/** POST /api/v1/subscription/upgrade */
export async function upgradePlan(_planKey: string): Promise<{ success: boolean }> {
    await delay(1500);
    return { success: true };
}

/** POST /api/v1/subscription/downgrade */
export async function downgradePlan(_planKey: string): Promise<{ success: boolean }> {
    await delay(800);
    return { success: true };
}
