"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Users, Layers, Activity, Shield, Brain, TrendingUp,
    UserPlus, UserMinus, CheckCircle2, XCircle, AlertTriangle,
    Building2, ArrowRight, ShieldAlert, Lock,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area, Legend,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    getOrgDashboardStats,
    getOrgDailyRequests,
    getOrgDeptUsage,
    getOrgModelUsage,
    getOrgUsageTrend,
    getOrgDeptComparison,
    getOrgRecentActivity,
    getOrgTopEmployees,
    getOrgSecurityOverview,
    type OrgDashboardStats,
    type DailyOrgRequestPoint,
    type DeptUsageRow,
    type OrgModelUsageSlice,
    type OrgUsageTrendPoint,
    type DeptComparisonPoint,
    type RecentActivityItem,
    type TopEmployeeRow,
    type SecurityOverview,
} from "@/services/oa.service";

// ── Activity icon mapping ────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<RecentActivityItem["icon"], { icon: React.ElementType; color: string }> = {
    "user-plus":      { icon: UserPlus,       color: "text-success bg-success/10" },
    "user-minus":     { icon: UserMinus,      color: "text-danger bg-danger/10" },
    "check-circle":   { icon: CheckCircle2,   color: "text-success bg-success/10" },
    "x-circle":       { icon: XCircle,        color: "text-danger bg-danger/10" },
    "shield":         { icon: Shield,         color: "text-brand-700 bg-brand-50" },
    "building":       { icon: Building2,      color: "text-info bg-info/10" },
    "alert-triangle": { icon: AlertTriangle,  color: "text-warning bg-warning/10" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgAdminDashboard() {
    const [stats, setStats] = useState<OrgDashboardStats | null>(null);
    const [daily, setDaily] = useState<DailyOrgRequestPoint[]>([]);
    const [depts, setDepts] = useState<DeptUsageRow[]>([]);
    const [models, setModels] = useState<OrgModelUsageSlice[]>([]);
    const [usageTrend, setUsageTrend] = useState<OrgUsageTrendPoint[]>([]);
    const [trendRange, setTrendRange] = useState<7 | 30>(7);
    const [deptComparison, setDeptComparison] = useState<DeptComparisonPoint[]>([]);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);
    const [topEmployees, setTopEmployees] = useState<TopEmployeeRow[]>([]);
    const [security, setSecurity] = useState<SecurityOverview | null>(null);

    useEffect(() => {
        getOrgDashboardStats().then(setStats);
        getOrgDailyRequests().then(setDaily);
        getOrgDeptUsage().then(setDepts);
        getOrgModelUsage().then(setModels);
        getOrgDeptComparison().then(setDeptComparison);
        getOrgRecentActivity().then(setActivity);
        getOrgTopEmployees(5).then(setTopEmployees);
        getOrgSecurityOverview().then(setSecurity);
    }, []);

    const loadTrend = useCallback((range: 7 | 30) => {
        setTrendRange(range);
        getOrgUsageTrend(range).then(setUsageTrend);
    }, []);

    useEffect(() => { loadTrend(7); }, [loadTrend]);

    if (!stats) return null;

    const twoFAPct = security ? Math.round((security.twoFAEnabled / security.twoFATotal) * 100) : 0;

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Organization Dashboard"
                subtitle="Acme Corporation — Monitor AI usage, quota, security, and team activity across all departments."
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Dashboard" }]}
            />

            {/* ── KPI Stat Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={Users}
                    delta={{ value: `${stats.activeEmployees} active · ${stats.pendingEmployees} pending`, trend: "up" }}
                />
                <StatCard
                    title="Departments"
                    value={stats.departments}
                    icon={Layers}
                    delta={{ value: `${stats.pendingQuotaRequests} quota requests pending`, trend: "flat" }}
                    iconColor="text-info bg-info/10"
                />
                <StatCard
                    title="Monthly Requests"
                    value={stats.monthlyRequests.toLocaleString()}
                    icon={Activity}
                    delta={{ value: `${stats.quotaUtilization}% of ${stats.monthlyQuota.toLocaleString()} quota`, trend: stats.quotaUtilization >= 80 ? "up" : "flat" }}
                    iconColor="text-success bg-success/10"
                />
                <StatCard
                    title="Anonymization Accuracy"
                    value={`${stats.anonymizationAccuracy}%`}
                    icon={Shield}
                    delta={{ value: `${stats.anonymizationOps.toLocaleString()} operations`, trend: "up" }}
                    iconColor="text-warning bg-warning/10"
                />
            </div>

            {/* ── Organisation Quota ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Organisation Quota</CardTitle>
                    <Link href="/oa/quota"><Button variant="ghost" size="sm">Manage →</Button></Link>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={stats.monthlyRequests} total={stats.monthlyQuota} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            {/* ── Row 1: Daily Activity + Model Usage ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Daily Requests */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Daily Request Activity</CardTitle>
                        <CardDescription>Requests and active users across the week.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-75 w-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                                <RechartsTooltip
                                    cursor={{ fill: "#f1f5f9" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                                <Bar dataKey="requests" name="AI Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="activeUsers" name="Active Users" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Model Usage Distribution */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Model Usage Distribution</CardTitle>
                        <CardDescription>AI model usage across the organisation.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-75 pb-4">
                        <div className="flex items-center gap-6 h-full">
                            <ResponsiveContainer width="50%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={models}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={50}
                                        paddingAngle={3}
                                        strokeWidth={0}
                                    >
                                        {models.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2.5 flex-1">
                                {models.map((m) => (
                                    <div key={m.name} className="flex items-center gap-2 text-sm">
                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="text-muted-foreground flex-1 truncate">{m.name}</span>
                                        <span className="font-semibold">{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Usage Trend (7/30 days) ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Usage Trend</CardTitle>
                        <CardDescription className="mt-0.5">Organisation-wide requests and active users over time.</CardDescription>
                    </div>
                    <div className="flex gap-1">
                        <Button variant={trendRange === 7 ? "default" : "outline"} size="sm" onClick={() => loadTrend(7)}>
                            7 Days
                        </Button>
                        <Button variant={trendRange === 30 ? "default" : "outline"} size="sm" onClick={() => loadTrend(30)}>
                            30 Days
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="min-h-75 w-full pb-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={usageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradOrgRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradOrgUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                dy={10}
                                interval={trendRange === 30 ? 4 : 0}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                            <Area type="monotone" dataKey="requests" name="Requests" stroke="#3b82f6" strokeWidth={2} fill="url(#gradOrgRequests)" />
                            <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#10b981" strokeWidth={2} fill="url(#gradOrgUsers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Department Comparison ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Department Comparison</CardTitle>
                        <CardDescription className="mt-0.5">Requests vs allocated quota by department.</CardDescription>
                    </div>
                    <Link href="/oa/departments"><Button variant="ghost" size="sm">View all →</Button></Link>
                </CardHeader>
                <CardContent className="min-h-75 w-full pb-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={deptComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <RechartsTooltip
                                cursor={{ fill: "#f1f5f9" }}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                            <Bar dataKey="requests" name="Requests Used" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="quota" name="Allocated Quota" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Row 2: Department Usage + Security Overview ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3 items-stretch">
                {/* Department Usage */}
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-base font-semibold">Department Usage</CardTitle>
                            <CardDescription className="mt-0.5">Quota consumption by department.</CardDescription>
                        </div>
                        <Link href="/oa/departments"><Button variant="ghost" size="sm">View all →</Button></Link>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-4">
                            {depts.map((dept) => {
                                const pct = dept.total > 0 ? Math.round((dept.used / dept.total) * 100) : 0;
                                return (
                                    <div key={dept.name} className="flex items-center gap-4">
                                        <div className="flex items-center gap-2.5 w-32 shrink-0 min-w-0">
                                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                                            <span className="text-sm font-medium truncate">{dept.name}</span>
                                        </div>
                                        <div className="flex-1">
                                            <QuotaBar used={dept.used} total={dept.total} showLabel={false} size="sm" />
                                        </div>
                                        <div className="w-28 shrink-0 text-right">
                                            <span className={cn(
                                                "text-xs font-semibold",
                                                pct >= 90 ? "text-danger" : pct >= 70 ? "text-warning" : "text-muted-foreground",
                                            )}>
                                                {pct}%
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({dept.used}/{dept.total})
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Security Overview */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-brand-700" />
                            <CardTitle className="text-base font-semibold">Security Overview</CardTitle>
                        </div>
                        <CardDescription>Authentication and access status.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                        {security && (
                            <>
                                <div className="rounded-lg border border-border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm font-medium">2FA Adoption</span>
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            twoFAPct >= 90 ? "text-success" : twoFAPct >= 70 ? "text-warning" : "text-danger",
                                        )}>
                                            {twoFAPct}%
                                        </span>
                                    </div>
                                    <div className="w-full overflow-hidden rounded-full bg-muted h-2">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                twoFAPct >= 90 ? "bg-success" : twoFAPct >= 70 ? "bg-warning" : "bg-danger",
                                            )}
                                            style={{ width: `${Math.min(twoFAPct, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1.5">
                                        {security.twoFAEnabled} of {security.twoFATotal} employees
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-border p-3 text-center">
                                        <p className={cn(
                                            "text-lg font-bold",
                                            security.failedLogins24h > 3 ? "text-warning" : "text-foreground",
                                        )}>
                                            {security.failedLogins24h}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">Failed Logins (24h)</p>
                                    </div>
                                    <div className="rounded-lg border border-border p-3 text-center">
                                        <p className="text-lg font-bold">{security.activeSessions}</p>
                                        <p className="text-[11px] text-muted-foreground">Active Sessions</p>
                                    </div>
                                </div>

                                {security.restrictedAccounts > 0 && (
                                    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                                        <p className="text-xs text-warning">
                                            <span className="font-semibold">{security.restrictedAccounts}</span> accounts currently restricted.
                                        </p>
                                    </div>
                                )}

                                <Link href="/oa/settings" className="block">
                                    <Button variant="outline" size="sm" className="w-full text-xs">
                                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                                        Security Settings
                                    </Button>
                                </Link>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 3: Top Employees + Recent Activity ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Top Employees */}
                <Card className="flex flex-col">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-base font-semibold">Top Employees by Activity</CardTitle>
                            <CardDescription className="mt-0.5">Most active AI users across the organisation.</CardDescription>
                        </div>
                        <Link href="/oa/employees"><Button variant="ghost" size="sm">View all →</Button></Link>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-3">
                            {topEmployees.map((emp, i) => (
                                <div key={emp.id} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                        {i + 1}
                                    </span>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                            {emp.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{emp.name}</p>
                                            <StatusBadge status={emp.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {emp.department} · {emp.lastActive}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {emp.requests}{" "}
                                        <span className="text-xs text-muted-foreground font-normal">requests</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-brand-700" />
                            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                        </div>
                        <CardDescription>Latest administrative actions and events.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-3">
                            {activity.map((item) => {
                                const { icon: IconComp, color } = ACTIVITY_ICONS[item.icon];
                                return (
                                    <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color)}>
                                            <IconComp className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                            {item.timestamp}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Quick Links ── */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Manage Employees", href: "/oa/employees", icon: Users, desc: "Add, edit, or remove team members" },
                    { label: "Departments", href: "/oa/departments", icon: Building2, desc: "View department performance" },
                    { label: "Quota Management", href: "/oa/quota", icon: Brain, desc: "Allocate and manage AI quotas" },
                    { label: "Organisation Settings", href: "/oa/settings", icon: Shield, desc: "Security, policies, and access" },
                ].map((link) => (
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
                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand-700 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
