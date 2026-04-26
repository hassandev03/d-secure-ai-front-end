/**
 * Department Admin service.
 * All mock data is centralised here. When the Python backend is connected,
 * replace each function body with the equivalent axios call from `./api`.
 */

import { delay } from './api';
import { MODELS } from '@/lib/constants';
import type { LLMModel } from '@/types/chat.types';
import {
    estimateMonthlyCreditsFixed,
    buildDailyCredits,
    buildDatedTrend,
} from '@/lib/costCalculator';

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
// Role monthly credit budgets are derived from the cost formula (Module H):
// estimateMonthlyCreditsFixed gives the expected USD spend for a typical employee
// in that role over a 22-workday month.
//
// Profile assumptions per role:
//   Tech Lead        — 8 queries/day, long prompts (300w in / 500w out), GPT-4o, 30% file use
//   Senior Developer — 6 queries/day, 250w/400w, GPT-4o, 20% file use
//   Developer        — 5 queries/day, 200w/350w, claude-4-5-haiku, 15% file use
//   DevOps Engineer  — 4 queries/day, 200w/300w, gemini-3-1-pro, 10% file use
//   QA Engineer      — 4 queries/day, 150w/250w, gpt-4o-mini, 5% file use
//   Business Analyst — 4 queries/day, 200w/300w, claude-4-6-sonnet, 20% file use, 20% RAG
//   Project Manager  — 3 queries/day, 150w/200w, gpt-4o-mini, 10% file use
//   Designer         — 3 queries/day, 100w/200w, gemini-3-1-flash, 5% file use
const ROLE_BUDGETS = {
    'role-1': estimateMonthlyCreditsFixed({ queriesPerDay: 8, avgInputWords: 300, avgOutputWords: 500, modelKey: 'gpt-4o',           fileQueryPct: 0.30, avgFileWords: 800, ragPct: 0.10 }),
    'role-2': estimateMonthlyCreditsFixed({ queriesPerDay: 6, avgInputWords: 250, avgOutputWords: 400, modelKey: 'gpt-4o',           fileQueryPct: 0.20, avgFileWords: 600, ragPct: 0.10 }),
    'role-3': estimateMonthlyCreditsFixed({ queriesPerDay: 5, avgInputWords: 200, avgOutputWords: 350, modelKey: 'claude-4-5-haiku', fileQueryPct: 0.15, avgFileWords: 400, ragPct: 0.05 }),
    'role-4': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 200, avgOutputWords: 300, modelKey: 'gemini-3-1-pro',  fileQueryPct: 0.10, avgFileWords: 300, ragPct: 0.05 }),
    'role-5': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 150, avgOutputWords: 250, modelKey: 'gpt-4o-mini',     fileQueryPct: 0.05, avgFileWords: 200, ragPct: 0.00 }),
    'role-6': estimateMonthlyCreditsFixed({ queriesPerDay: 4, avgInputWords: 200, avgOutputWords: 300, modelKey: 'claude-4-6-sonnet',fileQueryPct: 0.20, avgFileWords: 500, ragPct: 0.20 }),
    'role-7': estimateMonthlyCreditsFixed({ queriesPerDay: 3, avgInputWords: 150, avgOutputWords: 200, modelKey: 'gpt-4o-mini',     fileQueryPct: 0.10, avgFileWords: 300, ragPct: 0.10 }),
    'role-8': estimateMonthlyCreditsFixed({ queriesPerDay: 3, avgInputWords: 100, avgOutputWords: 200, modelKey: 'gemini-3-1-flash', fileQueryPct: 0.05, avgFileWords: 200, ragPct: 0.00 }),
} as Record<string, number>;

const MOCK_ORG_ROLES: OrgRole[] = [
    { id: 'role-1', name: 'Tech Lead',        description: 'Technical team lead',             defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-1']) },
    { id: 'role-2', name: 'Senior Developer', description: 'Senior software engineer',        defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-2']) },
    { id: 'role-3', name: 'Developer',        description: 'Software engineer',               defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-3']) },
    { id: 'role-4', name: 'DevOps Engineer',  description: 'Infrastructure and operations',   defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-4']) },
    { id: 'role-5', name: 'QA Engineer',      description: 'Quality assurance engineer',      defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-5']) },
    { id: 'role-6', name: 'Business Analyst', description: 'Business and product analysis',   defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-6']) },
    { id: 'role-7', name: 'Project Manager',  description: 'Project coordination & delivery', defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-7']) },
    { id: 'role-8', name: 'Designer',         description: 'UI/UX and product design',        defaultCreditLimit: Math.ceil(ROLE_BUDGETS['role-8']) },
];

/**
 * Department employees.
 * Backend route (future): GET /api/v1/dept/{deptId}/employees
 */
// creditsUsed = estimateMonthlyCreditsFixed with a partial-month multiplier
// to simulate different stages of the billing period.
// creditLimit = the role's formula-derived monthly budget ceiling.
const c = (roleId: string, partialMonthFraction: number) =>
    Math.round(ROLE_BUDGETS[roleId] * partialMonthFraction * 1000) / 1000;

const MOCK_DEPT_EMPLOYEES: DeptEmployee[] = [
    { id: "1",  name: "Raj Patel",       email: "raj@acme.com",       roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: c('role-2', 0.65), creditLimit: Math.ceil(ROLE_BUDGETS['role-2']), lastActive: "Today"      },
    { id: "2",  name: "John Miller",     email: "john@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: c('role-3', 0.60), creditLimit: Math.ceil(ROLE_BUDGETS['role-3']), lastActive: "Today"      },
    { id: "3",  name: "Alice Brown",     email: "alice@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed: c('role-5', 0.58), creditLimit: Math.ceil(ROLE_BUDGETS['role-5']), lastActive: "Yesterday"  },
    { id: "4",  name: "Bob Wilson",      email: "bob@acme.com",       roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed: c('role-4', 0.55), creditLimit: Math.ceil(ROLE_BUDGETS['role-4']), lastActive: "Yesterday"  },
    { id: "5",  name: "Mike Chen",       email: "mike@acme.com",      roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed: c('role-3', 0.18), creditLimit: 0,                               lastActive: "3 days ago" },
    { id: "6",  name: "Emily Zhao",      email: "emily@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: c('role-2', 0.35), creditLimit: Math.ceil(ROLE_BUDGETS['role-2']), lastActive: "Today"      },
    { id: "7",  name: "Tom Baker",       email: "tom@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   creditsUsed: c('role-1', 0.52), creditLimit: Math.ceil(ROLE_BUDGETS['role-1']), lastActive: "Today"      },
    { id: "8",  name: "Sara Kim",        email: "sara@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: c('role-3', 0.38), creditLimit: Math.ceil(ROLE_BUDGETS['role-3']), lastActive: "Today"      },
    { id: "9",  name: "David Lee",       email: "david@acme.com",     roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed: c('role-5', 0.27), creditLimit: Math.ceil(ROLE_BUDGETS['role-5']), lastActive: "2 days ago" },
    { id: "10", name: "Priya Singh",     email: "priya@acme.com",     roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: c('role-3', 0.57), creditLimit: Math.ceil(ROLE_BUDGETS['role-3']), lastActive: "Today"      },
    { id: "11", name: "Liam Turner",     email: "liam@acme.com",      roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed: c('role-4', 0.31), creditLimit: Math.ceil(ROLE_BUDGETS['role-4']), lastActive: "Yesterday"  },
    { id: "12", name: "Olivia Martin",   email: "olivia@acme.com",    roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed: c('role-3', 0.05), creditLimit: 0,                               lastActive: "1 week ago" },
    { id: "13", name: "James Anderson",  email: "james@acme.com",     roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: c('role-2', 0.79), creditLimit: Math.ceil(ROLE_BUDGETS['role-2']), lastActive: "Today"      },
    { id: "14", name: "Mia Thompson",    email: "mia@acme.com",       roleId: "role-5", roleName: "QA Engineer",      status: "ACTIVE",   creditsUsed: c('role-5', 0.22), creditLimit: Math.ceil(ROLE_BUDGETS['role-5']), lastActive: "Today"      },
    { id: "15", name: "Noah Garcia",     email: "noah@acme.com",      roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: c('role-3', 0.67), creditLimit: Math.ceil(ROLE_BUDGETS['role-3']), lastActive: "Today"      },
    { id: "16", name: "Ava Martinez",    email: "ava@acme.com",       roleId: "role-1", roleName: "Tech Lead",        status: "ACTIVE",   creditsUsed: c('role-1', 0.61), creditLimit: Math.ceil(ROLE_BUDGETS['role-1']), lastActive: "Yesterday"  },
    { id: "17", name: "William Jackson", email: "william@acme.com",   roleId: "role-3", roleName: "Developer",        status: "ACTIVE",   creditsUsed: c('role-3', 0.35), creditLimit: Math.ceil(ROLE_BUDGETS['role-3']), lastActive: "Today"      },
    { id: "18", name: "Isabella White",  email: "isabella@acme.com",  roleId: "role-2", roleName: "Senior Developer", status: "ACTIVE",   creditsUsed: c('role-2', 0.53), creditLimit: Math.ceil(ROLE_BUDGETS['role-2']), lastActive: "Today"      },
    { id: "19", name: "Ethan Harris",    email: "ethan@acme.com",     roleId: "role-3", roleName: "Developer",        status: "INACTIVE", creditsUsed: c('role-3', 0.09), creditLimit: 0,                               lastActive: "5 days ago" },
    { id: "20", name: "Sophia Clark",    email: "sophia@acme.com",    roleId: "role-4", roleName: "DevOps Engineer",  status: "ACTIVE",   creditsUsed: c('role-4', 0.41), creditLimit: Math.ceil(ROLE_BUDGETS['role-4']), lastActive: "Today"      },
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
const MOCK_REQUEST_TYPE_META: Omit<UsageTypePoint, 'credits' | 'percentage'>[] = [
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

export type DailyUsagePoint = {
    date: string;
    /** Credits consumed (USD) on this day */
    credits: number;
    activeUsers: number;
};

/** @deprecated Use DailyUsagePoint */
export type DailyRequestPoint = DailyUsagePoint;

export type ModelUsageSlice = {
    name: string;
    /** Credits (USD) consumed via this model */
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
    /** Credits (USD) consumed on this day */
    credits: number;
    activeUsers: number;
};

export type UsageTypePoint = {
    type: string;
    /** Credits (USD) consumed by this usage type */
    credits: number;
    percentage: number;
    /** Privacy / operational importance of this usage type */
    priority: 'high' | 'medium' | 'low';
    /** Short description shown in tooltips / callouts */
    description: string;
    color: string;
};

/** @deprecated Use UsageTypePoint */
export type RequestTypePoint = UsageTypePoint;

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

function buildDailyRequests(employees: DeptEmployee[]): DailyUsagePoint[] {
    const totalCredits = employees.reduce((s, e) => s + e.creditsUsed, 0);
    const activeCount   = employees.filter((e) => e.status === 'ACTIVE').length;
    // Use formula-based day distribution: weekday avg / weekend ~20% of weekday
    // total = 22*X + 8*0.2X  →  X = total / 23.6
    const workdayAvg   = totalCredits / 23.6;
    const weekendAvg   = workdayAvg * 0.2;
    const DAY_DATA: Array<{ date: string; isWeekend: boolean; userPct: number }> = [
        { date: 'Mon', isWeekend: false, userPct: 0.85 },
        { date: 'Tue', isWeekend: false, userPct: 0.90 },
        { date: 'Wed', isWeekend: false, userPct: 0.88 },
        { date: 'Thu', isWeekend: false, userPct: 0.82 },
        { date: 'Fri', isWeekend: false, userPct: 0.78 },
        { date: 'Sat', isWeekend: true,  userPct: 0.25 },
        { date: 'Sun', isWeekend: true,  userPct: 0.18 },
    ];
    return DAY_DATA.map(({ date, isWeekend, userPct }) => ({
        date,
        credits:     Math.round((isWeekend ? weekendAvg : workdayAvg) * 100) / 100,
        activeUsers: Math.round(activeCount * userPct),
    }));
}

function buildModelUsage(employees: DeptEmployee[]): ModelUsageSlice[] {
    const totalCredits = employees.reduce((s, e) => s + e.creditsUsed, 0);
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
        value: Math.round(totalCredits * s.pct * 10) / 10,
        color: MODEL_COLORS[s.name] || '#94A3B8',
    }));
}

function buildUsageTrend(employees: DeptEmployee[], days: number): UsageTrendPoint[] {
    const totalCredits = employees.reduce((s, e) => s + e.creditsUsed, 0);
    const activeCount  = employees.filter((e) => e.status === 'ACTIVE').length;
    // workdayAvg derived from formula: total = 22*X + 8*0.2X → X = total/23.6
    const workdayAvg   = totalCredits / 23.6;
    const weekendAvg   = workdayAvg * 0.2;
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const userPct   = isWeekend ? 0.22 : 0.80;
        return {
            date:        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            credits:     Math.round((isWeekend ? weekendAvg : workdayAvg) * 100) / 100,
            activeUsers: Math.max(1, Math.round(activeCount * userPct)),
        };
    });
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
 * Breaks the department's total credit consumption down by usage type.
 * Credits are derived proportionally from the actual total so they always sum correctly.
 * GET /api/v1/dept/{deptId}/dashboard/usage-types
 */
export async function getDeptRequestTypeBreakdown(): Promise<UsageTypePoint[]> {
    await delay(250);
    const total = MOCK_DEPT_EMPLOYEES.reduce((s, e) => s + e.creditsUsed, 0);
    // Distribution weights — must sum to 1.0  (Text Query, File Upload, Speech Input)
    const weights = [0.55, 0.30, 0.15];
    return MOCK_REQUEST_TYPE_META.map((meta, i) => ({
        ...meta,
        credits:    Math.round(total * weights[i] * 10) / 10,
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
