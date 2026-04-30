/**
 * init.service.ts — Dashboard initialisation single-call service
 *
 * Calls GET /api/v1/analytics/dashboard/init to bootstrap the entire layout
 * in one network round-trip instead of fanning out to:
 *   - /users/me
 *   - /subscriptions/me
 *   - /analytics/quota/me
 *   - /chat/sessions
 *   - /context/glossary (count)
 *   - /context/patterns (count)
 *
 * Uses in-flight deduplication so React StrictMode double-invocations and
 * concurrent component mounts share one request.
 */
import api from './api';

/* ═══════════════════════════════════════════════════════
   Backend response shape (mirrors app/analytics/init_routes.py)
   ═══════════════════════════════════════════════════════ */

export interface DashboardInitUser {
    user_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    org_id: string | null;
    is_first_login: boolean;
    job_title: string | null;
    industry: string | null;
    country: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
    last_active_at: string | null;
}

export interface DashboardInitPermissions {
    role: string;
    has_active_subscription: boolean;
    has_professional_features: boolean;
    can_access_context: boolean;
    can_upload_files: boolean;
    can_use_all_models: boolean;
    is_org_member: boolean;
    is_first_login: boolean;
}

export interface DashboardInitSubscription {
    subscription_id: string;
    plan_id: string;
    plan_key: string | null;
    status: string;
    subscriber_type: string;
    current_period_start: string;
    current_period_end: string;
    billing_cycle: string;
}

export interface DashboardInitQuota {
    plan_name: string;
    plan_key: string;
    monthly_requests: number;
    requests_used: number;
    requests_remaining: number;
    percentage_used: number;
    period_ends_at: string | null;
}

export interface DashboardInitSidebarContext {
    glossary_term_count: number;
    custom_pattern_count: number;
    total_context_items: number;
    has_professional_context: boolean;
}

export interface DashboardInitRecentSession {
    session_id: string;
    title: string;
    llm_provider: string;
    llm_model: string;
    message_count: number;
    has_file_uploads: boolean;
    last_message_at: string | null;
    created_at: string | null;
}

export interface DashboardInitResponse {
    user: DashboardInitUser;
    permissions: DashboardInitPermissions;
    subscription: DashboardInitSubscription | null;
    quota: DashboardInitQuota;
    sidebar_context: DashboardInitSidebarContext;
    recent_sessions: DashboardInitRecentSession[];
}

/* ═══════════════════════════════════════════════════════
   In-flight deduplication
   ═══════════════════════════════════════════════════════ */

let _initPromise: Promise<DashboardInitResponse | null> | null = null;

/**
 * GET /api/v1/analytics/dashboard/init
 *
 * Fetches the full dashboard bootstrap payload in a single request.
 * Concurrent callers (e.g. React StrictMode double-mount, sidebar + page
 * components mounting simultaneously) share one in-flight request so the
 * backend is only hit once per navigation event.
 *
 * Call ``invalidateDashboardInit()`` after writes (subscription change,
 * context update, etc.) to force a fresh fetch on the next call.
 */
export async function getDashboardInit(): Promise<DashboardInitResponse | null> {
    const token =
        typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return null;

    // Return in-flight promise to callers that arrive before the first resolves
    if (_initPromise) return _initPromise;

    _initPromise = _fetchDashboardInit()
        .finally(() => { _initPromise = null; });

    return _initPromise;
}

/** Force next call to ``getDashboardInit`` to make a fresh request. */
export function invalidateDashboardInit(): void {
    _initPromise = null;
}

async function _fetchDashboardInit(): Promise<DashboardInitResponse | null> {
    try {
        const { data } = await api.get<DashboardInitResponse>(
            '/analytics/dashboard/init',
            { headers: { 'X-Skip-Auth-Redirect': 'true' } },
        );
        return data;
    } catch {
        return null;
    }
}
