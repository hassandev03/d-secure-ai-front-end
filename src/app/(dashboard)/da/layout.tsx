"use client";

import {
    LayoutDashboard,
    Users,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import Sidebar, { type NavGroup } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const deptAdminNav: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/da/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Management",
        items: [
            { label: "Employees", href: "/da/employees", icon: Users },
            { label: "Quota Requests", href: "/da/quota-requests", icon: BarChart3, badge: 2 },
            { label: "Access Control", href: "/da/access-control", icon: ShieldCheck },
        ],
    },
];

export default function DeptAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={deptAdminNav}
                portalLabel="Dept Admin"
                portalColor="brand-700"
            />
            <div className="pl-64 transition-all duration-300">
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
