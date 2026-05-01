"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
    Users, TrendingUp, Percent, Bell,
    UserPlus, UserMinus, CheckCircle2, XCircle, AlertTriangle,
    Building2, ArrowRight, Shield, Brain,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaGauge from "@/components/shared/QuotaGauge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    getOrgDashboardStats,
    getOrgModelUsage,
    getOrgUsageTrend,
    getOrgRecentActivity,
    type OrgDashboardStats,
    type OADepartment,
    type OrgModelUsageSlice,
    type OrgUsageTrendPoint,
    type RecentActivityItem,
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

// ── Tooltip styles ───────────────────────────────────────────────────────────

const TOOLTIP_STYLE = { borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgAdminDashboard() {
    const [stats, setStats] = useState<OrgDashboardStats | null>(null);
    const [depts, setDepts] = useState<OADepartment[]>([]);
    const [models, setModels] = useState<OrgModelUsageSlice[]>([]);
    const [usageTrend, setUsageTrend] = useState<OrgUsageTrendPoint[]>([]);
    const [trendRange, setTrendRange] = useState<7 | 30>(7);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);

    useEffect(() => {
        // getOrgDashboardStats now returns { stats, departments } so we reuse
        // the already-fetched departments instead of calling getOrgDeptUsage()
        // (which was a thin wrapper around getOADepartments — a duplicate request).
        getOrgDashboardStats().then(({ stats, departments }) => {
            setStats(stats);
            setDepts(departments);
        });
        getOrgModelUsage().then(setModels);
        getOrgRecentActivity().then(setActivity);
    }, []);

    const loadTrend = useCallback((range: 7 | 30) => {
        setTrendRange(range);
        getOrgUsageTrend(range).then(setUsageTrend);
    }, []);

    useEffect(() => { loadTrend(7); }, [loadTrend]);

    // ── Derived business insights ────────────────────────────────────────────

    const deptUsage = useMemo(() =>
        [...depts]
            .map(d => ({
                name: d.name,
                color: d.color,
                used: Math.round(d.budget * (d.percentageUsed / 100)),
            }))
            .sort((a, b) => b.used - a.used),
        [depts],
    );

    const quotaAlerts = useMemo(() => ({
        critical:       depts.filter(d => d.budget > 0 && d.percentageUsed >= 90),
        warning:        depts.filter(d => d.budget > 0 && d.percentageUsed >= 70 && d.percentageUsed < 90),
        underutilized:  depts.filter(d => d.budget > 0 && d.percentageUsed < 40),
    }), [depts]);

    if (!stats) return null;

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Organization Dashboard"
                subtitle={`Acme Corporation — ${stats.departments} departments · ${stats.totalEmployees} employees`}
                breadcrumbs={[{ label: "Organization", href: "/oa/dashboard" }, { label: "Dashboard" }]}
            />

            {/* ── KPI Stat Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="AI Adoption Rate"
                    value={`${stats.adoptionRate}%`}
                    icon={Users}
                    delta={{ value: `${stats.activeEmployees} of ${stats.totalEmployees} employees active`, trend: stats.adoptionRate >= 80 ? "up" : "down" }}
                />
                <StatCard
                    title="Avg Credits / Employee"
                    value={stats.avgCreditsPerEmployee}
                    icon={TrendingUp}
                    delta={{ value: "Per active employee this month", trend: "flat" }}
                    iconColor="text-success bg-success/10"
                />
                <StatCard
                    title="Budget Utilization"
                    value={`${stats.quotaUtilization}%`}
                    icon={Percent}
                    delta={{ value: `${stats.monthlyCredits.toLocaleString()} of ${stats.monthlyBudget.toLocaleString()} credits used`, trend: stats.quotaUtilization >= 80 ? "up" : "flat" }}
                    iconColor="text-info bg-info/10"
                />
                <StatCard
                    title="Pending Actions"
                    value={stats.pendingQuotaRequests}
                    icon={Bell}
                    delta={{ value: "Budget requests awaiting review", trend: stats.pendingQuotaRequests > 0 ? "up" : "flat" }}
                    iconColor="text-warning bg-warning/10"
                />
            </div>

            {/* ── Organisation Quota ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Organisation Budget</CardTitle>
                        <CardDescription className="mt-0.5">{stats.unallocatedBudget.toLocaleString()} credits unallocated — available to assign to departments.</CardDescription>
                    </div>
                    <Link href="/oa/quota"><Button variant="ghost" size="sm">Manage →</Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-2">
                        <QuotaGauge percentageUsed={stats.quotaUtilization} size="md" planName="Organization Plan" renewsAt="2026-05-01T00:00:00Z" />
                    </div>
                </CardContent>
            </Card>

            {/* ── Row 1: Department Quota Usage + Model Preference ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Department Quota Usage — "Which teams are consuming the most quota?" */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Department Credit Usage</CardTitle>
                        <CardDescription>Credits (CU) consumed by each department this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-75 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptUsage} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} width={90} />
                                <RechartsTooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} CU`, "Credits Used"]}
                                />
                                <Bar dataKey="used" name="Credits (CU)" radius={[0, 4, 4, 0]} barSize={18}>
                                    {deptUsage.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Model Usage — "Which AI models does the organisation prefer?" */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Model Preference</CardTitle>
                        <CardDescription>Understand which AI models your teams use to optimise availability and licensing.</CardDescription>
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
                                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
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

            {/* ── Usage Trend — "What's the trajectory? Growing or stagnating?" ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Usage Trend</CardTitle>
                        <CardDescription className="mt-0.5">Track adoption growth — rising trends show increasing value, dips may signal issues.</CardDescription>
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
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="creditsUsed" name="Credits Used (CU)" stroke="#3b82f6" strokeWidth={2} fill="url(#gradOrgRequests)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Row 2: Quota Alerts + Recent Activity ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Quota Alerts — "Where do I need to take action?" */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <CardTitle className="text-base font-semibold">Quota Alerts</CardTitle>
                        </div>
                        <CardDescription>Departments needing quota reallocation — redistribute from underutilized to critical.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {quotaAlerts.critical.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-danger mb-2">Critical — Over 90% used, may run out</p>
                                {quotaAlerts.critical.map(d => {
                                    const pct = Math.round(d.percentageUsed);
                                    const remaining = Math.round(d.budget - (d.budget * (d.percentageUsed / 100)));
                                    return (
                                        <div key={d.name} className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5 mb-2 last:mb-0">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="text-sm font-medium">{d.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-danger">{pct}%</span>
                                                <p className="text-[10px] text-muted-foreground">{remaining} remaining</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {quotaAlerts.warning.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-warning mb-2">Warning — 70–90% used, monitor closely</p>
                                {quotaAlerts.warning.map(d => {
                                    const pct = Math.round(d.percentageUsed);
                                    const remaining = Math.round(d.budget - (d.budget * (d.percentageUsed / 100)));
                                    return (
                                        <div key={d.name} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5 mb-2 last:mb-0">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="text-sm font-medium">{d.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-warning">{pct}%</span>
                                                <p className="text-[10px] text-muted-foreground">{remaining} remaining</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {quotaAlerts.underutilized.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-info mb-2">Underutilized — Below 40%, consider redistributing</p>
                                {quotaAlerts.underutilized.map(d => {
                                    const pct = Math.round(d.percentageUsed);
                                    const remaining = Math.round(d.budget - (d.budget * (d.percentageUsed / 100)));
                                    return (
                                        <div key={d.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 mb-2 last:mb-0">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="text-sm font-medium">{d.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-info">{pct}%</span>
                                                <p className="text-[10px] text-muted-foreground">{remaining} unused</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {quotaAlerts.critical.length === 0 && quotaAlerts.warning.length === 0 && quotaAlerts.underutilized.length === 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3 text-sm text-success">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>All departments within healthy quota range.</span>
                            </div>
                        )}

                        <Link href="/oa/quota" className="block pt-1">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                                Manage Quota Allocations →
                            </Button>
                        </Link>
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
