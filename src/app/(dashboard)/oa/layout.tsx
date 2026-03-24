"use client";

import { useState } from "react";
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
