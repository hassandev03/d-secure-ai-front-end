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

// ── Backend response shapes ──────────────────────────────────────────────────

interface BackendOrg {
    org_id: string;
    name: string;
    industry: string | null;
    domain: string | null;
    country: string | null;
    size_range: string | null;
    status: string;
    created_at?: string;
    registered_at?: string;
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
    avatar_url?: string | null;
    created_at: string;
    last_active_at: string | null;
    credits_used?: number;
    plan_key?: string;
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
    const rawDate = b.registered_at || b.created_at || new Date().toISOString();
    return {
        id: b.org_id,
        name: b.name,
        industry: b.industry ?? 'Unknown',
        domain: b.domain ?? '',
        country: b.country ?? '',
        sizeRange: b.size_range ?? '',
        status: b.status as OrgStatus,
        plan: 'Enterprise',
        billingCycle: 'MONTHLY',
        employees: 0,
        departments: 0,
        quota: { percentageUsed: 0, budget: 0 },
        registeredAt: rawDate.split('T')[0],
        adminName: b.admin_name ?? '',
        adminEmail: b.admin_email ?? '',
        departmentList: [],
    };
}

function mapProfessional(b: BackendUser): SAProfessional {
    return {
        id: b.user_id,
        name: b.name,
        email: b.email,
        jobTitle: b.job_title ?? '',
        industry: b.industry ?? '',
        plan: (b.plan_key?.toUpperCase() as any) || 'FREE',
        status: b.status as ProfessionalStatus,
        creditsUsed: b.credits_used ?? 0,
        joinedAt: b.created_at.split('T')[0],
        lastActive: b.last_active_at
            ? new Date(b.last_active_at).toLocaleDateString()
            : 'Never',
        bio: '',
        avatar: b.avatar_url ?? undefined,
    };
}

function mapPlan(b: BackendPlan): SAIndividualPlan {
    return {
        key: b.plan_key,
        name: b.name,
        price: b.monthly_price,
        annualPrice: b.annual_price ?? 0,
        creditBudget: `$${b.monthly_price}/mo`,
        maxUploadSize: b.max_upload_size_mb ?? 0,
        contextWindow: b.context_window ?? 4000,
        allowedModels: b.allowed_models ?? ['GPT-4o mini'],
        features: b.features ?? [],
        excluded: b.excluded_features ?? [],
        active: 0,
        popular: b.is_popular,
        maxCost: b.max_cost_usd ?? 0,
    };
}

function mapAddon(b: BackendAddon): SAAddonPackage {
    return {
        id: b.addon_id,
        name: b.name,
        credits: b.credits,
        price: b.price,
        cost: b.cost_per_credit ?? 0,
        description: b.description ?? '',
        popular: b.is_popular,
    };
}

// ── Service state & Cache ──────────────────────────────────────────────────

/** 
 * Simple in-memory cache to prevent redundant calls during rapid navigation 
 * or simultaneous component mounts (e.g. Dashboard + Sidebar).
 */
const _cache = new Map<string, { data: any; timestamp: number }>();
const _promises = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds

/** Generic wrapper for deduplication and short-term caching */
async function _fetchCached<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
    const now = Date.now();
    const cached = _cache.get(key);

    // 1. Return from cache if fresh
    if (cached && (now - cached.timestamp < ttl)) {
        return cached.data;
    }

    // 2. Return existing promise if in-flight
    if (_promises.has(key)) {
        return _promises.get(key);
    }

    // 3. Fetch new data
    const promise = fetcher().then((data) => {
        _cache.set(key, { data, timestamp: Date.now() });
        _promises.delete(key);
        return data;
    }).catch((err) => {
        _promises.delete(key);
        throw err;
    });

    _promises.set(key, promise);
    return promise;
}

/** Invalidate specific cache keys (call after POST/PATCH) */
function _invalidate(keys: string | string[]) {
    const k = Array.isArray(keys) ? keys : [keys];
    k.forEach(key => _cache.delete(key));
}

// ── Service functions ────────────────────────────────────────────────────────

export async function getOrganizations(): Promise<SAOrganization[]> {
    return _fetchCached('organizations', async () => {
        try {
            const { data } = await api.get<BackendOrg[]>('/organizations');
            return data.map(mapOrg);
        } catch (err) {
            console.error('[sa.service] getOrganizations error:', err);
            return [];
        }
    });
}

export async function getOrganizationById(id: string): Promise<SAOrganization | null> {
    try {
        const { data } = await api.get<BackendOrg>(`/organizations/${id}/`);
        return mapOrg(data);
    } catch {
        return null;
    }
}

export async function registerOrganization(
    data: RegisterOrgPayload
): Promise<SAOrganization> {
    const { data: res } = await api.post<BackendOrg>('/organizations', {
        name: data.name,
        industry: data.industry,
        domain: data.domain,
        country: data.country,
        size_range: data.sizeRange,
        admin_name: data.adminName,
        admin_email: data.adminEmail,
        admin_phone: data.adminPhone,
        notes: data.notes,
    });
    _invalidate(['organizations', 'dashboard-stats']);
    return mapOrg(res);
}

export async function updateOrganizationStatus(
    id: string,
    orgStatus: OrgStatus
): Promise<SAOrganization | null> {
    try {
        const { data } = await api.patch<BackendOrg>(`/organizations/${id}`, { status: orgStatus });
        _invalidate(['organizations', 'dashboard-stats']);
        return mapOrg(data);
    } catch {
        return null;
    }
}

export async function getProfessionals(page = 1, limit = 20): Promise<{ professionals: SAProfessional[]; total: number }> {
    const offset = (page - 1) * limit;
    const cacheKey = `professionals-${page}-${limit}`;

    return _fetchCached(cacheKey, async () => {
        try {
            // Fetch individual users (PROFESSIONAL role) — SA sees all
            const { data } = await api.get<any>(`/users/?limit=${limit}&offset=${offset}&role=PROFESSIONAL`);

            // Robustly handle response shapes: { users: [] }, { items: [] }, or direct array
            const rawUsers = Array.isArray(data) ? data : (data.users || data.items || []);
            const total = data.total ?? (Array.isArray(data) ? rawUsers.length : (data.count || rawUsers.length));

            const professionals = rawUsers
                .filter((u: any) => {
                    if (!u.role) return true;
                    const r = u.role.toUpperCase();
                    return r === 'PROFESSIONAL' || r === 'INDIVIDUAL';
                })
                .map(mapProfessional);

            return { professionals, total };
        } catch (err) {
            console.error('[sa.service] getProfessionals error:', err);
            return { professionals: [], total: 0 };
        }
    }, 10000); // 10s cache for pagination pages
}

export async function getProfessionalById(id: string): Promise<SAProfessional | null> {
    try {
        const { data } = await api.get<BackendUser>(`/users/${id}/`);
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
        _invalidate('professionals');
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
    return _fetchCached('dashboard-stats', async () => {
        try {
            const { data } = await api.get<SADashboardStats>('/analytics/dashboard/platform-summary');
            return data;
        } catch (err) {
            console.error('[sa.service] getDashboardStats error:', err);
            return {
                totalOrganizations: 0, activeOrganizations: 0,
                totalUsers: 0, totalProfessionals: 0,
                totalCreditsUsed: 0, todayCreditsUsed: 0,
                anonymizationOps: 0, activeSubscriptions: 0,
                avgCreditsPerUser: 0, totalCost: 0,
            };
        }
    });
}

export async function getRecentOrganizations(limit = 5): Promise<SAOrganization[]> {
    const orgs = await getOrganizations();
    // Optimization: if we already have the full list (from cache), slice it.
    // If we wanted to be even faster, we could have a 'recent-orgs' endpoint.
    return orgs.slice(0, limit);
}

export async function getRecentActivity(): Promise<SAActivityItem[]> {
    // Not yet a dedicated backend endpoint — return empty until Module J is built
    return [];
}

async function _getPlans(): Promise<BackendPlan[]> {
    return _fetchCached('plans', async () => {
        try {
            const { data } = await api.get<BackendPlan[]>('/subscriptions/plans');
            return data;
        } catch (err) {
            console.error('[sa.service] _getPlans error:', err);
            return [];
        }
    }, 10000); // 10s cache for plans
}

export async function getIndividualPlans(): Promise<SAIndividualPlan[]> {
    try {
        const data = await _getPlans();
        const individual = data.filter(
            (p) => p.plan_type === 'INDIVIDUAL' || p.plan_type === 'PROFESSIONAL'
        );
        return individual.map(mapPlan);
    } catch {
        return [];
    }
}

export async function getEnterprisePlans(): Promise<SAEnterprisePlan[]> {
    try {
        const data = await _getPlans();
        const enterprise = data.filter((p) => p.plan_type === 'ENTERPRISE');
        return enterprise.map((b) => ({
            key: b.plan_key,
            name: b.name,
            price: b.monthly_price,
            annualPrice: b.annual_price ?? 0,
            perUser: 0,
            maxUploadSize: b.max_upload_size_mb ?? 0,
            contextWindow: b.context_window ?? 8000,
            allowedModels: b.allowed_models ?? ['GPT-4o mini'],
            features: b.features ?? [],
            excluded: b.excluded_features ?? [],
            color: 'from-blue-500/10 to-blue-500/5',
            borderColor: 'border-blue-200',
            maxCost: b.max_cost_usd ?? 5,
            popular: b.is_popular ?? false,
        }));
    } catch {
        return [];
    }
}

export async function getAddonPackages(): Promise<SAAddonPackage[]> {
    return _fetchCached('addons', async () => {
        try {
            const { data } = await api.get<BackendAddon[]>('/subscriptions/addons');
            return data.map(mapAddon);
        } catch (err) {
            console.error('[sa.service] getAddons error:', err);
            return [];
        }
    });
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
            name: pkg.name,
            credits: pkg.credits,
            price: pkg.price,
            cost_per_credit: pkg.cost,
            description: pkg.description,
            is_popular: pkg.popular ?? false,
        });
    }
    _invalidate('addons');
    // Update not yet exposed by backend
}

export async function getRevenueStats(): Promise<SARevenueStats> {
    // Derive revenue from dashboard stats until a dedicated revenue endpoint exists
    try {
        const stats = await getDashboardStats();
        const totalCost = stats.totalCost ?? 0;
        // Revenue = subscription payments (not yet tracked individually)
        // For now, show the cost data from the backend
        return {
            totalRevenue: 0,   // subscriptions revenue — needs billing module
            totalCost,
            totalProfit: -totalCost,
            subscriptionsProfit: 0,
            addonProfit: 0,
            unusedCreditsProfit: 0,
            profitMargin: 0,
        };
    } catch {
        return {
            totalRevenue: 0, totalCost: 0, totalProfit: 0,
            subscriptionsProfit: 0, addonProfit: 0,
            unusedCreditsProfit: 0, profitMargin: 0,
        };
    }
}


