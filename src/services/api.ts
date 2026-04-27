/**
 * api.ts — Axios instance with auth + error interceptors
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000, // 60s — LLM calls can take a while
    headers: {
        'Content-Type': 'application/json',
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

/** Simulate network delay (used only in tests / storybook, never in production) */
export function delay(ms: number = 400): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default api;
