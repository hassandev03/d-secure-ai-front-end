"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Building2, Activity, TrendingUp, Globe, CreditCard, DollarSign, Loader2, PlusCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRevenueStats, getDashboardStats, getOrganizations } from "@/services/sa.service";
import type { SARevenueStats, SADashboardStats, SAOrganization } from "@/types/sa.types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";

const modelUsage = [
    { name: "Claude 4.6 Sonnet", value: 35, color: "#3B82F6" },
    { name: "GPT-5.1", value: 28, color: "#10B981" },
    { name: "Gemini 3.1 Pro", value: 20, color: "#F59E0B" },
    { name: "Claude 4.5 Haiku", value: 12, color: "#8B5CF6" },
    { name: "Others", value: 5, color: "#94A3B8" },
];

export default function AnalyticsPage() {
    const [revStats, setRevStats] = useState<SARevenueStats | null>(null);
    const [stats, setStats] = useState<SADashboardStats | null>(null);
    const [orgs, setOrgs] = useState<SAOrganization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getRevenueStats(),
            getDashboardStats(),
            getOrganizations()
        ]).then(([r, s, o]) => {
            setRevStats(r);
            setStats(s);
            setOrgs(o);
            setLoading(false);
        });
    }, []);

    if (loading || !revStats || !stats || !orgs.length) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
        );
    }

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const RevenueBreakdown = [
        { name: "Subscriptions Profit", value: revStats.subscriptionsProfit, color: "#10B981" },
        { name: "Add-ons Profit", value: revStats.addonProfit, color: "#3B82F6" },
        { name: "Est. Cost", value: revStats.totalCost, color: "#EF4444" },
    ];

    const dailyRequests = [
        { day: "Mon", requests: 410 }, { day: "Tue", requests: 480 },
        { day: "Wed", requests: 520 }, { day: "Thu", requests: 460 },
        { day: "Fri", requests: 490 }, { day: "Sat", requests: 180 },
        { day: "Sun", requests: 240 },
    ];

    const monthlyTrend = [
        { month: "Jul", users: Math.round(stats.totalUsers * 0.25), requests: 3200 },
        { month: "Aug", users: Math.round(stats.totalUsers * 0.40), requests: 5100 },
        { month: "Sep", users: Math.round(stats.totalUsers * 0.55), requests: 6800 },
        { month: "Oct", users: Math.round(stats.totalUsers * 0.80), requests: 8900 },
        { month: "Nov", users: Math.round(stats.totalUsers * 0.90), requests: 10500 },
        { month: "Dec", users: stats.totalUsers, requests: 12400 },
    ];

    const sortedOrgs = [...orgs].sort((a, b) => b.quota.used - a.quota.used);
    const totalOrgUsage = orgs.reduce((sum, o) => sum + o.quota.used, 0);
    const topOrgs = sortedOrgs.slice(0, 5).map(o => ({
        name: o.name,
        requests: o.quota.used,
        pct: totalOrgUsage > 0 ? Math.round((o.quota.used / totalOrgUsage) * 100) : 0
    }));

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                title="Platform Analytics"
                subtitle="System-wide usage metrics and trends."
                breadcrumbs={[{ label: "Super Admin", href: "/sa/dashboard" }, { label: "Analytics" }]}
                actions={
                    <Select defaultValue="7d">
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={formatCurrency(revStats.totalRevenue)} icon={DollarSign} delta={{ value: "+8% this month", trend: "up" }} iconColor="text-success bg-success/10" />
                <StatCard title="Total Requests" value={(stats.totalRequests / 1000).toFixed(1) + "K"} icon={Activity} delta={{ value: "+12% this week", trend: "up" }} />
                <StatCard title="Active Users" value={stats.totalUsers.toLocaleString()} icon={Users} delta={{ value: "Total registered", trend: "up" }} iconColor="text-info bg-info/10" />
                <StatCard title="Organizations" value={stats.totalOrganizations} icon={Building2} delta={{ value: "+3 this month", trend: "up" }} iconColor="text-success bg-success/10" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Revenue Breakdown</CardTitle>
                            <CardDescription>Understanding where your subscription revenue goes.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-3 p-3 mt-2 bg-muted/40 rounded-lg text-[13px]">
                                <div>
                                    <div className="font-semibold text-foreground flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Subs Profit</div>
                                    <div className="text-muted-foreground leading-tight mt-1 text-[11px]">Recurring plans revenue.</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Add-ons Profit</div>
                                    <div className="text-muted-foreground leading-tight mt-1 text-[11px]">Extra quota blocks.</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Est. Cost</div>
                                    <div className="text-muted-foreground leading-tight mt-1 text-[11px]">Backend & server costs.</div>
                                </div>
                            </div>
                            
                            <div className="h-[220px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={RevenueBreakdown} 
                                            cx="50%" cy="50%" 
                                            innerRadius={65} outerRadius={85} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {RevenueBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any) => formatCurrency(value || 0)} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-6">
                    <StatCard 
                        title="Unused Credits Profit" 
                        value={formatCurrency(revStats.unusedCreditsProfit)} 
                        icon={PlusCircle} 
                        delta={{ value: "Added to net profit margin", trend: "up" }} 
                        iconColor="text-brand-700 bg-brand-50" 
                    />
                    <StatCard 
                        title="Average Profit Margin" 
                        value={`${Math.round(revStats.profitMargin)}%`} 
                        icon={TrendingUp} 
                        delta={{ value: "Across all active plans", trend: "up" }} 
                        iconColor="text-info bg-info/10" 
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Daily requests bar chart */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Daily Requests</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dailyRequests}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
                                <Bar dataKey="requests" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Model usage pie chart */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Model Usage Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={240}>
                                <PieChart>
                                    <Pie data={modelUsage} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                                        {modelUsage.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2.5 flex-1">
                                {modelUsage.map((m) => (
                                    <div key={m.name} className="flex items-center gap-2 text-sm">
                                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="text-muted-foreground flex-1 truncate">{m.name}</span>
                                        <span className="font-semibold">{m.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Growth trend */}
            <Card className="mt-6">
                <CardHeader><CardTitle className="text-base font-semibold">Platform Growth</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                            <RechartsTooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Users" />
                            <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Requests" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Orgs */}
            <Card className="mt-6">
                <CardHeader><CardTitle className="text-base font-semibold">Top Organizations by Usage</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topOrgs.map((org) => (
                            <div key={org.name} className="flex items-center gap-4">
                                <p className="w-28 text-sm font-medium truncate">{org.name}</p>
                                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-brand-500" style={{ width: `${org.pct}%` }} /></div>
                                <p className="w-20 text-right text-sm text-muted-foreground">{org.requests.toLocaleString()}</p>
                                <p className="w-12 text-right text-xs font-semibold text-foreground">{org.pct}%</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
