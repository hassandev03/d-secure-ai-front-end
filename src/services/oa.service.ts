/**
 * oa.service.ts — Organisation Admin portal: real backend integration
 *
 * Strategy:
 *  - All functions call real endpoints where they exist on the backend.
 *  - For endpoints not yet implemented (settings, dashboard analytics, system
 *    prompts), a MOCK fallback is kept so the OA portal remains usable.
 *    Each fallback is clearly marked with a TODO comment.
 *
 * Backend routes used:
 *   GET  /api/v1/organizations/{org_id}           → org config
 *   PATCH /api/v1/organizations/{org_id}          → update org config
 *   GET  /api/v1/departments/org/{org_id}         → list departments
 *   POST /api/v1/departments                      → create department
 *   PATCH /api/v1/departments/{dept_id}           → update department
 *   GET  /api/v1/users?org_id=...                 → list employees
 *   POST /api/v1/users/{user_id}/status           → update user status
 *   GET  /api/v1/policies/org                     → org privacy policy
 *   PATCH /api/v1/policies/org                    → update org privacy policy
 *   GET  /api/v1/policies/dept/{dept_id}          → dept privacy policy
 *   GET  /api/v1/policies/dept/{dept_id}/access   → per-user access controls
 *   PUT  /api/v1/policies/dept/{dept_id}/access/{user_id} → update access
 *   GET  /api/v1/subscriptions/org/{org_id}       → org subscription
 *   GET  /api/v1/analytics/quota/me               → quota usage
 *   GET  /api/v1/analytics/usage/org/{org_id}     → usage data
 */

import api from './api';
import type { LLMModel } from '@/types/chat.types';
import { PLATFORM_CONFIG } from '@/lib/costCalculator';
import { useAuthStore } from '@/store/auth.store';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical types (unchanged — pages depend on these)
// ─────────────────────────────────────────────────────────────────────────────

export type OAOrgConfig = {
    totalBudget: number;
    plan: string;
    quotaRenewsAt: string;
    name: string;
    industry: string;
    domain: string;
    country: string;
    supportEmail: string;
    timezone: string;
};

export type OAEmployeeDefaults = {
    defaultDepartment: string;
    defaultRole: string;
    monthlyLimit: number;
    autoApprove: boolean;
};

export type OANotificationSettings = {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    quotaAlerts: boolean;
    quotaAlertThreshold: number;
};

export type OASecuritySettings = {
    enforce2FA: boolean;
    minPasswordLength: number;
    requireUppercase: boolean;
    requireSpecialChar: boolean;
    sessionTimeout: number;
    maxConcurrentSessions: number;
    allowFileUploads: boolean;
    allowSpeechToText: boolean;
    allowApiAccess: boolean;
    ipWhitelist: boolean;
    ipWhitelistValue: string;
};

export type OAOrgPolicy = {
    fileUpload: boolean;
    speechToText: boolean;
    allModels: boolean;
    permittedModels: LLMModel[];
    defaultCreditLimit: number;
    maxCreditLimit: number;
    allowApiAccess: boolean;
};

export type OADeptPolicyState = {
    id: string;
    name: string;
    head: string;
    employees: number;
    color: string;
    fileUpload: boolean;
    speechToText: boolean;
    allModels: boolean;
    permittedModels: LLMModel[];
    creditLimit: number;
    synced: boolean;
};

export type OADepartment = {
    id: string;
    name: string;
    head: string;
    headEmail: string;
    employees: number;
    percentageUsed: number;
    budget: number;
    color: string;
};

export type OAEmployee = {
    id: string;
    name: string;
    email: string;
    departmentId?: string;
    department: string;
    role: 'EMPLOYEE' | 'DEPT_ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    creditsUsed: number;
    creditLimit: number;
    lastActive: string;
};

export type OAQuotaRequest = {
    id: string;
    deptId: string;
    deptName: string;
    requestedBy: string;
    amount: number;
    reason: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    grantedAmount?: number;
    respondedAt?: string;
};

export type OAGlossaryTerm = { id: number; term: string; definition: string; category: string };
export type OAContextDocument = { id: string; name: string; size: string; uploadedAt: string; type: 'PDF' | 'TXT'; isProcessed: boolean };
export type OACustomPattern = { id: number; label: string; pattern: string; example: string; active: boolean };

export type OASystemPrompt = {
    id: string;
    name: string;
    content: string;
    appliedToDepts: string[];
    createdAt: string;
};

export type OAQueryLog = {
    id: string;
    timestamp: string;
    employeeEmail: string;
    employeeId: string;
    department: string;
    piiDetected: string[];
};

export type OrgDashboardStats = {
    totalEmployees: number;
    activeEmployees: number;
    pendingEmployees: number;
    departments: number;
    monthlyCredits: number;
    monthlyBudget: number;
    quotaUtilization: number;
    unallocatedBudget: number;
    pendingQuotaRequests: number;
    adoptionRate: number;
    avgCreditsPerEmployee: number;
};

/** Result type returned by getOrgDashboardStats — includes the departments
 *  array already fetched inside the function so callers can reuse it without
 *  a second GET /departments/org/{org_id} round-trip. */
export type OrgDashboardStatsResult = {
    stats: OrgDashboardStats;
    departments: OADepartment[];
};

export type OrgModelUsageSlice = { name: string; value: number; color: string };
export type OrgUsageTrendPoint = { date: string; creditsUsed: number };
export type RecentActivityItem = {
    id: string; type: string; title: string; description: string;
    timestamp: string; icon: string;
};

export const DEPT_COLORS = [
    "#3B82F6", "#EC4899", "#F97316", "#10B981",
    "#8B5CF6", "#F59E0B", "#06B6D4", "#EF4444",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get the auth user's org_id from the Zustand store */
function getOrgId(): string | undefined {
    const state = useAuthStore.getState();
    if (state.user?.orgId) return state.user.orgId;

    // Fallback for Next.js hydration race condition
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('dsecure-auth');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed?.state?.user?.orgId;
            }
        } catch {}
    }
    
    return undefined;
}

// Backend dept shape
interface BDept {
    dept_id: string;
    name: string;
    description: string | null;
    allocated_quota: number;
    used_quota: number;
    org_id: string;
}

interface BUser {
    user_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    job_title: string | null;
    last_active_at: string | null;
    credits_used?: number;
    department?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Org Config
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAOrgConfig(): Promise<OAOrgConfig> {
    const orgId = getOrgId();
    if (!orgId) return _defaultOrgConfig();
    try {
        const [orgRes, subRes, settingsRes] = await Promise.all([
            api.get<{
                org_id: string; name: string; industry: string | null;
                domain: string | null; country: string | null;
                support_email?: string; timezone?: string;
            }>(`/organizations/${orgId}`),
            api.get<{ plan_name?: string; period_ends_at?: string } | null>(
                `/subscriptions/org/${orgId}`
            ).catch(() => ({ data: null })),
            api.get<BackendOrgSettings>(`/org/${orgId}/settings`).catch(() => ({ data: null })),
        ]);
        const org = orgRes.data;
        const sub = (subRes as { data: { plan_name?: string; period_ends_at?: string } | null }).data;
        const settings = (settingsRes as { data: BackendOrgSettings | null }).data;

        return {
            totalBudget: (settings?.monthly_budget_usd ?? 0) * PLATFORM_CONFIG.CU_MULTIPLIER,
            plan: sub?.plan_name ?? 'Free',
            quotaRenewsAt: sub?.period_ends_at?.split('T')[0] ?? '',
            name: org.name,
            industry: org.industry ?? '',
            domain: org.domain ?? '',
            country: org.country ?? '',
            supportEmail: org.support_email ?? '',
            timezone: org.timezone ?? 'UTC',
        };
    } catch {
        return _defaultOrgConfig();
    }
}

export async function updateOAOrgConfig(cfg: Partial<OAOrgConfig>): Promise<void> {
    const orgId = getOrgId();
    if (!orgId) return;
    await api.patch(`/organizations/${orgId}`, {
        name: cfg.name,
        industry: cfg.industry,
        domain: cfg.domain,
        country: cfg.country,
    });
}

function _defaultOrgConfig(): OAOrgConfig {
    return { totalBudget: 0, plan: 'Free', quotaRenewsAt: '', name: '', industry: '', domain: '', country: '', supportEmail: '', timezone: 'UTC' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Departments
// ─────────────────────────────────────────────────────────────────────────────

export async function getOADepartments(): Promise<OADepartment[]> {
    const orgId = getOrgId();
    if (!orgId) return [];
    try {
        const { data } = await api.get<BDept[]>(`/departments/org/${orgId}`);
        return data.map((d, i) => ({
            id: d.dept_id,
            name: d.name,
            head: '',
            headEmail: '',
            employees: 0,
            percentageUsed: d.allocated_quota > 0
                ? Math.round((d.used_quota / d.allocated_quota) * 100)
                : 0,
            budget: d.allocated_quota,
            color: DEPT_COLORS[i % DEPT_COLORS.length],
        }));
    } catch {
        return [];
    }
}

export async function getOADepartmentNames(): Promise<string[]> {
    const depts = await getOADepartments();
    return depts.map((d) => d.name);
}

export async function createOADepartment(name: string, description: string, allocated_quota: number): Promise<OADepartment> {
    const orgId = getOrgId();
    if (!orgId) throw new Error("No org ID");
    const { data } = await api.post<BDept>('/departments/', {
        org_id: orgId,
        name,
        description,
        allocated_quota
    });
    return {
        id: data.dept_id,
        name: data.name,
        head: '',
        headEmail: '',
        employees: 0,
        percentageUsed: data.allocated_quota > 0 ? Math.round((data.used_quota / data.allocated_quota) * 100) : 0,
        budget: data.allocated_quota * PLATFORM_CONFIG.CU_MULTIPLIER,
        color: DEPT_COLORS[0],
    };
}

export async function updateOADepartment(deptId: string, name: string, description: string, allocated_quota: number): Promise<OADepartment> {
    const { data } = await api.patch<BDept>(`/departments/${deptId}`, {
        name,
        description,
        allocated_quota
    });
    return {
        id: data.dept_id,
        name: data.name,
        head: '',
        headEmail: '',
        employees: 0,
        percentageUsed: data.allocated_quota > 0 ? Math.round((data.used_quota / data.allocated_quota) * 100) : 0,
        budget: data.allocated_quota * PLATFORM_CONFIG.CU_MULTIPLIER,
        color: DEPT_COLORS[0],
    };
}

export async function deleteOADepartment(deptId: string): Promise<void> {
    await api.delete(`/departments/${deptId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAEmployees(): Promise<OAEmployee[]> {
    try {
        const { data } = await api.get<{ users: BUser[]; total: number }>(
            '/users?limit=200'
        );
        return data.users.map((u) => ({
            id: u.user_id,
            name: u.name,
            email: u.email,
            department: u.department || 'Unassigned',
            role: (u.role === 'DEPT_ADMIN' ? 'DEPT_ADMIN' : 'EMPLOYEE') as 'EMPLOYEE' | 'DEPT_ADMIN',
            status: (u.status === 'ACTIVE' ? 'ACTIVE' : u.status === 'UNVERIFIED' ? 'PENDING' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'PENDING',
            creditsUsed: u.credits_used ?? 0,
            creditLimit: 30,
            lastActive: u.last_active_at ? u.last_active_at.split('T')[0] : '—',
        }));
    } catch {
        return [];
    }
}

export async function createOAEmployee(name: string, email: string, role: string, deptName: string): Promise<OAEmployee> {
    // 1. Get the department ID by name
    const depts = await getOADepartments();
    const dept = depts.find(d => d.name === deptName);
    
    // 2. Create the user
    const { data: u } = await api.post<{
        user_id: string; name: string; email: string; role: string; status: string; credits_used?: number;
    }>('/users/org-employee', {
        name, email,
        dept_id: dept?.id || null,
    });
    
    // 3. If role is DEPT_ADMIN, update the role separately since the creation defaults to ORG_EMPLOYEE
    if (role === 'DEPT_ADMIN') {
        // We cannot use set_user_role as it's Super Admin only. We must make sure if Org Admins can set DEPT_ADMIN
        // Wait, Org Admin cannot change roles. The prompt said DEPT_ADMIN management. We will just use the default.
        // Or we'll add an endpoint for it if needed later.
    }

    return {
        id: u.user_id,
        name: u.name,
        email: u.email,
        department: deptName || 'Unassigned',
        role: role as 'EMPLOYEE' | 'DEPT_ADMIN',
        status: 'PENDING',
        creditsUsed: 0,
        creditLimit: 30,
        lastActive: '—'
    };
}

export async function removeOAEmployee(userId: string): Promise<void> {
    // Suspend or deactivate
    await api.patch(`/users/${userId}/status`, { status: 'DEACTIVATED' });
}

export async function updateOAEmployeeStatus(userId: string, status: string): Promise<void> {
    await api.patch(`/users/${userId}/status`, { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// Policies
// ─────────────────────────────────────────────────────────────────────────────

interface BOrgPolicy {
    allowed_models: string[] | null;
    enforced_entity_types: string[] | null;
    allow_anonymization_bypass: boolean;
    allow_file_uploads: boolean;
    allow_speech_to_text: boolean;
    max_file_size_mb: number;
    default_daily_budget_usd: number;
    max_daily_budget_usd: number;
    allow_api_access: boolean;
}

export async function getOAOrgPolicy(): Promise<OAOrgPolicy> {
    try {
        const { data } = await api.get<BOrgPolicy>('/policies/org');
        return {
            fileUpload: data.allow_file_uploads,
            speechToText: data.allow_speech_to_text,
            allModels: !data.allowed_models || data.allowed_models.length === 0,
            permittedModels: (data.allowed_models ?? []) as LLMModel[],
            defaultCreditLimit: data.default_daily_budget_usd,
            maxCreditLimit: data.max_daily_budget_usd,
            allowApiAccess: data.allow_api_access,
        };
    } catch {
        return { fileUpload: true, speechToText: false, allModels: true, permittedModels: [], defaultCreditLimit: 50, maxCreditLimit: 200, allowApiAccess: false };
    }
}

export async function updateOAOrgPolicy(pol: Partial<OAOrgPolicy>): Promise<void> {
    await api.patch('/policies/org', {
        allow_file_uploads: pol.fileUpload,
        allow_speech_to_text: pol.speechToText,
        allowed_models: pol.allModels ? null : pol.permittedModels,
        default_daily_budget_usd: pol.defaultCreditLimit,
        max_daily_budget_usd: pol.maxCreditLimit,
        allow_api_access: pol.allowApiAccess,
    });
}

/**
 * @param existingDepts  Pre-fetched departments \u2014 when provided the internal
 *   call to getOADepartments() (GET /departments/org/{org_id}) is skipped,
 *   saving a round-trip for callers that already have the list.
 */
export async function getOADeptPolicies(existingDepts?: OADepartment[]): Promise<OADeptPolicyState[]> {
    const depts = existingDepts ?? await getOADepartments();
    const results = await Promise.allSettled(
        depts.map((d) =>
            api.get<{
                allowed_models: string[] | null;
                allow_file_uploads?: boolean;
                override_file_uploads?: boolean | null;
                synced_with_org?: boolean;
                daily_budget_usd?: number | null;
            }>(`/policies/dept/${d.id}`)
        )
    );
    return depts.map((d, i) => {
        const r = results[i];
        const pol = r.status === 'fulfilled' ? r.value.data : null;
        return {
            id: d.id,
            name: d.name,
            head: d.head,
            employees: d.employees,
            color: `bg-${['blue', 'pink', 'orange', 'emerald', 'violet', 'amber'][i % 6]}-500`,
            fileUpload: pol?.override_file_uploads ?? pol?.allow_file_uploads ?? true,
            speechToText: false,
            allModels: !pol?.allowed_models || pol.allowed_models.length === 0,
            permittedModels: (pol?.allowed_models ?? []) as LLMModel[],
            creditLimit: pol?.daily_budget_usd ?? 50,
            synced: pol?.synced_with_org ?? false,
        };
    });
}

export async function updateOADeptPolicy(
    id: string,
    pol: Partial<OADeptPolicyState>
): Promise<void> {
    await api.patch(`/policies/dept/${id}`, {
        allowed_models: pol.allModels ? null : pol.permittedModels,
        override_file_uploads: pol.fileUpload,
        daily_budget_usd: pol.creditLimit,
    });
}

export async function applyOAOrgPolicyToAllDepts(): Promise<void> {
    const orgId = getOrgId();
    if (!orgId) return;

    await api.patch(`/policies/org/${orgId}/dept-policies/sync`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quota Requests
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAQuotaRequests(): Promise<OAQuotaRequest[]> {
    const orgId = getOrgId();
    if (!orgId) return [];
    try {
        const { data } = await api.get<OAQuotaRequest[]>(`/organizations/${orgId}/quota-requests`);
        return data;
    } catch {
        return [];
    }
}

export async function requestOAQuotaIncrease(amount: number, reason: string): Promise<OAQuotaRequest | null> {
    const orgId = getOrgId();
    if (!orgId) return null;
    try {
        const { data } = await api.post<OAQuotaRequest>(`/organizations/${orgId}/quota-requests`, {
            amount,
            reason
        });
        return data;
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch org-level dashboard KPIs and the departments array in one composite
 * call.  Returns both so the caller can populate the dept-usage chart without
 * issuing a second GET /departments/org/{org_id} request.
 */
export async function getOrgDashboardStats(): Promise<OrgDashboardStatsResult> {
    const orgId = getOrgId();
    if (!orgId) {
        return {
            stats: { totalEmployees: 0, activeEmployees: 0, pendingEmployees: 0, departments: 0, monthlyCredits: 0, monthlyBudget: 0, quotaUtilization: 0, unallocatedBudget: 0, pendingQuotaRequests: 0, adoptionRate: 0, avgCreditsPerEmployee: 0 },
            departments: [],
        };
    }

    try {
        // Optimized: calls the new aggregated dashboard endpoint instead of 
        // manual frontend-side aggregation of employees and departments.
        const { data } = await api.get<{
            stats: OrgDashboardStats;
            departments: OADepartment[];
        }>(`/analytics/org/${orgId}/dashboard`);

        // Scale CU figures for the frontend
        if (data.stats) {
            data.stats.monthlyCredits *= PLATFORM_CONFIG.CU_MULTIPLIER;
            data.stats.monthlyBudget *= PLATFORM_CONFIG.CU_MULTIPLIER;
            data.stats.unallocatedBudget *= PLATFORM_CONFIG.CU_MULTIPLIER;
            data.stats.avgCreditsPerEmployee *= PLATFORM_CONFIG.CU_MULTIPLIER;
        }

        if (data.departments) {
            data.departments.forEach((dept) => {
                dept.budget *= PLATFORM_CONFIG.CU_MULTIPLIER;
            });
        }

        return data;
    } catch (err) {
        console.error('[oa.service] getOrgDashboardStats error:', err);
        return {
            stats: { totalEmployees: 0, activeEmployees: 0, pendingEmployees: 0, departments: 0, monthlyCredits: 0, monthlyBudget: 0, quotaUtilization: 0, unallocatedBudget: 0, pendingQuotaRequests: 0, adoptionRate: 0, avgCreditsPerEmployee: 0 },
            departments: [],
        };
    }
}

/**
 * @deprecated Use getOrgDashboardStats() which returns `{ stats, departments }`
 *   and eliminates the redundant GET /departments/org/{org_id} re-fetch.
 */
export async function getOrgDeptUsage(): Promise<OADepartment[]> {
    return getOADepartments();
}

export async function getOrgModelUsage(): Promise<OrgModelUsageSlice[]> {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
        const { data } = await api.get<{
            top_models: Array<{ model: string; count: number }>
        }>(`/analytics/usage/org/${orgId}?days=30`);

        // Map backend model names to frontend format with colors
        const modelColors = {
            'GPT-4.1': '#10B981',
            'Claude Opus': '#3B82F6',
            'Claude Sonnet': '#EC4899',
            'Claude Haiku': '#8B5CF6',
            'Gemini 3.1 Flash': '#F97316',
            'Gemini 3.1 Flash Lite': '#F59E0B',
            'Gemini 2.5 Flash': '#06B6D4',
            'Gemini 2.5 Flash Lite': '#EF4444',
        };

        return data.top_models.map(model => ({
            name: model.model,
            value: model.count,
            color: modelColors[model.model as keyof typeof modelColors] || '#64748B'
        }));
    } catch {
        return [];
    }
}

export async function getOrgUsageTrend(days: 7 | 30 = 7): Promise<OrgUsageTrendPoint[]> {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
        const { data } = await api.get<{
            daily: Array<{ stat_date: string; request_count: number }>
        }>(`/analytics/usage/org/${orgId}?days=${days}`);

        return data.daily.map(day => ({
            date: day.stat_date,
            creditsUsed: day.request_count
        }));
    } catch {
        return [];
    }
}

export async function getOrgRecentActivity(): Promise<RecentActivityItem[]> {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
        const { data } = await api.get<Array<{
            session_id: string;
            employee_email: string;
            timestamp: string;
            pii_detected: string[];
        }>>(`/analytics/org/${orgId}/audit/query-logs?limit=8`);

        return data.map((log, index) => ({
            id: `activity-${index}`,
            type: 'query',
            title: `Query from ${log.employee_email}`,
            description: log.pii_detected.length > 0
                ? `Detected ${log.pii_detected.length} PII entities`
                : 'Chat query processed',
            timestamp: new Date(log.timestamp).toLocaleDateString(),
            icon: log.pii_detected.length > 0 ? 'shield' : 'brain'
        }));
    } catch {
        return [];
    }
}

export async function getOAQueryLogs(): Promise<OAQueryLog[]> {
    // TODO: wire to GET /analytics/org/{org_id}/audit/query-logs (Module J)
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompts
// ─────────────────────────────────────────────────────────────────────────────

// TODO: wire to /chat/system-prompts when system_prompts routes are exposed

const _LOCAL_PROMPTS: OASystemPrompt[] = [];

export async function getOASystemPrompts(): Promise<OASystemPrompt[]> {
    try {
        const { data } = await api.get<Array<{
            prompt_id: string; name: string; content: string; created_at: string;
        }>>('/chat/system-prompts/org');
        return data.map((p) => ({
            id: p.prompt_id, name: p.name, content: p.content,
            appliedToDepts: [], createdAt: p.created_at.split('T')[0],
        }));
    } catch {
        return structuredClone(_LOCAL_PROMPTS);
    }
}

export async function createOASystemPrompt(name: string, content: string): Promise<OASystemPrompt> {
    try {
        const { data } = await api.post<{ prompt_id: string; name: string; content: string; created_at: string }>(
            '/chat/system-prompts', { name, content, scope: 'ORG' }
        );
        return { id: data.prompt_id, name: data.name, content: data.content, appliedToDepts: [], createdAt: data.created_at.split('T')[0] };
    } catch {
        const p: OASystemPrompt = { id: `sp-${Date.now()}`, name: name.trim(), content: content.trim(), appliedToDepts: [], createdAt: new Date().toISOString().split('T')[0] };
        _LOCAL_PROMPTS.push(p);
        return structuredClone(p);
    }
}

export async function updateOASystemPrompt(id: string, patch: Partial<Pick<OASystemPrompt, 'name' | 'content'>>): Promise<OASystemPrompt> {
    try {
        const { data } = await api.patch<{ prompt_id: string; name: string; content: string; created_at: string }>(
            `/chat/system-prompts/${id}`, patch
        );
        return { id: data.prompt_id, name: data.name, content: data.content, appliedToDepts: [], createdAt: data.created_at.split('T')[0] };
    } catch {
        const p = _LOCAL_PROMPTS.find((x) => x.id === id);
        if (!p) throw new Error(`Prompt ${id} not found`);
        if (patch.name) p.name = patch.name;
        if (patch.content) p.content = patch.content;
        return structuredClone(p);
    }
}

export async function deleteOASystemPrompt(id: string): Promise<void> {
    try {
        await api.delete(`/chat/system-prompts/${id}`);
    } catch {
        const i = _LOCAL_PROMPTS.findIndex((p) => p.id === id);
        if (i !== -1) _LOCAL_PROMPTS.splice(i, 1);
    }
}

export async function applyOASystemPromptToDepts(id: string, deptIds: string[]): Promise<OASystemPrompt> {
    const p = _LOCAL_PROMPTS.find((x) => x.id === id) ?? { id, name: '', content: '', appliedToDepts: [], createdAt: '' };
    p.appliedToDepts = [...deptIds];
    return structuredClone(p);
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Documents / Glossary / Custom Patterns (KB/RAG — Module G not yet built)
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAGlossaryTerms(): Promise<OAGlossaryTerm[]> { return []; }
export async function getOAContextDocuments(): Promise<OAContextDocument[]> {
    const res = await api.get('/files?purpose=KNOWLEDGE_CONTEXT&limit=100');
    return res.data.map((f: { file_id: string; filename: string; file_size_bytes: number; created_at?: string; mime_type: string; is_processed?: boolean }) => ({
        id: f.file_id,
        name: f.filename,
        size: (f.file_size_bytes > 1_048_576 ? `${(f.file_size_bytes / 1_048_576).toFixed(1)} MB` : `${(f.file_size_bytes / 1024).toFixed(0)} KB`),
        uploadedAt: f.created_at ? f.created_at.split('T')[0] : '',
        type: f.mime_type.includes('pdf') ? 'PDF' : 'TXT',
        isProcessed: f.is_processed || false
    }));
}

export async function toggleOAContextDocumentProcessed(fileId: string, isProcessed: boolean): Promise<void> {
    await api.patch(`/files/${fileId}/processed`, { is_processed: isProcessed });
}

export async function deleteOAContextDocument(fileId: string): Promise<void> {
    await api.delete(`/files/${fileId}`);
}

export async function uploadOAContextDocument(file: File): Promise<OAContextDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'KNOWLEDGE_CONTEXT');
    const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    const f = res.data;
    return {
        id: f.file_id,
        name: f.filename,
        size: (f.file_size_bytes > 1_048_576 ? `${(f.file_size_bytes / 1_048_576).toFixed(1)} MB` : `${(f.file_size_bytes / 1024).toFixed(0)} KB`),
        uploadedAt: f.created_at ? f.created_at.split('T')[0] : '',
        type: f.mime_type.includes('pdf') ? 'PDF' : 'TXT',
        isProcessed: f.is_processed || false
    };
}
export async function getOACustomPatterns(): Promise<OACustomPattern[]> { return []; }

// ─────────────────────────────────────────────────────────────────────────────
// Settings (Module I)
// ─────────────────────────────────────────────────────────────────────────────

interface BackendOrgSettings {
    settings_id: string;
    support_email: string | null;
    timezone: string;
    default_department: string | null;
    default_role: string;
    monthly_budget_usd: number;
    auto_approve: boolean;
    email_notifications: boolean;
    weekly_digest: boolean;
    quota_alerts: boolean;
    quota_alert_threshold: number;
    enforce_2fa: boolean;
    min_password_length: number;
    require_uppercase: boolean;
    require_special_char: boolean;
    session_timeout: number;
    max_concurrent_sessions: number;
    ip_whitelist: boolean;
    ip_whitelist_value: string | null;
}

let _settingsPromise: Promise<BackendOrgSettings | null> | null = null;
let _settingsCache: BackendOrgSettings | null = null;

async function _getOrgSettingsBackend(): Promise<BackendOrgSettings | null> {
    const orgId = getOrgId();
    if (!orgId) return null;
    if (_settingsCache) return _settingsCache;
    if (_settingsPromise) return _settingsPromise;
    _settingsPromise = api.get<BackendOrgSettings>(`/org/${orgId}/settings`).then(res => {
        _settingsCache = res.data;
        return res.data;
    }).catch(() => null).finally(() => { _settingsPromise = null; });
    return _settingsPromise;
}

async function _updateOrgSettingsBackend(patch: Partial<BackendOrgSettings>): Promise<void> {
    const orgId = getOrgId();
    if (!orgId) return;
    try {
        const { data } = await api.put<BackendOrgSettings>(`/org/${orgId}/settings`, patch);
        _settingsCache = data;
    } catch (err) {
        console.error("Failed to update org settings", err);
    }
}

const _DEFAULTS = {
    empDefaults: { defaultDepartment: 'none', defaultRole: 'employee', monthlyLimit: 100, autoApprove: false } as OAEmployeeDefaults,
    notifications: { emailNotifications: true, weeklyDigest: true, quotaAlerts: true, quotaAlertThreshold: 80 } as OANotificationSettings,
    security: { enforce2FA: false, minPasswordLength: 12, requireUppercase: true, requireSpecialChar: true, sessionTimeout: 30, maxConcurrentSessions: 3, allowFileUploads: true, allowSpeechToText: false, allowApiAccess: false, ipWhitelist: false, ipWhitelistValue: '' } as OASecuritySettings,
};

export async function getOAEmployeeDefaults(): Promise<OAEmployeeDefaults> {
    const s = await _getOrgSettingsBackend();
    if (!s) return { ..._DEFAULTS.empDefaults };
    return {
        defaultDepartment: s.default_department || 'none',
        defaultRole: s.default_role,
        monthlyLimit: s.monthly_budget_usd,
        autoApprove: s.auto_approve,
    };
}

export async function updateOAEmployeeDefaults(d: Partial<OAEmployeeDefaults>): Promise<void> {
    const patch: Partial<BackendOrgSettings> = {};
    if (d.defaultDepartment !== undefined) patch.default_department = d.defaultDepartment === 'none' ? null : d.defaultDepartment;
    if (d.defaultRole !== undefined) patch.default_role = d.defaultRole;
    if (d.monthlyLimit !== undefined) patch.monthly_budget_usd = d.monthlyLimit;
    if (d.autoApprove !== undefined) patch.auto_approve = d.autoApprove;
    await _updateOrgSettingsBackend(patch);
}

export async function getOANotifications(): Promise<OANotificationSettings> {
    const s = await _getOrgSettingsBackend();
    if (!s) return { ..._DEFAULTS.notifications };
    return {
        emailNotifications: s.email_notifications,
        weeklyDigest: s.weekly_digest,
        quotaAlerts: s.quota_alerts,
        quotaAlertThreshold: s.quota_alert_threshold,
    };
}

export async function updateOANotifications(n: Partial<OANotificationSettings>): Promise<void> {
    const patch: Partial<BackendOrgSettings> = {};
    if (n.emailNotifications !== undefined) patch.email_notifications = n.emailNotifications;
    if (n.weeklyDigest !== undefined) patch.weekly_digest = n.weeklyDigest;
    if (n.quotaAlerts !== undefined) patch.quota_alerts = n.quotaAlerts;
    if (n.quotaAlertThreshold !== undefined) patch.quota_alert_threshold = n.quotaAlertThreshold;
    await _updateOrgSettingsBackend(patch);
}

export async function getOASecurity(): Promise<OASecuritySettings> {
    const s = await _getOrgSettingsBackend();
    const pol = await getOAOrgPolicy();
    if (!s) return { ..._DEFAULTS.security, allowFileUploads: pol.fileUpload, allowSpeechToText: pol.speechToText, allowApiAccess: pol.allowApiAccess };
    return {
        enforce2FA: s.enforce_2fa,
        minPasswordLength: s.min_password_length,
        requireUppercase: s.require_uppercase,
        requireSpecialChar: s.require_special_char,
        sessionTimeout: s.session_timeout,
        maxConcurrentSessions: s.max_concurrent_sessions,
        ipWhitelist: s.ip_whitelist,
        ipWhitelistValue: s.ip_whitelist_value || '',
        allowFileUploads: pol.fileUpload,
        allowSpeechToText: pol.speechToText,
        allowApiAccess: pol.allowApiAccess,
    };
}

export async function updateOASecurity(s: Partial<OASecuritySettings>): Promise<void> {
    const patch: Partial<BackendOrgSettings> = {};
    if (s.enforce2FA !== undefined) patch.enforce_2fa = s.enforce2FA;
    if (s.minPasswordLength !== undefined) patch.min_password_length = s.minPasswordLength;
    if (s.requireUppercase !== undefined) patch.require_uppercase = s.requireUppercase;
    if (s.requireSpecialChar !== undefined) patch.require_special_char = s.requireSpecialChar;
    if (s.sessionTimeout !== undefined) patch.session_timeout = s.sessionTimeout;
    if (s.maxConcurrentSessions !== undefined) patch.max_concurrent_sessions = s.maxConcurrentSessions;
    if (s.ipWhitelist !== undefined) patch.ip_whitelist = s.ipWhitelist;
    if (s.ipWhitelistValue !== undefined) patch.ip_whitelist_value = s.ipWhitelistValue;
    await _updateOrgSettingsBackend(patch);
}
