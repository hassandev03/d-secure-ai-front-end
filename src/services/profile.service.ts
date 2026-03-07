import { delay } from './api';
import type { User } from '@/types/user.types';

/* ══════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════ */

export interface ProfileUpdatePayload {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    jobTitle?: string;
    industry?: string;
    bio?: string;
    avatar?: File;
}

/* ══════════════════════════════════════════════════════
   Service Functions
   ══════════════════════════════════════════════════════ */

/** PUT /api/v1/users/me */
export async function updateUserProfile(_payload: ProfileUpdatePayload): Promise<{ success: boolean; user: Partial<User> }> {
    await delay(600);
    return { success: true, user: {} };
}

/** POST /api/v1/users/me/avatar */
export async function uploadAvatar(_file: File): Promise<{ avatarUrl: string }> {
    await delay(500);
    return { avatarUrl: URL.createObjectURL(_file) };
}

/** PUT /api/v1/users/me/password */
export async function changePassword(_current: string, _newPassword: string): Promise<{ success: boolean }> {
    await delay(500);
    return { success: true };
}

/** POST /api/v1/users/me/2fa/enable */
export async function enable2FA(): Promise<{ secret: string; qrCode: string }> {
    await delay(400);
    return { secret: 'MOCK_SECRET_KEY', qrCode: 'data:image/png;base64,...' };
}

/** DELETE /api/v1/users/me/2fa/disable */
export async function disable2FA(): Promise<{ success: boolean }> {
    await delay(400);
    return { success: true };
}
