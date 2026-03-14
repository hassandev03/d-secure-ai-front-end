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

// ─────────────────────────────────────────────────────────────────────────────
// Canonical types
// ─────────────────────────────────────────────────────────────────────────────

export type OAOrgConfig = {
    totalQuota:     number;
    plan:           string;
    quotaRenewsAt:  string;
};

export type OADepartment = {
    id:       string;
    name:     string;
    head:     string;
    headEmail: string;
    employees: number;
    /** used = requests consumed this month; total = allocated monthly quota */
    quota:    { used: number; total: number };
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
    requests:      number;
    dailyLimit:    number;
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

// ── Dashboard presentation types ─────────────────────────────────────────────

export type OrgDashboardStats = {
    totalEmployees:          number;
    activeEmployees:         number;
    pendingEmployees:        number;
    departments:             number;
    monthlyRequests:         number;
    monthlyQuota:            number;
    quotaUtilization:        number;
    unallocatedQuota:        number;
    pendingQuotaRequests:    number;
    adoptionRate:            number;
    avgRequestsPerEmployee:  number;
};

export type OrgModelUsageSlice = {
    name:  string;
    value: number;
    color: string;
};

export type OrgUsageTrendPoint = {
    date:     string;
    requests: number;
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
    totalQuota:    8_000,
    plan:          "Enterprise",
    quotaRenewsAt: "2026-04-01",
};

/** Colour palette for newly created departments (cycling). Exported so the
 *  departments page can assign a colour on creation without duplicating it. */
export const DEPT_COLORS = [
    "#3B82F6", "#EC4899", "#F97316", "#10B981",
    "#8B5CF6", "#F59E0B", "#06B6D4", "#EF4444",
];

const DEPTS: OADepartment[] = [
    { id: "dept-001", name: "Engineering", head: "Sarah Johnson", headEmail: "sarah@acme.com",  employees: 45, quota: { used: 1420, total: 1800 }, color: "#3B82F6" },
    { id: "dept-002", name: "Marketing",   head: "Emma Davis",    headEmail: "emma@acme.com",   employees: 20, quota: { used: 620,  total: 800  }, color: "#EC4899" },
    { id: "dept-003", name: "Sales",       head: "David Kim",     headEmail: "david@acme.com",  employees: 25, quota: { used: 480,  total: 700  }, color: "#F97316" },
    { id: "dept-004", name: "Finance",     head: "Aisha Patel",   headEmail: "aisha@acme.com",  employees: 12, quota: { used: 390,  total: 600  }, color: "#10B981" },
    { id: "dept-005", name: "HR",          head: "Lisa Chen",     headEmail: "lisa@acme.com",   employees: 10, quota: { used: 180,  total: 400  }, color: "#8B5CF6" },
    { id: "dept-006", name: "Operations",  head: "James Wilson",  headEmail: "james@acme.com",  employees: 8,  quota: { used: 310,  total: 700  }, color: "#F59E0B" },
];

const EMPLOYEES: OAEmployee[] = [
    { id: "emp-001", name: "John Miller",    email: "john@acme.com",    departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "ACTIVE",   requests: 180, dailyLimit: 50,  lastActive: "2026-03-13" },
    { id: "emp-002", name: "Emma Davis",     email: "emma@acme.com",    departmentId: "dept-002", department: "Marketing",   role: "DEPT_ADMIN", status: "ACTIVE",   requests: 95,  dailyLimit: 100, lastActive: "2026-03-13" },
    { id: "emp-003", name: "Carlos Ruiz",    email: "carlos@acme.com",  departmentId: "dept-003", department: "Sales",       role: "EMPLOYEE",   status: "PENDING",  requests: 0,   dailyLimit: 30,  lastActive: "—" },
    { id: "emp-004", name: "Aisha Patel",    email: "aisha@acme.com",   departmentId: "dept-004", department: "Finance",     role: "DEPT_ADMIN", status: "ACTIVE",   requests: 210, dailyLimit: 100, lastActive: "2026-03-12" },
    { id: "emp-005", name: "Mike Chen",      email: "mike@acme.com",    departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "INACTIVE", requests: 45,  dailyLimit: 0,   lastActive: "2026-02-15" },
    { id: "emp-006", name: "Sophie Laurent", email: "sophie@acme.com",  departmentId: "dept-005", department: "HR",          role: "EMPLOYEE",   status: "ACTIVE",   requests: 60,  dailyLimit: 30,  lastActive: "2026-03-13" },
    { id: "emp-007", name: "Raj Patel",      email: "raj@acme.com",     departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "ACTIVE",   requests: 320, dailyLimit: 50,  lastActive: "2026-03-13" },
    { id: "emp-008", name: "Lisa Wang",      email: "lisa@acme.com",    departmentId: "dept-006", department: "Operations",  role: "EMPLOYEE",   status: "ACTIVE",   requests: 78,  dailyLimit: 30,  lastActive: "2026-03-12" },
    { id: "emp-009", name: "Tom Brennan",    email: "tom@acme.com",     departmentId: "dept-003", department: "Sales",       role: "DEPT_ADMIN", status: "ACTIVE",   requests: 134, dailyLimit: 100, lastActive: "2026-03-13" },
    { id: "emp-010", name: "Nina Hoffmann",  email: "nina@acme.com",    departmentId: "dept-004", department: "Finance",     role: "EMPLOYEE",   status: "ACTIVE",   requests: 88,  dailyLimit: 30,  lastActive: "2026-03-11" },
    { id: "emp-011", name: "Kevin Park",     email: "kevin@acme.com",   departmentId: "dept-001", department: "Engineering", role: "EMPLOYEE",   status: "PENDING",  requests: 0,   dailyLimit: 30,  lastActive: "—" },
    { id: "emp-012", name: "Priya Sharma",   email: "priya@acme.com",   departmentId: "dept-005", department: "HR",          role: "DEPT_ADMIN", status: "ACTIVE",   requests: 112, dailyLimit: 100, lastActive: "2026-03-13" },
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

const CUSTOM_PATTERNS: OACustomPattern[] = [
    { id: 1, label: "Employee ID",      pattern: "EMP-[0-9]{6}",          example: "EMP-001234",  active: true  },
    { id: 2, label: "Project Code",     pattern: "PRJ-[A-Z]{2}-[0-9]{4}", example: "PRJ-EN-2025", active: true  },
    { id: 3, label: "Internal Doc Ref", pattern: "DOC-[A-Z]{3}-[0-9]+",   example: "DOC-FIN-42",  active: false },
];

const RECENT_ACTIVITIES: RecentActivityItem[] = [
    { id: "a1", type: "employee_added",   title: "New employee added",     description: "Carlos Ruiz joined the Sales department",          timestamp: "2 hours ago", icon: "user-plus"      },
    { id: "a2", type: "quota_approved",   title: "Quota request approved", description: "Engineering dept granted +200 requests",           timestamp: "4 hours ago", icon: "check-circle"   },
    { id: "a3", type: "policy_changed",   title: "Policy updated",         description: "Speech-to-text enabled for Marketing department",  timestamp: "6 hours ago", icon: "shield"         },
    { id: "a4", type: "security_alert",   title: "Multiple failed logins", description: "3 failed login attempts for mike@acme.com",       timestamp: "8 hours ago", icon: "alert-triangle" },
    { id: "a5", type: "employee_removed", title: "Employee deactivated",   description: "Ethan Harris deactivated from Engineering",        timestamp: "1 day ago",   icon: "user-minus"     },
    { id: "a6", type: "quota_denied",     title: "Quota request denied",   description: "Operations dept request for +500 denied",          timestamp: "1 day ago",   icon: "x-circle"       },
    { id: "a7", type: "dept_created",     title: "Department edited",      description: "HR department quota increased to 400",             timestamp: "2 days ago",  icon: "building"       },
    { id: "a8", type: "employee_added",   title: "New employee added",     description: "Mia Thompson joined the Engineering department",   timestamp: "2 days ago",  icon: "user-plus"      },
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
    const total = DEPTS.reduce((s, d) => s + d.quota.used, 0);
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
    const avg   = DEPTS.reduce((s, d) => s + d.quota.used, 0) / 30;
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const factor    = isWeekend ? 0.15 + Math.random() * 0.15 : 0.7 + Math.random() * 0.6;
        return {
            date:     d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            requests: Math.round(avg * factor),
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

/** GET /api/v1/org/{orgId}/quota/requests */
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
    const monthlyRequests      = DEPTS.reduce((s, d) => s + d.quota.used, 0);
    const monthlyQuota         = DEPTS.reduce((s, d) => s + d.quota.total, 0);
    const activeEmployees      = EMPLOYEES.filter((e) => e.status === 'ACTIVE').length;
    const pendingEmployees     = EMPLOYEES.filter((e) => e.status === 'PENDING').length;
    const pendingQuotaRequests = QUOTA_REQUESTS.filter((r) => r.status === 'PENDING').length;
    return {
        totalEmployees,
        activeEmployees,
        pendingEmployees,
        departments:          DEPTS.length,
        monthlyRequests,
        monthlyQuota,
        quotaUtilization:     Math.round((monthlyRequests / monthlyQuota) * 100),
        unallocatedQuota:     ORG_CONFIG.totalQuota - monthlyQuota,
        pendingQuotaRequests,
        adoptionRate:         Math.round((activeEmployees / totalEmployees) * 100),
        avgRequestsPerEmployee: Math.round((monthlyRequests / activeEmployees) * 10) / 10,
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
