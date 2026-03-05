"use client";

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
            { label: "My Context", href: "/context", icon: BookText },
            { label: "Profile", href: "/profile", icon: User },
            { label: "Subscription", href: "/subscription", icon: CreditCard },
        ],
    },
];

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                groups={userNav}
                portalLabel="User"
                portalColor="brand-700"
            />
            <div className="pl-64 transition-all duration-300">
                <Topbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
