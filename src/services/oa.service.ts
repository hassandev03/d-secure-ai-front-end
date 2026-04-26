/**
 * Organisation Admin service — single source of truth for ALL OA portal data.
 *
 * Architecture:
 *   - All canonical mock data lives in the private constants below (DEPTS,
 *     EMPLOYEES, QUOTA_REQUESTS, etc.).  No other OA page file contains seed
 *     data arrays.
 *   - Every exported function maps 1-to-1 to a real backend endpoint (shown
 *     in the JSDoc comment).  Swap the mock body for an axios/fetch call when
 *     the Python backend is ready — frontend pages require zero changes.
 *   - Pages own their local mutation state (add / edit / delete via useState);
 *     they call these functions only for the initial data load.
 */

import { delay } from './api';
import type { LLMModel } from '@/types/chat.types';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical types
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
    fileUpload:        boolean;
    speechToText:      boolean;
    allModels:         boolean;
    permittedModels:   LLMModel[];
    defaultCreditLimit: number;
    maxDailyLimit:     number;
    allowApiAccess:    boolean;
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
    creditLimit:      number;
    synced:          boolean;
};

export type OADepartment = {
    id:       string;
    name:     string;
    head:     string;
    headEmail: string;
    employees: number;
    percentageUsed: number;
    budget: number;
    color:    string; // hex, e.g. "#3B82F6"
};

export type OAEmployee = {
    id:            string;
    name:          string;
    email:         string;
    departmentId?: string; // for backend FK; optional until API is wired
    department:    string; // display name (= OADepartment.name)
    role:          'EMPLOYEE' | 'DEPT_ADMIN';
    status:        'ACTIVE' | 'INACTIVE' | 'PENDING';
    creditsUsed:      number;
    creditLimit:    number;
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

export type OAGlossaryTerm = {
    id:         number;
    term:       string;
    definition: string;
    category:   string;
};

export type OAContextDocument = {
    id:         number;
    name:       string;
    size:       string;
    uploadedAt: string;
    type:       'PDF' | 'TXT';
};

export type OACustomPattern = {
    id:      number;
    label:   string;
    pattern: string;
    example: string;
    active:  boolean;
};

export type OASystemPrompt = {
    id:              string;
    name:            string;
    content:         string;
    /** IDs of departments this prompt is forced-applied to. Empty = not applied anywhere. */
    appliedToDepts:  string[];
    createdAt:       string;
};

export type OAQueryLog = {
    id:            string;
    timestamp:     string;
    employeeEmail: string;
    employeeId:    string;
    department:    string;
    piiDetected:   string[]; // e.g. ["EMAIL", "CREDIT_CARD"]
};

// ── Dashboard presentation types ─────────────────────────────────────────────

export type OrgDashboardStats = {
    totalEmployees:          number;
    activeEmployees:         number;
    pendingEmployees:        number;
    departments:             number;
    monthlyCredits:      number;
    monthlyBudget:     number;
    quotaUtilization:        number;
    unallocatedBudget:       number;
    pendingQuotaRequests:    number;
    adoptionRate:            number;
    avgCreditsPerEmployee:   number;
};

export type OrgModelUsageSlice = {
    name:  string;
    value: number;
    color: string;
};

export type OrgUsageTrendPoint = {
    date:     string;
    creditsUsed: number;
};

export type RecentActivityItem = {
    id:          string;
    type:        'employee_added' | 'employee_removed' | 'quota_approved' | 'quota_denied' | 'policy_changed' | 'dept_created' | 'security_alert';
    title:       string;
    description: string;
    timestamp:   string;
    icon:        'user-plus' | 'user-minus' | 'check-circle' | 'x-circle' | 'shield' | 'building' | 'alert-triangle';
};

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth — ALL OA mock data lives here, nowhere else
// ─────────────────────────────────────────────────────────────────────────────

const ORG_CONFIG: OAOrgConfig = {
    totalBudget:   8_000,
    plan:          "Enterprise",
    quotaRenewsAt: "2026-04-01",
    name:          "Acme Corporation",
    industry:      "Technology",
    domain:        "acme.com",
    country:       "United States",
    supportEmail:  "it@acme.com",
    timezone:      "UTC-5 (Eastern)",
};

const EMP_DEFAULTS: OAEmployeeDefaults = {
    defaultDepartment: "none",
    defaultRole:       "employee",
    monthlyLimit:      100,
    autoApprove:       false,
};

const NOTIFICATIONS: OANotificationSettings = {
    emailNotifications:  true,
    weeklyDigest:        true,
    quotaAlerts:         true,
    quotaAlertThreshold: 80,
};

const SECURITY: OASecuritySettings = {
    enforce2FA:            true,
    minPasswordLength:     12,
    requireUppercase:      true,
    requireSpecialChar:    true,
    sessionTimeout:        30,
    maxConcurrentSessions: 3,
    allowFileUploads:      true,
    allowSpeechToText:     false,
    allowApiAccess:        false,
    ipWhitelist:           false,
    ipWhitelistValue:      "",
};

const ORG_POLICY: OAOrgPolicy = {
    fileUpload:        true,
    speechToText:      false,
    allModels:         false,
    permittedModels:   ["gpt-5-1", "claude-4-6-sonnet", "gemini-3-1-pro"] as LLMModel[],
    defaultCreditLimit: 50,
    maxDailyLimit:     200,
    allowApiAccess:    false,
};

// We use all models logic. We'll simply hardcode the expected IDs since the pages import constants anyway:
const ALL_MODELS = [
    "claude-4-6-sonnet", "claude-4-5-haiku", "claude-4-6-opus", "gpt-4o", "gpt-5-1", "gemini-3-1-pro", "gemini-3-1-flash"
] as LLMModel[];

const DEPT_POLICIES: OADeptPolicyState[] = [
    { id: "d1", name: "Engineering", head: "Sarah Johnson", employees: 45, color: "bg-blue-500",    fileUpload: true,  speechToText: true,  allModels: true,  permittedModels: ALL_MODELS, creditLimit: 80,  synced: false },
    { id: "d2", name: "Marketing",   head: "Emma Davis",    employees: 20, color: "bg-pink-500",    fileUpload: true,  speechToText: false, allModels: false, permittedModels: ["gpt-5-1", "claude-4-6-sonnet"] as LLMModel[], creditLimit: 50, synced: false },
    { id: "d3", name: "Sales",       head: "David Kim",     employees: 25, color: "bg-orange-500",  fileUpload: true,  speechToText: false, allModels: false, permittedModels: ["gpt-5-1", "claude-4-6-sonnet", "gemini-3-1-pro"] as LLMModel[], creditLimit: 50, synced: true },
    { id: "d4", name: "Finance",     head: "Aisha Patel",   employees: 12, color: "bg-emerald-500", fileUpload: false, speechToText: false, allModels: false, permittedModels: ["gpt-5-1"] as LLMModel[], creditLimit: 30, synced: false },
    { id: "d5", name: "HR",          head: "Lisa Chen",     employees: 10, color: "bg-violet-500",  fileUpload: true,  speechToText: false, allModels: false, permittedModels: ["gpt-5-1", "claude-4-6-sonnet", "gemini-3-1-pro"] as LLMModel[], creditLimit: 50, synced: true },
    { id: "d6", name: "Operations",  head: "James Wilson",  employees: 8,  color: "bg-amber-500",   fileUpload: true,  speechToText: false, allModels: false, permittedModels: ["gpt-5-1", "claude-4-6-sonnet"] as LLMModel[], creditLimit: 40, synced: false },
];


/** Colour palette for newly created departments (cycling). Exported so the
 *  departments page can assign a colour on creation without duplicating it. */
export const DEPT_COLORS = [
    "#3B82F6", "#EC4899", "#F97316", "#10B981",
    "#8B5CF6", "#F59E0B", "#06B6D4", "#EF4444",
];

const DEPTS: OADepartment[] = [
    { id: "dept-001", name: "Engineering", head: "Sarah Johnson", headEmail: "sarah@acme.com",  employees: 45, percentageUsed: 78.8, budget: 1800, color: "#3B82F6" },
    { id: "dept-002", name: "Marketing",   head: "Emma Davis",    headEmail: "emma@acme.com",   employees: 20, percentageUsed: 77.5, budget: 800,  color: "#EC4899" },
    { id: "dept-003", name: "Sales",       head: "David Kim",     headEmail: "david@acme.com",  employees: 25, percentageUsed: 68.5, budget: 700,  color: "#F97316" },
    { id: "dept-004", name: "Finance",     head: "Aisha Patel",   headEmail: "aisha@acme.com",  employees: 12, percentageUsed: 65.0, budget: 600,  color: "#10B981" },
    { id: "dept-005", name: "HR",          head: "Lisa Chen",     headEmail: "lisa@acme.com",   employees: 10, percentageUsed: 45.0, budget: 400,  color: "#8B5CF6" },
    { id: "dept-006", name: "Operations",  head: "James Wilson",  headEmail: "james@acme.com",  employees: 8,  percentageUsed: 44.2, budget: 700,  color: "#F59E0B" },
];

const EMPLOYEES: OAEmployee[] = [
    { id: "emp-001", name: "John Miller",    email: "john@acme.com",    departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "ACTIVE",   creditsUsed: 180, creditLimit: 50,  lastActive: "2026-03-13" },
    { id: "emp-002", name: "Emma Davis",     email: "emma@acme.com",    departmentId: "dept-002", department: "Marketing",   role: "DEPT_ADMIN", status: "ACTIVE",   creditsUsed: 95,  creditLimit: 100, lastActive: "2026-03-13" },
    { id: "emp-003", name: "Carlos Ruiz",    email: "carlos@acme.com",  departmentId: "dept-003", department: "Sales",       role: "EMPLOYEE",   status: "PENDING",  creditsUsed: 0,   creditLimit: 30,  lastActive: "—" },
    { id: "emp-004", name: "Aisha Patel",    email: "aisha@acme.com",   departmentId: "dept-004", department: "Finance",     role: "DEPT_ADMIN", status: "ACTIVE",   creditsUsed: 210, creditLimit: 100, lastActive: "2026-03-12" },
    { id: "emp-005", name: "Mike Chen",      email: "mike@acme.com",    departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "INACTIVE", creditsUsed: 45,  creditLimit: 0,   lastActive: "2026-02-15" },
    { id: "emp-006", name: "Sophie Laurent", email: "sophie@acme.com",  departmentId: "dept-005", department: "HR",          role: "EMPLOYEE",   status: "ACTIVE",   creditsUsed: 60,  creditLimit: 30,  lastActive: "2026-03-13" },
    { id: "emp-007", name: "Raj Patel",      email: "raj@acme.com",     departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "ACTIVE",   creditsUsed: 320, creditLimit: 50,  lastActive: "2026-03-13" },
    { id: "emp-008", name: "Lisa Wang",      email: "lisa@acme.com",    departmentId: "dept-006", department: "Operations",  role: "EMPLOYEE",   status: "ACTIVE",   creditsUsed: 78,  creditLimit: 30,  lastActive: "2026-03-12" },
    { id: "emp-009", name: "Tom Brennan",    email: "tom@acme.com",     departmentId: "dept-003", department: "Sales",       role: "DEPT_ADMIN", status: "ACTIVE",   creditsUsed: 134, creditLimit: 100, lastActive: "2026-03-13" },
    { id: "emp-010", name: "Nina Hoffmann",  email: "nina@acme.com",    departmentId: "dept-004", department: "Finance",     role: "EMPLOYEE",   status: "ACTIVE",   creditsUsed: 88,  creditLimit: 30,  lastActive: "2026-03-11" },
    { id: "emp-011", name: "Kevin Park",     email: "kevin@acme.com",   departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "PENDING",  creditsUsed: 0,   creditLimit: 30,  lastActive: "—" },
    { id: "emp-012", name: "Priya Sharma",   email: "priya@acme.com",   departmentId: "dept-005", department: "HR",          role: "DEPT_ADMIN", status: "ACTIVE",   creditsUsed: 112, creditLimit: 100, lastActive: "2026-03-13" },
];

const QUOTA_REQUESTS: OAQuotaRequest[] = [
    {
        id: "req-001", deptId: "dept-001", deptName: "Engineering", requestedBy: "Sarah Johnson",
        amount: 800, reason: "Year-end sprint — extra capacity for code reviews and documentation generation.",
        date: "2026-03-12", status: "PENDING",
    },
    {
        id: "req-002", deptId: "dept-002", deptName: "Marketing", requestedBy: "Emma Davis",
        amount: 300, reason: "Q1 campaign content generation — blog posts, social media, email sequences.",
        date: "2026-03-13", status: "PENDING",
    },
    {
        id: "req-003", deptId: "dept-003", deptName: "Sales", requestedBy: "David Kim",
        amount: 400, reason: "Black Friday outreach and proposal generation.",
        date: "2026-02-20", status: "APPROVED", grantedAmount: 400, respondedAt: "2026-02-21",
    },
    {
        id: "req-004", deptId: "dept-004", deptName: "Finance", requestedBy: "Aisha Patel",
        amount: 200, reason: "End-of-year audit report generation.",
        date: "2026-02-15", status: "DENIED", respondedAt: "2026-02-16",
    },
    {
        id: "req-005", deptId: "dept-001", deptName: "Engineering", requestedBy: "Sarah Johnson",
        amount: 600, reason: "Platform migration scripting — extra AI calls required.",
        date: "2026-01-28", status: "APPROVED", grantedAmount: 500, respondedAt: "2026-01-29",
    },
];

const GLOSSARY_TERMS: OAGlossaryTerm[] = [
    { id: 1, term: "D-SecureAI",           definition: "Our privacy-preserving AI gateway platform",                                  category: "Product"    },
    { id: 2, term: "Entity Masking Engine", definition: "Core component that detects and replaces personally identifiable information", category: "Technical"  },
    { id: 3, term: "Project Falcon",        definition: "Internal codename for upcoming enterprise analytics module",                  category: "Internal"   },
    { id: 4, term: "CTRL Protocol",         definition: "Internal data handling standard v2.3",                                       category: "Compliance" },
    { id: 5, term: "QuotaSync",             definition: "Real-time quota tracking and allocation system",                              category: "Technical"  },
];

const CONTEXT_DOCUMENTS: OAContextDocument[] = [
    { id: 1, name: "Company Style Guide.pdf", size: "2.4 MB", uploadedAt: "2025-11-20", type: "PDF" },
    { id: 2, name: "Product Terminology.txt", size: "340 KB", uploadedAt: "2025-11-15", type: "TXT" },
    { id: 3, name: "Compliance Glossary.pdf", size: "1.1 MB", uploadedAt: "2025-10-28", type: "PDF" },
];

const SYSTEM_PROMPTS: OASystemPrompt[] = [
    {
        id:             "sp-oa-001",
        name:           "Professional Tone Policy",
        content:        "Always respond in a formal, professional tone. Avoid colloquialisms, slang, or casual language. Structure responses clearly with concise paragraphs.",
        appliedToDepts: ["dept-001", "dept-003"],
        createdAt:      "2026-03-01",
    },
    {
        id:             "sp-oa-002",
        name:           "Data Privacy Reminder",
        content:        "Before providing any response that may involve personal or financial data, remind the user that all PII is automatically anonymized by D-SecureAI. Do not include actual personal identifiers in your responses.",
        appliedToDepts: ["dept-004", "dept-005"],
        createdAt:      "2026-03-05",
    },
    {
        id:             "sp-oa-003",
        name:           "Compliance Disclaimer",
        content:        "When answering questions related to legal, financial, or HR matters, always append: 'This response is for informational purposes only and does not constitute professional legal or financial advice.'",
        appliedToDepts: [],
        createdAt:      "2026-03-10",
    },
];

const CUSTOM_PATTERNS: OACustomPattern[] = [
    { id: 1, label: "Employee ID",      pattern: "EMP-[0-9]{6}",          example: "EMP-001234",  active: true  },
    { id: 2, label: "Project Code",     pattern: "PRJ-[A-Z]{2}-[0-9]{4}", example: "PRJ-EN-2025", active: true  },
    { id: 3, label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+",   example: "DOC-FIN-42",  active: false },
];

const RECENT_ACTIVITIES: RecentActivityItem[] = [
    { id: "a1", type: "employee_added",   title: "New employee added",     description: "Carlos Ruiz joined the Sales department",          timestamp: "2 hours ago", icon: "user-plus"      },
    { id: "a2", type: "quota_approved",   title: "Quota request approved", description: "Engineering dept granted +200 creditsUsed",           timestamp: "4 hours ago", icon: "check-circle"   },
    { id: "a3", type: "policy_changed",   title: "Policy updated",         description: "Speech-to-text enabled for Marketing department",  timestamp: "6 hours ago", icon: "shield"         },
    { id: "a4", type: "security_alert",   title: "Multiple failed logins", description: "3 failed login attempts for mike@acme.com",       timestamp: "8 hours ago", icon: "alert-triangle" },
    { id: "a5", type: "employee_removed", title: "Employee deactivated",   description: "Ethan Harris deactivated from Engineering",        timestamp: "1 day ago",   icon: "user-minus"     },
    { id: "a6", type: "quota_denied",     title: "Quota request denied",   description: "Operations dept request for +500 denied",          timestamp: "1 day ago",   icon: "x-circle"       },
    { id: "a7", type: "dept_created",     title: "Department edited",      description: "HR department quota increased to 400",             timestamp: "2 days ago",  icon: "building"       },
    { id: "a8", type: "employee_added",   title: "New employee added",     description: "Mia Thompson joined the Engineering department",   timestamp: "2 days ago",  icon: "user-plus"      },
];

const QUERY_LOGS: OAQueryLog[] = [
    { id: "ql-001", timestamp: "2026-03-24 17:02:11", employeeEmail: "raj@acme.com",    employeeId: "EMP-000007", department: "Engineering", piiDetected: ["CREDENTIALS", "INTELLECTUAL_PROPERTY"] },
    { id: "ql-002", timestamp: "2026-03-24 16:48:33", employeeEmail: "aisha@acme.com",  employeeId: "EMP-000004", department: "Finance",     piiDetected: ["FINANCIAL_DATA", "CORPORATE_SECRETS"] },
    { id: "ql-003", timestamp: "2026-03-24 16:31:05", employeeEmail: "tom@acme.com",    employeeId: "EMP-000009", department: "Sales",       piiDetected: ["PERSONALLY_IDENTIFIABLE_INFO"] },
    { id: "ql-004", timestamp: "2026-03-24 16:15:47", employeeEmail: "john@acme.com",   employeeId: "EMP-000001", department: "Engineering", piiDetected: ["INTELLECTUAL_PROPERTY", "SYSTEM_AND_NETWORK_DATA"] },
    { id: "ql-005", timestamp: "2026-03-24 15:58:22", employeeEmail: "emma@acme.com",   employeeId: "EMP-000002", department: "Marketing",   piiDetected: ["PERSONALLY_IDENTIFIABLE_INFO", "CORPORATE_SECRETS"] },
    { id: "ql-006", timestamp: "2026-03-24 15:40:09", employeeEmail: "nina@acme.com",   employeeId: "EMP-000010", department: "Finance",     piiDetected: ["FINANCIAL_DATA", "PERSONALLY_IDENTIFIABLE_INFO"] },
    { id: "ql-007", timestamp: "2026-03-24 15:22:55", employeeEmail: "priya@acme.com",  employeeId: "EMP-000012", department: "HR",          piiDetected: ["PERSONALLY_IDENTIFIABLE_INFO", "PROTECTED_HEALTH_INFO"] },
    { id: "ql-008", timestamp: "2026-03-24 15:07:14", employeeEmail: "sophie@acme.com", employeeId: "EMP-000006", department: "HR",          piiDetected: ["PERSONALLY_IDENTIFIABLE_INFO"] },
    { id: "ql-009", timestamp: "2026-03-24 14:51:38", employeeEmail: "lisa@acme.com",   employeeId: "EMP-000008", department: "Operations",  piiDetected: ["PERSONALLY_IDENTIFIABLE_INFO", "FINANCIAL_DATA"] },
    { id: "ql-010", timestamp: "2026-03-24 14:33:01", employeeEmail: "raj@acme.com",    employeeId: "EMP-000007", department: "Engineering", piiDetected: ["SYSTEM_AND_NETWORK_DATA", "CREDENTIALS"] },
    { id: "ql-011", timestamp: "2026-03-24 14:18:29", employeeEmail: "john@acme.com",   employeeId: "EMP-000001", department: "Engineering", piiDetected: ["INTELLECTUAL_PROPERTY"] },
    { id: "ql-012", timestamp: "2026-03-24 13:55:44", employeeEmail: "aisha@acme.com",  employeeId: "EMP-000004", department: "Finance",     piiDetected: ["FINANCIAL_DATA"] },
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

// ─────────────────────────────────────────────────────────────────────────────
// Private builders (derived from canonical data — no extra hardcoding)
// ─────────────────────────────────────────────────────────────────────────────

function buildModelUsage(): OrgModelUsageSlice[] {
    const total = DEPTS.reduce((s, d) => s + d.budget * (d.percentageUsed / 100), 0);
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
        name:  s.name,
        value: Math.round(total * s.pct),
        color: MODEL_COLORS[s.name] || '#94A3B8',
    }));
}

function buildUsageTrend(days: number): OrgUsageTrendPoint[] {
    const avg   = DEPTS.reduce((s, d) => s + d.budget * (d.percentageUsed / 100), 0) / 30;
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const factor    = isWeekend ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.6;
        return {
            date:     d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            creditsUsed: Math.round(avg * factor),
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// Replace each function body with the equivalent axios/fetch call when the
// Python backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/org/{orgId}/config */
export async function getOAOrgConfig(): Promise<OAOrgConfig> {
    await delay(100);
    return { ...ORG_CONFIG };
}

export async function updateOAOrgConfig(cfg: Partial<OAOrgConfig>): Promise<void> {
    await delay(300);
    Object.assign(ORG_CONFIG, cfg);
}

/** GET /api/v1/org/{orgId}/employee-defaults */
export async function getOAEmployeeDefaults(): Promise<OAEmployeeDefaults> {
    await delay(100);
    return { ...EMP_DEFAULTS };
}

export async function updateOAEmployeeDefaults(defs: Partial<OAEmployeeDefaults>): Promise<void> {
    await delay(300);
    Object.assign(EMP_DEFAULTS, defs);
}

/** GET /api/v1/org/{orgId}/notifications */
export async function getOANotifications(): Promise<OANotificationSettings> {
    await delay(100);
    return { ...NOTIFICATIONS };
}

export async function updateOANotifications(nots: Partial<OANotificationSettings>): Promise<void> {
    await delay(300);
    Object.assign(NOTIFICATIONS, nots);
}

/** GET /api/v1/org/{orgId}/security */
export async function getOASecurity(): Promise<OASecuritySettings> {
    await delay(150);
    return { ...SECURITY };
}

export async function updateOASecurity(sec: Partial<OASecuritySettings>): Promise<void> {
    await delay(350);
    Object.assign(SECURITY, sec);
}

/** GET /api/v1/org/{orgId}/policy */
export async function getOAOrgPolicy(): Promise<OAOrgPolicy> {
    await delay(100);
    return { ...ORG_POLICY, permittedModels: [...ORG_POLICY.permittedModels] };
}

export async function updateOAOrgPolicy(pol: Partial<OAOrgPolicy>): Promise<void> {
    await delay(400);
    Object.assign(ORG_POLICY, pol);
}

/** GET /api/v1/org/{orgId}/dept-policies */
export async function getOADeptPolicies(): Promise<OADeptPolicyState[]> {
    await delay(200);
    return structuredClone(DEPT_POLICIES);
}

export async function updateOADeptPolicy(id: string, pol: Partial<OADeptPolicyState>): Promise<void> {
    await delay(300);
    const d = DEPT_POLICIES.find(p => p.id === id);
    if (d) Object.assign(d, pol);
}

export async function applyOAOrgPolicyToAllDepts(): Promise<void> {
    await delay(700);
    DEPT_POLICIES.forEach(d => {
        d.fileUpload = ORG_POLICY.fileUpload;
        d.speechToText = ORG_POLICY.speechToText;
        d.allModels = ORG_POLICY.allModels;
        d.permittedModels = ORG_POLICY.allModels ? [...ALL_MODELS] : [...ORG_POLICY.permittedModels];
        d.creditLimit = ORG_POLICY.defaultCreditLimit;
        d.synced = true;
    });
}


/** GET /api/v1/org/{orgId}/departments */
export async function getOADepartments(): Promise<OADepartment[]> {
    await delay(200);
    return structuredClone(DEPTS);
}

/** GET /api/v1/org/{orgId}/departments/names  (lightweight for dropdowns) */
export async function getOADepartmentNames(): Promise<string[]> {
    await delay(100);
    return DEPTS.map((d) => d.name);
}

/** GET /api/v1/org/{orgId}/employees */
export async function getOAEmployees(): Promise<OAEmployee[]> {
    await delay(250);
    return structuredClone(EMPLOYEES);
}

/** GET /api/v1/org/{orgId}/quota/creditsUsed */
export async function getOAQuotaRequests(): Promise<OAQuotaRequest[]> {
    await delay(200);
    return structuredClone(QUOTA_REQUESTS);
}

/** GET /api/v1/org/{orgId}/enterprise-context/glossary */
export async function getOAGlossaryTerms(): Promise<OAGlossaryTerm[]> {
    await delay(150);
    return structuredClone(GLOSSARY_TERMS);
}

/** GET /api/v1/org/{orgId}/enterprise-context/documents */
export async function getOAContextDocuments(): Promise<OAContextDocument[]> {
    await delay(150);
    return structuredClone(CONTEXT_DOCUMENTS);
}

/** GET /api/v1/org/{orgId}/enterprise-context/patterns */
export async function getOACustomPatterns(): Promise<OACustomPattern[]> {
    await delay(150);
    return structuredClone(CUSTOM_PATTERNS);
}

// ── Dashboard aggregates (derived — no new data) ────────────────────────────

/** GET /api/v1/org/{orgId}/dashboard/stats */
export async function getOrgDashboardStats(): Promise<OrgDashboardStats> {
    await delay(300);
    const totalEmployees       = DEPTS.reduce((s, d) => s + d.employees, 0);
    const monthlyCredits   = DEPTS.reduce((s, d) => s + d.budget * (d.percentageUsed / 100), 0);
    const monthlyBudget  = DEPTS.reduce((s, d) => s + d.budget, 0);
    const activeEmployees      = EMPLOYEES.filter((e) => e.status === 'ACTIVE').length;
    const pendingEmployees     = EMPLOYEES.filter((e) => e.status === 'PENDING').length;
    const pendingQuotaRequests = QUOTA_REQUESTS.filter((r) => r.status === 'PENDING').length;
    return {
        totalEmployees,
        activeEmployees,
        pendingEmployees,
        departments:          DEPTS.length,
        monthlyCredits,
        monthlyBudget,
        quotaUtilization:     Math.round((monthlyCredits / monthlyBudget) * 100),
        unallocatedBudget:    ORG_CONFIG.totalBudget - monthlyBudget,
        pendingQuotaRequests,
        adoptionRate:         Math.round((activeEmployees / totalEmployees) * 100),
        avgCreditsPerEmployee: Math.round((monthlyCredits / activeEmployees) * 10) / 10,
    };
}

/** GET /api/v1/org/{orgId}/dashboard/departments  (for quota bars & efficiency chart) */
export async function getOrgDeptUsage(): Promise<OADepartment[]> {
    await delay(200);
    return structuredClone(DEPTS);
}

/** GET /api/v1/org/{orgId}/dashboard/model-usage */
export async function getOrgModelUsage(): Promise<OrgModelUsageSlice[]> {
    await delay(200);
    return buildModelUsage();
}

/** GET /api/v1/org/{orgId}/dashboard/usage-trend?days=7|30 */
export async function getOrgUsageTrend(days: 7 | 30 = 7): Promise<OrgUsageTrendPoint[]> {
    await delay(200);
    return buildUsageTrend(days);
}

/** GET /api/v1/org/{orgId}/dashboard/recent-activity */
export async function getOrgRecentActivity(): Promise<RecentActivityItem[]> {
    await delay(250);
    return structuredClone(RECENT_ACTIVITIES);
}

/** GET /api/v1/org/{orgId}/audit/query-logs */
export async function getOAQueryLogs(): Promise<OAQueryLog[]> {
    await delay(250);
    return structuredClone(QUERY_LOGS);
}

// ── System Prompts ───────────────────────────────────────────────────────────

/** GET /api/v1/org/{orgId}/system-prompts */
export async function getOASystemPrompts(): Promise<OASystemPrompt[]> {
    await delay(200);
    return structuredClone(SYSTEM_PROMPTS);
}

/** POST /api/v1/org/{orgId}/system-prompts */
export async function createOASystemPrompt(
    name: string,
    content: string,
): Promise<OASystemPrompt> {
    await delay(400);
    const prompt: OASystemPrompt = {
        id:             `sp-oa-${Date.now()}`,
        name:           name.trim(),
        content:        content.trim(),
        appliedToDepts: [],
        createdAt:      new Date().toISOString().split('T')[0],
    };
    SYSTEM_PROMPTS.push(prompt);
    return structuredClone(prompt);
}

/** PUT /api/v1/org/{orgId}/system-prompts/{promptId} */
export async function updateOASystemPrompt(
    id: string,
    patch: Partial<Pick<OASystemPrompt, 'name' | 'content'>>,
): Promise<OASystemPrompt> {
    await delay(350);
    const prompt = SYSTEM_PROMPTS.find((p) => p.id === id);
    if (!prompt) throw new Error(`System prompt ${id} not found`);
    if (patch.name    !== undefined) prompt.name    = patch.name.trim();
    if (patch.content !== undefined) prompt.content = patch.content.trim();
    return structuredClone(prompt);
}

/** DELETE /api/v1/org/{orgId}/system-prompts/{promptId} */
export async function deleteOASystemPrompt(id: string): Promise<void> {
    await delay(300);
    const idx = SYSTEM_PROMPTS.findIndex((p) => p.id === id);
    if (idx !== -1) SYSTEM_PROMPTS.splice(idx, 1);
}

/** PUT /api/v1/org/{orgId}/system-prompts/{promptId}/apply
 *  Pass an array of department IDs. Pass all dept IDs for "apply to all".
 *  Pass an empty array to remove from all departments.
 */
export async function applyOASystemPromptToDepts(
    id: string,
    deptIds: string[],
): Promise<OASystemPrompt> {
    await delay(450);
    const prompt = SYSTEM_PROMPTS.find((p) => p.id === id);
    if (!prompt) throw new Error(`System prompt ${id} not found`);
    prompt.appliedToDepts = [...deptIds];
    return structuredClone(prompt);
}
