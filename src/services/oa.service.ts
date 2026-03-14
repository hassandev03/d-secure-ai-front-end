/**
 * Organisation Admin dashboard service.
 * All mock data is centralised here. When the Python backend is connected,
 * replace each function body with the equivalent axios call from `./api`.
 */

import { delay } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgDashboardStats = {
    totalEmployees: number;
    activeEmployees: number;
    pendingEmployees: number;
    departments: number;
    monthlyRequests: number;
    monthlyQuota: number;
    quotaUtilization: number;
    unallocatedQuota: number;
    pendingQuotaRequests: number;
    adoptionRate: number;
    avgRequestsPerEmployee: number;
};

export type DeptUsageRow = {
    name: string;
    head: string;
    employees: number;
    used: number;
    total: number;
    color: string;
};

export type OrgModelUsageSlice = {
    name: string;
    value: number;
    color: string;
};

export type OrgUsageTrendPoint = {
    date: string;
    requests: number;
};

export type RecentActivityItem = {
    id: string;
    type: 'employee_added' | 'employee_removed' | 'quota_approved' | 'quota_denied' | 'policy_changed' | 'dept_created' | 'security_alert';
    title: string;
    description: string;
    timestamp: string;
    icon: 'user-plus' | 'user-minus' | 'check-circle' | 'x-circle' | 'shield' | 'building' | 'alert-triangle';
};

// ─── Mock source data ─────────────────────────────────────────────────────────

const DEPT_DATA: DeptUsageRow[] = [
    { name: "Engineering", head: "Sarah Johnson", employees: 45, used: 1420, total: 1800, color: "#3B82F6" },
    { name: "Marketing",   head: "Emma Davis",    employees: 20, used: 620,  total: 800,  color: "#EC4899" },
    { name: "Sales",       head: "David Kim",     employees: 25, used: 480,  total: 700,  color: "#F97316" },
    { name: "Finance",     head: "Aisha Patel",   employees: 12, used: 390,  total: 600,  color: "#10B981" },
    { name: "HR",          head: "Lisa Chen",     employees: 10, used: 180,  total: 400,  color: "#8B5CF6" },
    { name: "Operations",  head: "James Wilson",  employees: 8,  used: 310,  total: 700,  color: "#F59E0B" },
];

const MODEL_COLORS: Record<string, string> = {
    'Claude 4.6 Sonnet': '#3B82F6',
    'GPT-5.1':           '#10B981',
    'GPT-4o':            '#F59E0B',
    'Claude 4.5 Haiku':  '#8B5CF6',
    'Claude 4.6 Opus':   '#EF4444',
    'Gemini 3.1 Pro':    '#06B6D4',
    'Gemini 3.1 Flash':  '#F97316',
};

const RECENT_ACTIVITIES: RecentActivityItem[] = [
    { id: "a1", type: "employee_added",   title: "New employee added",      description: "Carlos Ruiz joined the Sales department",             timestamp: "2 hours ago",  icon: "user-plus" },
    { id: "a2", type: "quota_approved",   title: "Quota request approved",  description: "Engineering dept granted +200 requests",              timestamp: "4 hours ago",  icon: "check-circle" },
    { id: "a3", type: "policy_changed",   title: "Policy updated",          description: "Speech-to-text enabled for Marketing department",     timestamp: "6 hours ago",  icon: "shield" },
    { id: "a4", type: "security_alert",   title: "Multiple failed logins",  description: "3 failed login attempts for mike@acme.com",          timestamp: "8 hours ago",  icon: "alert-triangle" },
    { id: "a5", type: "employee_removed", title: "Employee deactivated",    description: "Ethan Harris deactivated from Engineering",           timestamp: "1 day ago",    icon: "user-minus" },
    { id: "a6", type: "quota_denied",     title: "Quota request denied",    description: "Operations dept request for +500 denied",             timestamp: "1 day ago",    icon: "x-circle" },
    { id: "a7", type: "dept_created",     title: "Department edited",       description: "HR department quota increased to 400",                timestamp: "2 days ago",   icon: "building" },
    { id: "a8", type: "employee_added",   title: "New employee added",      description: "Mia Thompson joined the Engineering department",      timestamp: "2 days ago",   icon: "user-plus" },
];

// ─── Mock data builders ───────────────────────────────────────────────────────

function buildOrgModelUsage(): OrgModelUsageSlice[] {
    const totalRequests = DEPT_DATA.reduce((s, d) => s + d.used, 0);
    const slices = [
        { name: 'Claude 4.6 Sonnet', pct: 0.28 },
        { name: 'GPT-5.1',           pct: 0.22 },
        { name: 'GPT-4o',            pct: 0.15 },
        { name: 'Claude 4.5 Haiku',  pct: 0.12 },
        { name: 'Claude 4.6 Opus',   pct: 0.09 },
        { name: 'Gemini 3.1 Pro',    pct: 0.08 },
        { name: 'Gemini 3.1 Flash',  pct: 0.06 },
    ];
    return slices.map((s) => ({
        name: s.name,
        value: Math.round(totalRequests * s.pct),
        color: MODEL_COLORS[s.name] || '#94A3B8',
    }));
}

function buildOrgUsageTrend(days: number): OrgUsageTrendPoint[] {
    const totalRequests = DEPT_DATA.reduce((s, d) => s + d.used, 0);
    const avgDaily = totalRequests / 30;
    const points: OrgUsageTrendPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const factor = isWeekend ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.6;
        points.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            requests: Math.round(avgDaily * factor),
        });
    }
    return points;
}

// ─── Service functions ────────────────────────────────────────────────────────

/** GET /api/v1/org/{orgId}/dashboard/stats */
export async function getOrgDashboardStats(): Promise<OrgDashboardStats> {
    await delay(300);
    const totalEmployees = DEPT_DATA.reduce((s, d) => s + d.employees, 0);
    const monthlyRequests = DEPT_DATA.reduce((s, d) => s + d.used, 0);
    const monthlyQuota = DEPT_DATA.reduce((s, d) => s + d.total, 0);
    const activeEmployees = Math.round(totalEmployees * 0.93);
    const totalAllocated = DEPT_DATA.reduce((s, d) => s + d.total, 0);
    const orgQuota = 8000; // matches ORG_QUOTA.total in quota page
    return {
        totalEmployees,
        activeEmployees,
        pendingEmployees: 3,
        departments: DEPT_DATA.length,
        monthlyRequests,
        monthlyQuota,
        quotaUtilization: Math.round((monthlyRequests / monthlyQuota) * 100),
        unallocatedQuota: orgQuota - totalAllocated,
        pendingQuotaRequests: 2,
        adoptionRate: Math.round((activeEmployees / totalEmployees) * 100),
        avgRequestsPerEmployee: Math.round((monthlyRequests / activeEmployees) * 10) / 10,
    };
}

/** GET /api/v1/org/{orgId}/dashboard/department-usage */
export async function getOrgDeptUsage(): Promise<DeptUsageRow[]> {
    await delay(200);
    return structuredClone(DEPT_DATA);
}

/** GET /api/v1/org/{orgId}/dashboard/model-usage */
export async function getOrgModelUsage(): Promise<OrgModelUsageSlice[]> {
    await delay(200);
    return buildOrgModelUsage();
}

/** GET /api/v1/org/{orgId}/dashboard/usage-trend?days=7|30 */
export async function getOrgUsageTrend(days: 7 | 30 = 7): Promise<OrgUsageTrendPoint[]> {
    await delay(200);
    return buildOrgUsageTrend(days);
}

/** GET /api/v1/org/{orgId}/dashboard/recent-activity */
export async function getOrgRecentActivity(): Promise<RecentActivityItem[]> {
    await delay(250);
    return structuredClone(RECENT_ACTIVITIES);
}
