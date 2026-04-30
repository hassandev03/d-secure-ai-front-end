import type { LLMModel, ModelOption } from '@/types/chat.types';

export const APP_NAME = 'D-SecureAI';
export const APP_TAGLINE = 'Secure AI. Seamlessly.';

/**
 * Free-tier model IDs — only Gemini Flash variants.
 * Must stay in sync with backend _FREE_TIER_MODELS in policies/service.py.
 */
export const FREE_MODELS: Set<string> = new Set([
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
]);

/**
 * MODELS catalogue — only models with working API keys are listed.
 *
 * Note: GPT models are served through Azure OpenAI internally, but
 * from the user's perspective they are just "OpenAI" models.
 * The backend `_infer_provider()` handles routing transparently.
 */
export const MODELS: ModelOption[] = [
    // ── Google Gemini (free-tier available) ──────────────────────────────────
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        providerName: 'Google',
        isAvailable: true,
    },
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        provider: 'google',
        providerName: 'Google',
        isAvailable: true,
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google',
        providerName: 'Google',
        isAvailable: true,
    },
    {
        id: 'gemini-3.1-flash-lite-preview',
        name: 'Gemini 3.1 Flash Lite',
        provider: 'google',
        providerName: 'Google',
        isAvailable: true,
    },
    // ── Google Gemini (Pro+ only) ────────────────────────────────────────────
    {
        id: 'gemini-3.1-flash-preview',
        name: 'Gemini 3.1 Flash',
        provider: 'google',
        providerName: 'Google',
        isAvailable: true,
        isLocked: true,
        lockReason: 'Requires Pro plan',
    },
    // ── OpenAI / GPT models (Pro+ only, routed through Azure internally) ────
    {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'openai',
        providerName: 'OpenAI',
        isAvailable: true,
        isLocked: true,
        lockReason: 'Requires Pro plan',
    },
    // ── Anthropic Claude (Pro+ only) ─────────────────────────────────────────
    {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku',
        provider: 'anthropic',
        providerName: 'Anthropic',
        isAvailable: true,
        isLocked: true,
        lockReason: 'Requires Pro plan',
    },
    {
        id: 'claude-sonnet-4-5',
        name: 'Claude Sonnet',
        provider: 'anthropic',
        providerName: 'Anthropic',
        isAvailable: true,
        isLocked: true,
        lockReason: 'Requires Pro plan',
    },
    {
        id: 'claude-opus-4-5',
        name: 'Claude Opus',
        provider: 'anthropic',
        providerName: 'Anthropic',
        isAvailable: true,
        isLocked: true,
        lockReason: 'Requires Pro plan',
    },
];

export const INDUSTRIES = [
    'Healthcare',
    'Finance',
    'Legal',
    'Technology',
    'Education',
    'Government',
    'Manufacturing',
    'Retail',
    'Other',
] as const;

export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: 'Free',
        price: 0,
        annualPrice: 0,
        creditBudget: '$0.50/mo',   // Display label only
        sessionsPerDay: 3,
        features: [
            'Basic entity & rule-based anonymization',
            '$0.50 monthly credit budget',
            '3 chat sessions/day',
            'Standard support',
            '7-day chat history',
            'Gemini Flash models only',
        ],
        excluded: [
            'No file uploads',
            'No context-aware anonymization',
            'No KB/RAG context',
            'No speech-to-text',
        ],
    },
    PRO: {
        name: 'Pro',
        price: 29,
        annualPrice: 290,
        creditBudget: '$25.00/mo',
        sessionsPerDay: -1, // unlimited
        features: [
            '$25.00 monthly credit budget',
            'Per-word billing — pay for what you use',
            'Full context-aware anonymization',
            'Unlimited sessions',
            'All AI models',
            'File uploads + context support',
            'Context-aware anonymization',
            'Speech-to-text input',
            '90-day chat history',
            'Priority support',
        ],
        excluded: [],
    },
    MAX: {
        name: 'Max',
        price: 79,
        annualPrice: 790,
        creditBudget: '$80.00/mo',
        sessionsPerDay: -1,
        features: [
            '$80.00 monthly credit budget',
            'Everything in Pro',
            'Extended context window',
            'API access',
            'Higher chat history limit',
            'Early access to new features',
            'Dedicated support',
        ],
        excluded: [],
    },
} as const;

export const PORTAL_ROUTES = {
    SUPER_ADMIN: { prefix: '/sa', label: 'Super Admin' },
    ORG_ADMIN: { prefix: '/oa', label: 'Organization Admin' },
    DEPT_ADMIN: { prefix: '/da', label: 'Department Admin' },
    USER: { prefix: '', label: 'User' },
} as const;

export const DEFAULT_MODEL: LLMModel = 'gemini-2.5-flash';

