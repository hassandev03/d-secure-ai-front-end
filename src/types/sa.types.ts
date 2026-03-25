export type OrgStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type ProfessionalStatus = 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface SAOrganization {
    id: string;
    name: string;
    industry: string;
    domain: string;
    country: string;
    sizeRange: string;
    status: OrgStatus;
    plan: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    employees: number;
    departments: number;
    quota: { used: number; total: number };
    registeredAt: string;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    notes?: string;
    departmentList?: SADepartment[];
}

export interface SADepartment {
    name: string;
    employees: number;
    quota: { used: number; total: number };
}

export interface SAProfessional {
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    industry: string;
    plan: string;
    status: ProfessionalStatus;
    requests: number;
    joinedAt: string;
    lastActive: string;
    bio: string;
}

export interface SADashboardStats {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalProfessionals: number;
    totalRequests: number;
    todayRequests: number;
    anonymizationOps: number;
    activeSubscriptions: number;
    avgRequestsPerUser: number;
}

export type ActivityIconType = 'user-plus' | 'check-circle' | 'zap' | 'alert' | 'settings' | 'trending-up';

export interface SAActivityItem {
    action: string;
    target: string;
    time: string;
    icon: ActivityIconType;
}

export interface SAEnterprisePlan {
    key: string;
    name: string;
    price: number;
    annualPrice: number;
    perUser: number;
    maxUploadSize?: number;
    contextWindow?: number;
    allowedModels?: string[];
    popular?: boolean;
    features: string[];
    excluded: string[];
    color: string;
    borderColor: string;
    maxCost?: number;
}

export interface SAIndividualPlan {
    key: string;
    name: string;
    price: number;
    annualPrice: number;
    requests: number;
    maxUploadSize?: number;
    contextWindow?: number;
    allowedModels?: string[];
    active: number;
    popular?: boolean;
    features: readonly string[] | string[];
    excluded: readonly string[] | string[];
    maxCost?: number;
}

export interface SAAddonPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    cost: number;
    popular?: boolean;
    description: string;
}

export interface RegisterOrgPayload {
    name: string;
    industry: string;
    domain: string;
    country: string;
    sizeRange: string;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    subscriptionPlan: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    initialQuota: number;
    notes?: string;
}

export interface SARevenueStats {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    subscriptionsProfit: number;
    addonProfit: number;
    unusedCreditsProfit: number;
    profitMargin: number;
}
