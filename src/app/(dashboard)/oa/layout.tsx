"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    Layers,
    BookText,
    BarChart3,
    Settings,
    ShieldCheck,
    BrainCircuit,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { getCurrentUserSummary } from "@/services/auth.service";

const orgAdminNav: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/oa/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Management",
        items: [
            { label: "Employees", href: "/oa/employees", icon: Users },
            { label: "Departments", href: "/oa/departments", icon: Layers },
            { label: "Enterprise Context", href: "/oa/enterprise-context", icon: BookText },
            { label: "System Prompts", href: "/oa/system-prompts", icon: BrainCircuit },
        ],
    },
    {
        title: "Administration",
        items: [
            { label: "Quota Management", href: "/oa/quota", icon: BarChart3 },
            { label: "Settings", href: "/oa/settings", icon: Settings },
        ],
    },
    {
        title: "Compliance",
        items: [
            { label: "Audit & Privacy", href: "/oa/audit-privacy", icon: ShieldCheck },
        ],
    },
];

export default function OrgAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { token, setUser, isAuthenticated } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
                            jobTitle:       summary.user.job_title ?? undefined,
                            industry:       summary.user.industry ?? undefined,
                            country:        summary.user.country ?? undefined,
                            phone:          summary.user.phone ?? undefined,
                            avatar:         summary.user.avatar_url ?? undefined,
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

    if (!mounted || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-800 border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Org Admin portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={orgAdminNav}
                portalLabel="Org Admin"
                portalColor="brand-800"
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
