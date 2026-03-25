export type OrgStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type OrgSize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type IndustryType =
    | 'Healthcare'
    | 'Finance'
    | 'Legal'
    | 'Technology'
    | 'Education'
    | 'Government'
    | 'Manufacturing'
    | 'Retail'
    | 'Other';

export interface Organization {
    id: string;
    name: string;
    industry: IndustryType;
    domain: string;
    country: string;
    sizeRange: OrgSize;
    subscriptionPlan: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    monthlyQuota: number;
    usedQuota: number;
    status: OrgStatus;
    registeredAt: string;
    adminId: string;
    adminName?: string;
    adminEmail?: string;
    employeeCount?: number;
    departmentCount?: number;
    notes?: string;
}

export interface Department {
    id: string;
    orgId: string;
    name: string;
    description?: string;
    adminIds: string[];
    adminNames?: string[];
    employeeCount: number;
    allocatedQuota: number;
    usedQuota: number;
}

export interface RegisterOrgData {
    name: string;
    industry: IndustryType;
    domain: string;
    country: string;
    sizeRange: OrgSize;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    subscriptionPlan: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    initialQuota: number;
    notes?: string;
}

export interface QuotaRequest {
    id: string;
    departmentId: string;
    departmentName: string;
    requestedBy: string;
    requestedByName: string;
    amount: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    grantedAmount?: number;
    createdAt: string;
    resolvedAt?: string;
}
