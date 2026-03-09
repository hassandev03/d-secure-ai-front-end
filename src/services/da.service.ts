/**
 * Department Admin service.
 * All mock data is centralised here. When the Python backend is connected,
 * replace each function body with the equivalent axios call from `./api`.
 */

import { delay } from './api';
import { MODELS } from '@/lib/constants';
import type { LLMModel } from '@/types/chat.types';

// ─── Types ────────────────────────────────────────────────────────────────────

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
