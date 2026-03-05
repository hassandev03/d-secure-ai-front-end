"use client";

import { BarChart3, Users, Building2, Activity, TrendingUp, Globe } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const dailyRequests = [
    { day: "Mon", requests: 1800 }, { day: "Tue", requests: 2200 },
    { day: "Wed", requests: 2600 }, { day: "Thu", requests: 2400 },
    { day: "Fri", requests: 2100 }, { day: "Sat", requests: 900 },
    { day: "Sun", requests: 700 },
];

const modelUsage = [
    { name: "Claude 4.6 Sonnet", value: 35, color: "#3B82F6" },
    { name: "GPT-5.1", value: 28, color: "#10B981" },
    { name: "Gemini 3.1 Pro", value: 20, color: "#F59E0B" },
    { name: "Claude 4.5 Haiku", value: 12, color: "#8B5CF6" },
    { name: "Others", value: 5, color: "#94A3B8" },
];

const monthlyTrend = [
    { month: "Jul", users: 620, requests: 42000 },
    { month: "Aug", users: 780, requests: 58000 },
    { month: "Sep", users: 920, requests: 72000 },
    { month: "Oct", users: 1100, requests: 89000 },
    { month: "Nov", users: 1320, requests: 104000 },
    { month: "Dec", users: 1580, requests: 128400 },
];

const topOrgs = [
    { name: "Acme Corp", requests: 4200, pct: 22 },
    { name: "GovShield", requests: 3800, pct: 20 },
    { name: "MediHealth", requests: 2900, pct: 15 },
    { name: "FinSecure", requests: 2100, pct: 11 },
    { name: "Others", requests: 6000, pct: 32 },
];

export default function AnalyticsPage() {
    return (
        <div className="mx-auto max-w-7xl">
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
                <StatCard title="Total Requests" value="128.4K" icon={Activity} delta={{ value: "+12% this week", trend: "up" }} />
                <StatCard title="Active Users" value="1,580" icon={Users} delta={{ value: "+18% this month", trend: "up" }} iconColor="text-info bg-info/10" />
                <StatCard title="Organizations" value="42" icon={Building2} delta={{ value: "+3 this month", trend: "up" }} iconColor="text-success bg-success/10" />
                <StatCard title="Avg. Accuracy" value="98.7%" icon={TrendingUp} delta={{ value: "Stable", trend: "flat" }} iconColor="text-warning bg-warning/10" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Daily requests bar chart */}
                <Card>
                    <CardHeader><CardTitle className="text-base font-semibold">Daily Requests</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dailyRequests}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
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
                                    <Tooltip />
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
                            <Tooltip />
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
