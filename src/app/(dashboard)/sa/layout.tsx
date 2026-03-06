"use client";

import { useState } from "react";
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
