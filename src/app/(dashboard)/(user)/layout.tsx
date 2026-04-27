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
import { getUserDashboardStats } from "@/services/dashboard.service";
import { cn } from "@/lib/utils";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, token, setUser, updateUser, isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Blocker 1 Fix: Rehydrate user session from backend on page refresh.
        // getCurrentUser() reads the stored token and calls GET /api/v1/users/me.
        // In mock mode it returns null (no-op). When the backend is live, it
        // returns the full User object which gets stored in Zustand.
        const fetchSubscription = async () => {
            if (user?.role === 'PROFESSIONAL') {
                try {
                    const [sub, plans, stats] = await Promise.all([
                        getCurrentSubscription(),
                        getSubscriptionPlans(),
                        getUserDashboardStats()
                    ]);
                    if (sub) {
                        let matchedPlan = plans.find(p => p.planId && sub.plan_id && p.planId.toLowerCase() === sub.plan_id.toLowerCase());
                        if (!matchedPlan && stats?.planName) {
                            matchedPlan = plans.find(p => p.name.toLowerCase() === stats.planName.toLowerCase() || p.key.toLowerCase() === stats.planName.toLowerCase());
                        }
                        if (matchedPlan) {
                            updateUser({ subscriptionTier: matchedPlan.key.toUpperCase() as any });
                        }
                    } else {
                        updateUser({ subscriptionTier: 'FREE' });
                    }
                } catch (e) {
                    console.error("Failed to sync subscription tier", e);
                }
            }
        };

        if (!isAuthenticated) {
            getCurrentUser().then((fetchedUser) => {
                const storedToken = localStorage.getItem('auth_token');
                if (fetchedUser && storedToken) {
                    setUser(fetchedUser, storedToken);
                    // Only fetch sub after user is set so we have the token available
                    if (fetchedUser.role === 'PROFESSIONAL') {
                        Promise.all([getCurrentSubscription(), getSubscriptionPlans(), getUserDashboardStats()]).then(([sub, plans, stats]) => {
                            if (sub) {
                                let matchedPlan = plans.find(p => p.planId && sub.plan_id && p.planId.toLowerCase() === sub.plan_id.toLowerCase());
                                if (!matchedPlan && stats?.planName) {
                                    matchedPlan = plans.find(p => p.name.toLowerCase() === stats.planName.toLowerCase() || p.key.toLowerCase() === stats.planName.toLowerCase());
                                }
                                if (matchedPlan) {
                                    updateUser({ subscriptionTier: matchedPlan.key.toUpperCase() as any });
                                }
                            }
                        });
                    }
                }
            });
        } else {
            fetchSubscription();
        }
    }, [isAuthenticated, user?.role, setUser, updateUser]);

    const isProfessional = user?.role === 'PROFESSIONAL';
    const showContextTab = isProfessional && (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MAX');

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
