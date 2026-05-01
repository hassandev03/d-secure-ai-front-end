"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    ShieldCheck,
    BrainCircuit,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { getDeptPendingQuotaCount } from "@/services/da.service";
import { useAuthStore } from "@/store/auth.store";
import { getCurrentUserSummary } from "@/services/auth.service";

export default function DeptAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { token, setUser, isAuthenticated } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        getDeptPendingQuotaCount().then(setPendingCount).catch(() => {});
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
                            createdAt:      new Date().toISOString(),
                        },
                        storedToken
                    );
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const deptAdminNav: NavGroup[] = useMemo(() => [
        {
            title: "Overview",
            items: [
                { label: "Dashboard", href: "/da/dashboard", icon: LayoutDashboard },
            ],
        },
        {
            title: "Management",
            items: [
                { label: "Employee Management", href: "/da/employees", icon: Users },
                { label: "Quota Requests", href: "/da/quota-requests", icon: BarChart3, badge: pendingCount },
                { label: "Access Control", href: "/da/access-control", icon: ShieldCheck },
                { label: "System Prompts", href: "/da/system-prompts", icon: BrainCircuit },
            ],
        },
    ], [pendingCount]);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={deptAdminNav}
                portalLabel="Dept Admin"
                portalColor="brand-700"
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
            />
            <div className={cn("transition-all duration-300", sidebarCollapsed ? "pl-16" : "pl-64")}>
                <Topbar showProfile={false} />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
