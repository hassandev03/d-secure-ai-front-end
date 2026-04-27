"use client";

import { useState, useEffect } from "react";
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
import { getCurrentUser } from "@/services/auth.service";
import { getCurrentSubscription, getSubscriptionPlans } from "@/services/subscription.service";
import { cn } from "@/lib/utils";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, setUser, updateUser, isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // Track whether we've finished the async subscription sync so the
    // sidebar doesn't flicker or permanently hide the Context tab.
    const [subscriptionReady, setSubscriptionReady] = useState(false);

    /**
     * Fetch subscription and resolve the user's plan key.
     * Returns the resolved plan key (lowercase) or null.
     */
    const syncSubscription = async (role: string | undefined) => {
        if (role !== 'PROFESSIONAL') {
            setSubscriptionReady(true);
            return;
        }
        try {
            const [sub, plans] = await Promise.all([
                getCurrentSubscription(),
                getSubscriptionPlans(),
            ]);
            if (sub) {
                // Primary match: plan_key string (most reliable)
                let matchedPlan = sub.plan_key
                    ? plans.find((p) => p.key === sub.plan_key)
                    : null;
                // Secondary match: plan UUID
                if (!matchedPlan) {
                    matchedPlan = plans.find(
                        (p) => p.planId && sub.plan_id && p.planId.toLowerCase() === sub.plan_id.toLowerCase()
                    ) ?? null;
                }
                if (matchedPlan) {
                    updateUser({ subscriptionTier: matchedPlan.key.toUpperCase() as any });
                }
            } else {
                updateUser({ subscriptionTier: 'FREE' });
            }
        } catch (e) {
            console.error('Failed to sync subscription tier', e);
        } finally {
            setSubscriptionReady(true);
        }
    };

    useEffect(() => {
        setMounted(true);

        if (!isAuthenticated) {
            getCurrentUser().then(async (fetchedUser) => {
                const storedToken = localStorage.getItem('auth_token');
                if (fetchedUser && storedToken) {
                    setUser(fetchedUser, storedToken);
                    await syncSubscription(fetchedUser.role);
                } else {
                    setSubscriptionReady(true);
                }
            });
        } else {
            syncSubscription(user?.role);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role]);

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
