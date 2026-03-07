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
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 15, 33),
        },
    ],
    'sess-4': [
        {
            id: 'msg-4a', sessionId: 'sess-4', role: 'user',
            content: 'I have a slow SQL query joining our users table with orders at Samsung. Can you help optimize it? Our DBA Raj says it times out in production.',
            anonymizedContent: 'I have a slow SQL query joining our users table with orders at [ORG_1]. Can you help optimize it? Our DBA [PERSON_1] says it times out in production.',
            entities: [
                { original: 'Samsung', replacement: '[ORG_1]', type: 'ORG' },
                { original: 'Raj', replacement: '[PERSON_1]', type: 'PERSON' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 15),
        },
        {
            id: 'msg-4b', sessionId: 'sess-4', role: 'assistant',
            content: "Here are several optimization strategies for your slow JOIN query:\n\n**1. Add Proper Indexes**\n```sql\nCREATE INDEX idx_orders_user_id ON orders(user_id);\nCREATE INDEX idx_orders_created_at ON orders(created_at);\n```\n\n**2. Use EXPLAIN ANALYZE**\nRun `EXPLAIN ANALYZE` on the query to identify the bottleneck — likely a sequential scan on the orders table.\n\n**3. Consider Partitioning**\nIf your orders table has millions of rows, partition by date range (monthly or quarterly).\n\n**4. Limit the Result Set**\nAdd `WHERE` clauses to filter date ranges and use `LIMIT` with pagination instead of loading all results.\n\nWould you like me to review the actual query for specific recommendations?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 18),
        },
        {
            id: 'msg-4c', sessionId: 'sess-4', role: 'user',
            content: 'Yes, the query is: SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id WHERE o.total > 100 ORDER BY o.created_at DESC;',
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 20),
        },
        {
            id: 'msg-4d', sessionId: 'sess-4', role: 'assistant',
            content: "Here's the optimized version:\n\n```sql\nSELECT u.id, u.name, u.email, o.id AS order_id, o.total, o.created_at\nFROM orders o\nINNER JOIN users u ON u.id = o.user_id\nWHERE o.total > 100\nORDER BY o.created_at DESC\nLIMIT 50 OFFSET 0;\n```\n\n**Changes made:**\n1. **Select specific columns** instead of `*` — reduces I/O and memory\n2. **Lead with the filtered table** (`orders`) so the optimizer filters first\n3. **Added pagination** with `LIMIT`/`OFFSET`\n4. **Create a composite index**: `CREATE INDEX idx_orders_total_created ON orders(total, created_at DESC);`\n\nThis should reduce query time from seconds to milliseconds.",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 22),
        },
    ],
    'sess-5': [
        {
            id: 'msg-5a', sessionId: 'sess-5', role: 'user',
            content: 'Help me draft a technical blog post about implementing privacy-preserving machine learning pipelines for our engineering blog at Google.',
            anonymizedContent: 'Help me draft a technical blog post about implementing privacy-preserving machine learning pipelines for our engineering blog at [ORG_1].',
            entities: [
                { original: 'Google', replacement: '[ORG_1]', type: 'ORG' },
            ],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 13, 50),
        },
        {
            id: 'msg-5b', sessionId: 'sess-5', role: 'assistant',
            content: "Here's a draft outline and introduction for your technical blog post:\n\n# Privacy-Preserving ML Pipelines: A Practical Guide\n\n## Introduction\nAs organizations scale their machine learning capabilities, protecting user privacy becomes paramount. This post explores practical techniques for building ML pipelines that deliver powerful insights while ensuring sensitive data remains protected.\n\n## Outline\n\n**1. The Privacy Challenge in ML**\n- Data collection vs. user privacy\n- Regulatory landscape (GDPR, CCPA)\n\n**2. Techniques Deep-Dive**\n- Differential Privacy\n- Federated Learning\n- Homomorphic Encryption\n- Data Anonymization & Synthetic Data\n\n**3. Implementation Architecture**\n- Pipeline design patterns\n- Privacy budgets and accounting\n- Monitoring and auditing\n\n**4. Benchmarks & Trade-offs**\n- Accuracy vs. privacy guarantees\n- Performance overhead\n\nWant me to expand any section into full paragraphs?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 13, 54),
        },
    ],
    'sess-6': [
        {
            id: 'msg-6a', sessionId: 'sess-6', role: 'user',
            content: 'Review this REST API design for Project Phoenix. Lisa from the backend team says the endpoints don\'t follow our conventions. The API gateway is at gateway.acme.com.',
            anonymizedContent: 'Review this REST API design for [PROJECT_1]. [PERSON_1] from the backend team says the endpoints don\'t follow our conventions. The API gateway is at [PROJECT_2].',
            entities: [
                { original: 'Project Phoenix', replacement: '[PROJECT_1]', type: 'PROJECT' },
                { original: 'Lisa', replacement: '[PERSON_1]', type: 'PERSON' },
                { original: 'gateway.acme.com', replacement: '[PROJECT_2]', type: 'PROJECT' },
            ],
            files: ['API_Spec_v2.pdf'],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 20),
        },
        {
            id: 'msg-6b', sessionId: 'sess-6', role: 'assistant',
            content: "I've reviewed the API specification and found several design issues:\n\n**Naming Convention Issues:**\n1. ❌ `POST /createUser` → ✅ `POST /users`\n2. ❌ `GET /getUserById/:id` → ✅ `GET /users/:id`\n3. ❌ `PUT /updateOrder` → ✅ `PUT /orders/:id`\n\n**Structural Improvements:**\n- Use plural nouns for collections (`/users`, `/orders`, `/products`)\n- Nest sub-resources logically: `GET /users/:id/orders`\n- Use query params for filtering: `GET /orders?status=pending&page=1`\n- Version your API: `/api/v1/users` or via `Accept` header\n\n**Missing Best Practices:**\n- No pagination metadata in list responses\n- No rate limiting headers (`X-RateLimit-*`)\n- Error responses should use a consistent format with `code`, `message`, and `details`\n\nWant me to generate a complete OpenAPI/Swagger spec following these conventions?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 25),
        },
    ],
    'sess-7': [
        {
            id: 'msg-7a', sessionId: 'sess-7', role: 'user',
            content: 'We had 15 bugs reported this week. Help me triage them by severity and suggest assignment priorities for our team.',
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5, 8, 55),
        },
        {
            id: 'msg-7b', sessionId: 'sess-7', role: 'assistant',
            content: "Here's a triage framework for your 15 bugs:\n\n**🔴 Critical (Fix immediately — P0)**\n- Security vulnerabilities, data loss, or complete feature breakage\n- Assign to senior engineers, target same-day fix\n\n**🟠 High (Fix this sprint — P1)**\n- Major functionality broken but workaround exists\n- Assign to mid-level engineers, 2-day target\n\n**🟡 Medium (Schedule for next sprint — P2)**\n- UI glitches, performance issues, edge cases\n- Can be bundled into a cleanup sprint\n\n**🟢 Low (Backlog — P3)**\n- Cosmetic issues, minor UX improvements\n- Address when capacity allows\n\n**Suggested Process:**\n1. Categorize each bug by impact (users affected × severity)\n2. Check for duplicate reports\n3. Assign based on domain expertise\n4. Set SLA expectations per severity level\n\nShare the bug list and I'll categorize each one for you.",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5, 9, 0),
        },
    ],
    'sess-8': [
        {
            id: 'msg-8a', sessionId: 'sess-8', role: 'user',
            content: 'Draft a non-disclosure agreement for our new partnership between Acme Corporation and Microsoft. Carlos from legal in Dubai needs it by Friday.',
            anonymizedContent: 'Draft a non-disclosure agreement for our new partnership between [ORG_1] and [ORG_2]. [PERSON_1] from legal in [LOCATION_1] needs it by Friday.',
            entities: [
                { original: 'Acme Corporation', replacement: '[ORG_1]', type: 'ORG' },
                { original: 'Microsoft', replacement: '[ORG_2]', type: 'ORG' },
                { original: 'Carlos', replacement: '[PERSON_1]', type: 'PERSON' },
                { original: 'Dubai', replacement: '[LOCATION_1]', type: 'LOCATION' },
            ],
            files: ['Partnership_Terms.pdf'],
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 13, 10),
        },
        {
            id: 'msg-8b', sessionId: 'sess-8', role: 'assistant',
            content: "Here's a draft Mutual Non-Disclosure Agreement:\n\n# MUTUAL NON-DISCLOSURE AGREEMENT\n\n**Effective Date:** [Date]\n\n## 1. Definition of Confidential Information\nAll non-public information disclosed by either party, including but not limited to: trade secrets, business plans, financial data, technical specifications, customer lists, and product roadmaps.\n\n## 2. Obligations\nThe Receiving Party shall:\n- Maintain confidentiality using the same degree of care as its own confidential information\n- Not disclose to third parties without prior written consent\n- Use information solely for evaluating the potential business relationship\n\n## 3. Exclusions\nThis agreement does not apply to information that is:\n- Publicly available through no fault of the Receiving Party\n- Already known prior to disclosure\n- Independently developed without reference to Confidential Information\n\n## 4. Term\nThis agreement shall remain in effect for **two (2) years** from the Effective Date. Obligations of confidentiality survive for **three (3) years** after termination.\n\n## 5. Governing Law\nThis agreement shall be governed by the laws of the jurisdiction agreed upon by both parties.\n\nShall I add specific clauses for intellectual property, data protection (GDPR), or dispute resolution?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 13, 16),
        },
        {
            id: 'msg-8c', sessionId: 'sess-8', role: 'user',
            content: 'Yes, please add GDPR and IP clauses.',
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 13, 20),
        },
        {
            id: 'msg-8d', sessionId: 'sess-8', role: 'assistant',
            content: "Here are the additional clauses:\n\n## 6. Data Protection (GDPR Compliance)\n\n6.1 Both parties acknowledge their obligations under the General Data Protection Regulation (EU) 2016/679.\n\n6.2 Personal data shared under this agreement shall be processed in accordance with applicable data protection laws. Each party shall:\n- Process personal data only as necessary for the purposes of this agreement\n- Implement appropriate technical and organizational security measures\n- Notify the other party of any data breach within 72 hours\n- Conduct Data Protection Impact Assessments where required\n\n6.3 Cross-border transfers of personal data shall comply with GDPR Chapter V requirements, utilizing Standard Contractual Clauses where necessary.\n\n## 7. Intellectual Property\n\n7.1 No license, ownership, or other rights to intellectual property are granted under this agreement.\n\n7.2 All inventions, improvements, or derivative works created by the Receiving Party using Confidential Information shall be the sole property of the Disclosing Party.\n\n7.3 Each party retains all rights to its pre-existing intellectual property.\n\nI recommend having your legal team review these clauses before execution. Would you like me to compile the full document?",
            createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, 13, 25),
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
