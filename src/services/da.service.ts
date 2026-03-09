/**
 * Department Admin service.
 * All mock data is centralised here. When the Python backend is connected,
 * replace each function body with the equivalent axios call from `./api`.
 */

import { delay } from './api';
import { MODELS } from '@/lib/constants';
import type { LLMModel } from '@/types/chat.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptInfo = {
    /** Department display name */
    name: string;
    /** Subtitle shown below the name in the dashboard header */
    subtitle: string;
    /** Name of the department head */
    headName: string;
    /** Monthly AI request quota allocated to this department */
    monthlyQuota: number;
    /** ISO date string — next quota renewal date */
    quotaRenewsAt: string;
};

export type DeptQuota = {
    used: number;
    total: number;
    renewsAt: string;
};

export type EmpQuotaRequest = {
    id: string;
    /** Links to DeptEmployee.id */
    employeeId: string;
    name: string;
    email: string;
    amount: number;
    reason: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
};

export type OrgQuotaRequest = {
    id: string;
    amount: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    date: string;
    respondedBy: string;
};

export type OrgRole = {
    id: string;
    name: string;
    description: string;
    defaultDailyLimit: number;
};

export type DeptEmployee = {
    id: string;
    name: string;
    email: string;
    roleId: string;
    roleName: string;
    status: 'ACTIVE' | 'INACTIVE';
    requests: number;
    dailyLimit: number;
    lastActive: string;
};

export type EmpAccessData = {
    id: string;
    name: string;
    email: string;
    roleName: string;
    fileUpload: boolean;
    speechToText: boolean;
    /** true = inherits dept default; false = restricted to allowedModels */
    allModels: boolean;
    allowedModels: LLMModel[];
    limit: number;
};

export type DeptPolicy = {
    fileUpload: boolean;
    speechToText: boolean;
    /** true = no restriction; false = locked to permittedModels */
    allModels: boolean;
    permittedModels: LLMModel[];
    dailyLimit: number;
};

// ─── Mock source data (replace with API calls later) ─────────────────────────

/**
 * Org-defined job roles.
 * Backend route (future): GET /api/v1/org/roles
 */
const MOCK_ORG_ROLES: OrgRole[] = [
    { id: 'role-1', name: 'Tech Lead',        description: 'Technical team lead',             defaultDailyLimit: 60 },
    { id: 'role-2', name: 'Senior Developer', description: 'Senior software engineer',        defaultDailyLimit: 50 },
    { id: 'role-3', name: 'Developer',        description: 'Software engineer',               defaultDailyLimit: 30 },
    { id: 'role-4', name: 'DevOps Engineer',  description: 'Infrastructure and operations',   defaultDailyLimit: 40 },
    { id: 'role-5', name: 'QA Engineer',      description: 'Quality assurance engineer',      defaultDailyLimit: 25 },
    { id: 'role-6', name: 'Business Analyst', description: 'Business and product analysis',   defaultDailyLimit: 20 },
    { id: 'role-7', name: 'Project Manager',  description: 'Project coordination & delivery', defaultDailyLimit: 20 },
    { id: 'role-8', name: 'Designer',         description: 'UI/UX and product design',        defaultDailyLimit: 20 },
];

/**
 * Department employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/employees
 */
const MOCK_DEPT_EMPLOYEES: DeptEmployee[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",       roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   requests: 320, dailyLimit: 50, lastActive: "Today"      },
    { id: "2",  name: "John Miller",     email: "john@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   requests: 180, dailyLimit: 30, lastActive: "Today"      },
    { id: "3",  name: "Alice Brown",     email: "alice@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   requests: 150, dailyLimit: 30, lastActive: "Yesterday"  },
    { id: "4",  name: "Bob Wilson",      email: "bob@acme.com",       roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   requests: 120, dailyLimit: 40, lastActive: "Yesterday"  },
    { id: "5",  name: "Mike Chen",       email: "mike@acme.com",      roleId: "role-3", roleName: "Developer",        status: "INACTIVE", requests:  45, dailyLimit:  0, lastActive: "3 days ago" },
    { id: "6",  name: "Emily Zhao",      email: "emily@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   requests:  88, dailyLimit: 50, lastActive: "Today"      },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   requests: 210, dailyLimit: 60, lastActive: "Today"      },
    { id: "8",  name: "Sara Kim",        email: "sara@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   requests:  95, dailyLimit: 30, lastActive: "Today"      },
    { id: "9",  name: "David Lee",       email: "david@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   requests:  67, dailyLimit: 25, lastActive: "2 days ago" },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",     roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   requests: 143, dailyLimit: 30, lastActive: "Today"      },
    { id: "11", name: "Liam Turner",     email: "liam@acme.com",      roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   requests:  78, dailyLimit: 35, lastActive: "Yesterday"  },
    { id: "12", name: "Olivia Martin",   email: "olivia@acme.com",    roleId: "role-3", roleName: "Developer",        status: "INACTIVE", requests:  12, dailyLimit:  0, lastActive: "1 week ago" },
    { id: "13", name: "James Anderson",  email: "james@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   requests: 198, dailyLimit: 50, lastActive: "Today"      },
    { id: "14", name: "Mia Thompson",    email: "mia@acme.com",       roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   requests:  56, dailyLimit: 25, lastActive: "Today"      },
    { id: "15", name: "Noah Garcia",     email: "noah@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   requests: 167, dailyLimit: 30, lastActive: "Today"      },
    { id: "16", name: "Ava Martinez",    email: "ava@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   requests: 245, dailyLimit: 60, lastActive: "Yesterday"  },
    { id: "17", name: "William Jackson", email: "william@acme.com",   roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   requests:  89, dailyLimit: 30, lastActive: "Today"      },
    { id: "18", name: "Isabella White",  email: "isabella@acme.com",  roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   requests: 134, dailyLimit: 50, lastActive: "Today"      },
    { id: "19", name: "Ethan Harris",    email: "ethan@acme.com",     roleId: "role-3", roleName: "Developer",        status: "INACTIVE", requests:  23, dailyLimit:  0, lastActive: "5 days ago" },
    { id: "20", name: "Sophia Clark",    email: "sophia@acme.com",    roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   requests: 102, dailyLimit: 40, lastActive: "Today"      },
];

const ALL_MODEL_IDS = MODELS.map((m) => m.id) as LLMModel[];

/**
 * Per-employee access configuration.
 * Backend route (future): GET /api/v1/dept/{deptId}/access
 */
const MOCK_EMP_ACCESS: EmpAccessData[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",      roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "2",  name: "John Miller",     email: "john@acme.com",     roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 30 },
    { id: "3",  name: "Alice Brown",     email: "alice@acme.com",    roleName: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o", "claude-4-5-haiku"],          limit: 20 },
    { id: "4",  name: "Bob Wilson",      email: "bob@acme.com",      roleName: "DevOps Engineer",  fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 40 },
    { id: "5",  name: "Mike Chen",       email: "mike@acme.com",     roleName: "Developer",        fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o"],                              limit: 0  },
    { id: "6",  name: "Emily Zhao",      email: "emily@acme.com",    roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",      roleName: "Tech Lead",        fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 60 },
    { id: "8",  name: "Sara Kim",        email: "sara@acme.com",     roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: false, allowedModels: ["gpt-4o", "gpt-5-1"],                   limit: 30 },
    { id: "9",  name: "David Lee",       email: "david@acme.com",    roleName: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, allowedModels: ["claude-4-5-haiku"],                    limit: 25 },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",    roleName: "Developer",        fileUpload: true,  speechToText: true,  allModels: false, allowedModels: ["gpt-4o", "claude-4-6-sonnet"],         limit: 30 },
    { id: "11", name: "Liam Turner",     email: "liam@acme.com",     roleName: "DevOps Engineer",  fileUpload: true,  speechToText: false, allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 35 },
    { id: "12", name: "Olivia Martin",   email: "olivia@acme.com",   roleName: "Developer",        fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o"],                              limit: 0  },
    { id: "13", name: "James Anderson",  email: "james@acme.com",    roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "14", name: "Mia Thompson",    email: "mia@acme.com",      roleName: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, allowedModels: ["claude-4-5-haiku", "gemini-3-1-flash"], limit: 25 },
    { id: "15", name: "Noah Garcia",     email: "noah@acme.com",     roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: false, allowedModels: ["gpt-4o", "gemini-3-1-pro"],            limit: 30 },
    { id: "16", name: "Ava Martinez",    email: "ava@acme.com",      roleName: "Tech Lead",        fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 60 },
    { id: "17", name: "William Jackson", email: "william@acme.com",  roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: false, allowedModels: ["gpt-4o", "claude-4-6-sonnet"],         limit: 30 },
    { id: "18", name: "Isabella White",  email: "isabella@acme.com", roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "19", name: "Ethan Harris",    email: "ethan@acme.com",    roleName: "Developer",        fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o"],                              limit: 0  },
    { id: "20", name: "Sophia Clark",    email: "sophia@acme.com",   roleName: "DevOps Engineer",  fileUpload: true,  speechToText: false, allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 40 },
];

/**
 * Default department-level policy.
 * Backend route (future): GET /api/v1/dept/{deptId}/policy
 */
const MOCK_DEPT_POLICY: DeptPolicy = {
    fileUpload:      true,
    speechToText:    false,
    allModels:       true,
    permittedModels: ALL_MODEL_IDS,
    dailyLimit:      30,
};

/**
 * Department identity (name, subtitle shown in the dashboard header).
 * Backend route (future): GET /api/v1/dept/{deptId}
 */
const MOCK_DEPT_INFO: DeptInfo = {
    name:     'Engineering Department',
    subtitle: 'Department overview and team management.',
};

/**
 * Department quota configuration — total only; `used` is derived from employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/quota
 */
const MOCK_DEPT_QUOTA_TOTAL  = 3000;
const MOCK_DEPT_QUOTA_RENEWS = '2026-04-01';

/**
 * Incoming quota increase requests from employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/quota-requests
 */
const MOCK_EMP_QUOTA_REQUESTS: EmpQuotaRequest[] = [
    { id: 'qr-1', name: 'Tom Baker',   email: 'tom@acme.com',   amount: 150, reason: 'Machine learning project requires additional prompt quota.', date: '2025-12-28', status: 'PENDING'  },
    { id: 'qr-2', name: 'Emily Zhao',  email: 'emily@acme.com', amount:  50, reason: 'Year-end analysis and reporting tasks.',                    date: '2025-12-27', status: 'PENDING'  },
    { id: 'qr-3', name: 'Raj Patel',   email: 'raj@acme.com',   amount: 100, reason: 'Automated code-review workflows.',                         date: '2025-12-20', status: 'APPROVED' },
    { id: 'qr-4', name: 'John Miller', email: 'john@acme.com',  amount:  80, reason: 'Documentation generation sprint.',                         date: '2025-12-15', status: 'DENIED'   },
];

/**
 * Dept Admin's own requests submitted to the Org Admin.
 * Backend route (future): GET /api/v1/dept/{deptId}/org-quota-requests
 */
const MOCK_ORG_QUOTA_HISTORY: OrgQuotaRequest[] = [
    { id: 'oqr-1', amount: 300, reason: 'Q3 hackathon week',           status: 'APPROVED', date: '2025-10-05', respondedBy: 'Org Admin' },
    { id: 'oqr-2', amount: 200, reason: 'New team members onboarding', status: 'APPROVED', date: '2025-09-12', respondedBy: 'Org Admin' },
    { id: 'oqr-3', amount: 500, reason: 'Load testing project',        status: 'DENIED',   date: '2025-08-20', respondedBy: 'Org Admin' },
];

// ─── Service functions ────────────────────────────────────────────────────────

/** GET /api/v1/org/roles */
export async function getOrgRoles(): Promise<OrgRole[]> {
    await delay(350);
    return structuredClone(MOCK_ORG_ROLES);
}

/** GET /api/v1/dept/{deptId}/employees */
export async function getDeptEmployees(): Promise<DeptEmployee[]> {
    await delay(400);
    return structuredClone(MOCK_DEPT_EMPLOYEES);
}

/** GET /api/v1/dept/{deptId}/access */
export async function getDeptAccessData(): Promise<EmpAccessData[]> {
    await delay(400);
    return structuredClone(MOCK_EMP_ACCESS);
}

/** GET /api/v1/dept/{deptId}/policy */
export async function getDeptPolicy(): Promise<DeptPolicy> {
    await delay(300);
    return structuredClone(MOCK_DEPT_POLICY);
}

/** PUT /api/v1/dept/{deptId}/policy */
export async function saveDeptPolicy(policy: DeptPolicy): Promise<void> {
    await delay(500);
    // In production: await api.put(`/dept/${deptId}/policy`, policy);
    Object.assign(MOCK_DEPT_POLICY, policy);
}

/** POST /api/v1/dept/{deptId}/access/apply-policy
 *  Pass an array of employee IDs to restrict the update to those employees.
 *  Pass an empty array (or all IDs) to update everyone.
 */
export async function applyPolicyToSelected(policy: DeptPolicy, ids: string[]): Promise<EmpAccessData[]> {
    await delay(600);
    const idSet = new Set(ids);
    const updated = MOCK_EMP_ACCESS.map((e) =>
        idSet.has(e.id)
            ? {
                ...e,
                fileUpload:    policy.fileUpload,
                speechToText:  policy.speechToText,
                allModels:     policy.allModels,
                allowedModels: policy.allModels ? (MODELS.map((m) => m.id) as LLMModel[]) : policy.permittedModels,
                limit:         policy.dailyLimit,
            }
            : e,
    );
    MOCK_EMP_ACCESS.splice(0, MOCK_EMP_ACCESS.length, ...updated);
    return structuredClone(MOCK_EMP_ACCESS);
}

/** PUT /api/v1/dept/{deptId}/employees (add) */
export async function addDeptEmployee(emp: Omit<DeptEmployee, 'id' | 'requests' | 'lastActive'>): Promise<DeptEmployee> {
    await delay(400);
    const newEmp: DeptEmployee = {
        ...emp,
        id: `emp-${Date.now()}`,
        requests: 0,
        lastActive: 'Never',
    };
    MOCK_DEPT_EMPLOYEES.push(newEmp);
    return structuredClone(newEmp);
}

/** DELETE /api/v1/dept/{deptId}/employees/{empId} */
export async function removeDeptEmployee(empId: string): Promise<void> {
    await delay(350);
    const idx = MOCK_DEPT_EMPLOYEES.findIndex((e) => e.id === empId);
    if (idx !== -1) MOCK_DEPT_EMPLOYEES.splice(idx, 1);
}

/** PUT /api/v1/dept/{deptId}/employees/{empId}/limit */
export async function updateEmployeeLimit(empId: string, limit: number): Promise<void> {
    await delay(300);
    const emp = MOCK_DEPT_EMPLOYEES.find((e) => e.id === empId);
    if (emp) emp.dailyLimit = limit;
}

/** GET /api/v1/dept/{deptId} */
export async function getDeptInfo(): Promise<DeptInfo> {
    await delay(150);
    return structuredClone(MOCK_DEPT_INFO);
}

/** GET /api/v1/dept/{deptId}/quota */
export async function getDeptQuota(): Promise<DeptQuota> {
    await delay(250);
    const used = MOCK_DEPT_EMPLOYEES.reduce((s, e) => s + e.requests, 0);
    return { used, total: MOCK_DEPT_QUOTA_TOTAL, renewsAt: MOCK_DEPT_QUOTA_RENEWS };
}

/** GET /api/v1/dept/{deptId}/quota-requests */
export async function getDeptEmployeeQuotaRequests(): Promise<EmpQuotaRequest[]> {
    await delay(300);
    return structuredClone(MOCK_EMP_QUOTA_REQUESTS);
}

/** PUT /api/v1/dept/{deptId}/quota-requests/{requestId}/approve */
export async function approveEmployeeQuotaRequest(requestId: string): Promise<void> {
    await delay(300);
    const req = MOCK_EMP_QUOTA_REQUESTS.find((r) => r.id === requestId);
    if (req) req.status = 'APPROVED';
}

/** PUT /api/v1/dept/{deptId}/quota-requests/{requestId}/deny */
export async function denyEmployeeQuotaRequest(requestId: string): Promise<void> {
    await delay(300);
    const req = MOCK_EMP_QUOTA_REQUESTS.find((r) => r.id === requestId);
    if (req) req.status = 'DENIED';
}

/** GET /api/v1/dept/{deptId}/org-quota-requests */
export async function getDeptOrgQuotaHistory(): Promise<OrgQuotaRequest[]> {
    await delay(250);
    return structuredClone(MOCK_ORG_QUOTA_HISTORY);
}

/** POST /api/v1/dept/{deptId}/org-quota-requests */
export async function submitOrgQuotaRequest(amount: number, reason: string): Promise<OrgQuotaRequest> {
    await delay(700);
    const newReq: OrgQuotaRequest = {
        id:          `oqr-${Date.now()}`,
        amount,
        reason,
        status:      'PENDING',
        date:        new Date().toISOString().split('T')[0],
        respondedBy: '—',
    };
    MOCK_ORG_QUOTA_HISTORY.unshift(newReq);
    return structuredClone(newReq);
}

// ─── Dashboard analytics types ──────────────────────────────────────────────

export type DeptDashboardStats = {
    totalEmployees: number;
    activeEmployees: number;
    monthlyRequests: number;
    monthlyQuota: number;
    modelsInUse: number;
    totalModelsAvailable: number;
    avgRequestsPerEmployee: number;
};

export type DailyRequestPoint = {
    date: string;
    requests: number;
    activeUsers: number;
};

export type ModelUsageSlice = {
    name: string;
    value: number;
    color: string;
};

export type RoleUsagePoint = {
    role: string;
    employees: number;
    totalRequests: number;
    avgRequests: number;
};

export type UsageTrendPoint = {
    date: string;
    requests: number;
    activeUsers: number;
};

// ─── Dashboard analytics mock data builders ─────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
    'Claude 4.6 Sonnet': '#3B82F6',
    'GPT-5.1':           '#10B981',
    'GPT-4o':            '#F59E0B',
    'Claude 4.5 Haiku':  '#8B5CF6',
    'Claude 4.6 Opus':   '#EF4444',
    'Gemini 3.1 Pro':    '#06B6D4',
    'Gemini 3.1 Flash':  '#F97316',
};

function buildDailyRequests(employees: DeptEmployee[]): DailyRequestPoint[] {
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weights = [0.18, 0.19, 0.20, 0.17, 0.15, 0.06, 0.05];
    const userWeights = [0.85, 0.90, 0.88, 0.82, 0.78, 0.25, 0.18];
    return days.map((date, i) => ({
        date,
        requests: Math.round(totalRequests * weights[i]),
        activeUsers: Math.round(activeCount * userWeights[i]),
    }));
}

function buildModelUsage(employees: DeptEmployee[]): ModelUsageSlice[] {
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);
    const slices: { name: string; pct: number }[] = [
        { name: 'Claude 4.6 Sonnet', pct: 0.32 },
        { name: 'GPT-5.1',           pct: 0.24 },
        { name: 'GPT-4o',            pct: 0.18 },
        { name: 'Claude 4.5 Haiku',  pct: 0.12 },
        { name: 'Gemini 3.1 Pro',    pct: 0.09 },
        { name: 'Gemini 3.1 Flash',  pct: 0.05 },
    ];
    return slices.map((s) => ({
        name: s.name,
        value: Math.round(totalRequests * s.pct),
        color: MODEL_COLORS[s.name] || '#94A3B8',
    }));
}

function buildUsageTrend(employees: DeptEmployee[], days: number): UsageTrendPoint[] {
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const avgDaily = totalRequests / 30;
    const points: UsageTrendPoint[] = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const factor = isWeekend ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.6;
        const userFactor = isWeekend ? 0.1 + Math.random() * 0.15 : 0.6 + Math.random() * 0.35;
        points.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            requests: Math.round(avgDaily * factor),
            activeUsers: Math.max(1, Math.round(activeCount * userFactor)),
        });
    }
    return points;
}

function buildRoleUsage(employees: DeptEmployee[]): RoleUsagePoint[] {
    const byRole = new Map<string, { employees: number; totalRequests: number }>();
    employees.forEach((e) => {
        const entry = byRole.get(e.roleName) || { employees: 0, totalRequests: 0 };
        entry.employees++;
        entry.totalRequests += e.requests;
        byRole.set(e.roleName, entry);
    });
    return Array.from(byRole.entries())
        .map(([role, data]) => ({
            role,
            employees: data.employees,
            totalRequests: data.totalRequests,
            avgRequests: Math.round(data.totalRequests / data.employees),
        }))
        .sort((a, b) => b.totalRequests - a.totalRequests);
}

// ─── Dashboard service functions ────────────────────────────────────────────

/** GET /api/v1/dept/{deptId}/dashboard/stats */
export async function getDeptDashboardStats(): Promise<DeptDashboardStats> {
    await delay(300);
    const employees = structuredClone(MOCK_DEPT_EMPLOYEES);
    const active = employees.filter((e) => e.status === 'ACTIVE');
    const totalRequests = employees.reduce((s, e) => s + e.requests, 0);
    const access = structuredClone(MOCK_EMP_ACCESS);
    const uniqueModels = new Set(access.flatMap((e) => e.allowedModels));
    return {
        totalEmployees: employees.length,
        activeEmployees: active.length,
        monthlyRequests: totalRequests,
        monthlyQuota: MOCK_DEPT_QUOTA_TOTAL,
        modelsInUse: uniqueModels.size,
        totalModelsAvailable: ALL_MODEL_IDS.length,
        avgRequestsPerEmployee: active.length > 0 ? Math.round(totalRequests / active.length) : 0,
    };
}

/** GET /api/v1/dept/{deptId}/dashboard/daily-requests */
export async function getDeptDailyRequests(): Promise<DailyRequestPoint[]> {
    await delay(250);
    return buildDailyRequests(structuredClone(MOCK_DEPT_EMPLOYEES));
}

/** GET /api/v1/dept/{deptId}/dashboard/model-usage */
export async function getDeptModelUsage(): Promise<ModelUsageSlice[]> {
    await delay(200);
    return buildModelUsage(structuredClone(MOCK_DEPT_EMPLOYEES));
}

/** GET /api/v1/dept/{deptId}/dashboard/usage-trend?days=7|30 */
export async function getDeptUsageTrend(days: 7 | 30 = 7): Promise<UsageTrendPoint[]> {
    await delay(200);
    return buildUsageTrend(structuredClone(MOCK_DEPT_EMPLOYEES), days);
}

/** GET /api/v1/dept/{deptId}/dashboard/role-usage */
export async function getDeptRoleUsage(): Promise<RoleUsagePoint[]> {
    await delay(250);
    return buildRoleUsage(structuredClone(MOCK_DEPT_EMPLOYEES));
}

/** GET /api/v1/dept/{deptId}/dashboard/top-users */
export async function getDeptTopUsers(limit: number = 5): Promise<DeptEmployee[]> {
    await delay(300);
    return structuredClone(MOCK_DEPT_EMPLOYEES)
        .sort((a, b) => b.requests - a.requests)
        .slice(0, limit);
}
