/**
 * auth.service.ts — Real backend integration
 *
 * Maps to FastAPI routes:
 *   POST /api/v1/auth/login       (form-encoded — OAuth2PasswordRequestForm)
 *   POST /api/v1/auth/register    (JSON — UserCreate)
 *   POST /api/v1/auth/logout      (Bearer token)
 *   GET  /api/v1/users/me         (Bearer token)
 */
import api from './api';
import type { User, LoginCredentials, RegisterData, TwoFAVerification } from '@/types/user.types';

// ---------------------------------------------------------------------------
// Backend response shapes (snake_case from FastAPI)
// ---------------------------------------------------------------------------

interface BackendUserRead {
    user_id: string;
    name: string;
    email: string;
    role: string | null;
    status: string;
    org_id: string | null;
    job_title: string | null;
    industry: string | null;
    country: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_first_login: boolean;
    email_verified_at: string | null;
    created_at: string;
    last_active_at: string | null;
}

interface BackendToken {
    access_token: string;
    refresh_token: string | null;
    token_type: string;
    user: BackendUserRead | null;
}

// ---------------------------------------------------------------------------
// Shape mapper: backend → frontend
// ---------------------------------------------------------------------------

function mapUser(b: BackendUserRead): User {
    return {
        id: b.user_id,
        name: b.name,
        email: b.email,
        role: (b.role as User['role']) ?? 'PROFESSIONAL',
        status: (b.status as User['status']) ?? 'ACTIVE',
        orgId: b.org_id ?? undefined,
        jobTitle: b.job_title ?? undefined,
        industry: b.industry ?? undefined,
        country: b.country ?? undefined,
        phone: b.phone ?? undefined,
        avatar: b.avatar_url ?? undefined,
        isFirstLogin: b.is_first_login,
        isTwoFAEnabled: false,          // backend doesn't expose this in UserRead yet
        emailVerifiedAt: b.email_verified_at ?? undefined,
        createdAt: b.created_at,
        lastActiveAt: b.last_active_at ?? undefined,
    };
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/login
 *
 * FastAPI's OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
 * with fields `username` and `password`.
 */
export async function login(
    credentials: LoginCredentials
): Promise<{ user: User; token: string; refreshToken: string | null; requires2FA: boolean }> {
    const form = new URLSearchParams();
    form.set('username', credentials.email);
    form.set('password', credentials.password);

    const { data } = await api.post<BackendToken>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Fetch user if not embedded in the token response
    let backendUser = data.user;
    if (!backendUser) {
        const meRes = await api.get<BackendUserRead>('/users/me', {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        backendUser = meRes.data;
    }

    return {
        user: mapUser(backendUser),
        token: data.access_token,
        refreshToken: data.refresh_token ?? null,
        requires2FA: false, // extend when backend exposes 2FA status in login response
    };
}

/**
 * POST /api/v1/auth/register
 */
export async function register(
    data: RegisterData
): Promise<{ user: User; token: string }> {
    const { data: res } = await api.post<BackendToken>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        job_title: data.jobTitle,
        industry: data.industry,
        country: data.country,
    });

    let backendUser = res.user;
    if (!backendUser) {
        const meRes = await api.get<BackendUserRead>('/users/me', {
            headers: { Authorization: `Bearer ${res.access_token}` },
        });
        backendUser = meRes.data;
    }

    return { user: mapUser(backendUser), token: res.access_token };
}

/**
 * POST /api/v1/auth/2fa/verify
 */
export async function verify2FA(
    verification: TwoFAVerification
): Promise<{ success: boolean }> {
    await api.post('/auth/2fa/verify', { code: verification.code });
    return { success: true };
}

/**
 * POST /api/v1/auth/2fa/setup
 */
export async function setup2FA(): Promise<{ secret: string; provisioningUri: string }> {
    const { data } = await api.post<{ secret: string; provisioning_uri: string }>('/auth/2fa/setup');
    return { secret: data.secret, provisioningUri: data.provisioning_uri };
}

/**
 * GET /api/v1/users/me
 * Called on page refresh to rehydrate the Zustand store.
 */
export async function getCurrentUser(): Promise<User | null> {
    const token =
        typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return null;

    try {
        const { data } = await api.get<BackendUserRead>('/users/me', {
            // Prevent the global 401 interceptor from redirecting to login
            // during this silent rehydration call. If the token is expired,
            // we simply return null and let the UI stay on the current page.
            headers: { 'X-Skip-Auth-Redirect': 'true' },
        });
        return mapUser(data);
    } catch {
        return null;
    }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout', { refresh_jti: null });
    } catch {
        // best-effort — always clear local state regardless
    }
}

/**
 * POST /api/v1/auth/forgot-password
 * Backend always returns 202 (silent on missing email).
 */
export async function requestPasswordReset(
    email: string
): Promise<{ success: boolean }> {
    await api.post('/auth/forgot-password', { email });
    return { success: true };
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(
    token: string,
    newPassword: string
): Promise<{ success: boolean }> {
    await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
    });
    return { success: true };
}

/**
 * POST /api/v1/auth/resend-verification
 * Resend email verification link. Always silent.
 */
export async function resendVerificationEmail(
    email: string
): Promise<{ success: boolean }> {
    await api.post('/auth/resend-verification', { email });
    return { success: true };
}

/**
 * POST /api/v1/auth/verify-email
 * Confirm email with the token received in the verification email.
 */
export async function verifyEmail(
    token: string
): Promise<{ success: boolean }> {
    await api.post('/auth/verify-email', { token });
    return { success: true };
}
