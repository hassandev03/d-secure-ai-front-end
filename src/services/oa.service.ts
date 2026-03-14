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
    avgRequestsPerEmployee: number;
    anonymizationOps: number;
    anonymizationAccuracy: number;
    activeSessions: number;
    pendingQuotaRequests: number;
};

export type DailyOrgRequestPoint = {
    date: string;
    requests: number;
    activeUsers: number;
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
    activeUsers: number;
};

export type DeptComparisonPoint = {
    dept: string;
    requests: number;
    quota: number;
    employees: number;
    color: string;
};

export type RecentActivityItem = {
    id: string;
    type: 'employee_added' | 'employee_removed' | 'quota_approved' | 'quota_denied' | 'policy_changed' | 'dept_created' | 'security_alert';
    title: string;
    description: string;
    timestamp: string;
    icon: 'user-plus' | 'user-minus' | 'check-circle' | 'x-circle' | 'shield' | 'building' | 'alert-triangle';
};

export type TopEmployeeRow = {
    id: string;
    name: string;
    email: string;
    department: string;
    requests: number;
    status: string;
    lastActive: string;
};

export type SecurityOverview = {
    twoFAEnabled: number;
    twoFATotal: number;
    failedLogins24h: number;
    activeSessions: number;
    restrictedAccounts: number;
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

const TOP_EMPLOYEES: TopEmployeeRow[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",     department: "Engineering", requests: 320, status: "ACTIVE", lastActive: "Today" },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",     department: "Engineering", requests: 245, status: "ACTIVE", lastActive: "Today" },
    { id: "16", name: "Ava Martinez",    email: "ava@acme.com",     department: "Engineering", requests: 210, status: "ACTIVE", lastActive: "Yesterday" },
    { id: "13", name: "James Anderson",  email: "james@acme.com",   department: "Engineering", requests: 198, status: "ACTIVE", lastActive: "Today" },
    { id: "2",  name: "John Miller",     email: "john@acme.com",    department: "Engineering", requests: 180, status: "ACTIVE", lastActive: "Today" },
    { id: "15", name: "Noah Garcia",     email: "noah@acme.com",    department: "Marketing",   requests: 167, status: "ACTIVE", lastActive: "Today" },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",   department: "Sales",       requests: 143, status: "ACTIVE", lastActive: "Today" },
    { id: "18", name: "Isabella White",  email: "isabella@acme.com",department: "Finance",     requests: 134, status: "ACTIVE", lastActive: "Today" },
];

// ─── Mock data builders ───────────────────────────────────────────────────────

function buildOrgDailyRequests(): DailyOrgRequestPoint[] {
    const totalRequests = DEPT_DATA.reduce((s, d) => s + d.used, 0);
    const totalEmployees = DEPT_DATA.reduce((s, d) => s + d.employees, 0);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weights = [0.18, 0.19, 0.20, 0.17, 0.15, 0.06, 0.05];
    const userWeights = [0.85, 0.90, 0.88, 0.82, 0.78, 0.25, 0.18];
    return days.map((date, i) => ({
        date,
        requests: Math.round(totalRequests * weights[i]),
        activeUsers: Math.round(totalEmployees * userWeights[i]),
    }));
}

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
    const totalEmployees = DEPT_DATA.reduce((s, d) => s + d.employees, 0);
    const avgDaily = totalRequests / 30;
    const points: OrgUsageTrendPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const factor = isWeekend ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.6;
        const userFactor = isWeekend ? 0.10 + Math.random() * 0.15 : 0.55 + Math.random() * 0.40;
        points.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            requests: Math.round(avgDaily * factor),
            activeUsers: Math.max(1, Math.round(totalEmployees * userFactor)),
        });
    }
    return points;
}

function buildDeptComparison(): DeptComparisonPoint[] {
    return DEPT_DATA.map((d) => ({
        dept: d.name,
        requests: d.used,
        quota: d.total,
        employees: d.employees,
        color: d.color,
    }));
}

// ─── Service functions ────────────────────────────────────────────────────────

/** GET /api/v1/org/{orgId}/dashboard/stats */
export async function getOrgDashboardStats(): Promise<OrgDashboardStats> {
    await delay(300);
    const totalEmployees = DEPT_DATA.reduce((s, d) => s + d.employees, 0);
    const monthlyRequests = DEPT_DATA.reduce((s, d) => s + d.used, 0);
    const monthlyQuota = DEPT_DATA.reduce((s, d) => s + d.total, 0);
    const activeEmployees = Math.round(totalEmployees * 0.93);
    return {
        totalEmployees,
        activeEmployees,
        pendingEmployees: 3,
        departments: DEPT_DATA.length,
        monthlyRequests,
        monthlyQuota,
        quotaUtilization: Math.round((monthlyRequests / monthlyQuota) * 100),
        avgRequestsPerEmployee: Math.round(monthlyRequests / activeEmployees),
        anonymizationOps: Math.round(monthlyRequests * 0.82),
        anonymizationAccuracy: 99.1,
        activeSessions: 47,
        pendingQuotaRequests: 2,
    };
}

/** GET /api/v1/org/{orgId}/dashboard/daily-requests */
export async function getOrgDailyRequests(): Promise<DailyOrgRequestPoint[]> {
    await delay(250);
    return buildOrgDailyRequests();
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

/** GET /api/v1/org/{orgId}/dashboard/dept-comparison */
export async function getOrgDeptComparison(): Promise<DeptComparisonPoint[]> {
    await delay(200);
    return buildDeptComparison();
}

/** GET /api/v1/org/{orgId}/dashboard/recent-activity */
export async function getOrgRecentActivity(): Promise<RecentActivityItem[]> {
    await delay(250);
    return structuredClone(RECENT_ACTIVITIES);
}

/** GET /api/v1/org/{orgId}/dashboard/top-employees */
export async function getOrgTopEmployees(limit: number = 5): Promise<TopEmployeeRow[]> {
    await delay(300);
    return structuredClone(TOP_EMPLOYEES).slice(0, limit);
}

/** GET /api/v1/org/{orgId}/dashboard/security-overview */
export async function getOrgSecurityOverview(): Promise<SecurityOverview> {
    await delay(200);
    const totalEmployees = DEPT_DATA.reduce((s, d) => s + d.employees, 0);
    return {
        twoFAEnabled: Math.round(totalEmployees * 0.78),
        twoFATotal: totalEmployees,
        failedLogins24h: 5,
        activeSessions: 47,
        restrictedAccounts: 3,
    };
}
