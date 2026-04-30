/**
 * da.service.ts — Department Admin portal: real backend integration
 *
 * Backend routes used:
 *   GET    /api/v1/departments/org/{org_id}                     → all depts (find current)
 *   PATCH  /api/v1/departments/{dept_id}                        → update dept
 *   GET    /api/v1/users?limit=200                              → dept employees
 *   PATCH  /api/v1/users/{user_id}/status                       → restrict/activate
 *   GET    /api/v1/policies/dept/{dept_id}                      → dept policy
 *   PATCH  /api/v1/policies/dept/{dept_id}                      → save dept policy
 *   GET    /api/v1/policies/dept/{dept_id}/access               → per-user access
 *   PUT    /api/v1/policies/dept/{dept_id}/access/{user_id}     → update access
 *   GET    /api/v1/analytics/quota/me                           → current dept quota
 *
 * NOTE: Quota-request flows (approve/deny/submit) require a dedicated backend
 * endpoint that does not exist yet (Module K). These use local state fallbacks.
 */

import api from './api';
import { MODELS } from '@/lib/constants';
import type { LLMModel } from '@/types/chat.types';
import {
    estimateMonthlyCreditsFixed,
} from '@/lib/costCalculator';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptInfo = {
    name:          string;
    subtitle:      string;
    headName:      string;
    monthlyBudget: number;
    quotaRenewsAt: string;
};

export type DeptQuota = {
    percentageUsed: number;
    budget:         number;
    renewsAt:       string;
};

export type EmpQuotaRequest = {
    id:              string;
    employeeId:      string;
    name:            string;
    email:           string;
    credits:         number;
    grantedCredits?: number;
    reason:          string;
    date:            string;
    status:          'PENDING' | 'APPROVED' | 'DENIED';
};

export type OrgQuotaRequest = {
    id:          string;
    credits:     number;
    reason:      string;
    status:      'PENDING' | 'APPROVED' | 'DENIED';
    date:        string;
    respondedBy: string;
};

export type OrgRole = {
    id:                 string;
    name:               string;
    description:        string;
    defaultCreditLimit: number;
};

export type DeptEmployee = {
    id:          string;
    name:        string;
    email:       string;
    roleId:      string;
    roleName:    string;
    status:      'ACTIVE' | 'INACTIVE';
    creditsUsed: number;
    creditLimit: number;
    lastActive:  string;
};

export type EmpAccessData = {
    id:            string;
    name:          string;
    email:         string;
    roleName:      string;
    fileUpload:    boolean;
    speechToText:  boolean;
    allModels:     boolean;
    allowedModels: LLMModel[];
    limit:         number;
};

export type DeptPolicy = {
    fileUpload:      boolean;
    speechToText:    boolean;
    allModels:       boolean;
    permittedModels: LLMModel[];
    creditLimit:     number;
};

export type DASystemPrompt = {
    id:                  string;
    name:                string;
    content:             string;
    appliedToEmployees:  string[];
    createdAt:           string;
    enforcedByOrg?:      boolean;
};

// ─── Dashboard analytics types ───────────────────────────────────────────────

export type DeptDashboardStats = {
    totalEmployees:        number;
    activeEmployees:       number;
    monthlyCreditsUsed:    number;
    monthlyCreditBudget:   number;
    modelsInUse:           number;
    totalModelsAvailable:  number;
    avgCreditsPerEmployee: number;
    quotaUtilization:      number;
};

export type DailyUsagePoint   = { date: string; credits: number; activeUsers: number };
export type DailyRequestPoint  = DailyUsagePoint;
export type ModelUsageSlice    = { name: string; value: number; color: string };
export type RoleUsagePoint     = { role: string; employees: number; totalCredits: number; avgCredits: number };
export type UsageTrendPoint    = { date: string; credits: number; activeUsers: number };
export type RequestTypePoint   = UsageTypePoint;

export type UsageTypePoint = {
    type:        string;
    credits:     number;
    percentage:  number;
    priority:    'high' | 'medium' | 'low';
    description: string;
    color:       string;
};

// ─── Backend shapes ────────────────────────────────────────────────────────────

interface BUser {
    user_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    job_title: string | null;
    last_active_at: string | null;
}

interface BPolicy {
    allowed_models: string[] | null;
    override_file_uploads: boolean | null;
    allow_file_uploads?: boolean;
    allow_speech_to_text?: boolean;
    daily_limit: number | null;
    synced_with_org?: boolean;
}

interface BAccess {
    user_id: string;
    file_upload_allowed: boolean;
    stt_allowed: boolean;
    allowed_models: string[] | null;
    daily_limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_MODEL_IDS = MODELS.map((m) => m.id) as LLMModel[];

function getDeptId(): string | undefined {
    return useAuthStore.getState().user?.deptId ?? undefined;
}

// PHASE2_PLACEHOLDER — Local fallbacks for backend endpoints not yet implemented
const _localEmpQuotaRequests: EmpQuotaRequest[] = [];   // TODO: GET /dept/{dept_id}/quota-requests
const _localOrgQuotaHistory: OrgQuotaRequest[] = [];    // TODO: GET /dept/{dept_id}/org-quota-history
const _localSystemPrompts: DASystemPrompt[] = [];       // TODO: GET /chat/system-prompts/dept

// ─── Org Roles (no backend endpoint yet — use static list) ─────────────────────

const ROLE_BUDGETS: Record<string, number> = {
    'role-1': estimateMonthlyCreditsFixed({ queriesPerDay: 8, avgInputWords: 300, avgOutputWords: 500, modelKey: 'gpt-4.1',          fileQueryPct: 0.30, avgFileWords: 800, ragPct: 0.10 }),
    'role-2': estimateMonthlyCreditsFixed({ queriesPerDay: 6, avgInputWords: 250, avgOutputWords: 400, modelKey: 'gpt-4.1',          fileQueryPct: 0.20, avgFileWords: 600, ragPct: 0.10 }),
    'role-3': estimateMonthlyCreditsFixed({ queriesPerDay: 5, avgInputWords: 200, avgOutputWords: 350, modelKey: 'claude-haiku-4-5',  fileQueryPct: 0.15, avgFileWords: 400, ragPct: 0.05 }),
    'role-4': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 200, avgOutputWords: 300, modelKey: 'gemini-3.1-flash-preview', fileQueryPct: 0.10, avgFileWords: 300, ragPct: 0.05 }),
    'role-5': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 150, avgOutputWords: 250, modelKey: 'gemini-2.5-flash',   fileQueryPct: 0.05, avgFileWords: 200, ragPct: 0.00 }),
    'role-6': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 200, avgOutputWords: 300, modelKey: 'claude-sonnet-4-5', fileQueryPct: 0.20, avgFileWords: 500, ragPct: 0.20 }),
    'role-7': estimateMonthlyCreditsFixed({ queriesPerDay: 3, avgInputWords: 150, avgOutputWords: 200, modelKey: 'gemini-2.5-flash',   fileQueryPct: 0.10, avgFileWords: 300, ragPct: 0.10 }),
    'role-8': estimateMonthlyCreditsFixed({ queriesPerDay: 3, avgInputWords: 100, avgOutputWords: 200, modelKey: 'gemini-2.5-flash',   fileQueryPct: 0.05, avgFileWords: 200, ragPct: 0.00 }),
};

const STATIC_ROLES: OrgRole[] = [
    { id: 'role-1', name: 'Tech Lead',        description: 'Technical team lead',             defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-1']) },
    { id: 'role-2', name: 'Senior Developer', description: 'Senior software engineer',        defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-2']) },
    { id: 'role-3', name: 'Developer',        description: 'Software engineer',               defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-3']) },
    { id: 'role-4', name: 'DevOps Engineer',  description: 'Infrastructure and operations',   defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-4']) },
    { id: 'role-5', name: 'QA Engineer',      description: 'Quality assurance engineer',      defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-5']) },
    { id: 'role-6', name: 'Business Analyst', description: 'Business and product analysis',   defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-6']) },
    { id: 'role-7', name: 'Project Manager',  description: 'Project coordination & delivery', defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-7']) },
    { id: 'role-8', name: 'Designer',         description: 'UI/UX and product design',        defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-8']) },
];

export async function getOrgRoles(): Promise<OrgRole[]> {
    // GET /api/v1/org/roles not yet implemented — return static
    return structuredClone(STATIC_ROLES);
}

// ─── Dept Info ────────────────────────────────────────────────────────────────

export async function getDeptInfo(): Promise<DeptInfo> {
    const deptId = getDeptId();
    if (!deptId) return { name: 'My Department', subtitle: '', headName: '', monthlyBudget: 0, quotaRenewsAt: '' };
    try {
        const { data } = await api.get<{
            dept_id: string; name: string; description: string | null;
            allocated_quota: number;
        }>(`/departments/${deptId}`);
        return {
            name:          data.name,
            subtitle:      data.description ?? 'Department overview and team management.',
            headName:      useAuthStore.getState().user?.name ?? '',
            monthlyBudget: data.allocated_quota,
            quotaRenewsAt: '',
        };
    } catch {
        return { name: 'My Department', subtitle: '', headName: '', monthlyBudget: 0, quotaRenewsAt: '' };
    }
}

// ─── Quota ────────────────────────────────────────────────────────────────────

export async function getDeptQuota(): Promise<DeptQuota> {
    try {
        const { data } = await api.get<{
            monthly_requests: number;
            requests_used: number;
            requests_remaining: number;
            period_ends_at: string;
        }>('/analytics/quota/me');
        const pct = data.monthly_requests > 0
            ? Math.round((data.requests_used / data.monthly_requests) * 100)
            : 0;
        return {
            percentageUsed: pct,
            budget:         data.monthly_requests,
            renewsAt:       data.period_ends_at ? data.period_ends_at.split('T')[0] : '',
        };
    } catch {
        return { percentageUsed: 0, budget: 0, renewsAt: '' };
    }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function getDeptEmployees(): Promise<DeptEmployee[]> {
    try {
        const { data } = await api.get<{ users: BUser[]; total: number }>('/users?limit=200');
        return data.users.map((u) => ({
            id:          u.user_id,
            name:        u.name,
            email:       u.email,
            roleId:      'role-3',
            roleName:    u.job_title ?? 'Developer',
            status:      (u.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
            creditsUsed: 0,
            creditLimit: Math.ceil(ROLE_BUDGETS['role-3']),
            lastActive:  u.last_active_at ? u.last_active_at.split('T')[0] : 'Never',
        }));
    } catch {
        return [];
    }
}

export async function addDeptEmployee(
    emp: Omit<DeptEmployee, 'id' | 'creditsUsed' | 'lastActive'>
): Promise<DeptEmployee> {
    // Invite / register user flow not yet exposed — local only
    const newEmp: DeptEmployee = { ...emp, id: `emp-${Date.now()}`, creditsUsed: 0, lastActive: 'Never' };
    return newEmp;
}

export async function removeDeptEmployee(empId: string): Promise<void> {
    await api.patch(`/users/${empId}/status`, { status: 'DEACTIVATED' });
}

export async function updateEmployeeLimit(empId: string, limit: number): Promise<DeptEmployee> {
    await api.put(`/policies/dept/${getDeptId()}/access/${empId}`, { daily_limit: limit });
    const employees = await getDeptEmployees();
    const emp = employees.find((e) => e.id === empId);
    if (!emp) throw new Error('Employee not found');
    emp.creditLimit = limit;
    return emp;
}

export async function setEmployeeRestriction(empId: string, restrict: boolean): Promise<DeptEmployee> {
    const status = restrict ? 'DEACTIVATED' : 'ACTIVE';
    await api.patch(`/users/${empId}/status`, { status });
    const employees = await getDeptEmployees();
    const emp = employees.find((e) => e.id === empId);
    if (!emp) throw new Error('Employee not found');
    emp.status      = restrict ? 'INACTIVE' : 'ACTIVE';
    emp.creditLimit = restrict ? 0 : Math.ceil(ROLE_BUDGETS['role-3']);
    return emp;
}

// ─── Access Control ───────────────────────────────────────────────────────────

export async function getDeptAccessData(): Promise<EmpAccessData[]> {
    const deptId = getDeptId();
    if (!deptId) return [];
    try {
        const [usersRes, accessRes] = await Promise.all([
            api.get<{ users: BUser[]; total: number }>('/users?limit=200'),
            api.get<BAccess[]>(`/policies/dept/${deptId}/access`),
        ]);
        const accessMap = new Map(accessRes.data.map((a) => [a.user_id, a]));
        return usersRes.data.users.map((u) => {
            const a = accessMap.get(u.user_id);
            return {
                id:            u.user_id,
                name:          u.name,
                email:         u.email,
                roleName:      u.job_title ?? 'Developer',
                fileUpload:    a?.file_upload_allowed ?? true,
                speechToText:  a?.stt_allowed ?? false,
                allModels:     !a?.allowed_models || a.allowed_models.length === 0,
                allowedModels: (a?.allowed_models ?? []) as LLMModel[],
                limit:         a?.daily_limit ?? 30,
            };
        });
    } catch {
        return [];
    }
}

// ─── Policy ───────────────────────────────────────────────────────────────────

export async function getDeptPolicy(): Promise<DeptPolicy> {
    const deptId = getDeptId();
    if (!deptId) return { fileUpload: true, speechToText: false, allModels: true, permittedModels: [], creditLimit: 30 };
    try {
        const { data } = await api.get<BPolicy>(`/policies/dept/${deptId}`);
        return {
            fileUpload:      data.override_file_uploads ?? data.allow_file_uploads ?? true,
            speechToText:    data.allow_speech_to_text ?? false,
            allModels:       !data.allowed_models || data.allowed_models.length === 0,
            permittedModels: (data.allowed_models ?? []) as LLMModel[],
            creditLimit:     data.daily_limit ?? 30,
        };
    } catch {
        return { fileUpload: true, speechToText: false, allModels: true, permittedModels: [], creditLimit: 30 };
    }
}

export async function saveDeptPolicy(policy: DeptPolicy): Promise<void> {
    const deptId = getDeptId();
    if (!deptId) return;
    await api.patch(`/policies/dept/${deptId}`, {
        allowed_models:       policy.allModels ? null : policy.permittedModels,
        override_file_uploads: policy.fileUpload,
        allow_speech_to_text: policy.speechToText,
        daily_limit:          policy.creditLimit,
    });
}

export async function applyPolicyToSelected(policy: DeptPolicy, ids: string[]): Promise<EmpAccessData[]> {
    const deptId = getDeptId();
    if (deptId) {
        await Promise.all(ids.map((uid) =>
            api.put(`/policies/dept/${deptId}/access/${uid}`, {
                file_upload_allowed: policy.fileUpload,
                stt_allowed:         policy.speechToText,
                allowed_models:      policy.allModels ? null : policy.permittedModels,
                daily_limit:         policy.creditLimit,
            })
        ));
    }
    return getDeptAccessData();
}

// ─── Quota Requests ───────────────────────────────────────────────────────────

export async function getDeptPendingQuotaCount(): Promise<number> {
    return _localEmpQuotaRequests.filter((r) => r.status === 'PENDING').length;
}

export async function getDeptEmployeeQuotaRequests(): Promise<EmpQuotaRequest[]> {
    // TODO: GET /dept/{dept_id}/quota-requests (Module K)
    return structuredClone(_localEmpQuotaRequests);
}

export async function approveEmployeeQuotaRequest(
    requestId: string,
    grantedCredits?: number,
): Promise<{ grantedCredits: number }> {
    const req = _localEmpQuotaRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');
    const amount = grantedCredits ?? req.credits;
    req.status = 'APPROVED';
    req.grantedCredits = amount;
    return { grantedCredits: amount };
}

export async function denyEmployeeQuotaRequest(requestId: string): Promise<void> {
    const req = _localEmpQuotaRequests.find((r) => r.id === requestId);
    if (req) req.status = 'DENIED';
}

export async function getDeptOrgQuotaHistory(): Promise<OrgQuotaRequest[]> {
    return structuredClone(_localOrgQuotaHistory);
}

export async function submitOrgQuotaRequest(credits: number, reason: string): Promise<OrgQuotaRequest> {
    const newReq: OrgQuotaRequest = {
        id: `oqr-${Date.now()}`, credits, reason, status: 'PENDING',
        date: new Date().toISOString().split('T')[0], respondedBy: '—',
    };
    _localOrgQuotaHistory.unshift(newReq);
    return structuredClone(newReq);
}

// ─── Dashboard Analytics ──────────────────────────────────────────────────────

export async function getDeptDashboardStats(): Promise<DeptDashboardStats> {
    try {
        const [quota, employees] = await Promise.all([getDeptQuota(), getDeptEmployees()]);
        const active = employees.filter((e) => e.status === 'ACTIVE').length;
        const used   = employees.reduce((s, e) => s + e.creditsUsed, 0);
        return {
            totalEmployees:        employees.length,
            activeEmployees:       active,
            monthlyCreditsUsed:    used,
            monthlyCreditBudget:   quota.budget,
            modelsInUse:           0,
            totalModelsAvailable:  ALL_MODEL_IDS.length,
            avgCreditsPerEmployee: active > 0 ? Math.round((used / active) * 10) / 10 : 0,
            quotaUtilization:      quota.percentageUsed,
        };
    } catch {
        return { totalEmployees: 0, activeEmployees: 0, monthlyCreditsUsed: 0, monthlyCreditBudget: 0, modelsInUse: 0, totalModelsAvailable: 0, avgCreditsPerEmployee: 0, quotaUtilization: 0 };
    }
}

export async function getDeptDailyRequests(): Promise<DailyRequestPoint[]>     { return []; }
export async function getDeptModelUsage():    Promise<ModelUsageSlice[]>        { return []; }
export async function getDeptUsageTrend(_days: 7 | 30 = 7): Promise<UsageTrendPoint[]> { return []; }
export async function getDeptRoleUsage():     Promise<RoleUsagePoint[]>         { return []; }
export async function getDeptTopUsers(limit = 5): Promise<DeptEmployee[]>       { const e = await getDeptEmployees(); return e.sort((a, b) => b.creditsUsed - a.creditsUsed).slice(0, limit); }
export async function getDeptRequestTypeBreakdown(): Promise<UsageTypePoint[]>  { return []; }

// ─── System Prompts ───────────────────────────────────────────────────────────

export async function getDASystemPrompts(): Promise<DASystemPrompt[]>           { return structuredClone(_localSystemPrompts); }
export async function getOAPromptsForDept(): Promise<DASystemPrompt[]>          { return []; }

export async function createDASystemPrompt(name: string, content: string): Promise<DASystemPrompt> {
    const p: DASystemPrompt = { id: `sp-da-${Date.now()}`, name: name.trim(), content: content.trim(), appliedToEmployees: [], createdAt: new Date().toISOString().split('T')[0] };
    _localSystemPrompts.push(p);
    return structuredClone(p);
}

export async function updateDASystemPrompt(id: string, patch: Partial<Pick<DASystemPrompt, 'name' | 'content'>>): Promise<DASystemPrompt> {
    const p = _localSystemPrompts.find((x) => x.id === id);
    if (!p) throw new Error(`Prompt ${id} not found`);
    if (patch.name)    p.name    = patch.name;
    if (patch.content) p.content = patch.content;
    return structuredClone(p);
}

export async function deleteDASystemPrompt(id: string): Promise<void> {
    const i = _localSystemPrompts.findIndex((p) => p.id === id);
    if (i !== -1) _localSystemPrompts.splice(i, 1);
}

export async function applyDASystemPromptToEmployees(id: string, empIds: string[]): Promise<DASystemPrompt> {
    const p = _localSystemPrompts.find((x) => x.id === id);
    if (!p) throw new Error(`Prompt ${id} not found`);
    p.appliedToEmployees = [...empIds];
    return structuredClone(p);
}
