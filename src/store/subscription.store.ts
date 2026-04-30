/**
 * subscription.store.ts — R14
 *
 * Lifts subscription + plan state out of UserLayout into a module-level
 * Zustand store so any page can read it without triggering a new network call.
 *
 * Usage:
 *   const { subscription, plans, isLoaded } = useSubscriptionStore();
 *
 * Invalidate after upgrade/downgrade/cancel:
 *   useSubscriptionStore.getState().invalidate();
 */
import { create } from 'zustand';
import type { BSub, SubscriptionPlanDisplay } from '@/services/subscription.service';

const SUBSCRIPTION_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface SubscriptionState {
    subscription: BSub | null;
    plans: SubscriptionPlanDisplay[];
    isLoaded: boolean;
    lastFetchedAt: number | null;

    setSubscription: (sub: BSub | null, plans: SubscriptionPlanDisplay[]) => void;
    invalidate: () => void;
    /** True if data is absent or older than the TTL. */
    isStale: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscription: null,
    plans: [],
    isLoaded: false,
    lastFetchedAt: null,

    setSubscription: (sub, plans) =>
        set({ subscription: sub, plans, isLoaded: true, lastFetchedAt: Date.now() }),

    invalidate: () => set({ isLoaded: false, lastFetchedAt: null }),

    isStale: () => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return true;
        return Date.now() - lastFetchedAt > SUBSCRIPTION_TTL_MS;
    },
}));
