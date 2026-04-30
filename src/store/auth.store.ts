import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types/user.types';

interface AuthState {
    user: User | null;
    role: UserRole | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    pendingUser: User | null; // User pending 2FA verification

    setUser: (user: User, token: string) => void;
    setPendingUser: (user: User, token: string) => void;
    updateUser: (updates: Partial<User>) => void;
    confirmAuth: () => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            role: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            pendingUser: null,

            setUser: (user, token) => {
                set({
                    user,
                    role: user.role,
                    token,
                    isAuthenticated: true,
                    pendingUser: null,
                });
                // Kept for legacy code that reads localStorage directly (e.g. api.ts interceptor).
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                }
            },

            setPendingUser: (user, token) => {
                set({ pendingUser: user, token, isAuthenticated: false });
            },

            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                    role: state.user && updates.role ? updates.role : state.role,
                }));
            },

            confirmAuth: () => {
                const { pendingUser, token } = get();
                if (pendingUser && token) {
                    set({
                        user: pendingUser,
                        role: pendingUser.role,
                        isAuthenticated: true,
                        pendingUser: null,
                    });
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('auth_token', token);
                    }
                }
            },

            logout: () => {
                set({
                    user: null,
                    role: null,
                    token: null,
                    isAuthenticated: false,
                    pendingUser: null,
                });
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                }
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'dsecure-auth', // localStorage key
            // Only persist the fields needed for SSR-safe rehydration.
            // `pendingUser` and `isLoading` are intentionally excluded.
            partialize: (state) => ({
                user: state.user,
                role: state.role,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                // Persist subscriptionTier so it's available immediately on rehydration
                // without waiting for the async subscription fetch.
                user_subscriptionTier: state.user?.subscriptionTier ?? null,
            }),
        }
    )
);
