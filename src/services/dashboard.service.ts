import api from './api';
import type { UserStats } from '@/types/analytics.types';

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
    'gpt-4.1':           '#F59E0B',
    'claude-opus-4-5':   '#3B82F6',
    'claude-sonnet-4-5': '#8B5CF6',
    'gemini-3.1-flash-preview': '#06B6D4',
    'gemini-2.5-flash':  '#F97316',
};
const FALLBACK_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

// ─── Model / provider display name maps (mirrored from chat.service) ──────────

const PROVIDER_DISPLAY: Record<string, string> = {
    openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google', azure: 'OpenAI',
};
const MODEL_DISPLAY: Record<string, string> = {
    'gpt-4.1': 'GPT-4.1',
    'claude-opus-4-5': 'Claude Opus',
    'claude-sonnet-4-5': 'Claude Sonnet',
    'gemini-3.1-flash-preview': 'Gemini 3.1 Flash',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
};

// ─── ChatSessionSummary (inline to avoid cycle with chat.service) ────────────

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
        id: b.session_id,
        userId: '',
        title: b.title ?? 'Untitled Chat',
        model,
        modelName: MODEL_DISPLAY[model] ?? model,
        provider,
        providerName: PROVIDER_DISPLAY[provider] ?? provider,
        messageCount: b.message_count,
        createdAt: b.created_at ? b.created_at.split('T')[0] : '',
        lastMessageAt: b.last_message_at
            ? new Date(b.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
        hasFileUploads: b.has_file_uploads,
    };
}

// ─── Service functions ────────────────────────────────────────────────────────

/** GET /api/v1/analytics/dashboard/summary → single-call dashboard data */
export async function getDashboardSummary(): Promise<DashboardSummaryResponse | null> {
    try {
        const { data } = await api.get<{
            usage_30d: BUsageMe['summary'];
            quota: BQuota;
            total_sessions: number;
            daily: BUsageMe['daily'];
            recent_sessions: BRecentSession[];
        }>('/analytics/dashboard/summary');

        const rawUsage = data.usage_30d;
        const quota = data.quota;
        const totalRequests = rawUsage?.total_requests ?? 0;
        const entitiesAnonymized = rawUsage?.total_entities_detected ?? 0;

        const stats: DashboardStats = {
            totalRequestsThisMonth: totalRequests,
            totalSessions: data.total_sessions ?? 0,
            entitiesAnonymized,
            quotaRemaining: quota?.requests_remaining ?? 0,
            quotaTotal: quota?.monthly_requests ?? 0,
            avgEntitiesPerRequest: totalRequests > 0
                ? Math.round((entitiesAnonymized / totalRequests) * 10) / 10
                : 0,
            percentageUsed: quota?.requests_remaining_pct
                ? 100 - quota.requests_remaining_pct
                : 0,
            planName: quota?.plan_name ?? 'Free',
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

        // Derive last 7 days from the 30-day daily array already returned
        const limit = quota?.monthly_requests ?? 1;
        let cumulative = 0;
        const last7 = (data.daily ?? []).slice(-7);
        const dailyActivity: DailyActivityPoint[] = last7.map((row) => {
            cumulative += row.request_count;
            return {
                date: new Date(row.stat_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: row.request_count,
                entitiesAnonymized: row.entities_detected,
                quotaUtilizedPct: Math.round(Math.min((cumulative / limit) * 100, 100)),
            };
        });

        const recentSessions = (data.recent_sessions ?? []).map(mapSession);

        return { stats, dailyActivity, models, entities, recentSessions };
    } catch {
        return null;
    }
}

/** GET /api/v1/analytics/usage/me?days=30 + /analytics/quota/me
 *
 * @deprecated Use ``getDashboardSummary()`` which returns all of this in one
 *   call.  This function is kept for backward-compat with page components
 *   that have not yet been migrated to the consolidated endpoint.
 */
export async function getUserDashboardStats(): Promise<DashboardStats> {
    const summary = await getDashboardSummary();
    if (summary) return summary.stats;

    // Last-resort fallback (offline / backend error)
    return {
        totalRequestsThisMonth: 0, totalSessions: 0, entitiesAnonymized: 0,
        quotaRemaining: 0, quotaTotal: 0, avgEntitiesPerRequest: 0,
        percentageUsed: 0, planName: 'Free', periodEndsAt: '',
    };
}

/**
 * Derive the last N days of activity from the already-fetched dashboard
 * summary instead of making a second call to /analytics/usage/me.
 *
 * @deprecated Consume ``getDashboardSummary().dailyActivity`` directly.
 */
export async function getDailyActivity(days = 7): Promise<DailyActivityPoint[]> {
    const summary = await getDashboardSummary();
    if (!summary) return [];
    // getDashboardSummary already slices the last 7 days — return as-is when
    // the caller requests ≤7, otherwise fall back to a direct API call.
    if (days <= 7) return summary.dailyActivity;

    // Extended range: fetch from the full 30-day array embedded in the summary
    try {
        const { data } = await api.get<BUsageMe>(`/analytics/usage/me?days=${days}`);
        const quota = await api.get<BQuota>('/analytics/quota/me').catch(() => null);
        const limit = quota?.data.monthly_requests ?? 1;
        let cumulative = 0;
        return data.daily.map((row) => {
            cumulative += row.request_count;
            return {
                date: new Date(row.stat_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests: row.request_count,
                entitiesAnonymized: row.entities_detected,
                quotaUtilizedPct: Math.round(Math.min((cumulative / limit) * 100, 100)),
            };
        });
    } catch {
        return summary.dailyActivity;
    }
}

/**
 * @deprecated Consume ``getDashboardSummary().models`` directly.
 */
export async function getModelUsageBreakdown(): Promise<ModelUsagePoint[]> {
    const summary = await getDashboardSummary();
    return summary?.models ?? [];
}

/**
 * @deprecated Consume ``getDashboardSummary().entities`` directly.
 */
export async function getEntityTypeBreakdown(): Promise<EntityTypePoint[]> {
    const summary = await getDashboardSummary();
    return summary?.entities ?? [];
}

