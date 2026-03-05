export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DEPT_ADMIN' | 'ORG_EMPLOYEE' | 'PROFESSIONAL';
export type SubscriptionTier = 'FREE' | 'PRO' | 'MAX';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    subscriptionTier?: SubscriptionTier;
    orgId?: string;
    orgName?: string;
    deptId?: string;
    deptName?: string;
    isTwoFAEnabled: boolean;
    isFirstLogin?: boolean;
    status: UserStatus;
    jobTitle?: string;
    industry?: string;
    country?: string;
    phone?: string;
    createdAt: string;
    lastActiveAt?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
    industry?: string;
    country?: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordReset {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface TwoFAVerification {
    code: string;
    isBackupCode?: boolean;
}
