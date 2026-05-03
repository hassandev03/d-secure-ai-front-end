"use client";

import { useState, useEffect } from "react";
import { Activity, MessageSquare, Shield, BarChart3 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaGauge from "@/components/shared/QuotaGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useAuthStore } from "@/store/auth.store";

import {
    getDashboardSummary, type ChatSessionSummary,
    type DashboardStats, type DailyActivityPoint, type ModelUsagePoint, type EntityTypePoint, type DashboardSummaryResponse
} from "@/services/dashboard.service";

export default function UserDashboard() {
    const { user } = useAuthStore();
    const isOrgUser = user?.role === 'ORG_EMPLOYEE' || user?.role === 'ORG_ADMIN' || user?.role === 'DEPT_ADMIN';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
    const [models, setModels] = useState<ModelUsagePoint[]>([]);
    const [entities, setEntities] = useState<EntityTypePoint[]>([]);
    const [recentSessions, setRecentSessions] = useState<ChatSessionSummary[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        getDashboardSummary(controller.signal).then((data) => {
            if (controller.signal.aborted) return;
            if (data) {
                setStats(data.stats);
                setActivity(data.dailyActivity);
                setModels(data.models);
                setEntities(data.entities);
                setRecentSessions(data.recentSessions);
            } else {
                setStats({
                    totalRequestsThisMonth: 0,
                    totalSessions: 0,
                    entitiesAnonymized: 0,
                    quotaRemaining: 50,
                    quotaTotal: 50,
                    avgEntitiesPerRequest: 0,
                    percentageUsed: 0,
                    planName: "Free",
                    periodEndsAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                });
            }
            setIsLoading(false);
        });
        return () => controller.abort();
    }, []);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader title="My Dashboard" subtitle="Your personal D-SecureAI usage overview." />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
                </div>
                <div className="h-48 rounded-xl bg-muted animate-pulse mt-6" />
                <div className="grid gap-6 lg:grid-cols-2 mt-6">
                    <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="h-[190px] rounded-xl bg-muted animate-pulse" />
                        <div className="h-[190px] rounded-xl bg-muted animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

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

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* ── Left: Main Activity Chart (2/3 width) ── */}
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Daily Request Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[350px] w-full pb-4">
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
                                <Line type="monotone" dataKey="quotaUtilizedPct" name="Quota Used (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ── Right: Quota & Plan Summary (1/3 width) ── */}
                <div className="flex flex-col gap-6">
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">
                                {isOrgUser ? "Organization Quota" : "Monthly Credit Budget"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center py-6">
                            <QuotaGauge
                                percentageUsed={stats.percentageUsed}
                                planName={stats.planName}
                                renewsAt={stats.periodEndsAt}
                                size="md"
                            />
                            <div className="mt-6 w-full space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Plan Status</span>
                                    <Badge variant="outline" className="text-success border-success/20 bg-success/5 uppercase text-[10px]">{stats.planName}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Requests Used</span>
                                    <span className="font-medium">{stats.totalRequestsThisMonth} / {stats.quotaTotal}</span>
                                </div>
                                <div className="pt-2">
                                    {!isOrgUser && (
                                        <Link href="/subscription" className="w-full">
                                            <Button variant="outline" size="sm" className="w-full text-brand-600 border-brand-200 hover:bg-brand-50">Upgrade Plan</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Models Used</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[180px] pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={models} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                        {models.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Top Entity Types Anonymized</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={entities} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569" }} width={80} />
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

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
                        <Link href="/history"><Button variant="ghost" size="sm">View all →</Button></Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentSessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2 text-center italic">No recent sessions found.</p>
                            ) : (
                                recentSessions.map((s) => (
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
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
