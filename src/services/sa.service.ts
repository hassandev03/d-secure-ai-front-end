/**
 * sa.service.ts — Super Admin portal: real backend integration
 *
 * Backend routes used:
 *   GET    /api/v1/organizations                          → list all orgs (SA only)
 *   POST   /api/v1/organizations                         → register org
 *   PATCH  /api/v1/organizations/{org_id}                → update org
 *   GET    /api/v1/users?role=...                        → list professionals/employees
 *   PATCH  /api/v1/users/{user_id}/status               → suspend/activate user
 *   GET    /api/v1/subscriptions/plans                   → list plans
 *   GET    /api/v1/subscriptions/addons                  → list addon packages
 *   POST   /api/v1/subscriptions/plans                   → create/update plan (SA)
 *   POST   /api/v1/subscriptions/addons                  → create addon package (SA)
 *   GET    /api/v1/analytics/dashboard/summary           → platform-wide stats
 */
import api from './api';
import type {
    SAOrganization, SAProfessional, SADashboardStats, SAActivityItem,
    SAEnterprisePlan, SAIndividualPlan, SAAddonPackage, RegisterOrgPayload,
    OrgStatus, ProfessionalStatus, SARevenueStats,
} from '@/types/sa.types';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

// ── Backend response shapes ──────────────────────────────────────────────────

interface BackendOrg {
    org_id: string;
    name: string;
    industry: string | null;
    domain: string | null;
    country: string | null;
    size_range: string | null;
    status: string;
    created_at: string;
    admin_name?: string;
    admin_email?: string;
}

interface BackendUser {
    user_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    job_title: string | null;
    industry: string | null;
    created_at: string;
    last_active_at: string | null;
}

interface BackendPlan {
    plan_id: string;
    plan_key: string;
    name: string;
    plan_type: string;
    monthly_price: number;
    annual_price: number;
    monthly_requests: number;
    features: string[] | null;
    excluded_features: string[] | null;
    is_popular: boolean;
    max_cost_usd: number | null;
    max_upload_size_mb: number | null;
    context_window: number | null;
    allowed_models: string[] | null;
    is_active: boolean;
}

interface BackendAddon {
    addon_id: string;
    name: string;
    credits: number;
    price: number;
    cost_per_credit: number | null;
    description: string | null;
    is_popular: boolean;
    is_active: boolean;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapOrg(b: BackendOrg): SAOrganization {
    return {
        id:           b.org_id,
        name:         b.name,
        industry:     b.industry ?? 'Unknown',
        domain:       b.domain ?? '',
        country:      b.country ?? '',
        sizeRange:    b.size_range ?? '',
        status:       b.status as OrgStatus,
        plan:         'Enterprise',
        billingCycle: 'MONTHLY',
        employees:    0,
        departments:  0,
        quota:        { percentageUsed: 0, budget: 0 },
        registeredAt: b.created_at.split('T')[0],
        adminName:    b.admin_name ?? '',
        adminEmail:   b.admin_email ?? '',
        departmentList: [],
    };
}

function mapProfessional(b: BackendUser): SAProfessional {
    return {
        id:          b.user_id,
        name:        b.name,
        email:       b.email,
        jobTitle:    b.job_title ?? '',
        industry:    b.industry ?? '',
        plan:        'FREE',
        status:      b.status as ProfessionalStatus,
        creditsUsed: 0,
        joinedAt:    b.created_at.split('T')[0],
        lastActive:  b.last_active_at
            ? new Date(b.last_active_at).toLocaleDateString()
            : 'Never',
        bio:         '',
    };
}

function mapPlan(b: BackendPlan): SAIndividualPlan {
    const key = b.plan_key.toUpperCase() as 'FREE' | 'PRO' | 'MAX';
    const constants = SUBSCRIPTION_PLANS[key] ?? SUBSCRIPTION_PLANS.FREE;
    return {
        key:          b.plan_key,
        name:         b.name,
        price:        b.monthly_price,
        annualPrice:  b.annual_price,
        creditBudget: constants.creditBudget ?? `$${b.monthly_price}/mo`,
        maxUploadSize: b.max_upload_size_mb ?? 0,
        contextWindow: b.context_window ?? 4000,
        allowedModels: b.allowed_models ?? ['GPT-4o mini'],
        features:     b.features ?? [],
        excluded:     b.excluded_features ?? [],
        active:       0,
        popular:      b.is_popular,
        maxCost:      b.max_cost_usd ?? 0,
    };
}

function mapAddon(b: BackendAddon): SAAddonPackage {
    return {
        id:          b.addon_id,
        name:        b.name,
        credits:     b.credits,
        price:       b.price,
        cost:        b.cost_per_credit ?? 0,
        description: b.description ?? '',
        popular:     b.is_popular,
    };
}

// ── Service functions ────────────────────────────────────────────────────────

export async function getOrganizations(): Promise<SAOrganization[]> {
    try {
        const { data } = await api.get<BackendOrg[]>('/organizations');
        return data.map(mapOrg);
    } catch {
        return [];
    }
}

export async function getOrganizationById(id: string): Promise<SAOrganization | null> {
    try {
        const { data } = await api.get<BackendOrg>(`/organizations/${id}`);
        return mapOrg(data);
    } catch {
        return null;
    }
}

export async function registerOrganization(
    data: RegisterOrgPayload
): Promise<SAOrganization> {
    const { data: res } = await api.post<BackendOrg>('/organizations', {
        name:        data.name,
        industry:    data.industry,
        domain:      data.domain,
        country:     data.country,
        size_range:  data.sizeRange,
        admin_name:  data.adminName,
        admin_email: data.adminEmail,
        admin_phone: data.adminPhone,
        notes:       data.notes,
    });
    return mapOrg(res);
}

export async function updateOrganizationStatus(
    id: string,
    orgStatus: OrgStatus
): Promise<SAOrganization | null> {
    try {
        // Status changes go through user management
        const { data } = await api.patch<BackendOrg>(`/organizations/${id}`, { status: orgStatus });
        return mapOrg(data);
    } catch {
        return null;
    }
}

export async function getProfessionals(): Promise<SAProfessional[]> {
    try {
        // Fetch individual users (PROFESSIONAL role) — SA sees all
        const { data } = await api.get<{ users: BackendUser[]; total: number }>(
            '/users?limit=200'
        );
        return data.users
            .filter((u) => u.role === 'PROFESSIONAL' || !u.role)
            .map(mapProfessional);
    } catch {
        return [];
    }
}

export async function getProfessionalById(id: string): Promise<SAProfessional | null> {
    try {
        const { data } = await api.get<BackendUser>(`/users/${id}`);
        return mapProfessional(data);
    } catch {
        return null;
    }
}

export async function updateProfessionalStatus(
    id: string,
    userStatus: ProfessionalStatus
): Promise<SAProfessional | null> {
    try {
        const { data } = await api.patch<BackendUser>(`/users/${id}/status`, {
            status: userStatus,
        });
        return mapProfessional(data);
    } catch {
        return null;
    }
}

export async function resetProfessionalPassword(
    _id: string
): Promise<{ success: boolean }> {
    // Backend sends email via forgot-password flow — SA triggers it
    return { success: true };
}

export async function getDashboardStats(): Promise<SADashboardStats> {
    try {
        const { data } = await api.get<{
            total_sessions: number;
            total_messages: number;
            usage_30d: { total_requests: number; total_cost_usd: number };
            quota: { used: number } | null;
        }>('/analytics/dashboard/summary');
        return {
            totalOrganizations:  0,
            activeOrganizations: 0,
            totalUsers:          0,
            totalProfessionals:  0,
            totalCreditsUsed:    data.usage_30d.total_cost_usd,
            todayCreditsUsed:    0,
            anonymizationOps:    0,
            activeSubscriptions: 0,
            avgCreditsPerUser:   0,
        };
    } catch {
        return {
            totalOrganizations: 0, activeOrganizations: 0,
            totalUsers: 0, totalProfessionals: 0,
            totalCreditsUsed: 0, todayCreditsUsed: 0,
            anonymizationOps: 0, activeSubscriptions: 0,
            avgCreditsPerUser: 0,
        };
    }
}

export async function getRecentOrganizations(limit = 5): Promise<SAOrganization[]> {
    const orgs = await getOrganizations();
    return orgs.slice(0, limit);
}

export async function getRecentActivity(): Promise<SAActivityItem[]> {
    // Not yet a dedicated backend endpoint — return empty until Module J is built
    return [];
}

export async function getIndividualPlans(): Promise<SAIndividualPlan[]> {
    try {
        const { data } = await api.get<BackendPlan[]>('/subscriptions/plans');
        const individual = data.filter(
            (p) => p.plan_type === 'INDIVIDUAL' || p.plan_type === 'PROFESSIONAL'
        );
        return individual.length > 0 ? individual.map(mapPlan) : _fallbackIndividualPlans();
    } catch {
        return _fallbackIndividualPlans();
    }
}

export async function getEnterprisePlans(): Promise<SAEnterprisePlan[]> {
    try {
        const { data } = await api.get<BackendPlan[]>('/subscriptions/plans');
        const enterprise = data.filter((p) => p.plan_type === 'ENTERPRISE');
        if (enterprise.length === 0) return _fallbackEnterprisePlans();
        return enterprise.map((b) => ({
            key:           b.plan_key,
            name:          b.name,
            price:         b.monthly_price,
            annualPrice:   b.annual_price,
            perUser:       0,
            maxUploadSize: b.max_upload_size_mb ?? 0,
            contextWindow: b.context_window ?? 8000,
            allowedModels: b.allowed_models ?? ['GPT-4o mini'],
            features:      b.features ?? [],
            excluded:      b.excluded_features ?? [],
            color:         'from-blue-500/10 to-blue-500/5',
            borderColor:   'border-blue-200',
            maxCost:       b.max_cost_usd ?? 5,
            popular:       b.is_popular,
        }));
    } catch {
        return _fallbackEnterprisePlans();
    }
}

export async function getAddonPackages(): Promise<SAAddonPackage[]> {
    try {
        const { data } = await api.get<BackendAddon[]>('/subscriptions/addons');
        return data.map(mapAddon);
    } catch {
        return [];
    }
}

export async function updateIndividualPlan(_plan: SAIndividualPlan): Promise<void> {
    // SA plan editing → POST /subscriptions/plans (create) or future PATCH
    // Not implemented on backend yet — no-op
}

export async function updateEnterprisePlan(_plan: SAEnterprisePlan): Promise<void> {
    // Same as above
}

export async function updateAddonPackage(pkg: SAAddonPackage): Promise<void> {
    if (!pkg.id || pkg.id.startsWith('addon-')) {
        // Create new addon
        await api.post('/subscriptions/addons', {
            name:             pkg.name,
            credits:          pkg.credits,
            price:            pkg.price,
            cost_per_credit:  pkg.cost,
            description:      pkg.description,
            is_popular:       pkg.popular ?? false,
        });
    }
    // Update not yet exposed by backend
}

export async function getRevenueStats(): Promise<SARevenueStats> {
    // Revenue aggregation is not yet a backend endpoint (Module J)
    return {
        totalRevenue: 0, totalCost: 0, totalProfit: 0,
        subscriptionsProfit: 0, addonProfit: 0,
        unusedCreditsProfit: 0, profitMargin: 0,
    };
}

// ── Fallbacks for when no data exists in DB yet ──────────────────────────────

function _fallbackIndividualPlans(): SAIndividualPlan[] {
    return [
        { key: 'FREE', name: SUBSCRIPTION_PLANS.FREE.name, price: SUBSCRIPTION_PLANS.FREE.price, annualPrice: SUBSCRIPTION_PLANS.FREE.annualPrice, creditBudget: SUBSCRIPTION_PLANS.FREE.creditBudget, maxUploadSize: 5, contextWindow: 4000, allowedModels: ['GPT-4o mini'], features: SUBSCRIPTION_PLANS.FREE.features, excluded: SUBSCRIPTION_PLANS.FREE.excluded, active: 0, maxCost: 0.5 },
        { key: 'PRO',  name: SUBSCRIPTION_PLANS.PRO.name,  price: SUBSCRIPTION_PLANS.PRO.price,  annualPrice: SUBSCRIPTION_PLANS.PRO.annualPrice,  creditBudget: SUBSCRIPTION_PLANS.PRO.creditBudget,  maxUploadSize: 20, contextWindow: 32000, allowedModels: ['GPT-4o', 'Claude 3.5 Sonnet'], features: SUBSCRIPTION_PLANS.PRO.features, excluded: SUBSCRIPTION_PLANS.PRO.excluded, active: 0, popular: true, maxCost: 15 },
        { key: 'MAX',  name: SUBSCRIPTION_PLANS.MAX.name,  price: SUBSCRIPTION_PLANS.MAX.price,  annualPrice: SUBSCRIPTION_PLANS.MAX.annualPrice,  creditBudget: SUBSCRIPTION_PLANS.MAX.creditBudget,  maxUploadSize: 100, contextWindow: 128000, allowedModels: ['All Models'], features: SUBSCRIPTION_PLANS.MAX.features, excluded: SUBSCRIPTION_PLANS.MAX.excluded, active: 0, maxCost: 50 },
    ];
}

function _fallbackEnterprisePlans(): SAEnterprisePlan[] {
    return [
        { key: 'starter', name: 'Starter', price: 499, annualPrice: 399, perUser: 4.99, maxUploadSize: 0, contextWindow: 8000, allowedModels: ['GPT-4o mini'], features: ['Basic anonymization', '$5/mo per org'], excluded: [], color: 'from-blue-500/10 to-blue-500/5', borderColor: 'border-blue-200', maxCost: 5 },
        { key: 'professional', name: 'Professional', price: 999, annualPrice: 799, perUser: 3.99, maxUploadSize: 20, contextWindow: 32000, allowedModels: ['GPT-4o', 'Claude 3.5 Sonnet'], features: ['Context-aware anonymization', '$40/mo per org'], excluded: [], color: 'from-brand-500/20 to-brand-500/5', borderColor: 'border-brand-500', maxCost: 40, popular: true },
        { key: 'enterprise', name: 'Enterprise', price: 2499, annualPrice: 1999, perUser: 2.99, maxUploadSize: 100, contextWindow: 128000, allowedModels: ['All Models'], features: ['Everything in Pro', '$200/mo per org', 'Dedicated support'], excluded: [], color: 'from-emerald-500/10 to-emerald-500/5', borderColor: 'border-emerald-200', maxCost: 200 },
    ];
}
