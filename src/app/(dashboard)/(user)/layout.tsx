"use client";

import { useState, useEffect, useRef } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    History,
    User,
    CreditCard,
    BookText,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { getCurrentUserSummary, type UserSummary } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, setUser, updateUser, isAuthenticated } = useAuthStore();
    const subscriptionStore = useSubscriptionStore();
    const [mounted, setMounted] = useState(false);
    const [subscriptionReady, setSubscriptionReady] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // Prevents subscription sync from running more than once per mount.
    const hasSynced = useRef(false);

    /**
     * Hydrate auth store + subscription in ONE network call using
     * GET /users/me/summary.  Subsequent navigations within the same
     * session are served from the subscription store cache.
     */
    useEffect(() => {
        setMounted(true);

        if (hasSynced.current) return;
        hasSynced.current = true;

        if (!isAuthenticated) {
            // Single call: user + subscription + quota
            getCurrentUserSummary().then((summary: UserSummary | null) => {
                const storedToken = localStorage.getItem('auth_token');
                if (summary?.user && storedToken) {
                    // Hydrate auth store with the user from the summary endpoint
                    const { setUser: storeSetUser } = useAuthStore.getState();
                    storeSetUser(
                        {
                            id:            summary.user.user_id,
                            name:          summary.user.name,
                            email:         summary.user.email,
                            role:          summary.user.role as any,
                            status:        summary.user.status as any,
                            orgId:         summary.user.org_id ?? undefined,
                            subscriptionTier: summary.quota?.plan_key?.toUpperCase() as any,
                            isFirstLogin:  summary.user.is_first_login,
                        },
                        storedToken
                    );

                    // Cache subscription data so pages skip their own fetches
                    if (summary.subscription && summary.quota) {
                        subscriptionStore.setSubscription(
                            {
                                subscription_id: summary.subscription.subscription_id,
                                plan_id:         summary.subscription.plan_id,
                                plan_key:        summary.subscription.plan_key,
                                status:          summary.subscription.status,
                                current_period_start: summary.subscription.current_period_start,
                                current_period_end:   summary.subscription.current_period_end,
                                billing_cycle:   summary.subscription.billing_cycle,
                                cancelled_at:     null,
                            },
                            [] // plans are empty here; pages that need them will fetch
                        );
                    }
                }
                setSubscriptionReady(true);
            });
        } else {
            // Already authenticated — use cached subscription store
            syncSubscription(user?.role);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * R12: Fetch subscription + plans with a 5-minute in-memory TTL.
     * Uses the module-level `useSubscriptionStore` so subsequent page
     * navigations within the same session skip the fetch entirely.
     */
    const syncSubscription = async (role: string | undefined) => {
        if (role !== 'PROFESSIONAL') {
            setSubscriptionReady(true);
            return;
        }

        if (subscriptionStore.isLoaded && !subscriptionStore.isStale()) {
            const { subscription: sub, plans } = subscriptionStore;
            if (sub) {
                const matchedPlan =
                    plans.find((p) => p.key === sub.plan_key) ??
                    plans.find(
                        (p) =>
                            p.planId &&
                            sub.plan_id &&
                            p.planId.toLowerCase() === sub.plan_id.toLowerCase()
                    ) ??
                    null;
                if (matchedPlan) {
                    updateUser({ subscriptionTier: matchedPlan.key.toUpperCase() as any });
                }
            } else {
                updateUser({ subscriptionTier: 'FREE' });
            }
            setSubscriptionReady(true);
            return;
        }

        try {
            const { getSubscriptionSummary } = await import("@/services/subscription.service");
            const summary = await getSubscriptionSummary();
            if (summary?.subscription && summary?.quota) {
                subscriptionStore.setSubscription(summary.subscription, []);
            }

            if (summary?.subscription_plan_key) {
                updateUser({ subscriptionTier: summary.subscription_plan_key.toUpperCase() as any });
            } else {
                updateUser({ subscriptionTier: 'FREE' });
            }
        } catch (e) {
            console.error('Failed to sync subscription tier', e);
        } finally {
            setSubscriptionReady(true);
        }
    };

    const isProfessional = user?.role === 'PROFESSIONAL';
    // Only evaluate the context tab AFTER subscription data has been loaded
    // to prevent the tab from being permanently hidden due to a race condition.
    const showContextTab =
        subscriptionReady &&
        isProfessional &&
        (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MAX');

    const userNav: NavGroup[] = [
        {
            title: "Main",
            items: [
                { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { label: "Chat", href: "/chat", icon: MessageSquare },
                { label: "History", href: "/history", icon: History },
            ],
        },
        {
            title: "Account",
            items: [
                ...(mounted && showContextTab ? [{ label: "Professional Context", href: "/context", icon: BookText }] : []),
                { label: "Profile", href: "/profile", icon: User },
                ...(mounted && isProfessional ? [{ label: "Subscription", href: "/subscription", icon: CreditCard }] : []),
            ],
        },
    ];
    const displayRole = mounted && user?.role
        ? user.role.replace(/_/g, " ")
        : "User";

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={userNav}
                portalLabel={displayRole}
                portalColor="brand-700"
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
            />
            <div className={cn("transition-all duration-300", sidebarCollapsed ? "pl-16" : "pl-64")}>
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
