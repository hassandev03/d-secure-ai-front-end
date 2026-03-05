import type { LLMModel } from './chat.types';

export interface UsageStat {
    date: string;
    requestCount: number;
    anonymizationCount: number;
    modelBreakdown: Partial<Record<LLMModel, number>>;
}

export interface QuotaInfo {
    allocated: number;
    used: number;
    remaining: number;
    resetDate: string;
}

export interface PlatformStats {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalProfessionals: number;
    totalRequests: number;
    todayRequests: number;
    anonymizationOps: number;
    activeSubscriptions: number;
    anonymizationAccuracy: number;
}

export interface OrgStats {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    monthlyRequestsUsed: number;
    monthlyQuota: number;
    anonymizationOps: number;
    pendingQuotaRequests: number;
}

export interface DeptStats {
    totalEmployees: number;
    quotaUsed: number;
    quotaAllocated: number;
    requestsThisMonth: number;
    restrictedEmployees: number;
    pendingQuotaRequests: number;
}

export interface UserStats {
    totalRequestsThisMonth: number;
    quotaRemaining: number;
    quotaTotal: number;
    totalSessions: number;
    entitiesAnonymized: number;
}
