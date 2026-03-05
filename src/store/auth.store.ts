import { create } from 'zustand';
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
    confirmAuth: () => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    },

    setPendingUser: (user, token) => {
        set({ pendingUser: user, token, isAuthenticated: false });
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
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),
}));
