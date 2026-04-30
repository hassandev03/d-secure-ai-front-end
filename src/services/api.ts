/**
 * api.ts — Axios instance with auth + error + retry interceptors
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000, // 60s — LLM calls can take a while
    headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
    },
});

// ── Request interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token =
            typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors ──────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status as number | undefined;

        // Skip redirect for silent rehydration calls (e.g. GET /users/me on page refresh).
        // Those callers set X-Skip-Auth-Redirect so a stale/missing token doesn't
        // boot the user before the store has a chance to rehydrate.
        const skipRedirect = error.config?.headers?.['X-Skip-Auth-Redirect'] === 'true';

        if (status === 401 && !skipRedirect) {
            // Token expired or invalid — clear local auth state and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/';
            }
        }

        // 429 and 403 are handled per-call by the service layer (chat.service.ts)
        // — do NOT redirect here; the UI shows a quota/policy banner instead.

        return Promise.reject(error);
    }
);

// ── Retry interceptor: transient 5xx failures ─────────────────────────────
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;

api.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    const status = error.response?.status as number | undefined;

    // Only retry GET/HEAD requests with transient server errors
    if (
        config &&
        status &&
        RETRYABLE_STATUS.has(status) &&
        ['get', 'head'].includes((config.method ?? '').toLowerCase()) &&
        (config.__retryCount ?? 0) < MAX_RETRIES
    ) {
        config.__retryCount = (config.__retryCount ?? 0) + 1;
        const delay = Math.pow(2, config.__retryCount - 1) * 1000; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        return api.request(config);
    }

    return Promise.reject(error);
});

/** Simulate network delay (used only in tests / storybook, never in production) */
export function delay(ms: number = 400): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default api;

