/**
 * chat.helpers.ts — Shared display maps for chat sessions.
 *
 * Previously PROVIDER_DISPLAY, MODEL_DISPLAY, and mapSession were duplicated
 * between chat.service.ts and dashboard.service.ts. The dashboard copy had
 * drifted to only 5 model entries while chat.service had 13, creating a
 * divergence bug (models added in one place wouldn't appear in the other).
 *
 * Both services now import from here so there is a single source of truth.
 */

export const PROVIDER_DISPLAY: Record<string, string> = {
    openai:    'OpenAI',
    anthropic: 'Anthropic',
    google:    'Google',
    azure:     'OpenAI',   // Azure OpenAI serves GPT models — show as OpenAI to users
};

/** Canonical model → human-readable name map. Add new models here only. */
export const MODEL_DISPLAY: Record<string, string> = {
    // Azure OpenAI
    'gpt-4.1':                    'GPT-4.1',
    // Anthropic Claude 4.x
    'claude-opus-4-5':            'Claude Opus',
    'claude-sonnet-4-5':          'Claude Sonnet',
    'claude-haiku-4-5':           'Claude Haiku',
    // Google Gemini
    'gemini-3-flash-preview':        'Gemini 3 Flash',
    'gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite',
    'gemini-3.1-flash-preview':      'Gemini 3.1 Flash',
    'gemini-2.5-flash-lite':         'Gemini 2.5 Flash Lite',
    'gemini-2.5-flash':              'Gemini 2.5 Flash',
};
