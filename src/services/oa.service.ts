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
import { estimateMonthlyCreditsFixed } from '@/lib/costCalculator';
import { useAuthStore } from '@/store/auth.store';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical types (unchanged — pages depend on these)
// ─────────────────────────────────────────────────────────────────────────────

export type OAOrgConfig = {
    totalBudget:    number;
    plan:           string;
    quotaRenewsAt:  string;
    name:           string;
    industry:       string;
    domain:         string;
    country:        string;
    supportEmail:   string;
    timezone:       string;
};

export type OAEmployeeDefaults = {
    defaultDepartment: string;
    defaultRole:       string;
    monthlyLimit:      number;
    autoApprove:       boolean;
};

export type OANotificationSettings = {
    emailNotifications:  boolean;
    weeklyDigest:        boolean;
    quotaAlerts:         boolean;
    quotaAlertThreshold: number;
};

export type OASecuritySettings = {
    enforce2FA:            boolean;
    minPasswordLength:     number;
    requireUppercase:      boolean;
    requireSpecialChar:    boolean;
    sessionTimeout:        number;
    maxConcurrentSessions: number;
    allowFileUploads:      boolean;
    allowSpeechToText:     boolean;
    allowApiAccess:        boolean;
    ipWhitelist:           boolean;
    ipWhitelistValue:      string;
};

export type OAOrgPolicy = {
    fileUpload:         boolean;
    speechToText:       boolean;
    allModels:          boolean;
    permittedModels:    LLMModel[];
    defaultCreditLimit: number;
    maxCreditLimit:     number;
    allowApiAccess:     boolean;
};

export type OADeptPolicyState = {
    id:              string;
    name:            string;
    head:            string;
    employees:       number;
    color:           string;
    fileUpload:      boolean;
    speechToText:    boolean;
    allModels:       boolean;
    permittedModels: LLMModel[];
    creditLimit:     number;
    synced:          boolean;
};

export type OADepartment = {
    id:             string;
    name:           string;
    head:           string;
    headEmail:      string;
    employees:      number;
    percentageUsed: number;
    budget:         number;
    color:          string;
};

export type OAEmployee = {
    id:            string;
    name:          string;
    email:         string;
    departmentId?: string;
    department:    string;
    role:          'EMPLOYEE' | 'DEPT_ADMIN';
    status:        'ACTIVE' | 'INACTIVE' | 'PENDING';
    creditsUsed:   number;
    creditLimit:   number;
    lastActive:    string;
};

export type OAQuotaRequest = {
    id:            string;
    deptId:        string;
    deptName:      string;
    requestedBy:   string;
    amount:        number;
    reason:        string;
    date:          string;
    status:        'PENDING' | 'APPROVED' | 'DENIED';
    grantedAmount?: number;
    respondedAt?:  string;
};

export type OAGlossaryTerm = { id: number; term: string; definition: string; category: string };
export type OAContextDocument = { id: number; name: string; size: string; uploadedAt: string; type: 'PDF' | 'TXT' };
export type OACustomPattern = { id: number; label: string; pattern: string; example: string; active: boolean };

export type OASystemPrompt = {
    id:             string;
    name:           string;
    content:        string;
    appliedToDepts: string[];
    createdAt:      string;
};

export type OAQueryLog = {
    id:            string;
    timestamp:     string;
    employeeEmail: string;
    employeeId:    string;
    department:    string;
    piiDetected:   string[];
};

export type OrgDashboardStats = {
    totalEmployees:        number;
    activeEmployees:       number;
    pendingEmployees:      number;
    departments:           number;
    monthlyCredits:        number;
    monthlyBudget:         number;
    quotaUtilization:      number;
    unallocatedBudget:     number;
    pendingQuotaRequests:  number;
    adoptionRate:          number;
    avgCreditsPerEmployee: number;
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
    return useAuthStore.getState().user?.orgId ?? undefined;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Org Config
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAOrgConfig(): Promise<OAOrgConfig> {
    const orgId = getOrgId();
    if (!orgId) return _defaultOrgConfig();
    try {
        const [orgRes, subRes] = await Promise.all([
            api.get<{
                org_id: string; name: string; industry: string | null;
                domain: string | null; country: string | null;
                support_email?: string; timezone?: string;
            }>(`/organizations/${orgId}`),
            api.get<{ plan_name?: string; period_ends_at?: string } | null>(
                `/subscriptions/org/${orgId}`
            ).catch(() => ({ data: null })),
        ]);
        const org = orgRes.data;
        const sub = (subRes as { data: { plan_name?: string; period_ends_at?: string } | null }).data;
        return {
            totalBudget:   0,
            plan:          sub?.plan_name ?? 'Free',
            quotaRenewsAt: sub?.period_ends_at?.split('T')[0] ?? '',
            name:          org.name,
            industry:      org.industry ?? '',
            domain:        org.domain ?? '',
            country:       org.country ?? '',
            supportEmail:  org.support_email ?? '',
            timezone:      org.timezone ?? 'UTC',
        };
    } catch {
        return _defaultOrgConfig();
    }
}

export async function updateOAOrgConfig(cfg: Partial<OAOrgConfig>): Promise<void> {
    const orgId = getOrgId();
    if (!orgId) return;
    await api.patch(`/organizations/${orgId}`, {
        name:     cfg.name,
        industry: cfg.industry,
        domain:   cfg.domain,
        country:  cfg.country,
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
            id:             d.dept_id,
            name:           d.name,
            head:           '',
            headEmail:      '',
            employees:      0,
            percentageUsed: d.allocated_quota > 0
                ? Math.round((d.used_quota / d.allocated_quota) * 100)
                : 0,
            budget: d.allocated_quota,
            color:  DEPT_COLORS[i % DEPT_COLORS.length],
        }));
    } catch {
        return [];
    }
}

export async function getOADepartmentNames(): Promise<string[]> {
    const depts = await getOADepartments();
    return depts.map((d) => d.name);
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
            id:          u.user_id,
            name:        u.name,
            email:       u.email,
            department:  '',
            role:        (u.role === 'DEPT_ADMIN' ? 'DEPT_ADMIN' : 'EMPLOYEE') as 'EMPLOYEE' | 'DEPT_ADMIN',
            status:      (u.status === 'ACTIVE' ? 'ACTIVE' : u.status === 'UNVERIFIED' ? 'PENDING' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'PENDING',
            creditsUsed: 0,
            creditLimit: 30,
            lastActive:  u.last_active_at ? u.last_active_at.split('T')[0] : '—',
        }));
    } catch {
        return [];
    }
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
    default_daily_limit: number;
    max_daily_limit: number;
    allow_api_access: boolean;
}

export async function getOAOrgPolicy(): Promise<OAOrgPolicy> {
    try {
        const { data } = await api.get<BOrgPolicy>('/policies/org');
        return {
            fileUpload:         data.allow_file_uploads,
            speechToText:       data.allow_speech_to_text,
            allModels:          !data.allowed_models || data.allowed_models.length === 0,
            permittedModels:    (data.allowed_models ?? []) as LLMModel[],
            defaultCreditLimit: data.default_daily_limit,
            maxCreditLimit:     data.max_daily_limit,
            allowApiAccess:     data.allow_api_access,
        };
    } catch {
        return { fileUpload: true, speechToText: false, allModels: true, permittedModels: [], defaultCreditLimit: 50, maxCreditLimit: 200, allowApiAccess: false };
    }
}

export async function updateOAOrgPolicy(pol: Partial<OAOrgPolicy>): Promise<void> {
    await api.patch('/policies/org', {
        allow_file_uploads:  pol.fileUpload,
        allow_speech_to_text: pol.speechToText,
        allowed_models:      pol.allModels ? null : pol.permittedModels,
        default_daily_limit: pol.defaultCreditLimit,
        max_daily_limit:     pol.maxCreditLimit,
        allow_api_access:    pol.allowApiAccess,
    });
}

export async function getOADeptPolicies(): Promise<OADeptPolicyState[]> {
    const depts = await getOADepartments();
    const results = await Promise.allSettled(
        depts.map((d) =>
            api.get<{
                allowed_models: string[] | null;
                allow_file_uploads?: boolean;
                override_file_uploads?: boolean | null;
                synced_with_org?: boolean;
                daily_limit?: number | null;
            }>(`/policies/dept/${d.id}`)
        )
    );
    return depts.map((d, i) => {
        const r = results[i];
        const pol = r.status === 'fulfilled' ? r.value.data : null;
        return {
            id:              d.id,
            name:            d.name,
            head:            d.head,
            employees:       d.employees,
            color:           `bg-${['blue','pink','orange','emerald','violet','amber'][i % 6]}-500`,
            fileUpload:      pol?.override_file_uploads ?? pol?.allow_file_uploads ?? true,
            speechToText:    false,
            allModels:       !pol?.allowed_models || pol.allowed_models.length === 0,
            permittedModels: (pol?.allowed_models ?? []) as LLMModel[],
            creditLimit:     pol?.daily_limit ?? 50,
            synced:          pol?.synced_with_org ?? false,
        };
    });
}

export async function updateOADeptPolicy(
    id: string,
    pol: Partial<OADeptPolicyState>
): Promise<void> {
    await api.patch(`/policies/dept/${id}`, {
        allowed_models:      pol.allModels ? null : pol.permittedModels,
        override_file_uploads: pol.fileUpload,
        daily_limit:         pol.creditLimit,
    });
}

export async function applyOAOrgPolicyToAllDepts(): Promise<void> {
    const depts = await getOADepartments();
    const orgPol = await getOAOrgPolicy();
    await Promise.all(
        depts.map((d) =>
            api.patch(`/policies/dept/${d.id}`, {
                allowed_models:       orgPol.allModels ? null : orgPol.permittedModels,
                override_file_uploads: orgPol.fileUpload,
                daily_limit:          orgPol.defaultCreditLimit,
                synced_with_org:      true,
            })
        )
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quota Requests
// ─────────────────────────────────────────────────────────────────────────────

export async function getOAQuotaRequests(): Promise<OAQuotaRequest[]> {
    // TODO: wire to /org/{org_id}/quota/requests when Module K is complete
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrgDashboardStats(): Promise<OrgDashboardStats> {
    try {
        const [depts, employees] = await Promise.all([
            getOADepartments(),
            getOAEmployees(),
        ]);
        const active  = employees.filter((e) => e.status === 'ACTIVE').length;
        const pending = employees.filter((e) => e.status === 'PENDING').length;
        const totalBudget  = depts.reduce((s, d) => s + d.budget, 0);
        const usedCredits  = depts.reduce((s, d) => s + (d.budget * d.percentageUsed / 100), 0);
        return {
            totalEmployees:        employees.length,
            activeEmployees:       active,
            pendingEmployees:      pending,
            departments:           depts.length,
            monthlyCredits:        Math.round(usedCredits),
            monthlyBudget:         totalBudget,
            quotaUtilization:      totalBudget > 0 ? Math.round((usedCredits / totalBudget) * 100) : 0,
            unallocatedBudget:     0,
            pendingQuotaRequests:  0,
            adoptionRate:          employees.length > 0 ? Math.round((active / employees.length) * 100) : 0,
            avgCreditsPerEmployee: active > 0 ? Math.round((usedCredits / active) * 10) / 10 : 0,
        };
    } catch {
        return { totalEmployees: 0, activeEmployees: 0, pendingEmployees: 0, departments: 0, monthlyCredits: 0, monthlyBudget: 0, quotaUtilization: 0, unallocatedBudget: 0, pendingQuotaRequests: 0, adoptionRate: 0, avgCreditsPerEmployee: 0 };
    }
}

export async function getOrgDeptUsage(): Promise<OADepartment[]> {
    return getOADepartments();
}

export async function getOrgModelUsage(): Promise<OrgModelUsageSlice[]> {
    // TODO: wire to GET /analytics/usage/org/{org_id} model_breakdown when Module J complete
    return [];
}

export async function getOrgUsageTrend(_days: 7 | 30 = 7): Promise<OrgUsageTrendPoint[]> {
    // TODO: wire to Module J analytics endpoint
    return [];
}

export async function getOrgRecentActivity(): Promise<RecentActivityItem[]> {
    return [];
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
        if (patch.name)    p.name = patch.name;
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

export async function getOAGlossaryTerms(): Promise<OAGlossaryTerm[]>     { return []; }
export async function getOAContextDocuments(): Promise<OAContextDocument[]>{ return []; }
export async function getOACustomPatterns(): Promise<OACustomPattern[]>    { return []; }

// ─────────────────────────────────────────────────────────────────────────────
// Settings stubs (Module I — not yet on backend)
// ─────────────────────────────────────────────────────────────────────────────

// PHASE2_PLACEHOLDER — Settings stubs (Module I — not yet on backend)
const _DEFAULTS = {
    empDefaults: { defaultDepartment: 'none', defaultRole: 'employee', monthlyLimit: 100, autoApprove: false } as OAEmployeeDefaults,
    notifications: { emailNotifications: true, weeklyDigest: true, quotaAlerts: true, quotaAlertThreshold: 80 } as OANotificationSettings,
    security: { enforce2FA: false, minPasswordLength: 12, requireUppercase: true, requireSpecialChar: true, sessionTimeout: 30, maxConcurrentSessions: 3, allowFileUploads: true, allowSpeechToText: false, allowApiAccess: false, ipWhitelist: false, ipWhitelistValue: '' } as OASecuritySettings,
};

export async function getOAEmployeeDefaults(): Promise<OAEmployeeDefaults>            { return { ..._DEFAULTS.empDefaults }; }
export async function updateOAEmployeeDefaults(d: Partial<OAEmployeeDefaults>): Promise<void> { Object.assign(_DEFAULTS.empDefaults, d); }
export async function getOANotifications(): Promise<OANotificationSettings>           { return { ..._DEFAULTS.notifications }; }
export async function updateOANotifications(n: Partial<OANotificationSettings>): Promise<void>{ Object.assign(_DEFAULTS.notifications, n); }
export async function getOASecurity(): Promise<OASecuritySettings>                    { return { ..._DEFAULTS.security }; }
export async function updateOASecurity(s: Partial<OASecuritySettings>): Promise<void> { Object.assign(_DEFAULTS.security, s); }
