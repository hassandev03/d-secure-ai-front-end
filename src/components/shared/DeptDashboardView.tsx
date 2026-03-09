"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Users, Activity, Shield, BarChart3, TrendingUp,
    AlertCircle, Brain,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
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
    getDeptEntityTypes, getDeptRoleUsage, getDeptTopUsers,
    type DeptDashboardStats, type DailyRequestPoint, type ModelUsageSlice,
    type EntityTypeSlice, type RoleUsagePoint, type DeptEmployee,
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
    const [entities, setEntities] = useState<EntityTypeSlice[]>([]);
    const [roles, setRoles] = useState<RoleUsagePoint[]>([]);
    const [topUsers, setTopUsers] = useState<DeptEmployee[]>([]);

    useEffect(() => {
        getDeptDashboardStats().then(setStats);
        getDeptDailyRequests().then(setDaily);
        getDeptModelUsage().then(setModels);
        getDeptEntityTypes().then(setEntities);
        getDeptRoleUsage().then(setRoles);
        getDeptTopUsers(5).then(setTopUsers);
    }, []);

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
                    delta={{ value: `of ${stats.monthlyQuota.toLocaleString()} quota`, trend: "up" }}
                    iconColor="text-info bg-info/10"
                />
                <StatCard
                    title="Anonymization Accuracy"
                    value={`${stats.anonymizationAccuracy}%`}
                    icon={Shield}
                    delta={{ value: `${stats.entitiesAnonymized.toLocaleString()} entities`, trend: "flat" }}
                    iconColor="text-success bg-success/10"
                />
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingQuotaRequests}
                    icon={AlertCircle}
                    delta={{ value: `Avg ${stats.avgRequestsPerEmployee} req/user`, trend: "flat" }}
                    iconColor="text-warning bg-warning/10"
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
                                <Bar dataKey="entitiesAnonymized" name="Entities Anonymized" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
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

            {/* ── Row 2: Entity Types + Role-based Usage ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* Entity Types Anonymized */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Entity Types Anonymized</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[260px] w-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={entities} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#475569" }}
                                    width={70}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: "#f1f5f9" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                />
                                <Bar dataKey="count" name="Entities" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16}>
                                    {entities.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(260, 70%, ${45 + index * 6}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Usage by Role */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Usage by Role</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[260px] w-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={roles} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                                <RechartsTooltip
                                    cursor={{ fill: "#f1f5f9" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />
                                <Bar dataKey="totalRequests" name="Total Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                                <Bar dataKey="avgRequests" name="Avg / Employee" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

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
