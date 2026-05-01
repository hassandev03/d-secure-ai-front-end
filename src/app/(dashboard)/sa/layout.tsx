"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Settings,
    BarChart3,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { getCurrentUserSummary } from "@/services/auth.service";

const superAdminNav: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/sa/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Management",
        items: [
            { label: "Organizations", href: "/sa/organizations", icon: Building2 },
            { label: "Professionals", href: "/sa/professionals", icon: Users },
            { label: "Subscriptions", href: "/sa/subscriptions", icon: CreditCard },
        ],
    },
    {
        title: "System",
        items: [
            { label: "Analytics", href: "/sa/analytics", icon: BarChart3 },
            { label: "Settings", href: "/sa/settings", icon: Settings },
        ],
    },
];

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { token, setUser, isAuthenticated } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            // Use getCurrentUserSummary instead of getCurrentUser so we call
            // /users/me/summary directly (not via getCurrentUser which proxies it).
            getCurrentUserSummary().then((summary) => {
                const storedToken = localStorage.getItem('auth_token');
                if (summary?.user && storedToken) {
                    setUser(
                        {
                            id:             summary.user.user_id,
                            name:           summary.user.name,
                            email:          summary.user.email,
                            role:           summary.user.role as any,
                            status:         summary.user.status as any,
                            orgId:          summary.user.org_id ?? undefined,
                            isFirstLogin:   summary.user.is_first_login,
                            isTwoFAEnabled: false,
                            createdAt:      new Date().toISOString(), // Mock value, update with actual if available from summary
                        },
                        storedToken
                    );
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={superAdminNav}
                portalLabel="Super Admin"
                portalColor="brand-950"
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
