import { delay } from './api';
import type { UserStats } from '@/types/analytics.types';
import { MOCK_SESSIONS, MOCK_MESSAGES, ChatMessage } from './chat.service';

/* ══════════════════════════════════════════════════════
   Dashboard-specific types (mirror backend response)
   ══════════════════════════════════════════════════════ */

export interface DashboardStats extends UserStats {
    /** Computed: entitiesAnonymized / totalRequestsThisMonth */
    avgEntitiesPerRequest: number;
    /** Percentage of monthly credit budget used (0–100) */
    percentageUsed: number;
    /** Plan name (e.g. "Pro") */
    planName: string;
    /** ISO date of next renewal */
    periodEndsAt: string;
}

export interface DailyActivityPoint {
    date: string;
    requests: number;
    entitiesAnonymized: number;
    /** Cumulative daily quota usage as percentage of plan total */
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

/* ══════════════════════════════════════════════════════
   Mock data — realistic & internally consistent
   ══════════════════════════════════════════════════════ */

// Mock quota data — in production this comes from GET /api/v1/analytics/quota/me
const MOCK_QUOTA = {
    plan_name: 'Pro',
    credits_allocated: 25.00,
    credits_used: 8.32,
    addon_credits: 5.00,
    effective_budget: 30.00,
    percentage_used: 27.7,
    period_ends_at: '2026-05-01T00:00:00Z',
};

/** GET /api/v1/dashboard/stats */
export async function getUserDashboardStats(): Promise<DashboardStats> {
    await delay(300);

    // Aggregate stats from mock conversations
    let totalRequests = 0;
    let entitiesAnonymized = 0;

    const allMessages = Object.values(MOCK_MESSAGES) as ChatMessage[][];
    allMessages.forEach(messages => {
        messages.forEach(msg => {
            if (msg.role === 'user') {
                totalRequests++;
                if (msg.entities) {
                    entitiesAnonymized += msg.entities.length;
                }
            }
        });
    });

    return {
        totalRequestsThisMonth: totalRequests,
        totalSessions: MOCK_SESSIONS.length,
        entitiesAnonymized,
        quotaRemaining: 0,  // Not relevant in credit system — use percentageUsed
        quotaTotal: 0,      // Not relevant in credit system — use percentageUsed
        avgEntitiesPerRequest: totalRequests > 0 ? Math.round((entitiesAnonymized / totalRequests) * 10) / 10 : 0,
        percentageUsed: MOCK_QUOTA.percentage_used,
        planName: MOCK_QUOTA.plan_name,
        periodEndsAt: MOCK_QUOTA.period_ends_at,
    };
}

/** GET /api/v1/dashboard/activity?days=7 */
export async function getDailyActivity(days: number = 7): Promise<DailyActivityPoint[]> {
    await delay(250);

    // For the activity chart, we show cumulative percentage growth across the period.
    // In production: backend returns per-day credits_used which we map to % of effective_budget.
    const totalPctForPeriod = MOCK_QUOTA.percentage_used;
    let cumulative = 0;

    const activityMap = new Map<string, { requests: number; entities: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        activityMap.set(d.toISOString().split('T')[0], { requests: 0, entities: 0 });
    }

    // Populate data from messages
    const allMessages = Object.values(MOCK_MESSAGES) as ChatMessage[][];
    allMessages.forEach(messages => {
        messages.forEach(msg => {
            if (msg.role === 'user') {
                const dateKey = new Date(msg.createdAt).toISOString().split('T')[0];
                if (activityMap.has(dateKey)) {
                    const stats = activityMap.get(dateKey)!;
                    stats.requests++;
                    if (msg.entities) {
                        stats.entities += msg.entities.length;
                    }
                }
            }
        });
    });

    const totalRequests = Array.from(activityMap.values()).reduce((s, v) => s + v.requests, 0);
    const pctPerRequest = totalRequests > 0 ? totalPctForPeriod / totalRequests : 0;

    return Array.from(activityMap.entries()).map(([dateStr, stats]) => {
        cumulative += stats.requests * pctPerRequest;
        const d = new Date(dateStr);
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
            date: formattedDate,
            requests: stats.requests,
            entitiesAnonymized: stats.entities,
            quotaUtilizedPct: Math.round(Math.min(cumulative, 100)),
        };
    });
}

/** GET /api/v1/dashboard/models */
export async function getModelUsageBreakdown(): Promise<ModelUsagePoint[]> {
    await delay(200);

    const modelCounts = new Map<string, number>();
    MOCK_SESSIONS.forEach(session => {
        const messages = MOCK_MESSAGES[session.id] || [];
        const requestCount = messages.filter((m: ChatMessage) => m.role === 'user').length;
        const count = modelCounts.get(session.modelName) || 0;
        modelCounts.set(session.modelName, count + requestCount);
    });

    const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'];
    return Array.from(modelCounts.entries())
        .filter(([_, value]) => value > 0)
        .map(([name, value], i) => ({
            name,
            value,
            color: colors[i % colors.length]
        }))
        .sort((a, b) => b.value - a.value);
}

/** GET /api/v1/dashboard/entities */
export async function getEntityTypeBreakdown(): Promise<EntityTypePoint[]> {
    await delay(200);

    const entityCounts = new Map<string, number>();

    const allMessages = Object.values(MOCK_MESSAGES) as ChatMessage[][];
    allMessages.forEach(messages => {
        messages.forEach(msg => {
            if (msg.role === 'user' && msg.entities) {
                msg.entities.forEach(entity => {
                    const count = entityCounts.get(entity.type) || 0;
                    entityCounts.set(entity.type, count + 1);
                });
            }
        });
    });

    return Array.from(entityCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}
