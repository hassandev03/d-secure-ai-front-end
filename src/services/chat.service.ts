/**
 * chat.service.ts — Real backend integration
 *
 * Maps to FastAPI routes (prefix: /api/v1/chat):
 *   GET  /sessions                   → list chat sessions
 *   GET  /sessions/:id               → single session
 *   GET  /sessions/:id/messages      → session messages
 *   DELETE /sessions/:id             → delete session
 *   PATCH  /sessions/:id             → rename session
 *   POST /message                    → send message (full pipeline)
 *
 * Maps to FastAPI routes (prefix: /api/v1/analytics):
 *   GET  /quota/me                   → current user quota status
 */

import api from './api';
import type { LLMModel, LLMProvider, ChatSession, Message, AnonymizedEntity } from '@/types/chat.types';

/* ══════════════════════════════════════════════════════
   Backwards-compatible aliases
   ══════════════════════════════════════════════════════ */
export type ChatSessionSummary = ChatSession;
export type ChatMessage = Message;
export type { AnonymizedEntity };

// ---------------------------------------------------------------------------
// Backend → Frontend mappers
// ---------------------------------------------------------------------------

/**
 * Backend ChatSessionRead shape (snake_case from FastAPI)
 */
interface BackendSession {
    session_id: string;
    user_id: string;
    title: string | null;
    llm_provider: string;
    llm_model: string;
    message_count: number;
    has_file_uploads: boolean;
    created_at: string;
    last_message_at: string;
}

/**
 * Backend ChatMessageRead shape
 */
interface BackendMessage {
    message_id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    anonymized_content: string | null;
    entities_detected: number;
    created_at: string;
    // message_metadata carries entity_types, vault etc. (present on detailed read)
    message_metadata?: {
        entity_types?: string[];
        vault?: Record<string, string>;
    } | null;
}

/**
 * Backend ChatResponse (POST /chat/message)
 */
interface BackendChatResponse {
    session_id: string;
    message_id: string;
    content: string;
    anonymized_prompt: string | null;
    pii: {
        entities_count: number;
        entity_types: string[];
    };
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost_usd: number;
    created_at: string;
}

/**
 * Quota status response from GET /analytics/quota/me
 */
export interface QuotaStatus {
    plan_name: string;
    monthly_limit: number;
    requests_used: number;
    requests_remaining: number;
    percentage_used: number;
    period_ends_at: string;
    cost_this_period: number;
}

// Provider display names map
const PROVIDER_DISPLAY: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
};

// Model display names map (extend as needed)
const MODEL_DISPLAY: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o mini',
    'gpt-5-1': 'GPT-5.1',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'gemini-1-5-pro-latest': 'Gemini 1.5 Pro',
    'gemini-1-5-flash-latest': 'Gemini 1.5 Flash',
    // Frontend UI model IDs (used in session creation)
    'claude-4-6-sonnet': 'Claude 4.6 Sonnet',
    'claude-4-5-haiku': 'Claude 4.5 Haiku',
    'claude-4-6-opus': 'Claude 4.6 Opus',
    'gemini-3-1-pro': 'Gemini 3.1 Pro',
    'gemini-3-1-flash': 'Gemini 3.1 Flash',
};

function mapSession(b: BackendSession): ChatSession {
    const model = b.llm_model as LLMModel;
    const provider = b.llm_provider as LLMProvider;
    return {
        id: b.session_id,
        userId: b.user_id,
        title: b.title ?? 'Untitled Chat',
        model,
        modelName: MODEL_DISPLAY[model] ?? model,
        provider,
        providerName: PROVIDER_DISPLAY[provider] ?? provider,
        messageCount: b.message_count,
        createdAt: b.created_at.split('T')[0],
        lastMessageAt: new Date(b.last_message_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        }),
        hasFileUploads: b.has_file_uploads,
    };
}

function mapMessage(b: BackendMessage): Message {
    // Build entity list from metadata vault: {fake_val → orig_val}
    const entities: AnonymizedEntity[] = [];
    const vault = b.message_metadata?.vault ?? {};
    const entityTypes = b.message_metadata?.entity_types ?? [];

    // Each vault entry is fake_val → original_val
    Object.entries(vault).forEach(([fake, original], i) => {
        entities.push({
            replacement: fake,
            original,
            type: (entityTypes[i] as AnonymizedEntity['type']) ?? 'CUSTOM',
        });
    });

    return {
        id: b.message_id,
        sessionId: b.session_id,
        role: b.role === 'system' ? 'assistant' : b.role,
        content: b.content,
        anonymizedContent: b.anonymized_content ?? undefined,
        entities: entities.length > 0 ? entities : undefined,
        createdAt: b.created_at,
    };
}

// ---------------------------------------------------------------------------
// Custom error class for quota exhaustion
// ---------------------------------------------------------------------------

export class QuotaExceededError extends Error {
    constructor(public detail: string) {
        super(detail);
        this.name = 'QuotaExceededError';
    }
}

export class SubscriptionRequiredError extends Error {
    constructor(public detail: string) {
        super(detail);
        this.name = 'SubscriptionRequiredError';
    }
}

export class PolicyViolationError extends Error {
    constructor(public detail: string) {
        super(detail);
        this.name = 'PolicyViolationError';
    }
}

/** Extract a meaningful error from an axios error */
function extractApiError(err: unknown): never {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    const status = e?.response?.status as number | undefined;
    const detail: string =
        e?.response?.data?.detail ?? e?.message ?? 'An unexpected error occurred.';

    if (status === 429) throw new QuotaExceededError(detail);
    if (status === 403) {
        if (detail.toLowerCase().includes('subscription')) {
            throw new SubscriptionRequiredError(detail);
        }
        throw new PolicyViolationError(detail);
    }
    throw new Error(detail);
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/** GET /api/v1/analytics/quota/me — fetch current quota status */
export async function getQuotaStatus(): Promise<QuotaStatus | null> {
    try {
        const { data } = await api.get<QuotaStatus>('/analytics/quota/me');
        return data;
    } catch {
        return null;
    }
}

/** GET /api/v1/chat/sessions */
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
    try {
        const { data } = await api.get<BackendSession[]>('/chat/sessions');
        return data.map(mapSession);
    } catch {
        return [];
    }
}

/** GET /api/v1/chat/sessions/:id */
export async function getChatSession(
    sessionId: string
): Promise<ChatSessionSummary | null> {
    try {
        const { data } = await api.get<BackendSession>(`/chat/sessions/${sessionId}`);
        return mapSession(data);
    } catch {
        return null;
    }
}

/** GET /api/v1/chat/sessions/:id/messages */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
        const { data } = await api.get<BackendMessage[]>(
            `/chat/sessions/${sessionId}/messages`
        );
        return data.map(mapMessage);
    } catch {
        return [];
    }
}

/** DELETE /api/v1/chat/sessions/:id */
export async function deleteChatSession(
    sessionId: string
): Promise<{ success: boolean }> {
    await api.delete(`/chat/sessions/${sessionId}`);
    return { success: true };
}

/** PATCH /api/v1/chat/sessions/:id — rename */
export async function renameChatSession(
    sessionId: string,
    title: string
): Promise<ChatSession> {
    const { data } = await api.patch<BackendSession>(`/chat/sessions/${sessionId}`, { title });
    return mapSession(data);
}

/**
 * POST /api/v1/chat/message
 *
 * Sends a message through the full D-SecureAI pipeline:
 *   anonymization → LLM → de-anonymization → persistence → quota deduction
 *
 * Returns both the stored user message and the AI response so the caller
 * can replace the optimistic message with the real persisted ones.
 *
 * Throws:
 *   QuotaExceededError          — HTTP 429 (credit budget exhausted)
 *   SubscriptionRequiredError   — HTTP 403 (no active subscription)
 *   PolicyViolationError        — HTTP 403 (model/feature blocked by policy)
 *   Error                       — any other failure
 *
 * IMPORTANT: The caller must NOT render any optimistic message until this
 * resolves. On error the caller should discard the optimistic message entirely
 * so the user never sees a partial answer.
 */
export async function sendMessage(
    sessionId: string | null,
    content: string,
    llmModel?: string,
    fileIds?: string[]
): Promise<{ userMessage: Message; assistantMessage: Message }> {
    let response: BackendChatResponse;

    try {
        const body: Record<string, unknown> = {
            message: content,
            ...(sessionId && sessionId !== 'new' ? { session_id: sessionId } : {}),
            ...(llmModel ? { llm_model: llmModel } : {}),
            ...(fileIds && fileIds.length > 0 ? { file_ids: fileIds } : {}),
        };

        const { data } = await api.post<BackendChatResponse>('/chat/message', body);
        response = data;
    } catch (err) {
        extractApiError(err);
    }

    const now = new Date().toISOString();

    const userMessage: Message = {
        id: `user-${Date.now()}`,
        sessionId: response!.session_id,
        role: 'user',
        content,
        anonymizedContent: response!.anonymized_prompt ?? undefined,
        // Build entities from PII info (entity_types only — vault not returned here)
        entities:
            response!.pii.entities_count > 0
                ? response!.pii.entity_types.map((t) => ({
                      replacement: `[${t}]`,
                      original: '(anonymized)',
                      type: t as AnonymizedEntity['type'],
                  }))
                : undefined,
        createdAt: now,
    };

    const assistantMessage: Message = {
        id: response!.message_id,
        sessionId: response!.session_id,
        role: 'assistant',
        content: response!.content,
        createdAt: response!.created_at,
    };

    return { userMessage, assistantMessage };
}
