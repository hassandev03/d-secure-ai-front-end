import type { LLMModel, ModelOption } from '@/types/chat.types';

export const APP_NAME = 'D-SecureAI';
export const APP_TAGLINE = 'Secure AI. Seamlessly.';

export const MODELS: ModelOption[] = [
    { id: 'gpt-5-1', name: 'GPT-5.1', provider: 'openai', providerName: 'OpenAI', isAvailable: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', providerName: 'OpenAI', isAvailable: true },
    { id: 'claude-4-6-sonnet', name: 'Claude 4.6 Sonnet', provider: 'anthropic', providerName: 'Anthropic', isAvailable: true },
    { id: 'claude-4-5-haiku', name: 'Claude 4.5 Haiku', provider: 'anthropic', providerName: 'Anthropic', isAvailable: true },
    { id: 'claude-4-6-opus', name: 'Claude 4.6 Opus', provider: 'anthropic', providerName: 'Anthropic', isAvailable: true },
    { id: 'gemini-3-1-pro', name: 'Gemini 3.1 Pro', provider: 'google', providerName: 'Google', isAvailable: true },
    { id: 'gemini-3-1-flash', name: 'Gemini 3.1 Flash', provider: 'google', providerName: 'Google', isAvailable: true },
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
            'GPT-4o-mini & Gemini Flash only',
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

export const DEFAULT_MODEL: LLMModel = 'claude-4-6-sonnet';
