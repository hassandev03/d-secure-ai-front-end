/**
 * dashboard.service.ts — User dashboard: real backend integration
 *
 * Backend routes:
 *   GET /api/v1/analytics/usage/me?days=30    → daily usage + summary
 *   GET /api/v1/analytics/quota/me            → quota / plan status
 *   GET /api/v1/chat/sessions                 → session count
 */
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
    recentSessions: import('@/services/chat.service').ChatSessionSummary[];
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

// ─── Colour palette for model breakdown ──────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
    'gpt-4o':             '#F59E0B',
    'gpt-4o-mini':        '#10B981',
    'claude-3-5-sonnet':  '#3B82F6',
    'claude-3-haiku':     '#8B5CF6',
    'gemini-1-5-pro':     '#06B6D4',
    'gemini-1-5-flash':   '#F97316',
};
const FALLBACK_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

// ─── Service functions ────────────────────────────────────────────────────────

/** GET /api/v1/analytics/usage/me?days=30 + /analytics/quota/me */
export async function getUserDashboardStats(): Promise<DashboardStats> {
    try {
        const [usageRes, quotaRes] = await Promise.allSettled([
            api.get<BUsageMe>('/analytics/usage/me?days=30'),
            api.get<BQuota>('/analytics/quota/me'),
        ]);

        const usage   = usageRes.status   === 'fulfilled' ? usageRes.value.data   : null;
        const quota   = quotaRes.status   === 'fulfilled' ? quotaRes.value.data   : null;

        const totalRequests       = usage?.summary.total_requests       ?? 0;
        const entitiesAnonymized  = usage?.summary.total_entities_detected ?? 0;
        const requestsUsed        = quota?.requests_used   ?? 0;
        const monthlyLimit        = quota?.monthly_requests ?? 0;
        const percentageUsed      = monthlyLimit > 0
            ? Math.round((requestsUsed / monthlyLimit) * 100)
            : 0;

        return {
            totalRequestsThisMonth: totalRequests,
            totalSessions:          0,      // derived separately if needed
            entitiesAnonymized,
            quotaRemaining:         quota?.requests_remaining ?? 0,
            quotaTotal:             monthlyLimit,
            avgEntitiesPerRequest:  totalRequests > 0
                ? Math.round((entitiesAnonymized / totalRequests) * 10) / 10
                : 0,
            percentageUsed,
            planName:    quota?.plan_name    ?? 'Free',
            periodEndsAt: quota?.period_ends_at ?? '',
        };
    } catch {
        return {
            totalRequestsThisMonth: 0, totalSessions: 0, entitiesAnonymized: 0,
            quotaRemaining: 0, quotaTotal: 0, avgEntitiesPerRequest: 0,
            percentageUsed: 0, planName: 'Free', periodEndsAt: '',
        };
    }
}

/** GET /api/v1/analytics/usage/me?days=N */
export async function getDailyActivity(days = 7): Promise<DailyActivityPoint[]> {
    try {
        const { data } = await api.get<BUsageMe>(`/analytics/usage/me?days=${days}`);
        const quota    = await api.get<BQuota>('/analytics/quota/me').catch(() => null);
        const limit    = quota?.data.monthly_requests ?? 1;

        let cumulative = 0;
        return data.daily.map((row) => {
            cumulative += row.request_count;
            const d = new Date(row.stat_date);
            return {
                date:               d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                requests:           row.request_count,
                entitiesAnonymized: row.entities_detected,
                quotaUtilizedPct:   Math.round(Math.min((cumulative / limit) * 100, 100)),
            };
        });
    } catch {
        return [];
    }
}

/** GET /api/v1/analytics/usage/me?days=30 → model breakdown */
export async function getModelUsageBreakdown(): Promise<ModelUsagePoint[]> {
    try {
        const { data } = await api.get<BUsageMe>('/analytics/usage/me?days=30');
        return data.summary.top_models.map((m, i) => ({
            name:  m.model,
            value: m.count,
            color: MODEL_COLORS[m.model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }));
    } catch {
        return [];
    }
}

/** GET /api/v1/analytics/usage/me?days=30 → entity type breakdown */
export async function getEntityTypeBreakdown(): Promise<EntityTypePoint[]> {
    try {
        const { data } = await api.get<BUsageMe>('/analytics/usage/me?days=30');
        return data.summary.top_entity_types.map((e) => ({
            name:  e.type,
            count: e.count,
        }));
    } catch {
        return [];
    }
}

/** GET /api/v1/analytics/dashboard/summary → Unified endpoint */
export async function getDashboardSummary(): Promise<DashboardSummaryResponse | null> {
    try {
        const { data } = await api.get<{ usage_30d: unknown; quota: unknown; total_sessions: number }>('/analytics/dashboard/summary');
        
        const usage = data.usage_30d as BUsageMe['summary'] | undefined;
        const quota = data.quota as Record<string, unknown> | undefined;
        
        const totalRequests       = usage?.total_requests ?? 0;
        const entitiesAnonymized  = usage?.total_entities_detected ?? 0;
        
        const stats: DashboardStats = {
            totalRequestsThisMonth: totalRequests,
            totalSessions:          data.total_sessions ?? 0,
            entitiesAnonymized:     entitiesAnonymized,
            quotaRemaining:         (quota?.remaining as number) ?? 0,
            quotaTotal:             (quota?.limit as number) ?? 0,
            avgEntitiesPerRequest:  totalRequests > 0
                ? Math.round((entitiesAnonymized / totalRequests) * 10) / 10
                : 0,
            percentageUsed:         (quota?.percentage as number) ?? 0,
            planName:               (quota?.plan as string) ?? 'Free',
            periodEndsAt:           (quota?.period_ends as string) ?? '',
        };
        
        const models = (usage?.top_models ?? []).map((m: { model: string; count: number }, i: number) => ({
            name:  m.model,
            value: m.count,
            color: MODEL_COLORS[m.model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }));
        
        const entities = (usage?.top_entity_types ?? []).map((e: { type: string; count: number }) => ({
            name:  e.type,
            count: e.count,
        }));
        
        // We still need to get daily activity points properly mapped, and recent chat sessions.
        // The backend /dashboard/summary doesn't return the full daily array and sessions list yet.
        // Wait, the backend /dashboard/summary DOES return total_sessions, but not the recent sessions list!
        // Let's do a fast Promise.all just for the remaining pieces that we must fetch.
        
        // Actually, the best way to speed this up is just returning the unified data we have,
        // and fetching the rest concurrently.
        
        const [dailyRes, sessionsRes] = await Promise.allSettled([
            getDailyActivity(7),
            api.get('/chat/sessions')
        ]);
        
        const dailyActivity = dailyRes.status === 'fulfilled' ? dailyRes.value : [];
        const recentSessions = sessionsRes.status === 'fulfilled' ? 
            (sessionsRes.value.data as Array<{
                session_id: string; title: string | null; llm_model: string; message_count: number; last_message_at: string
            }>).map(s => ({
                id: s.session_id,
                title: s.title || "New Chat",
                modelName: s.llm_model,
                messageCount: s.message_count,
                lastMessageAt: new Date(s.last_message_at).toLocaleDateString(),
            })).slice(0, 5) : [];
            
        return { stats, dailyActivity, models, entities, recentSessions };
    } catch {
        return null;
    }
}
