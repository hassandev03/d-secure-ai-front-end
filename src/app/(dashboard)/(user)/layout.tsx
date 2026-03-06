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
import { cn } from "@/lib/utils";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showContextTab = user?.role === 'PROFESSIONAL' && (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MAX');

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
                ...(mounted && showContextTab ? [{ label: "My Context", href: "/context", icon: BookText }] : []),
                { label: "Profile", href: "/profile", icon: User },
                { label: "Subscription", href: "/subscription", icon: CreditCard },
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
