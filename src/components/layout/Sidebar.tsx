"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Shield,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string | number;
}

export interface NavGroup {
    title?: string;
    items: NavItem[];
}

interface SidebarProps {
    groups: NavGroup[];
    portalLabel: string;
    portalColor?: string; // e.g. "brand-950"
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({
    groups,
    portalLabel,
    portalColor = "brand-700",
    collapsed: controlledCollapsed,
    onCollapse,
}: SidebarProps) {
    const pathname = usePathname();
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

    const handleCollapseToggle = () => {
        if (onCollapse) {
            onCollapse(!isCollapsed);
        } else {
            setInternalCollapsed(!isCollapsed);
        }
    };

    const isActive = (href: string) => {
        if (href === pathname) return true;
        // match sub-routes (e.g. /sa/organizations/123 matches /sa/organizations)
        if (href !== "/" && pathname.startsWith(href + "/")) return true;
        return false;
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-white transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className={cn(
                "flex h-16 shrink-0 items-center border-b border-border transition-all",
                isCollapsed ? "justify-center" : "px-4"
            )}>
                <Link href="/" className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
                            `bg-${portalColor}`
                        )}
                        style={{ backgroundColor: portalColor === "brand-950" ? "#172554" : portalColor === "brand-800" ? "#1E40AF" : "#1D4ED8" }}
                    >
                        <Shield className="h-5 w-5" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <span className="text-lg font-bold text-foreground">
                                    {APP_NAME}
                                </span>
                                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    {portalLabel}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {groups.map((group, gi) => (
                    <div key={gi} className={cn(gi > 0 && "mt-6")}>
                        {group.title && !isCollapsed && (
                            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {group.title}
                            </p>
                        )}
                        {group.title && isCollapsed && (
                            <div className="mb-2 mx-auto h-px w-6 bg-border" />
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                const linkContent = (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-brand-50 text-brand-700"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 shrink-0",
                                                active ? "text-brand-600" : ""
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1">{item.label}</span>
                                                {item.badge !== undefined && (
                                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-100 px-1.5 text-[11px] font-semibold text-brand-700">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Link>
                                );

                                return (
                                    <li key={item.href}>
                                        {isCollapsed ? (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                                    <TooltipContent side="right" sideOffset={8}>
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            linkContent
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-border p-3">
                <button
                    onClick={handleCollapseToggle}
                    className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft
                        className={cn(
                            "h-5 w-5 transition-transform duration-300",
                            isCollapsed && "rotate-180"
                        )}
                    />
                </button>
            </div>
        </aside>
    );
}
