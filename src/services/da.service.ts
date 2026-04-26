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
    /** Monthly credit budget allocated to this department */
    monthlyBudget: number;
    /** ISO date string — next quota renewal date */
    quotaRenewsAt: string;
};

export type DeptQuota = {
    percentageUsed: number;
    budget: number;
    renewsAt: string;
};

export type EmpQuotaRequest = {
    id: string;
    /** Links to DeptEmployee.id */
    employeeId: string;
    name: string;
    email: string;
    /** Amount of credits the employee requested */
    credits: number;
    /** Amount actually granted — may be less than `credits` when quota is tight */
    grantedCredits?: number;
    reason: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
};

export type OrgQuotaRequest = {
    id: string;
    credits: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    date: string;
    respondedBy: string;
};

export type OrgRole = {
    id: string;
    name: string;
    description: string;
    defaultCreditLimit: number;
};

export type DeptEmployee = {
    id: string;
    name: string;
    email: string;
    roleId: string;
    roleName: string;
    status: 'ACTIVE' | 'INACTIVE';
    creditsUsed: number;
    creditLimit: number;
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
    creditLimit: number;
};

export type DASystemPrompt = {
    id:                  string;
    name:                string;
    content:             string;
    /** Employee IDs this DA prompt is applied to. */
    appliedToEmployees:  string[];
    createdAt:           string;
    /** True = originated from Org Admin — read-only for dept admin */
    enforcedByOrg?:      boolean;
};

// ─── Mock source data (replace with API calls later) ─────────────────────────

/**
 * Org-defined job roles.
 * Backend route (future): GET /api/v1/org/roles
 */
const MOCK_ORG_ROLES: OrgRole[] = [
    { id: 'role-1', name: 'Tech Lead',        description: 'Technical team lead',             defaultCreditLimit: 60 },
    { id: 'role-2', name: 'Senior Developer', description: 'Senior software engineer',        defaultCreditLimit: 50 },
    { id: 'role-3', name: 'Developer',        description: 'Software engineer',               defaultCreditLimit: 30 },
    { id: 'role-4', name: 'DevOps Engineer',  description: 'Infrastructure and operations',   defaultCreditLimit: 40 },
    { id: 'role-5', name: 'QA Engineer',      description: 'Quality assurance engineer',      defaultCreditLimit: 25 },
    { id: 'role-6', name: 'Business Analyst', description: 'Business and product analysis',   defaultCreditLimit: 20 },
    { id: 'role-7', name: 'Project Manager',  description: 'Project coordination & delivery', defaultCreditLimit: 20 },
    { id: 'role-8', name: 'Designer',         description: 'UI/UX and product design',        defaultCreditLimit: 20 },
];

/**
 * Department employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/employees
 */
const MOCK_DEPT_EMPLOYEES: DeptEmployee[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",       roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: 32.0, creditLimit: 50, lastActive: "Today"      },
    { id: "2",  name: "John Miller",     email: "john@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: 18.0, creditLimit: 30, lastActive: "Today"      },
    { id: "3",  name: "Alice Brown",     email: "alice@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed: 15.0, creditLimit: 25, lastActive: "Yesterday"  },
    { id: "4",  name: "Bob Wilson",      email: "bob@acme.com",       roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed: 12.0, creditLimit: 40, lastActive: "Yesterday"  },
    { id: "5",  name: "Mike Chen",       email: "mike@acme.com",      roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed:  4.5, creditLimit:  0, lastActive: "3 days ago" },
    { id: "6",  name: "Emily Zhao",      email: "emily@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed:  8.8, creditLimit: 50, lastActive: "Today"      },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   creditsUsed: 21.0, creditLimit: 60, lastActive: "Today"      },
    { id: "8",  name: "Sara Kim",        email: "sara@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed:  9.5, creditLimit: 30, lastActive: "Today"      },
    { id: "9",  name: "David Lee",       email: "david@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed:  6.7, creditLimit: 25, lastActive: "2 days ago" },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",     roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: 14.3, creditLimit: 30, lastActive: "Today"      },
    { id: "11", name: "Liam Turner",     email: "liam@acme.com",      roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed:  7.8, creditLimit: 40, lastActive: "Yesterday"  },
    { id: "12", name: "Olivia Martin",   email: "olivia@acme.com",    roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed:  1.2, creditLimit:  0, lastActive: "1 week ago" },
    { id: "13", name: "James Anderson",  email: "james@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: 19.8, creditLimit: 50, lastActive: "Today"      },
    { id: "14", name: "Mia Thompson",    email: "mia@acme.com",       roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed:  5.6, creditLimit: 25, lastActive: "Today"      },
    { id: "15", name: "Noah Garcia",     email: "noah@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: 16.7, creditLimit: 30, lastActive: "Today"      },
    { id: "16", name: "Ava Martinez",    email: "ava@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   creditsUsed: 24.5, creditLimit: 60, lastActive: "Yesterday"  },
    { id: "17", name: "William Jackson", email: "william@acme.com",   roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed:  8.9, creditLimit: 30, lastActive: "Today"      },
    { id: "18", name: "Isabella White",  email: "isabella@acme.com",  roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: 13.4, creditLimit: 50, lastActive: "Today"      },
    { id: "19", name: "Ethan Harris",    email: "ethan@acme.com",     roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed:  2.3, creditLimit:  0, lastActive: "5 days ago" },
    { id: "20", name: "Sophia Clark",    email: "sophia@acme.com",    roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed: 10.2, creditLimit: 40, lastActive: "Today"      },
];

const ALL_MODEL_IDS = MODELS.map((m) => m.id) as LLMModel[];

/**
 * Per-employee access configuration.
 * Backend route (future): GET /api/v1/dept/{deptId}/access
 */
const MOCK_EMP_ACCESS: EmpAccessData[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",      roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "2",  name: "John Miller",     email: "john@acme.com",     roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 30 },
    { id: "3",  name: "Alice Brown",     email: "alice@acme.com",    roleName: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o", "claude-4-5-haiku"],          limit: 25 },
    { id: "4",  name: "Bob Wilson",      email: "bob@acme.com",      roleName: "DevOps Engineer",  fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 40 },
    { id: "5",  name: "Mike Chen",       email: "mike@acme.com",     roleName: "Developer",        fileUpload: false, speechToText: false, allModels: false, allowedModels: ["gpt-4o"],                              limit: 0  },
    { id: "6",  name: "Emily Zhao",      email: "emily@acme.com",    roleName: "Senior Developer", fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 50 },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",      roleName: "Tech Lead",        fileUpload: true,  speechToText: true,  allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 60 },
    { id: "8",  name: "Sara Kim",        email: "sara@acme.com",     roleName: "Developer",        fileUpload: true,  speechToText: false, allModels: false, allowedModels: ["gpt-4o", "gpt-5-1"],                   limit: 30 },
    { id: "9",  name: "David Lee",       email: "david@acme.com",    roleName: "QA Engineer",      fileUpload: false, speechToText: false, allModels: false, allowedModels: ["claude-4-5-haiku"],                    limit: 25 },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",    roleName: "Developer",        fileUpload: true,  speechToText: true,  allModels: false, allowedModels: ["gpt-4o", "claude-4-6-sonnet"],         limit: 30 },
    { id: "11", name: "Liam Turner",     email: "liam@acme.com",     roleName: "DevOps Engineer",  fileUpload: true,  speechToText: false, allModels: true,  allowedModels: ALL_MODEL_IDS,                           limit: 40 },
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
    creditLimit:      30,
};

/**
 * Department identity (name, subtitle shown in the dashboard header).
 * Backend route (future): GET /api/v1/dept/{deptId}
 */
const MOCK_DEPT_INFO: DeptInfo = {
    name:          'Engineering Department',
    subtitle:      'Department overview and team management.',
    headName:      'Dr. Sarah Mitchell',
    monthlyBudget: 3000,
    quotaRenewsAt: '2026-04-01',
};


/**
 * Incoming quota increase requests from employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/quota-requests
 */
const MOCK_EMP_QUOTA_REQUESTS: EmpQuotaRequest[] = [
    { id: 'qr-1', employeeId: '7', name: 'Tom Baker',   email: 'tom@acme.com',   credits: 15.0, reason: 'Machine learning project requires additional prompt quota.', date: '2025-12-28', status: 'PENDING'  },
    { id: 'qr-2', employeeId: '6', name: 'Emily Zhao',  email: 'emily@acme.com', credits:  5.0, reason: 'Year-end analysis and reporting tasks.',                    date: '2025-12-27', status: 'PENDING'  },
    { id: 'qr-3', employeeId: '1', name: 'Raj Patel',   email: 'raj@acme.com',   credits: 10.0, reason: 'Automated code-review workflows.',                         date: '2025-12-20', status: 'APPROVED' },
    { id: 'qr-4', employeeId: '2', name: 'John Miller', email: 'john@acme.com',  credits:  8.0, reason: 'Documentation generation sprint.',                         date: '2025-12-15', status: 'DENIED'   },
];

/**
 * DA-created system prompts for this department.
 * Backend route (future): GET /api/v1/dept/{deptId}/system-prompts
 */
const MOCK_DA_SYSTEM_PROMPTS: DASystemPrompt[] = [
    {
        id:                 'sp-da-001',
        name:               'Code Review Assistant',
        content:            'When answering coding questions, always suggest best practices, potential edge cases, and security considerations. Format code examples with language-specific syntax and include comments explaining non-obvious logic.',
        appliedToEmployees: ['1', '2', '7', '13', '18'],
        createdAt:          '2026-03-08',
    },
    {
        id:                 'sp-da-002',
        name:               'Technical Documentation Style',
        content:            'Format all technical explanations using structured markdown. Use headings, bullet lists, and code blocks where appropriate. Assume the reader has engineering-level technical knowledge.',
        appliedToEmployees: ['4', '11', '20'],
        createdAt:          '2026-03-15',
    },
];

/**
 * OA-enforced prompts that apply to this department (read-only for dept admin).
 * Backend route (future): GET /api/v1/dept/{deptId}/org-system-prompts
 */
const MOCK_OA_ENFORCED_PROMPTS: DASystemPrompt[] = [
    {
        id:                 'sp-oa-001',
        name:               'Professional Tone Policy',
        content:            'Always respond in a formal, professional tone. Avoid colloquialisms, slang, or casual language. Structure responses clearly with concise paragraphs.',
        appliedToEmployees: [],   // enforced for entire dept — field unused here
        createdAt:          '2026-03-01',
        enforcedByOrg:      true,
    },
];

/**
 * Dept Admin's own requests submitted to the Org Admin.
 * Backend route (future): GET /api/v1/dept/{deptId}/org-quota-requests
 */
const MOCK_ORG_QUOTA_HISTORY: OrgQuotaRequest[] = [
    { id: 'oqr-1', credits: 300, reason: 'Q3 hackathon week',           status: 'APPROVED', date: '2025-10-05', respondedBy: 'Org Admin' },
    { id: 'oqr-2', credits: 200, reason: 'New team members onboarding', status: 'APPROVED', date: '2025-09-12', respondedBy: 'Org Admin' },
    { id: 'oqr-3', credits: 500, reason: 'Load testing project',        status: 'DENIED',   date: '2025-08-20', respondedBy: 'Org Admin' },
];

/**
 * Static metadata for each request type: colour, priority, description.
 * Counts are derived at runtime from MOCK_DEPT_EMPLOYEES.
 * Backend route (future): GET /api/v1/dept/{deptId}/dashboard/request-types
 */
const MOCK_REQUEST_TYPE_META: Omit<RequestTypePoint, 'count' | 'percentage'>[] = [
    {
        type:        'Text Query',
        priority:    'low',
        description: 'Standard conversational prompts with no file or audio input.',
        color:       '#10B981',
    },
    {
        type:        'File Upload',
        priority:    'high',
        description: 'Requests that include document or file uploads — PII risk is elevated.',
        color:       '#EF4444',
    },
    {
        type:        'Speech Input',
        priority:    'high',
        description: 'Speech-to-text transcription requests — audio data is privacy-sensitive.',
        color:       '#8B5CF6',
    },
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
                limit:         policy.creditLimit,
            }
            : e,
    );
    MOCK_EMP_ACCESS.splice(0, MOCK_EMP_ACCESS.length, ...updated);
    return structuredClone(MOCK_EMP_ACCESS);
}

/** PUT /api/v1/dept/{deptId}/employees (add) */
export async function addDeptEmployee(emp: Omit<DeptEmployee, 'id' | 'creditsUsed' | 'lastActive'>): Promise<DeptEmployee> {
    await delay(400);
    const newEmp: DeptEmployee = {
        ...emp,
        id: `emp-${Date.now()}`,
        creditsUsed: 0,
        lastActive: 'Never',
    };
    MOCK_DEPT_EMPLOYEES.push(newEmp);
    // Also add to MOCK_EMP_ACCESS with dept policy defaults
    const newAccess: EmpAccessData = {
        id:           newEmp.id,
        name:         newEmp.name,
        email:        newEmp.email,
        roleName:     newEmp.roleName,
        fileUpload:   MOCK_DEPT_POLICY.fileUpload,
        speechToText: MOCK_DEPT_POLICY.speechToText,
        allModels:    MOCK_DEPT_POLICY.allModels,
        allowedModels: MOCK_DEPT_POLICY.allModels
            ? ALL_MODEL_IDS
            : MOCK_DEPT_POLICY.permittedModels,
        limit:        newEmp.creditLimit,
    };
    MOCK_EMP_ACCESS.push(newAccess);
    return structuredClone(newEmp);
}

/** DELETE /api/v1/dept/{deptId}/employees/{empId} */
export async function removeDeptEmployee(empId: string): Promise<void> {
    await delay(350);
    const idx = MOCK_DEPT_EMPLOYEES.findIndex((e) => e.id === empId);
    if (idx !== -1) MOCK_DEPT_EMPLOYEES.splice(idx, 1);
    // Also remove from MOCK_EMP_ACCESS
    const accessIdx = MOCK_EMP_ACCESS.findIndex((a) => a.id === empId);
    if (accessIdx !== -1) MOCK_EMP_ACCESS.splice(accessIdx, 1);
}

/** PUT /api/v1/dept/{deptId}/employees/{empId}/limit */
export async function updateEmployeeLimit(empId: string, limit: number): Promise<DeptEmployee> {
    await delay(300);
    const emp = MOCK_DEPT_EMPLOYEES.find((e) => e.id === empId);
    if (!emp) throw new Error(`Employee ${empId} not found`);
    emp.creditLimit = limit;
    // Also keep MOCK_EMP_ACCESS in sync
    const access = MOCK_EMP_ACCESS.find((a) => a.id === empId);
    if (access) access.limit = limit;
    return structuredClone(emp);
}

/**
 * Restrict or unrestrict an employee.
 * restrict=true  → creditLimit=0, status='INACTIVE'
 * restrict=false → restore role's default creditLimit, status='ACTIVE'
 * Also updates MOCK_EMP_ACCESS limit.
 * PUT /api/v1/dept/{deptId}/employees/{empId}/restrict
 */
export async function setEmployeeRestriction(empId: string, restrict: boolean): Promise<DeptEmployee> {
    await delay(300);
    const emp = MOCK_DEPT_EMPLOYEES.find((e) => e.id === empId);
    if (!emp) throw new Error(`Employee ${empId} not found`);
    if (restrict) {
        emp.creditLimit = 0;
        emp.status = 'INACTIVE';
    } else {
        const role = MOCK_ORG_ROLES.find((r) => r.id === emp.roleId);
        emp.creditLimit = role ? role.defaultCreditLimit : 30;
        emp.status = 'ACTIVE';
    }
    // Also keep MOCK_EMP_ACCESS in sync
    const access = MOCK_EMP_ACCESS.find((a) => a.id === empId);
    if (access) access.limit = emp.creditLimit;
    return structuredClone(emp);
}

/** GET /api/v1/dept/{deptId}/quota-requests/pending-count */
export async function getDeptPendingQuotaCount(): Promise<number> {
    await delay(100);
    return MOCK_EMP_QUOTA_REQUESTS.filter((r) => r.status === 'PENDING').length;
}

/** GET /api/v1/dept/{deptId} */
export async function getDeptInfo(): Promise<DeptInfo> {
    await delay(150);
    return structuredClone(MOCK_DEPT_INFO);
}

/** GET /api/v1/dept/{deptId}/quota */
export async function getDeptQuota(): Promise<DeptQuota> {
    await delay(250);
    const used = MOCK_DEPT_EMPLOYEES.reduce((s, e) => s + e.creditsUsed, 0);
    const percentageUsed = MOCK_DEPT_INFO.monthlyBudget > 0 ? (used / MOCK_DEPT_INFO.monthlyBudget) * 100 : 0;
    return { percentageUsed, budget: MOCK_DEPT_INFO.monthlyBudget, renewsAt: MOCK_DEPT_INFO.quotaRenewsAt };
}

/** GET /api/v1/dept/{deptId}/quota-requests */
export async function getDeptEmployeeQuotaRequests(): Promise<EmpQuotaRequest[]> {
    await delay(300);
    return structuredClone(MOCK_EMP_QUOTA_REQUESTS);
}

/** PUT /api/v1/dept/{deptId}/quota-requests/{requestId}/approve */
export async function approveEmployeeQuotaRequest(
    requestId: string,
    grantedCredits?: number,
): Promise<{ grantedCredits: number }> {
    await delay(300);
    const req = MOCK_EMP_QUOTA_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const used      = MOCK_DEPT_EMPLOYEES.reduce((s, e) => s + e.creditsUsed, 0);
    const remaining = MOCK_DEPT_INFO.monthlyBudget - used;
    const amount    = grantedCredits ?? req.credits;

    if (amount <= 0) throw new Error('Granted credits must be at least 1.');
    if (amount > remaining) {
        throw new Error(`Only ${remaining.toFixed(2)} credits remaining in this period.`);
    }

    req.status        = 'APPROVED';
    req.grantedCredits = amount;
    return { grantedCredits: amount };
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
export async function submitOrgQuotaRequest(credits: number, reason: string): Promise<OrgQuotaRequest> {
    await delay(700);
    const newReq: OrgQuotaRequest = {
        id:          `oqr-${Date.now()}`,
        credits,
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
    monthlyCreditsUsed: number;
    monthlyCreditBudget: number;
    modelsInUse: number;
    totalModelsAvailable: number;
    avgCreditsPerEmployee: number;
    quotaUtilization: number;
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
    totalCredits: number;
    avgCredits: number;
};

export type UsageTrendPoint = {
    date: string;
    requests: number;
    activeUsers: number;
};

export type RequestTypePoint = {
    type: string;
    count: number;
    percentage: number;
    /** Privacy / operational importance of this request type */
    priority: 'high' | 'medium' | 'low';
    /** Short description shown in tooltips / callouts */
    description: string;
    color: string;
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
    const totalRequests = employees.reduce((s, e) => s + e.creditsUsed, 0);
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
    const totalRequests = employees.reduce((s, e) => s + e.creditsUsed, 0);
    const slices: { name: string; pct: number }[] = [
        { name: 'Claude 4.6 Sonnet', pct: 0.27 },
        { name: 'GPT-5.1',           pct: 0.20 },
        { name: 'GPT-4o',            pct: 0.16 },
        { name: 'Claude 4.5 Haiku',  pct: 0.11 },
        { name: 'Claude 4.6 Opus',   pct: 0.10 },
        { name: 'Gemini 3.1 Pro',    pct: 0.08 },
        { name: 'Gemini 3.1 Flash',  pct: 0.08 },
    ];
    return slices.map((s) => ({
        name: s.name,
        value: Math.round(totalRequests * s.pct),
        color: MODEL_COLORS[s.name] || '#94A3B8',
    }));
}

function buildUsageTrend(employees: DeptEmployee[], days: number): UsageTrendPoint[] {
    const totalRequests = employees.reduce((s, e) => s + e.creditsUsed, 0);
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
    const byRole = new Map<string, { employees: number; totalCredits: number }>();
    employees.forEach((e) => {
        const entry = byRole.get(e.roleName) || { employees: 0, totalCredits: 0 };
        entry.employees++;
        entry.totalCredits += e.creditsUsed;
        byRole.set(e.roleName, entry);
    });
    return Array.from(byRole.entries())
        .map(([role, data]) => ({
            role,
            employees: data.employees,
            totalCredits: data.totalCredits,
            avgCredits: Math.round((data.totalCredits / data.employees) * 10) / 10,
        }))
        .sort((a, b) => b.totalCredits - a.totalCredits);
}

// ─── Dashboard service functions ────────────────────────────────────────────

/** GET /api/v1/dept/{deptId}/dashboard/stats */
export async function getDeptDashboardStats(): Promise<DeptDashboardStats> {
    await delay(300);
    const employees = structuredClone(MOCK_DEPT_EMPLOYEES);
    const active = employees.filter((e) => e.status === 'ACTIVE');
    const totalCreditsUsed = employees.reduce((s, e) => s + e.creditsUsed, 0);
    const access = structuredClone(MOCK_EMP_ACCESS);
    const uniqueModels = new Set(access.flatMap((e) => e.allowedModels));
    return {
        totalEmployees: employees.length,
        activeEmployees: active.length,
        monthlyCreditsUsed: totalCreditsUsed,
        monthlyCreditBudget: MOCK_DEPT_INFO.monthlyBudget,
        modelsInUse: uniqueModels.size,
        totalModelsAvailable: ALL_MODEL_IDS.length,
        avgCreditsPerEmployee: active.length > 0 ? Math.round((totalCreditsUsed / active.length) * 10) / 10 : 0,
        quotaUtilization: Math.round((totalCreditsUsed / MOCK_DEPT_INFO.monthlyBudget) * 100),
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
        .sort((a, b) => b.creditsUsed - a.creditsUsed)
        .slice(0, limit);
}

/**
 * Breaks the department's total requests down by type (Text, Code, File Upload, etc.).
 * Counts are derived proportionally from the actual request total so they always sum correctly.
 * GET /api/v1/dept/{deptId}/dashboard/request-types
 */
export async function getDeptRequestTypeBreakdown(): Promise<RequestTypePoint[]> {
    await delay(250);
    const total = MOCK_DEPT_EMPLOYEES.reduce((s, e) => s + e.creditsUsed, 0);
    // Distribution weights — must sum to 1.0  (Text Query, File Upload, Speech Input)
    const weights = [0.55, 0.30, 0.15];
    return MOCK_REQUEST_TYPE_META.map((meta, i) => ({
        ...meta,
        count:      Math.round(total * weights[i]),
        percentage: Math.round(weights[i] * 100),
    }));
}

// ─── System Prompts ───────────────────────────────────────────────────────────

/** GET /api/v1/dept/{deptId}/system-prompts */
export async function getDASystemPrompts(): Promise<DASystemPrompt[]> {
    await delay(200);
    return structuredClone(MOCK_DA_SYSTEM_PROMPTS);
}

/** GET /api/v1/dept/{deptId}/org-system-prompts  (read-only, enforced by org admin) */
export async function getOAPromptsForDept(): Promise<DASystemPrompt[]> {
    await delay(150);
    return structuredClone(MOCK_OA_ENFORCED_PROMPTS);
}

/** POST /api/v1/dept/{deptId}/system-prompts */
export async function createDASystemPrompt(
    name: string,
    content: string,
): Promise<DASystemPrompt> {
    await delay(400);
    const prompt: DASystemPrompt = {
        id:                 `sp-da-${Date.now()}`,
        name:               name.trim(),
        content:            content.trim(),
        appliedToEmployees: [],
        createdAt:          new Date().toISOString().split('T')[0],
    };
    MOCK_DA_SYSTEM_PROMPTS.push(prompt);
    return structuredClone(prompt);
}

/** PUT /api/v1/dept/{deptId}/system-prompts/{promptId} */
export async function updateDASystemPrompt(
    id: string,
    patch: Partial<Pick<DASystemPrompt, 'name' | 'content'>>,
): Promise<DASystemPrompt> {
    await delay(350);
    const prompt = MOCK_DA_SYSTEM_PROMPTS.find((p) => p.id === id);
    if (!prompt) throw new Error(`System prompt ${id} not found`);
    if (patch.name    !== undefined) prompt.name    = patch.name.trim();
    if (patch.content !== undefined) prompt.content = patch.content.trim();
    return structuredClone(prompt);
}

/** DELETE /api/v1/dept/{deptId}/system-prompts/{promptId} */
export async function deleteDASystemPrompt(id: string): Promise<void> {
    await delay(300);
    const idx = MOCK_DA_SYSTEM_PROMPTS.findIndex((p) => p.id === id);
    if (idx !== -1) MOCK_DA_SYSTEM_PROMPTS.splice(idx, 1);
}

/** PUT /api/v1/dept/{deptId}/system-prompts/{promptId}/apply
 *  Pass employee IDs. Pass all IDs for "apply to all".
 *  Pass an empty array to un-apply from everyone.
 */
export async function applyDASystemPromptToEmployees(
    id: string,
    employeeIds: string[],
): Promise<DASystemPrompt> {
    await delay(450);
    const prompt = MOCK_DA_SYSTEM_PROMPTS.find((p) => p.id === id);
    if (!prompt) throw new Error(`System prompt ${id} not found`);
    prompt.appliedToEmployees = [...employeeIds];
    return structuredClone(prompt);
}
