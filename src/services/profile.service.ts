/**
 * profile.service.ts — Real backend integration
 *
 * Backend routes (prefix /api/v1/users):
 *   PATCH /me                  → update profile fields
 *   POST  /me/change-password  → change password (requires current)
 *   POST  /auth/2fa/setup      → enable 2FA → returns secret + QR URI
 *   POST  /auth/2fa/verify     → confirm 2FA code (activates it)
 *   DELETE /auth/2fa/disable   → disable 2FA
 */
import api from './api';
import type { User } from '@/types/user.types';

export interface ProfileUpdatePayload {
    name?: string;
    jobTitle?: string;
    industry?: string;
    country?: string;
    phone?: string;
    avatarUrl?: string;
}

/** PATCH /api/v1/users/me */
export async function updateUserProfile(
    payload: ProfileUpdatePayload
): Promise<{ success: boolean; user: Partial<User> }> {
    const { data } = await api.patch('/users/me', {
        name:      payload.name,
        job_title: payload.jobTitle,
        industry:  payload.industry,
        country:   payload.country,
        phone:     payload.phone,
        avatar_url: payload.avatarUrl,
    });
    return {
        success: true,
        user: {
            name:     data.name,
            jobTitle: data.job_title,
            industry: data.industry,
            country:  data.country,
            phone:    data.phone,
            avatar:   data.avatar_url,
        },
    };
}

/** POST /api/v1/users/me/change-password */
export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean }> {
    await api.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
    });
    return { success: true };
}

/** POST /api/v1/auth/2fa/setup */
export async function enable2FA(): Promise<{ secret: string; qrCode: string }> {
    const { data } = await api.post<{ secret: string; provisioning_uri: string }>(
        '/auth/2fa/setup'
    );
    return { secret: data.secret, qrCode: data.provisioning_uri };
}

/** POST /api/v1/auth/2fa/verify */
export async function verify2FACode(code: string): Promise<{ success: boolean }> {
    await api.post('/auth/2fa/verify', { code });
    return { success: true };
}

/** DELETE /api/v1/auth/2fa/disable */
export async function disable2FA(): Promise<{ success: boolean }> {
    await api.delete('/auth/2fa/disable');
    return { success: true };
}
