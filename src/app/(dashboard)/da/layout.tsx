"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { getDeptPendingQuotaCount } from "@/services/da.service";

export default function DeptAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        getDeptPendingQuotaCount().then(setPendingCount).catch(() => {});
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
