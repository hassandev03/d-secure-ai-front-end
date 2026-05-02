import api from './api';
import type { UserStats } from '@/types/analytics.types';
import { PROVIDER_DISPLAY, MODEL_DISPLAY } from '@/lib/chat.helpers';

/* ══════════════════════════════════════════════════════
   Dashboard-specific types (mirror backend response)
   ══════════════════════════════════════════════════════ */

export interface DashboardStats extends UserStats {
    avgEntitiesPerRequest: number;
    percentageUsed: number;
    planName: string;
    periodEndsAt: string;
}

export interface DashboardSummaryResponse {
    stats: DashboardStats;
    dailyActivity: DailyActivityPoint[];
    models: ModelUsagePoint[];
    entities: EntityTypePoint[];
    recentSessions: ChatSessionSummary[];
}

export interface DailyActivityPoint {
    date: string;
    requests: number;
    entitiesAnonymized: number;
    quotaUtilizedPct: number;
}

export interface ModelUsagePoint {
    name: string;
    value: number;
    color: string;
}

export interface EntityTypePoint {
    name: string;
    count: number;
}

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BUsageMe {
    summary: {
        total_requests: number;
        total_anonymizations: number;
        total_entities_detected: number;
        total_cost_usd: number;
        anonymization_rate: number;
        top_models: { model: string; count: number }[];
        top_entity_types: { type: string; count: number }[];
    };
    daily: {
        stat_date: string;
        request_count: number;
        anonymization_count: number;
        entities_detected: number;
        llm_cost_usd: number;
        model_breakdown: Record<string, number> | null;
    }[];
}

interface BQuota {
    plan_name: string;
    monthly_requests: number;
    requests_used: number;
    requests_remaining: number;
    period_ends_at: string;
    requests_remaining_pct?: number;
}

// Backend shape for a chat session embedded in dashboard summary
interface BRecentSession {
    session_id: string;
    title: string | null;
    llm_provider: string;
    llm_model: string;
    message_count: number;
    has_file_uploads: boolean;
    created_at: string | null;
    last_message_at: string | null;
}

// ─── Colour palette for model breakdown ──────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
    'gpt-4.1':                  '#F59E0B',
    'claude-opus-4-5':          '#3B82F6',
    'claude-sonnet-4-5':        '#8B5CF6',
    'gemini-3.1-flash-preview': '#06B6D4',
    'gemini-2.5-flash':         '#F97316',
};
const FALLBACK_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

// ─── ChatSessionSummary interface (dashboard-local shape) ─────────────────────

export interface ChatSessionSummary {
    id: string;
    userId: string;
    title: string;
    model: string;
    modelName: string;
    provider: string;
    providerName: string;
    messageCount: number;
    createdAt: string;
    lastMessageAt: string;
    hasFileUploads: boolean;
}

function mapSession(b: BRecentSession): ChatSessionSummary {
    const model = b.llm_model;
    const provider = b.llm_provider;
    return {
        id:           b.session_id,
        userId:       '',
        title:        b.title ?? 'Untitled Chat',
        model,
        modelName:    MODEL_DISPLAY[model]    ?? model,
        provider,
        providerName: PROVIDER_DISPLAY[provider] ?? provider,
        messageCount: b.message_count,
        createdAt:    b.created_at ? b.created_at.split('T')[0] : '',
        lastMessageAt: b.last_message_at
            ? new Date(b.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
        hasFileUploads: b.has_file_uploads,
    };
}

// ─── Request deduplication + TTL result cache ─────────────────────────────────
//
// WHY THIS EXISTS
//   React 18 StrictMode mounts → unmounts → remounts every component in dev,
//   so useEffect fires twice per page load.  Combined with the four deprecated
//   wrappers (getUserDashboardStats, getDailyActivity, getModelUsageBreakdown,
//   getEntityTypeBreakdown) each independently calling getDashboardSummary(),
//   the endpoint was being hit 4–8 times per navigation.
//
// HOW IT WORKS
//   Layer 1 — In-flight deduplication:
//     While a fetch is in-progress every concurrent caller shares the same
//     Promise.  No matter how many callers fire simultaneously, exactly ONE
//     HTTP request leaves the browser.
//
//   Layer 2 — TTL result cache (CACHE_TTL_MS):
//     After a successful fetch the result is held in module-level memory.
//     Callers within the TTL window get the cached value synchronously
//     (wrapped in Promise.resolve).  Navigating away and back is free.
//
//   Invalidation:
//     Call invalidateDashboardCache() after any mutation that would change
//     the dashboard data — sending a chat message, deleting a session,
//     buying or cancelling a subscription.  The next getDashboardSummary()
//     call will then perform a fresh fetch.

/** How long (ms) a cached dashboard result is considered fresh. */
const CACHE_TTL_MS = 30_000; // 30 seconds

interface DashboardCache {
    data: DashboardSummaryResponse;
    /** Unix timestamp (ms) when this entry was stored. */
    storedAt: number;
}

/** Cached result from the last successful fetch. */
let _cache: DashboardCache | null = null;

/**
 * In-flight promise — shared across all concurrent callers while a fetch is
 * in progress.  Cleared to null once the fetch settles.
 */
let _inflight: Promise<DashboardSummaryResponse | null> | null = null;

/**
 * Bust the in-memory dashboard cache.
 *
 * Call this after any mutation that affects what the dashboard shows:
 *
 * @example — after sending a chat message
 *   import { invalidateDashboardCache } from '@/services/dashboard.service';
 *   await sendMessage(...);
 *   invalidateDashboardCache();
 *
 * @example — after deleting a session (history page)
 *   await deleteChatSession(id);
 *   invalidateDashboardCache();
 */
export function invalidateDashboardCache(): void {
    if (_cache) {
        console.log('[DASHBOARD_CACHE] Invalidating dashboard cache due to mutation');
    }
    _cache = null;
    // Do NOT touch _inflight — if a fetch is already running we let it
    // complete and re-warm the cache rather than abandoning it mid-flight.
}

// ─── Internal HTTP fetch + transform ─────────────────────────────────────────

async function _fetchDashboard(signal?: AbortSignal): Promise<DashboardSummaryResponse | null> {
    try {
        const { data } = await api.get<{
            usage_30d: BUsageMe['summary'];
            quota: BQuota;
            total_sessions: number;
            daily: BUsageMe['daily'];
            recent_sessions: BRecentSession[];
        }>('/analytics/dashboard/summary', { signal });

        const rawUsage = data.usage_30d;
        const quota    = data.quota;
        const totalRequests      = rawUsage?.total_requests        ?? 0;
        const entitiesAnonymized = rawUsage?.total_entities_detected ?? 0;

        const stats: DashboardStats = {
            totalRequestsThisMonth: totalRequests,
            totalSessions:          data.total_sessions ?? 0,
            entitiesAnonymized,
            quotaRemaining:         quota?.requests_remaining ?? 0,
            quotaTotal:             quota?.monthly_requests   ?? 0,
            avgEntitiesPerRequest:  totalRequests > 0
                ? Math.round((entitiesAnonymized / totalRequests) * 10) / 10
                : 0,
            percentageUsed: quota?.requests_remaining_pct
                ? 100 - quota.requests_remaining_pct
                : 0,
            planName:    quota?.plan_name    ?? 'Free',
            periodEndsAt: quota?.period_ends_at ?? '',
        };

        const models = (rawUsage?.top_models ?? []).map((m, i) => ({
            name:  m.model,
            value: m.count,
            color: MODEL_COLORS[m.model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }));

        const entities = (rawUsage?.top_entity_types ?? []).map((e) => ({
            name:  e.type,
            count: e.count,
        }));

        // Derive last 7 days from the 30-day daily array already returned.
        const limit = quota?.monthly_requests ?? 1;
        let cumulative = 0;
        const last7 = (data.daily ?? []).slice(-7);
        const dailyActivity: DailyActivityPoint[] = last7.map((row) => {
            cumulative += row.request_count;
            return {
                date: new Date(row.stat_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests:           row.request_count,
                entitiesAnonymized: row.entities_detected,
                quotaUtilizedPct:   Math.round(Math.min((cumulative / limit) * 100, 100)),
            };
        });

        const recentSessions = (data.recent_sessions ?? []).map(mapSession);

        return { stats, dailyActivity, models, entities, recentSessions };
    } catch {
        return null;
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/dashboard/summary — single-call dashboard data.
 *
 * Guarantees at most ONE in-flight HTTP request at any time, and returns
 * the cached result for CACHE_TTL_MS after a successful fetch.
 *
 * All deprecated wrapper functions (getUserDashboardStats, getDailyActivity,
 * getModelUsageBreakdown, getEntityTypeBreakdown) delegate here so they all
 * benefit from the cache and deduplication automatically.
 */
export async function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummaryResponse | null> {
    // Layer 2 — serve from cache if still fresh.
    if (_cache && Date.now() - _cache.storedAt < CACHE_TTL_MS) {
        const cacheAgeMs = Date.now() - _cache.storedAt;
        console.log(`[DASHBOARD_CACHE_HIT] Serving cached result (age: ${cacheAgeMs}ms)`);
        return _cache.data;
    }

    // Layer 1 — join an already in-flight request instead of launching another.
    if (_inflight) {
        console.log('[DASHBOARD_DEDUP] Joining existing in-flight request');
        return _inflight;
    }

    // No cache and no in-flight request — start a fresh fetch and share the
    // promise so every concurrent caller gets the same result.
    console.log('[DASHBOARD_API_CALL] Starting fresh fetch to GET /analytics/dashboard/summary');
    _inflight = _fetchDashboard(signal).then((result) => {
        if (result !== null) {
            // Warm the cache on success.
            console.log('[DASHBOARD_CACHE_WARM] Populated cache with fresh result');
            _cache = { data: result, storedAt: Date.now() };
        } else {
            console.log('[DASHBOARD_API_ERROR] Dashboard fetch returned null');
        }
        // Release the in-flight slot so future callers (after TTL) start fresh.
        _inflight = null;
        return result;
    });

    return _inflight;
}