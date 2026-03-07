import { delay } from './api';
import type { LLMModel, LLMProvider } from '@/types/chat.types';

/* ══════════════════════════════════════════════════════
   Types — mirrors backend response shapes
   ══════════════════════════════════════════════════════ */

export interface ChatSessionSummary {
    id: string;
    title: string;
    model: LLMModel;
    modelName: string;
    provider: LLMProvider;
    providerName: string;
    messageCount: number;
    createdAt: string;     // ISO date
    lastMessageAt: string; // ISO date/time display string
    hasFileUploads: boolean;
}

export interface AnonymizedEntity {
    original: string;
    replacement: string;
    type: 'PERSON' | 'ORG' | 'EMAIL' | 'PHONE' | 'LOCATION' | 'PROJECT' | 'CUSTOM';
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    anonymizedContent?: string;
    entities?: AnonymizedEntity[];
    files?: string[];
    createdAt: Date;
}

/* ══════════════════════════════════════════════════════
   Mock Data — single source of truth
   ══════════════════════════════════════════════════════ */

const today = new Date();
const d = (daysAgo: number): string => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - daysAgo);
    return dt.toISOString().split('T')[0];
};

export const MOCK_SESSIONS: ChatSessionSummary[] = [
    { id: 'sess-1', title: 'GDPR Compliance Query', model: 'claude-4-6-sonnet', modelName: 'Claude 4.6 Sonnet', provider: 'anthropic', providerName: 'Anthropic', messageCount: 12, createdAt: d(0), lastMessageAt: '10:30 AM', hasFileUploads: true },
    { id: 'sess-2', title: 'Code Review — Auth Module', model: 'gpt-5-1', modelName: 'GPT-5.1', provider: 'openai', providerName: 'OpenAI', messageCount: 8, createdAt: d(0), lastMessageAt: '8:15 AM', hasFileUploads: false },
    { id: 'sess-3', title: 'Market Research Analysis', model: 'gemini-3-1-pro', modelName: 'Gemini 3.1 Pro', provider: 'google', providerName: 'Google', messageCount: 15, createdAt: d(1), lastMessageAt: '3:45 PM', hasFileUploads: true },
    { id: 'sess-4', title: 'SQL Optimization Help', model: 'claude-4-5-haiku', modelName: 'Claude 4.5 Haiku', provider: 'anthropic', providerName: 'Anthropic', messageCount: 6, createdAt: d(1), lastMessageAt: '11:20 AM', hasFileUploads: false },
    { id: 'sess-5', title: 'Technical Writing Draft', model: 'gpt-4o', modelName: 'GPT-4o', provider: 'openai', providerName: 'OpenAI', messageCount: 20, createdAt: d(2), lastMessageAt: '2:00 PM', hasFileUploads: false },
    { id: 'sess-6', title: 'API Design Review', model: 'claude-4-6-sonnet', modelName: 'Claude 4.6 Sonnet', provider: 'anthropic', providerName: 'Anthropic', messageCount: 18, createdAt: d(3), lastMessageAt: '4:30 PM', hasFileUploads: true },
    { id: 'sess-7', title: 'Bug Triage Summary', model: 'gpt-5-1', modelName: 'GPT-5.1', provider: 'openai', providerName: 'OpenAI', messageCount: 10, createdAt: d(5), lastMessageAt: '9:00 AM', hasFileUploads: false },
    { id: 'sess-8', title: 'Legal Document Drafting', model: 'claude-4-6-opus', modelName: 'Claude 4.6 Opus', provider: 'anthropic', providerName: 'Anthropic', messageCount: 25, createdAt: d(10), lastMessageAt: '1:15 PM', hasFileUploads: true },
];

/** Pre-populated chat messages for each session (first 3 sessions have full conversations) */
const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
    'sess-1': [
        {
            id: 'msg-1a', sessionId: 'sess-1', role: 'user',
            content: 'Can you analyze this NDA and flag any GDPR compliance risks? The document is between Acme Corporation and our client Ahmed Khan in Berlin.',
            anonymizedContent: 'Can you analyze this NDA and flag any GDPR compliance risks? The document is between [ORG_1] and our client [PERSON_1] in [LOCATION_1].',
            entities: [
                { original: 'Acme Corporation', replacement: '[ORG_1]', type: 'ORG' },
                { original: 'Ahmed Khan', replacement: '[PERSON_1]', type: 'PERSON' },
                { original: 'Berlin', replacement: '[LOCATION_1]', type: 'LOCATION' },
            ],
            files: ['NDA_Template.pdf'],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 15),
        },
        {
            id: 'msg-1b', sessionId: 'sess-1', role: 'assistant',
            content: "I've reviewed the NDA and identified 3 key GDPR compliance concerns:\n\n**1. Data Retention Clause (Section 4.2)**\nThe current clause specifies indefinite retention of personal data, which violates GDPR Article 5(1)(e). Recommend adding a specific retention period (e.g., 3 years post-contract).\n\n**2. Cross-Border Transfer (Section 7.1)**\nThe agreement doesn't address data transfer mechanisms for processing data outside the EEA. You'll need Standard Contractual Clauses (SCCs) or adequacy decisions.\n\n**3. Data Subject Rights (Missing)**\nNo provisions for data subject access requests (DSARs). GDPR Article 15 requires clear processes for individuals to access their data.\n\nAll personal identifiers in your document were detected and anonymized before processing.",
            entities: [
                { original: 'Acme Corporation', replacement: '[ORG_1]', type: 'ORG' },
                { original: 'Ahmed Khan', replacement: '[PERSON_1]', type: 'PERSON' },
                { original: 'Berlin', replacement: '[LOCATION_1]', type: 'LOCATION' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 17),
        },
        {
            id: 'msg-1c', sessionId: 'sess-1', role: 'user',
            content: 'Great analysis. Can you draft a corrected Section 4.2 with a 3-year retention period?',
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 20),
        },
        {
            id: 'msg-1d', sessionId: 'sess-1', role: 'assistant',
            content: "Here's a GDPR-compliant replacement for Section 4.2:\n\n**Section 4.2 — Data Retention**\n\n*\"The Receiving Party shall retain Confidential Information containing personal data only for the duration necessary to fulfill the purposes outlined in this Agreement, and in no event longer than thirty-six (36) months following the termination or expiration of this Agreement. Upon expiration of the retention period, the Receiving Party shall securely destroy or return all personal data, and provide written certification of such destruction within thirty (30) days.\"*\n\nThis aligns with GDPR Article 5(1)(e) storage limitation principle. Want me to draft the SCCs for Section 7.1 as well?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 22),
        },
    ],
    'sess-2': [
        {
            id: 'msg-2a', sessionId: 'sess-2', role: 'user',
            content: 'Review this authentication module for security vulnerabilities. We\'re using JWT with refresh tokens. The API is at api.acme.com serving our Singapore office.',
            anonymizedContent: 'Review this authentication module for security vulnerabilities. We\'re using JWT with refresh tokens. The API is at [PROJECT_1] serving our [LOCATION_1] office.',
            entities: [
                { original: 'api.acme.com', replacement: '[PROJECT_1]', type: 'PROJECT' },
                { original: 'Singapore', replacement: '[LOCATION_1]', type: 'LOCATION' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 10),
        },
        {
            id: 'msg-2b', sessionId: 'sess-2', role: 'assistant',
            content: "I've analyzed the authentication module. Here are the findings:\n\n**Critical Issues:**\n1. **Token Expiry Too Long** — Access tokens expire in 24 hours. Best practice is 15-30 minutes for access tokens, with refresh tokens handling re-authentication.\n2. **No Token Rotation** — Refresh tokens are not rotated on use, enabling replay attacks if a token is compromised.\n\n**Medium Severity:**\n3. **Missing Rate Limiting** — The `/auth/login` endpoint has no rate limiting, making it vulnerable to brute-force attacks.\n4. **Weak Password Policy** — Minimum 6 characters with no complexity requirements.\n\n**Recommendations:**\n- Implement sliding window rate limiting (5 attempts per 15 minutes)\n- Add refresh token rotation with automatic invalidation of previous tokens\n- Require minimum 12 characters with uppercase, number, and special character",
            entities: [
                { original: 'api.acme.com', replacement: '[PROJECT_1]', type: 'PROJECT' },
                { original: 'Singapore', replacement: '[LOCATION_1]', type: 'LOCATION' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 13),
        },
    ],
    'sess-3': [
        {
            id: 'msg-3a', sessionId: 'sess-3', role: 'user',
            content: 'Analyze the Q4 2025 market research data for Project Falcon. Summarize key findings for Sarah Johnson at the leadership team.',
            anonymizedContent: 'Analyze the Q4 2025 market research data for [PROJECT_1]. Summarize key findings for [PERSON_1] at the leadership team.',
            entities: [
                { original: 'Project Falcon', replacement: '[PROJECT_1]', type: 'PROJECT' },
                { original: 'Sarah Johnson', replacement: '[PERSON_1]', type: 'PERSON' },
            ],
            files: ['Q4_Market_Research.xlsx'],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 15, 30),
        },
        {
            id: 'msg-3b', sessionId: 'sess-3', role: 'assistant',
            content: "Here's the executive summary of the Q4 2025 market research:\n\n**Key Findings:**\n\n📈 **Market Growth**: The privacy-AI segment grew 34% YoY, outpacing the broader AI market (22% YoY).\n\n🏆 **Competitive Position**: Our solution ranks #2 in customer satisfaction among enterprise clients, behind only one competitor in the anonymization accuracy metric.\n\n💰 **Revenue Opportunity**: 67% of surveyed enterprises indicated willingness to pay premium pricing for context-aware anonymization — up from 41% in Q3.\n\n⚠️ **Risks**: Open-source alternatives are improving rapidly. Three new entrants launched in Q4 with basic anonymization features at no cost.\n\n**Recommended Actions:**\n1. Accelerate the context-aware features roadmap\n2. Launch an enterprise pilot program in Q1\n3. Invest in compliance certifications (SOC 2, ISO 27001)\n\nAll project names and personnel were anonymized during processing.",
            entities: [
                { original: 'Project Falcon', replacement: '[PROJECT_1]', type: 'PROJECT' },
                { original: 'Sarah Johnson', replacement: '[PERSON_1]', type: 'PERSON' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 15, 33),
        },
    ],
};

/* ══════════════════════════════════════════════════════
   Service Functions (swap for real API calls later)
   ══════════════════════════════════════════════════════ */

/** GET /api/v1/chat/sessions */
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
    await delay(300);
    return [...MOCK_SESSIONS];
}

/** GET /api/v1/chat/sessions/:id/messages */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    await delay(400);
    return MOCK_MESSAGES[sessionId] || [];
}

/** GET /api/v1/chat/sessions/:id */
export async function getChatSession(sessionId: string): Promise<ChatSessionSummary | null> {
    await delay(200);
    return MOCK_SESSIONS.find(s => s.id === sessionId) || null;
}

/** DELETE /api/v1/chat/sessions/:id */
export async function deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    await delay(300);
    return { success: true };
}

/** POST /api/v1/chat/sessions/:id/messages */
export async function sendMessage(
    _sessionId: string,
    _content: string,
    _files?: File[]
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    await delay(1200);
    // The actual mock creation is handled client-side for now.
    // Backend will return both the stored user message and the AI response.
    throw new Error('Use client-side mock in chat page until backend is ready');
}
