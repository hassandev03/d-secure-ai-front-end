export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'azure';

export type LLMModel =
    // Azure OpenAI deployments
    | 'gpt-4.1'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    // Anthropic Claude (4.x family)
    | 'claude-opus-4-5'
    | 'claude-sonnet-4-5'
    | 'claude-haiku-4-5'
    // Anthropic Claude (3.x — kept for backward compat with stored sessions)
    | 'claude-3-5-sonnet-20241022'
    | 'claude-3-5-haiku-20241022'
    | 'claude-3-opus-20240229'
    | 'claude-3-haiku-20240307'
    // Google Gemini
    | 'gemini-2.0-flash'
    | 'gemini-1.5-pro'
    | 'gemini-1.5-flash'
    | 'gemini-2.5-pro-preview-05-06';

/**
 * Canonical Chat Session shape — mirrors backend GET /api/v1/chat/sessions/:id
 * modelName and providerName are display strings that the backend should include.
 */
export interface ChatSession {
    id: string;
    userId?: string;          // optional: not always returned on list endpoints
    title: string;
    model: LLMModel;
    modelName: string;        // display name, e.g. "GPT-4.1"
    provider: LLMProvider;
    providerName: string;     // display name, e.g. "Azure OpenAI"
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
