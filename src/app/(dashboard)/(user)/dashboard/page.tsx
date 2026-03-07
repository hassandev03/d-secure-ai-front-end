"use client";

import { useState, useEffect } from "react";
import { Activity, MessageSquare, Shield, BarChart3 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useAuthStore } from "@/store/auth.store";

import {
    getUserDashboardStats, getDailyActivity, getModelUsageBreakdown, getEntityTypeBreakdown,
    type DashboardStats, type DailyActivityPoint, type ModelUsagePoint, type EntityTypePoint
} from "@/services/dashboard.service";
import { getChatSessions, type ChatSessionSummary } from "@/services/chat.service";

export default function UserDashboard() {
    const { user } = useAuthStore();
    const isOrgUser = user?.role === 'ORG_EMPLOYEE' || user?.role === 'ORG_ADMIN' || user?.role === 'DEPT_ADMIN';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
    const [models, setModels] = useState<ModelUsagePoint[]>([]);
    const [entities, setEntities] = useState<EntityTypePoint[]>([]);
    const [recentSessions, setRecentSessions] = useState<ChatSessionSummary[]>([]);

    useEffect(() => {
        getUserDashboardStats(user?.subscriptionTier).then(setStats);
        getDailyActivity(7).then(setActivity);
        getModelUsageBreakdown().then(setModels);
        getEntityTypeBreakdown().then(setEntities);
        getChatSessions().then(sessions => setRecentSessions(sessions.slice(0, 5)));
    }, []);

    if (!stats) return null;

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="My Dashboard"
                subtitle="Your personal D-SecureAI usage overview."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Chat Sessions" value={stats.totalSessions} icon={MessageSquare} />
                <StatCard title="AI Requests" value={stats.totalRequestsThisMonth} icon={Activity} iconColor="text-brand-600 bg-brand-100" />
                <StatCard title="Entities Anonymized" value={stats.entitiesAnonymized} icon={Shield} iconColor="text-success bg-success/10" />
                <StatCard title="Avg. Entities/Request" value={stats.avgEntitiesPerRequest} icon={BarChart3} iconColor="text-purple-600 bg-purple-100" />
            </div>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">
                        {isOrgUser ? "Organization Quota" : "Monthly Quota"}
                    </CardTitle>
                    {!isOrgUser && (
                        <Link href="/subscription"><Button variant="ghost" size="sm">Upgrade →</Button></Link>
                    )}
                </CardHeader>
                <CardContent>
                    <QuotaBar
                        used={stats.totalRequestsThisMonth}
                        total={stats.quotaTotal}
                        label="AI Requests This Month"
                    />
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
                {/* ── Daily Activity Chart ── */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Daily Request Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px] w-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                                <RechartsTooltip
                                    cursor={{ fill: "#f1f5f9" }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar dataKey="requests" name="AI Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="entitiesAnonymized" name="Entities Anonymized" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                <Line type="monotone" dataKey="quotaUtilizedPct" name="Quota Utilized (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ── Models Used & Top Entities ── */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Models Used</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={models} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {models.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px', right: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Top Entity Types Anonymized</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] w-full pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={entities} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} width={70} />
                                    <RechartsTooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="count" name="Entities" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16}>
                                        {entities.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(260, 70%, ${50 + index * 5}%)`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
                    <Link href="/history"><Button variant="ghost" size="sm">View all →</Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentSessions.map((s) => (
                            <Link key={s.id} href={`/chat?id=${s.id}`}>
                                <div className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                                        <MessageSquare className="h-4 w-4 text-brand-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{s.title}</p>
                                        <p className="text-xs text-muted-foreground">{s.modelName} · {s.messageCount} messages</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground shrink-0">{s.lastMessageAt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
