"use client";

import { Users, Layers, Activity, Shield, CreditCard, TrendingUp } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

const orgStats = {
    totalEmployees: 120,
    activeEmployees: 112,
    departments: 6,
    monthlyRequests: 3200,
    monthlyQuota: 5000,
    anonymizationOps: 2800,
    plan: "Enterprise",
    accuracy: 99.1,
};

const topDepartments = [
    { name: "Engineering", employees: 45, used: 1200, total: 1500 },
    { name: "Marketing", employees: 20, used: 600, total: 800 },
    { name: "Sales", employees: 25, used: 500, total: 700 },
    { name: "Finance", employees: 12, used: 400, total: 600 },
    { name: "HR", employees: 10, used: 200, total: 400 },
    { name: "Operations", employees: 8, used: 300, total: 1000 },
];

const recentEmployees = [
    { name: "John Miller", email: "john@acme.com", dept: "Engineering", status: "ACTIVE", lastActive: "2 hours ago" },
    { name: "Emma Davis", email: "emma@acme.com", dept: "Marketing", status: "ACTIVE", lastActive: "30 min ago" },
    { name: "Carlos Ruiz", email: "carlos@acme.com", dept: "Sales", status: "PENDING", lastActive: "Never" },
    { name: "Aisha Patel", email: "aisha@acme.com", dept: "Finance", status: "ACTIVE", lastActive: "1 hour ago" },
    { name: "Mike Chen", email: "mike@acme.com", dept: "Engineering", status: "INACTIVE", lastActive: "3 days ago" },
];

export default function OrgAdminDashboard() {
    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="Organization Dashboard"
                subtitle="Acme Corporation — Manage your team's secure AI access."
            />

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Employees" value={orgStats.totalEmployees} icon={Users} delta={{ value: `${orgStats.activeEmployees} active`, trend: "up" }} />
                <StatCard title="Departments" value={orgStats.departments} icon={Layers} iconColor="text-info bg-info/10" />
                <StatCard title="Monthly Requests" value={orgStats.monthlyRequests.toLocaleString()} icon={Activity} delta={{ value: `of ${orgStats.monthlyQuota.toLocaleString()} quota`, trend: "up" }} iconColor="text-success bg-success/10" />
                <StatCard title="Anonymization Accuracy" value={`${orgStats.accuracy}%`} icon={Shield} delta={{ value: `${orgStats.anonymizationOps.toLocaleString()} ops`, trend: "flat" }} iconColor="text-warning bg-warning/10" />
            </div>

            {/* Organization Quota */}
            <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold">Organization Quota</CardTitle>
                    <Link href="/oa/quota"><Button variant="ghost" size="sm">Manage →</Button></Link>
                </CardHeader>
                <CardContent>
                    <QuotaBar used={orgStats.monthlyRequests} total={orgStats.monthlyQuota} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            {/* Departments + Recent Employees */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Departments */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold">Department Usage</CardTitle>
                        <Link href="/oa/departments"><Button variant="ghost" size="sm">View all →</Button></Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topDepartments.map((dept) => (
                                <div key={dept.name} className="flex items-center gap-4">
                                    <p className="w-24 text-sm font-medium truncate">{dept.name}</p>
                                    <div className="flex-1"><QuotaBar used={dept.used} total={dept.total} showLabel={false} size="sm" /></div>
                                    <p className="w-16 text-right text-xs text-muted-foreground">{dept.employees} users</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Employees */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-semibold">Recent Employees</CardTitle>
                        <Link href="/oa/employees"><Button variant="ghost" size="sm">View all →</Button></Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentEmployees.map((emp) => (
                                <div key={emp.email} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{emp.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{emp.name}</p>
                                            <StatusBadge status={emp.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{emp.dept} · {emp.lastActive}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
