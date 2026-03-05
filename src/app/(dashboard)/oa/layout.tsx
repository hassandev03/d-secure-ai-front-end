"use client";

import {
    LayoutDashboard,
    Users,
    Layers,
    BookText,
    BarChart3,
    Settings,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

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
        ],
    },
    {
        title: "Administration",
        items: [
            { label: "Quota Management", href: "/oa/quota", icon: BarChart3 },
            { label: "Settings", href: "/oa/settings", icon: Settings },
        ],
    },
];

export default function OrgAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={orgAdminNav}
                portalLabel="Org Admin"
                portalColor="brand-800"
            />
            <div className="pl-64 transition-all duration-300">
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
