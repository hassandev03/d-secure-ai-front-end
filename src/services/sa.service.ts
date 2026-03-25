import { delay } from './api';
import type {
    SAOrganization, SAProfessional, SADashboardStats, SAActivityItem,
    SAEnterprisePlan, SAIndividualPlan, RegisterOrgPayload,
    OrgStatus, ProfessionalStatus,
} from '@/types/sa.types';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

const organizations: SAOrganization[] = [
    {
        id: 'org-001', name: 'Acme Corporation', industry: 'Technology', domain: 'acme.com',
        country: 'USA', sizeRange: '51-200', status: 'ACTIVE', plan: 'Enterprise',
        billingCycle: 'ANNUAL', employees: 120, departments: 6,
        quota: { used: 3200, total: 5000 }, registeredAt: '2025-03-15',
        adminName: 'Sarah Johnson', adminEmail: 'sarah@acmecorp.com', adminPhone: '+1-555-0123',
        notes: 'Premium enterprise client. Priority support enabled.',
        departmentList: [
            { name: 'Engineering', employees: 45, quota: { used: 1200, total: 1500 } },
            { name: 'Marketing', employees: 20, quota: { used: 600, total: 800 } },
            { name: 'Sales', employees: 25, quota: { used: 500, total: 700 } },
            { name: 'HR', employees: 10, quota: { used: 200, total: 400 } },
            { name: 'Finance', employees: 12, quota: { used: 400, total: 600 } },
            { name: 'Operations', employees: 8, quota: { used: 300, total: 1000 } },
        ],
    },
    {
        id: 'org-002', name: 'MediHealth Inc.', industry: 'Healthcare', domain: 'medihealth.com',
        country: 'UK', sizeRange: '51-200', status: 'ACTIVE', plan: 'Enterprise',
        billingCycle: 'ANNUAL', employees: 85, departments: 4,
        quota: { used: 1800, total: 3000 }, registeredAt: '2025-04-22',
        adminName: 'James Carter', adminEmail: 'james@medihealth.com',
        departmentList: [
            { name: 'Research', employees: 30, quota: { used: 800, total: 1000 } },
            { name: 'Clinical', employees: 25, quota: { used: 500, total: 800 } },
            { name: 'Admin', employees: 15, quota: { used: 300, total: 600 } },
            { name: 'IT', employees: 15, quota: { used: 200, total: 600 } },
        ],
    },
    {
        id: 'org-003', name: 'LegalEase Partners', industry: 'Legal', domain: 'legalease.com',
        country: 'Canada', sizeRange: '11-50', status: 'ONBOARDING', plan: 'Starter',
        billingCycle: 'MONTHLY', employees: 20, departments: 2,
        quota: { used: 0, total: 1000 }, registeredAt: '2025-09-01',
        adminName: 'Emma Liu', adminEmail: 'emma@legalease.com',
        departmentList: [
            { name: 'Litigation', employees: 12, quota: { used: 0, total: 600 } },
            { name: 'Corporate', employees: 8, quota: { used: 0, total: 400 } },
        ],
    },
    {
        id: 'org-004', name: 'EduTech Global', industry: 'Education', domain: 'edutech.io',
        country: 'Australia', sizeRange: '11-50', status: 'ACTIVE', plan: 'Professional',
        billingCycle: 'MONTHLY', employees: 45, departments: 3,
        quota: { used: 900, total: 2000 }, registeredAt: '2025-06-10',
        adminName: 'Oliver Park', adminEmail: 'oliver@edutech.io',
        departmentList: [
            { name: 'Curriculum', employees: 18, quota: { used: 400, total: 700 } },
            { name: 'Technology', employees: 15, quota: { used: 350, total: 700 } },
            { name: 'Administration', employees: 12, quota: { used: 150, total: 600 } },
        ],
    },
    {
        id: 'org-005', name: 'FinSecure Ltd.', industry: 'Finance', domain: 'finsecure.co',
        country: 'Singapore', sizeRange: '51-200', status: 'DEACTIVATED', plan: 'Enterprise',
        billingCycle: 'ANNUAL', employees: 60, departments: 5,
        quota: { used: 200, total: 2000 }, registeredAt: '2025-01-20',
        adminName: 'Wei Zhang', adminEmail: 'wei@finsecure.co',
        departmentList: [
            { name: 'Trading', employees: 15, quota: { used: 80, total: 500 } },
            { name: 'Risk', employees: 12, quota: { used: 50, total: 400 } },
            { name: 'Compliance', employees: 13, quota: { used: 40, total: 400 } },
            { name: 'IT', employees: 10, quota: { used: 20, total: 400 } },
            { name: 'Operations', employees: 10, quota: { used: 10, total: 300 } },
        ],
    },
    {
        id: 'org-006', name: 'GovShield Agency', industry: 'Government', domain: 'govshield.gov',
        country: 'USA', sizeRange: '201-500', status: 'ACTIVE', plan: 'Enterprise',
        billingCycle: 'ANNUAL', employees: 200, departments: 8,
        quota: { used: 4100, total: 5000 }, registeredAt: '2025-02-05',
        adminName: 'Patricia Moore', adminEmail: 'patricia@govshield.gov', adminPhone: '+1-555-0456',
        departmentList: [
            { name: 'Intelligence', employees: 40, quota: { used: 1200, total: 1200 } },
            { name: 'Cybersecurity', employees: 35, quota: { used: 900, total: 900 } },
            { name: 'Field Ops', employees: 30, quota: { used: 700, total: 800 } },
            { name: 'Analysis', employees: 25, quota: { used: 500, total: 600 } },
            { name: 'Legal', employees: 20, quota: { used: 300, total: 400 } },
            { name: 'Admin', employees: 20, quota: { used: 200, total: 400 } },
            { name: 'Training', employees: 15, quota: { used: 200, total: 400 } },
            { name: 'IT', employees: 15, quota: { used: 100, total: 300 } },
        ],
    },
    {
        id: 'org-007', name: 'RetailPro Stores', industry: 'Retail', domain: 'retailpro.com',
        country: 'Germany', sizeRange: '11-50', status: 'SUSPENDED', plan: 'Professional',
        billingCycle: 'MONTHLY', employees: 30, departments: 2,
        quota: { used: 400, total: 1500 }, registeredAt: '2025-07-12',
        adminName: 'Hans Müller', adminEmail: 'hans@retailpro.com',
        departmentList: [
            { name: 'Sales', employees: 18, quota: { used: 300, total: 800 } },
            { name: 'Logistics', employees: 12, quota: { used: 100, total: 700 } },
        ],
    },
];

const professionals: SAProfessional[] = [
    {
        id: 'pro-001', name: 'Alex Thompson', email: 'alex@freelance.com',
        jobTitle: 'Data Scientist', industry: 'Technology', plan: 'PRO',
        status: 'ACTIVE', requests: 320, joinedAt: '2025-06-01',
        lastActive: '2 hours ago',
        bio: 'Experienced data scientist using secure AI to analyze large datasets while maintaining full compliance and data privacy standards.',
    },
    {
        id: 'pro-002', name: 'Maria Santos', email: 'maria@consulting.io',
        jobTitle: 'Legal Consultant', industry: 'Legal', plan: 'MAX',
        status: 'ACTIVE', requests: 890, joinedAt: '2025-04-15',
        lastActive: '30 minutes ago',
        bio: 'Senior legal consultant leveraging AI-powered document analysis and anonymization tools for complex litigation and contract review.',
    },
    {
        id: 'pro-003', name: 'David Chen', email: 'david@design.co',
        jobTitle: 'UX Researcher', industry: 'Technology', plan: 'FREE',
        status: 'ACTIVE', requests: 15, joinedAt: '2025-08-20',
        lastActive: '1 day ago',
        bio: 'UX researcher exploring privacy-first AI tools for user research and data analysis in design workflows.',
    },
    {
        id: 'pro-004', name: 'Fatima Al-Rashid', email: 'fatima@health.org',
        jobTitle: 'Clinical Researcher', industry: 'Healthcare', plan: 'PRO',
        status: 'DEACTIVATED', requests: 0, joinedAt: '2025-05-10',
        lastActive: 'Never',
        bio: 'Clinical researcher focused on leveraging AI to analyze patient data while ensuring HIPAA compliance and data anonymization.',
    },
    {
        id: 'pro-005', name: 'James Wilson', email: 'james@finance.net',
        jobTitle: 'Financial Analyst', industry: 'Finance', plan: 'PRO',
        status: 'ACTIVE', requests: 540, joinedAt: '2025-07-03',
        lastActive: '5 hours ago',
        bio: 'Financial analyst using AI-powered tools for secure market analysis and regulatory compliance reporting.',
    },
    {
        id: 'pro-006', name: 'Priya Sharma', email: 'priya@edu.academy',
        jobTitle: 'Research Fellow', industry: 'Education', plan: 'FREE',
        status: 'SUSPENDED', requests: 0, joinedAt: '2025-09-12',
        lastActive: '2 weeks ago',
        bio: 'Research fellow in educational technology, exploring AI applications in academic research with privacy preservation.',
    },
];

const activityFeed: SAActivityItem[] = [
    { action: 'New organization registered', target: 'FinSecure Ltd.', time: '2 hours ago', icon: 'user-plus' },
    { action: 'Subscription upgraded', target: 'MediHealth Inc.', time: '5 hours ago', icon: 'zap' },
    { action: 'Quota increased', target: 'Acme Corporation', time: '1 day ago', icon: 'trending-up' },
    { action: 'Professional suspended', target: 'priya@edu.academy', time: '1 day ago', icon: 'alert' },
    { action: 'New professional registered', target: 'alex@freelance.com', time: '2 days ago', icon: 'user-plus' },
];

const enterprisePlans: SAEnterprisePlan[] = [
    {
        key: 'starter', name: 'Starter', price: 499, annualPrice: 399, perUser: 4.99,
        features: ['Basic entity anonymization', 'Up to 1,000 requests/month', '5 departments max', 'Standard support', '30-day history'],
        excluded: ['No context-aware anonymization', 'No file upload', 'Limited models'],
        color: 'from-blue-500/10 to-blue-500/5', borderColor: 'border-blue-200', maxCost: 5
    },
    {
        key: 'professional', name: 'Professional', price: 999, annualPrice: 799, perUser: 3.99, popular: true,
        features: ['Context-aware anonymization', 'Up to 10,000 requests/month', 'Unlimited departments', 'All AI providers', 'File upload support', '90-day history', 'Priority support'],
        excluded: [],
        color: 'from-brand-500/20 to-brand-500/5', borderColor: 'border-brand-500 ring-1 ring-brand-500/30', maxCost: 40
    },
    {
        key: 'enterprise', name: 'Enterprise', price: 2499, annualPrice: 1999, perUser: 2.99,
        features: ['Everything in Professional', 'Up to 50,000 requests/month', 'Custom anonymization rules', 'API access', 'Unlimited history', 'Dedicated account manager', 'Custom SLA'],
        excluded: [],
        color: 'from-emerald-500/10 to-emerald-500/5', borderColor: 'border-emerald-200', maxCost: 200
    },
];

const individualPlans: SAIndividualPlan[] = [
    { key: 'FREE', name: SUBSCRIPTION_PLANS.FREE.name, price: SUBSCRIPTION_PLANS.FREE.price, annualPrice: SUBSCRIPTION_PLANS.FREE.annualPrice, requests: SUBSCRIPTION_PLANS.FREE.requests, features: SUBSCRIPTION_PLANS.FREE.features, excluded: SUBSCRIPTION_PLANS.FREE.excluded, active: 180, maxCost: 0.5 },
    { key: 'PRO', name: SUBSCRIPTION_PLANS.PRO.name, price: SUBSCRIPTION_PLANS.PRO.price, annualPrice: SUBSCRIPTION_PLANS.PRO.annualPrice, requests: SUBSCRIPTION_PLANS.PRO.requests, features: SUBSCRIPTION_PLANS.PRO.features, excluded: SUBSCRIPTION_PLANS.PRO.excluded, active: 54, popular: true, maxCost: 15 },
    { key: 'MAX', name: SUBSCRIPTION_PLANS.MAX.name, price: SUBSCRIPTION_PLANS.MAX.price, annualPrice: SUBSCRIPTION_PLANS.MAX.annualPrice, requests: SUBSCRIPTION_PLANS.MAX.requests, features: SUBSCRIPTION_PLANS.MAX.features, excluded: SUBSCRIPTION_PLANS.MAX.excluded, active: 33, maxCost: 50 },
];

export async function getOrganizations(): Promise<SAOrganization[]> {
    await delay(300);
    return [...organizations];
}

export async function getOrganizationById(id: string): Promise<SAOrganization | null> {
    await delay(200);
    return organizations.find((o) => o.id === id) ?? null;
}

export async function registerOrganization(data: RegisterOrgPayload): Promise<SAOrganization> {
    await delay(600);
    const newOrg: SAOrganization = {
        id: `org-${Date.now()}`,
        name: data.name,
        industry: data.industry,
        domain: data.domain,
        country: data.country,
        sizeRange: data.sizeRange,
        status: 'ONBOARDING',
        plan: data.subscriptionPlan,
        billingCycle: data.billingCycle,
        employees: 0,
        departments: 0,
        quota: { used: 0, total: data.initialQuota },
        registeredAt: new Date().toISOString().split('T')[0],
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPhone: data.adminPhone,
        notes: data.notes,
        departmentList: [],
    };
    organizations.unshift(newOrg);
    return newOrg;
}

export async function updateOrganizationStatus(id: string, status: OrgStatus): Promise<SAOrganization | null> {
    await delay(400);
    const org = organizations.find((o) => o.id === id);
    if (org) org.status = status;
    return org ?? null;
}

export async function getProfessionals(): Promise<SAProfessional[]> {
    await delay(300);
    return [...professionals];
}

export async function getProfessionalById(id: string): Promise<SAProfessional | null> {
    await delay(200);
    return professionals.find((p) => p.id === id) ?? null;
}

export async function updateProfessionalStatus(id: string, status: ProfessionalStatus): Promise<SAProfessional | null> {
    await delay(400);
    const pro = professionals.find((p) => p.id === id);
    if (pro) pro.status = status;
    return pro ?? null;
}

export async function resetProfessionalPassword(id: string): Promise<{ success: boolean }> {
    await delay(500);
    const pro = professionals.find((p) => p.id === id);
    return { success: !!pro };
}

export async function getDashboardStats(): Promise<SADashboardStats> {
    await delay(250);
    const activeOrgs = organizations.filter((o) => o.status === 'ACTIVE').length;
    const totalPros = professionals.length;
    const totalUsers = organizations.reduce((s, o) => s + o.employees, 0) + totalPros;
    const totalRequests = 128400;
    return {
        totalOrganizations: organizations.length,
        activeOrganizations: activeOrgs,
        totalUsers,
        totalProfessionals: totalPros,
        totalRequests,
        todayRequests: 2340,
        anonymizationOps: 89200,
        activeSubscriptions: 267,
        avgRequestsPerUser: Math.round(totalRequests / totalUsers),
    };
}

export async function getRecentOrganizations(limit: number = 5): Promise<SAOrganization[]> {
    await delay(200);
    return organizations.slice(0, limit);
}

export async function getRecentActivity(): Promise<SAActivityItem[]> {
    await delay(200);
    return [...activityFeed];
}

export async function getEnterprisePlans(): Promise<SAEnterprisePlan[]> {
    await delay(200);
    return [...enterprisePlans];
}

export async function getIndividualPlans(): Promise<SAIndividualPlan[]> {
    await delay(200);
    return [...individualPlans];
}

import type { SARevenueStats } from '@/types/sa.types';

export async function getRevenueStats(): Promise<SARevenueStats> {
    await delay(250);
    
    let totalRevenue = 0;
    let totalCost = 0;
    let maxPossibleCost = 0;

    // Organizations
    for (const org of organizations) {
        if (org.status !== 'ACTIVE') continue;
        const plan = enterprisePlans.find(p => p.name === org.plan) || enterprisePlans[1];
        
        totalRevenue += plan.price;
        const maxCost = plan.maxCost || 15;
        
        const usedRatio = org.quota.total > 0 ? (org.quota.used / org.quota.total) : 0;
        totalCost += usedRatio * maxCost;
        maxPossibleCost += maxCost;
    }

    // Professionals
    for (const pro of professionals) {
        if (pro.status !== 'ACTIVE') continue;
        const plan = individualPlans.find(p => p.key === pro.plan) || individualPlans[0];
        
        totalRevenue += plan.price;
        const maxCost = plan.maxCost || 15;
        
        const usedRatio = plan.requests > 0 ? (pro.requests / plan.requests) : 0;
        totalCost += usedRatio * maxCost;
        maxPossibleCost += maxCost;
    }

    const totalProfit = totalRevenue - totalCost;
    const unusedCreditsProfit = maxPossibleCost - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
        totalRevenue,
        totalCost,
        totalProfit,
        unusedCreditsProfit,
        profitMargin
    };
}
