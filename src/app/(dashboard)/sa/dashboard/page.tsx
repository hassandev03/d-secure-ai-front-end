"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Building2, Users, CreditCard, Activity, TrendingUp, Globe,
    UserPlus, ArrowUpRight, Settings, Shield, Zap, CheckCircle2,
    AlertTriangle, BarChart3, Loader2,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getDashboardStats, getRecentOrganizations, getRecentActivity } from "@/services/sa.service";
import type { SADashboardStats, SAOrganization, SAActivityItem, ActivityIconType } from "@/types/sa.types";

const ACTIVITY_ICONS: Record<ActivityIconType, { icon: React.ElementType; color: string }> = {
    "user-plus":    { icon: UserPlus,      color: "text-success bg-success/10" },
    "check-circle": { icon: CheckCircle2,  color: "text-brand-700 bg-brand-50" },
    "zap":          { icon: Zap,           color: "text-info bg-info/10" },
    "alert":        { icon: AlertTriangle, color: "text-warning bg-warning/10" },
    "settings":     { icon: Settings,      color: "text-muted-foreground bg-muted" },
    "trending-up":  { icon: TrendingUp,    color: "text-success bg-success/10" },
};

const quickLinks = [
    { label: "Manage Organizations", href: "/sa/organizations", icon: Building2, desc: "View & manage all orgs" },
    { label: "Professionals", href: "/sa/professionals", icon: Users, desc: "Independent user directory" },
    { label: "Subscriptions", href: "/sa/subscriptions", icon: CreditCard, desc: "Plans & billing tiers" },
    { label: "Analytics", href: "/sa/analytics", icon: BarChart3, desc: "Platform-wide usage data" },
];

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<SADashboardStats | null>(null);
    const [recentOrgs, setRecentOrgs] = useState<SAOrganization[]>([]);
    const [activity, setActivity] = useState<SAActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [s, o, a] = await Promise.all([
                getDashboardStats(),
                getRecentOrganizations(5),
                getRecentActivity(),
            ]);
            setStats(s);
            setRecentOrgs(o);
            setActivity(a);
            setLoading(false);
        }
        load();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Platform Overview"
                subtitle="Monitor and manage the entire D-SecureAI platform."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Organizations"
                    value={stats.totalOrganizations}
                    icon={Building2}
                    delta={{ value: `${stats.activeOrganizations} active`, trend: "up" }}
                />
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={Users}
                    delta={{ value: `${stats.totalProfessionals} professionals`, trend: "up" }}
                    iconColor="text-info bg-info/10"
                />
                <StatCard
                    title="Today's Requests"
                    value={stats.todayRequests.toLocaleString()}
                    icon={Activity}
                    delta={{ value: "+12% vs yesterday", trend: "up" }}
                    iconColor="text-success bg-success/10"
                />
                <StatCard
                    title="Avg Requests / User"
                    value={stats.avgRequestsPerUser}
                    icon={TrendingUp}
                    delta={{ value: "Per registered user, all-time", trend: "flat" }}
                    iconColor="text-brand-700 bg-brand-50"
                />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <StatCard title="Total Requests" value={stats.totalRequests.toLocaleString()} icon={TrendingUp} />
                <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} iconColor="text-info bg-info/10" />
                <StatCard title="Anonymization Ops" value={stats.anonymizationOps.toLocaleString()} icon={Globe} iconColor="text-success bg-success/10" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold">Recent Organizations</CardTitle>
                        <Link href="/sa/organizations">
                            <Button variant="ghost" size="sm">View all →</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentOrgs.map((org) => (
                            <div key={org.id} className="flex items-center gap-4 rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/50">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarFallback className="bg-brand-100 text-sm font-semibold text-brand-700">
                                        {org.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/sa/organizations/${org.id}`} className="font-medium text-foreground hover:text-brand-600 truncate transition-colors">
                                            {org.name}
                                        </Link>
                                        <StatusBadge status={org.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{org.industry} · {org.employees} employees</p>
                                </div>
                                <div className="w-32 hidden sm:block">
                                    <QuotaBar used={org.quota.used} total={org.quota.total} size="sm" showLabel={false} />
                                    <p className="mt-1 text-[11px] text-muted-foreground text-right">
                                        {org.quota.used.toLocaleString()}/{org.quota.total.toLocaleString()}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground hidden lg:block" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activity.map((item, i) => {
                            const { icon: IconComp, color } = ACTIVITY_ICONS[item.icon];
                            return (
                                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color)}>
                                        <IconComp className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-tight">{item.action}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.target}</p>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{item.time}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Card className="group cursor-pointer transition-shadow hover:shadow-md h-full">
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold group-hover:text-brand-700 transition-colors">{link.label}</p>
                                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand-700 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
