export type LLMProvider = 'openai' | 'anthropic' | 'google';
export type LLMModel =
    | 'gpt-5-1'
    | 'gpt-4o'
    | 'claude-4-6-sonnet'
    | 'claude-4-5-haiku'
    | 'claude-4-6-opus'
    | 'gemini-3-1-pro'
    | 'gemini-3-1-flash';

/**
 * Canonical Chat Session shape — mirrors backend GET /api/v1/chat/sessions/:id
 * modelName and providerName are display strings that the backend should include.
 */
export interface ChatSession {
    id: string;
    userId?: string;          // optional: not always returned on list endpoints
    title: string;
    model: LLMModel;
    modelName: string;        // display name, e.g. "Claude 4.6 Sonnet"
    provider: LLMProvider;
    providerName: string;     // display name, e.g. "Anthropic"
    messageCount: number;
    createdAt: string;        // ISO date
    lastMessageAt: string;    // ISO date or display label
    hasFileUploads?: boolean;
}

export interface AnonymizedEntity {
    original: string;
    replacement: string;
    type: 'PERSON' | 'ORG' | 'EMAIL' | 'PHONE' | 'LOCATION' | 'PROJECT' | 'CUSTOM';
}

/**
 * Canonical Message shape — mirrors backend GET /api/v1/chat/sessions/:id/messages
 * createdAt accepts both ISO string (from backend) and Date object (from local state).
 */
export interface Message {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    anonymizedContent?: string;
    /** Entities detected and anonymized in this message (populated by the anonymization engine). */
    entities?: AnonymizedEntity[];
    files?: string[];
    createdAt: string | Date;  // ISO string from backend; Date when created locally
}

export interface ModelOption {
    id: LLMModel;
    name: string;
    provider: LLMProvider;
    providerName: string;
    isAvailable: boolean;
    isLocked?: boolean;
    lockReason?: string;
}
