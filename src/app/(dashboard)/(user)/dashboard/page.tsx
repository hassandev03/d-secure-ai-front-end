"use client";

import { Activity, MessageSquare, Shield, Clock } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const userStats = {
    totalSessions: 48,
    totalRequests: 320,
    anonymizationOps: 890,
    avgResponseTime: "1.2s",
    quota: { used: 320, total: 1000 },
};

const recentSessions = [
    { id: "sess-1", title: "GDPR Compliance Query", model: "Claude 4.6 Sonnet", messages: 12, time: "2 hours ago" },
    { id: "sess-2", title: "Code Review — Auth Module", model: "GPT-5.1", messages: 8, time: "5 hours ago" },
    { id: "sess-3", title: "Market Research Analysis", model: "Gemini 3.1 Pro", messages: 15, time: "Yesterday" },
    { id: "sess-4", title: "SQL Optimization Help", model: "Claude 4.5 Haiku", messages: 6, time: "Yesterday" },
    { id: "sess-5", title: "Technical Writing Draft", model: "GPT-4o", messages: 20, time: "2 days ago" },
];

export default function UserDashboard() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="My Dashboard"
                subtitle="Your personal D-SecureAI usage overview."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Chat Sessions" value={userStats.totalSessions} icon={MessageSquare} />
                <StatCard title="AI Requests" value={userStats.totalRequests} icon={Activity} iconColor="text-info bg-info/10" />
                <StatCard title="Data Anonymized" value={userStats.anonymizationOps} icon={Shield} iconColor="text-success bg-success/10" />
                <StatCard title="Avg Response" value={userStats.avgResponseTime} icon={Clock} iconColor="text-warning bg-warning/10" />
            </div>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Monthly Quota</CardTitle>
                    <Link href="/subscription"><Button variant="ghost" size="sm">Upgrade →</Button></Link>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={userStats.quota.used} total={userStats.quota.total} label="AI Requests This Month" />
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
                    <Link href="/history"><Button variant="ghost" size="sm">View all →</Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentSessions.map((s) => (
                            <Link key={s.id} href={`/chat/${s.id}`}>
                                <div className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                                        <MessageSquare className="h-4 w-4 text-brand-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{s.title}</p>
                                        <p className="text-xs text-muted-foreground">{s.model} · {s.messages} messages</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground shrink-0">{s.time}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
