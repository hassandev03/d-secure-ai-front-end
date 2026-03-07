import { delay } from './api';
import type { UserStats } from '@/types/analytics.types';

/* ══════════════════════════════════════════════════════
   Dashboard-specific types (mirror backend response)
   ══════════════════════════════════════════════════════ */

export interface DashboardStats extends UserStats {
    /** Computed: entitiesAnonymized / totalRequestsThisMonth */
    avgEntitiesPerRequest: number;
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
   
   A PRO user with 1000 monthly quota:
   - 47 sessions this month so far
   - 312 total requests
   - ~780 entities anonymized (≈2.5 per request)
   - Quota used: 312/1000 = 31.2%
   ══════════════════════════════════════════════════════ */

/** GET /api/v1/dashboard/stats */
export async function getUserDashboardStats(): Promise<DashboardStats> {
    await delay(300);

    const totalRequests = 312;
    const entitiesAnonymized = 782;

    return {
        totalRequestsThisMonth: totalRequests,
        totalSessions: 47,
        entitiesAnonymized,
        quotaRemaining: 1000 - totalRequests,
        quotaTotal: 1000,
        avgEntitiesPerRequest: Math.round((entitiesAnonymized / totalRequests) * 10) / 10,
    };
}

/** GET /api/v1/dashboard/activity?days=7 */
export async function getDailyActivity(days: number = 7): Promise<DailyActivityPoint[]> {
    await delay(250);

    // Daily breakdown that sums up to ~312 total requests
    const raw = [
        { date: 'Mar 1', requests: 38, entities: 95 },
        { date: 'Mar 2', requests: 45, entities: 112 },
        { date: 'Mar 3', requests: 41, entities: 103 },
        { date: 'Mar 4', requests: 52, entities: 130 },
        { date: 'Mar 5', requests: 47, entities: 118 },
        { date: 'Mar 6', requests: 50, entities: 125 },
        { date: 'Mar 7', requests: 39, entities: 99 },
    ];

    const quotaTotal = 1000;
    let cumulative = 0;

    return raw.slice(-days).map(point => {
        cumulative += point.requests;
        return {
            date: point.date,
            requests: point.requests,
            entitiesAnonymized: point.entities,
            quotaUtilizedPct: Math.round((cumulative / quotaTotal) * 100),
        };
    });
}

/** GET /api/v1/dashboard/models */
export async function getModelUsageBreakdown(): Promise<ModelUsagePoint[]> {
    await delay(200);

    // Realistic split across the models the user actually used
    return [
        { name: 'Claude 4.6 Sonnet', value: 134, color: '#f97316' },
        { name: 'GPT-5.1', value: 98, color: '#10b981' },
        { name: 'Gemini 3.1 Pro', value: 52, color: '#3b82f6' },
        { name: 'Claude 4.5 Haiku', value: 28, color: '#8b5cf6' },
    ];
    // Total = 312, matches totalRequests
}

/** GET /api/v1/dashboard/entities */
export async function getEntityTypeBreakdown(): Promise<EntityTypePoint[]> {
    await delay(200);

    // Realistic distribution — names & emails are most commonly detected
    return [
        { name: 'PERSON', count: 245 },
        { name: 'ORG', count: 186 },
        { name: 'EMAIL', count: 142 },
        { name: 'LOCATION', count: 108 },
        { name: 'PROJECT', count: 62 },
        { name: 'PHONE', count: 39 },
    ];
    // Total = 782, matches entitiesAnonymized
}
