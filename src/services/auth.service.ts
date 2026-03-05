import { delay } from './api';
import type { User, LoginCredentials, RegisterData, TwoFAVerification } from '@/types/user.types';

// --- Mock Data ---
const mockSuperAdmin: User = {
    id: 'sa-001',
    name: 'Admin User',
    email: 'admin@dsecureai.com',
    role: 'SUPER_ADMIN',
    isTwoFAEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
};

const mockOrgAdmin: User = {
    id: 'oa-001',
    name: 'Sarah Johnson',
    email: 'sarah@acmecorp.com',
    role: 'ORG_ADMIN',
    orgId: 'org-001',
    orgName: 'Acme Corporation',
    isTwoFAEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-03-15T00:00:00Z',
};

const mockDeptAdmin: User = {
    id: 'da-001',
    name: 'James Wilson',
    email: 'james@acmecorp.com',
    role: 'DEPT_ADMIN',
    orgId: 'org-001',
    orgName: 'Acme Corporation',
    deptId: 'dept-001',
    deptName: 'Engineering',
    isTwoFAEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-04-01T00:00:00Z',
};

const mockEmployee: User = {
    id: 'emp-001',
    name: 'Emily Chen',
    email: 'emily@acmecorp.com',
    role: 'ORG_EMPLOYEE',
    orgId: 'org-001',
    orgName: 'Acme Corporation',
    deptId: 'dept-001',
    deptName: 'Engineering',
    isTwoFAEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-05-10T00:00:00Z',
};

const mockProfessional: User = {
    id: 'pro-001',
    name: 'Alex Thompson',
    email: 'alex@freelance.com',
    role: 'PROFESSIONAL',
    subscriptionTier: 'PRO',
    isTwoFAEnabled: false,
    status: 'ACTIVE',
    jobTitle: 'Data Scientist',
    industry: 'Technology',
    country: 'United States',
    createdAt: '2025-06-01T00:00:00Z',
};

const mockUsers: Record<string, User> = {
    'admin@dsecureai.com': mockSuperAdmin,
    'sarah@acmecorp.com': mockOrgAdmin,
    'james@acmecorp.com': mockDeptAdmin,
    'emily@acmecorp.com': mockEmployee,
    'alex@freelance.com': mockProfessional,
};

// --- Service Functions ---

export async function login(credentials: LoginCredentials): Promise<{ user: User; token: string; requires2FA: boolean }> {
    await delay(600);
    const user = mockUsers[credentials.email];
    if (!user) {
        throw new Error('Invalid email or password');
    }
    return {
        user,
        token: `mock-jwt-token-${user.id}`,
        requires2FA: user.isTwoFAEnabled,
    };
}

export async function verify2FA(verification: TwoFAVerification): Promise<{ success: boolean }> {
    await delay(400);
    if (verification.code === '000000') {
        throw new Error('Invalid verification code');
    }
    return { success: true };
}

export async function register(data: RegisterData): Promise<{ user: User; token: string }> {
    await delay(800);
    const newUser: User = {
        id: `pro-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: 'PROFESSIONAL',
        subscriptionTier: 'FREE',
        isTwoFAEnabled: false,
        status: 'ACTIVE',
        jobTitle: data.jobTitle,
        industry: data.industry,
        country: data.country,
        createdAt: new Date().toISOString(),
    };
    return { user: newUser, token: `mock-jwt-token-${newUser.id}` };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
    await delay(500);
    return { success: true };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    await delay(500);
    return { success: true };
}

export async function getCurrentUser(): Promise<User | null> {
    await delay(300);
    // MOCK: Return null when not authenticated
    return null;
}

export async function logout(): Promise<void> {
    await delay(200);
}
