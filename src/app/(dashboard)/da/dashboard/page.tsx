"use client";

import { Users, Activity, Shield, BarChart3 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const deptStats = {
    employees: 45,
    activeEmployees: 42,
    monthlyRequests: 1200,
    monthlyQuota: 1500,
    accuracy: 99.3,
    pendingRequests: 2,
};

const topUsers = [
    { name: "Raj Patel", email: "raj@acme.com", requests: 320, status: "ACTIVE" },
    { name: "John Miller", email: "john@acme.com", requests: 180, status: "ACTIVE" },
    { name: "Alice Brown", email: "alice@acme.com", requests: 150, status: "ACTIVE" },
    { name: "Bob Wilson", email: "bob@acme.com", requests: 120, status: "ACTIVE" },
    { name: "Mike Chen", email: "mike@acme.com", requests: 45, status: "INACTIVE" },
];

export default function DeptAdminDashboard() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Engineering Department"
                subtitle="Department overview and team management."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Team Members" value={deptStats.employees} icon={Users} delta={{ value: `${deptStats.activeEmployees} active`, trend: "up" }} />
                <StatCard title="Monthly Requests" value={deptStats.monthlyRequests.toLocaleString()} icon={Activity} delta={{ value: `of ${deptStats.monthlyQuota.toLocaleString()} quota`, trend: "up" }} iconColor="text-info bg-info/10" />
                <StatCard title="Accuracy" value={`${deptStats.accuracy}%`} icon={Shield} iconColor="text-success bg-success/10" />
                <StatCard title="Pending Requests" value={deptStats.pendingRequests} icon={BarChart3} iconColor="text-warning bg-warning/10" />
            </div>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Department Quota</CardTitle>
                    <Link href="/da/quota-requests"><Button variant="ghost" size="sm">Request more →</Button></Link>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={deptStats.monthlyRequests} total={deptStats.monthlyQuota} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base font-semibold">Top Users by Activity</CardTitle>
                    <Link href="/da/employees"><Button variant="ghost" size="sm">View all →</Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topUsers.map((u, i) => (
                            <div key={u.email} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{u.name}</p><StatusBadge status={u.status} /></div>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">{u.requests} <span className="text-xs text-muted-foreground font-normal">requests</span></p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
