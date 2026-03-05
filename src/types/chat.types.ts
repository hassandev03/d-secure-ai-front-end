export type LLMProvider = 'openai' | 'anthropic' | 'google';
export type LLMModel =
    | 'gpt-5-1'
    | 'gpt-4o'
    | 'claude-4-6-sonnet'
    | 'claude-4-5-haiku'
    | 'claude-4-6-opus'
    | 'gemini-3-1-pro'
    | 'gemini-3-1-flash';

export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    model: LLMModel;
    provider: LLMProvider;
    createdAt: string;
    lastMessageAt: string;
    messageCount: number;
}

export interface Message {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    anonymizedContent?: string;
    detectedEntities?: AnonymizedEntity[];
    createdAt: string;
}

export interface AnonymizedEntity {
    original: string;
    replacement: string;
    type: 'PERSON' | 'ORG' | 'EMAIL' | 'PHONE' | 'LOCATION' | 'PROJECT' | 'CUSTOM';
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
