"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Users, Activity,
    Gauge, Brain,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    getDeptDashboardStats, getDeptDailyRequests, getDeptModelUsage,
    getDeptUsageTrend, getDeptRoleUsage, getDeptTopUsers,
    type DeptDashboardStats, type DailyRequestPoint, type ModelUsageSlice,
    type UsageTrendPoint, type RoleUsagePoint, type DeptEmployee,
} from "@/services/da.service";

interface DeptDashboardViewProps {
    /** Visible department name */
    deptName: string;
    /** Subtitle shown below the title */
    subtitle: string;
    /** Breadcrumbs for the PageHeader */
    breadcrumbs?: { label: string; href?: string }[];
    /** Base route prefix for links (e.g. "/da" or "/oa/departments/dept-001") */
    linkPrefix: string;
    /** Whether to show the "Request more" quota link (only for DA) */
    showQuotaRequestLink?: boolean;
    /** Optional header actions */
    headerActions?: React.ReactNode;
}

export default function DeptDashboardView({
    deptName,
    subtitle,
    breadcrumbs,
    linkPrefix,
    showQuotaRequestLink = false,
    headerActions,
}: DeptDashboardViewProps) {
    const [stats, setStats] = useState<DeptDashboardStats | null>(null);
    const [daily, setDaily] = useState<DailyRequestPoint[]>([]);
    const [models, setModels] = useState<ModelUsageSlice[]>([]);
    const [usageTrend, setUsageTrend] = useState<UsageTrendPoint[]>([]);
    const [trendRange, setTrendRange] = useState<7 | 30>(7);
    const [roles, setRoles] = useState<RoleUsagePoint[]>([]);
    const [topUsers, setTopUsers] = useState<DeptEmployee[]>([]);

    useEffect(() => {
        getDeptDashboardStats().then(setStats);
        getDeptDailyRequests().then(setDaily);
        getDeptModelUsage().then(setModels);
        getDeptRoleUsage().then(setRoles);
        getDeptTopUsers(5).then(setTopUsers);
    }, []);

    const loadTrend = useCallback((range: 7 | 30) => {
        setTrendRange(range);
        getDeptUsageTrend(range).then(setUsageTrend);
    }, []);

    useEffect(() => { loadTrend(7); }, [loadTrend]);

    if (!stats) return null;

    const employeesHref = `${linkPrefix}/employees`;
    const quotaHref = `${linkPrefix}/quota-requests`;

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title={deptName}
                subtitle={subtitle}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
            />

            {/* ── KPI cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Team Members"
                    value={stats.totalEmployees}
                    icon={Users}
                    delta={{ value: `${stats.activeEmployees} active`, trend: "up" }}
                />
                <StatCard
                    title="Monthly Requests"
                    value={stats.monthlyRequests.toLocaleString()}
                    icon={Activity}
                    delta={{ value: `Avg ${stats.avgRequestsPerEmployee} per user`, trend: "up" }}
                    iconColor="text-info bg-info/10"
                />
                <StatCard
                    title="Quota Utilization"
                    value={`${stats.quotaUtilization}%`}
                    icon={Gauge}
                    delta={{
                        value: stats.quotaUtilization >= 90 ? "Near limit" : stats.quotaUtilization >= 70 ? "Moderate usage" : "Healthy",
                        trend: stats.quotaUtilization >= 90 ? "down" : stats.quotaUtilization >= 70 ? "flat" : "up",
                    }}
                    iconColor={stats.quotaUtilization >= 90 ? "text-danger bg-danger/10" : stats.quotaUtilization >= 70 ? "text-warning bg-warning/10" : "text-success bg-success/10"}
                />
                <StatCard
                    title="Models in Use"
                    value={stats.modelsInUse}
                    icon={Brain}
                    delta={{ value: `of ${stats.totalModelsAvailable} available`, trend: "flat" }}
                    iconColor="text-info bg-info/10"
                />
            </div>

            {/* ── Quota bar ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Department Quota</CardTitle>
                    {showQuotaRequestLink && (
                        <Link href={quotaHref}>
                            <Button variant="ghost" size="sm">Request more &rarr;</Button>
                        </Link>
                    )}
                </CardHeader>
                <CardContent>
                    <QuotaBar
                        used={stats.monthlyRequests}
                        total={stats.monthlyQuota}
                        label="Monthly AI Requests"
                    />
                </CardContent>
            </Card>

            {/* ── Row 1: Daily Activity + Model Usage ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Daily Requests Trend */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Daily Request Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px] w-full pb-4">
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
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px] pb-4">
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

            {/* ── Usage Trend (filterable) ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Usage Trend</CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant={trendRange === 7 ? "default" : "outline"}
                            size="sm"
                            onClick={() => loadTrend(7)}
                        >
                            7 Days
                        </Button>
                        <Button
                            variant={trendRange === 30 ? "default" : "outline"}
                            size="sm"
                            onClick={() => loadTrend(30)}
                        >
                            30 Days
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="min-h-[300px] w-full pb-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={usageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
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
                            <Area
                                type="monotone"
                                dataKey="requests"
                                name="Requests"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#gradRequests)"
                            />
                            <Area
                                type="monotone"
                                dataKey="activeUsers"
                                name="Active Users"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#gradUsers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Usage by Role ── */}
            <Card className="mt-6 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Usage by Role</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[280px] w-full pb-4">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={roles} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <RechartsTooltip
                                cursor={{ fill: "#f1f5f9" }}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                            <Bar dataKey="totalRequests" name="Total Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="avgRequests" name="Avg / Employee" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Top Users ── */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-semibold">Top Users by Activity</CardTitle>
                    <Link href={employeesHref}>
                        <Button variant="ghost" size="sm">View all &rarr;</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topUsers.map((u, i) => (
                            <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                    {i + 1}
                                </span>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                                        {u.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{u.name}</p>
                                        <StatusBadge status={u.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {u.roleName} &middot; {u.email}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {u.requests}{" "}
                                    <span className="text-xs text-muted-foreground font-normal">requests</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
