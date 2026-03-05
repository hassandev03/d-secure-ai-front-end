"use client";

import { Building2, Users, CreditCard, BarChart3, Activity, Shield, TrendingUp, Globe } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

/* ===== Mock Data ===== */
const stats = {
    totalOrganizations: 42,
    activeOrganizations: 38,
    totalUsers: 1580,
    totalProfessionals: 312,
    totalRequests: 128400,
    todayRequests: 2340,
    anonymizationOps: 89200,
    activeSubscriptions: 267,
    anonymizationAccuracy: 98.7,
};

const recentOrgs = [
    { id: "org-001", name: "Acme Corporation", industry: "Technology", status: "ACTIVE", employees: 120, quota: { used: 3200, total: 5000 } },
    { id: "org-002", name: "MediHealth Inc.", industry: "Healthcare", status: "ACTIVE", employees: 85, quota: { used: 1800, total: 3000 } },
    { id: "org-003", name: "LegalEase Partners", industry: "Legal", status: "PENDING", employees: 20, quota: { used: 0, total: 1000 } },
    { id: "org-004", name: "EduTech Global", industry: "Education", status: "ACTIVE", employees: 45, quota: { used: 900, total: 2000 } },
    { id: "org-005", name: "FinSecure Ltd.", industry: "Finance", status: "INACTIVE", employees: 60, quota: { used: 200, total: 2000 } },
];

const recentActivity = [
    { action: "New organization registered", target: "FinSecure Ltd.", time: "2 hours ago" },
    { action: "Subscription upgraded", target: "MediHealth Inc.", time: "5 hours ago" },
    { action: "Quota increased", target: "Acme Corporation", time: "1 day ago" },
    { action: "User suspended", target: "john@example.com", time: "1 day ago" },
    { action: "New professional registered", target: "alex@freelance.com", time: "2 days ago" },
];

export default function SuperAdminDashboard() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Platform Overview"
                subtitle="Monitor and manage the entire D-SecureAI platform."
            />

            {/* Stat Cards */}
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
                    delta={{ value: `+${stats.totalProfessionals} professionals`, trend: "up" }}
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
                    title="Anonymization Accuracy"
                    value={`${stats.anonymizationAccuracy}%`}
                    icon={Shield}
                    delta={{ value: `${stats.anonymizationOps.toLocaleString()} ops`, trend: "flat" }}
                    iconColor="text-warning bg-warning/10"
                />
            </div>

            {/* Platform stats row */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard title="Total Requests" value={stats.totalRequests.toLocaleString()} icon={TrendingUp} />
                <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={CreditCard} iconColor="text-info bg-info/10" />
                <StatCard title="Anonymization Ops" value={stats.anonymizationOps.toLocaleString()} icon={Globe} iconColor="text-success bg-success/10" />
            </div>

            {/* Recent Orgs + Activity */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Recent Organizations — 2 cols */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold">Recent Organizations</CardTitle>
                        <Link href="/sa/organizations">
                            <Button variant="ghost" size="sm">View all →</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrgs.map((org) => (
                                <div key={org.id} className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarFallback className="bg-brand-100 text-sm font-semibold text-brand-700">
                                            {org.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/sa/organizations/${org.id}`} className="font-medium text-foreground hover:text-brand-600 truncate">
                                                {org.name}
                                            </Link>
                                            <StatusBadge status={org.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{org.industry} · {org.employees} employees</p>
                                    </div>
                                    <div className="w-32 hidden sm:block">
                                        <QuotaBar used={org.quota.used} total={org.quota.total} size="sm" showLabel={false} />
                                        <p className="mt-1 text-[11px] text-muted-foreground text-right">{org.quota.used.toLocaleString()}/{org.quota.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity — 1 col */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                                    <div>
                                        <p className="text-sm text-foreground">{item.action}</p>
                                        <p className="text-xs text-muted-foreground">{item.target} · {item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
