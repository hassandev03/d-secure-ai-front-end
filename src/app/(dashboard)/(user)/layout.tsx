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
import { getDashboardInit, type DashboardInitResponse } from "@/services/dashboard.service";
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
            // Single call: user + subscription + quota + permissions + recent sessions
            getDashboardInit().then((data: DashboardInitResponse | null) => {
                const storedToken = localStorage.getItem('auth_token');
                if (data?.user && storedToken) {
                    // Hydrate auth store with the user from the init endpoint
                    const { setUser: storeSetUser } = useAuthStore.getState();
                    storeSetUser(
                        {
                            id:            data.user.user_id,
                            name:          data.user.name,
                            email:         data.user.email,
                            role:          data.user.role as any,
                            status:        data.user.status as any,
                            orgId:         data.user.org_id ?? undefined,
                            subscriptionTier: (data.quota?.plan_key || 'FREE').toUpperCase() as any,
                            isFirstLogin:  data.user.is_first_login,
                            jobTitle:      data.user.job_title ?? undefined,
                            industry:      data.user.industry ?? undefined,
                            country:       data.user.country ?? undefined,
                            phone:         data.user.phone ?? undefined,
                            avatar:        data.user.avatar_url ?? undefined,
                            isTwoFAEnabled: false,
                            createdAt:     new Date().toISOString(),
                        },
                        storedToken
                    );

                    // Cache subscription data so pages skip their own fetches
                    if (data.subscription && data.quota) {
                        subscriptionStore.setSubscription(
                            {
                                subscription_id: data.subscription.subscription_id,
                                plan_id:         data.subscription.plan_id,
                                plan_key:        data.subscription.plan_key,
                                status:          data.subscription.status,
                                current_period_start: data.subscription.current_period_start,
                                current_period_end:   data.subscription.current_period_end,
                                billing_cycle:   data.subscription.billing_cycle,
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
     * R12: Sync subscription state from the lightweight /users/me/summary endpoint.
     * Avoids a separate /subscriptions/summary call — the summary endpoint already
     * returns subscription + quota data, eliminating one redundant authenticated
     * API call (and its associated user + department queries) on every page load.
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
            // Reuse the heavy-duty /dashboard/init endpoint for consistent syncing
            const data = await getDashboardInit();
            if (data?.subscription && data?.quota) {
                subscriptionStore.setSubscription(
                    {
                        subscription_id: data.subscription.subscription_id,
                        plan_id:         data.subscription.plan_id,
                        plan_key:        data.subscription.plan_key,
                        status:          data.subscription.status,
                        current_period_start: data.subscription.current_period_start,
                        current_period_end:   data.subscription.current_period_end,
                        billing_cycle:   data.subscription.billing_cycle,
                        cancelled_at:    null,
                    },
                    []
                );
                updateUser({ subscriptionTier: data.subscription.plan_key.toUpperCase() as any });
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

    if (!mounted || !subscriptionReady) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading your workspace...</p>
                </div>
            </div>
        );
    }

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
