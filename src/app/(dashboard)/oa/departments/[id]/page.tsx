"use client";

import { use } from "react";
import { Users, Activity, Shield, Layers } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import QuotaBar from "@/components/shared/QuotaBar";
import StatusBadge from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const deptDetail = {
    name: "Engineering",
    head: "Sarah Johnson",
    headEmail: "sarah@acme.com",
    employees: 45,
    activeEmployees: 42,
    quota: { used: 1200, total: 1500 },
    totalRequests: 8900,
    accuracy: 99.3,
    members: [
        { name: "Raj Patel", email: "raj@acme.com", role: "EMPLOYEE", status: "ACTIVE", requests: 320 },
        { name: "John Miller", email: "john@acme.com", role: "EMPLOYEE", status: "ACTIVE", requests: 180 },
        { name: "Alice Brown", email: "alice@acme.com", role: "EMPLOYEE", status: "ACTIVE", requests: 150 },
        { name: "Bob Wilson", email: "bob@acme.com", role: "EMPLOYEE", status: "ACTIVE", requests: 120 },
        { name: "Mike Chen", email: "mike@acme.com", role: "EMPLOYEE", status: "INACTIVE", requests: 45 },
    ],
};

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title={deptDetail.name}
                subtitle={`Managed by ${deptDetail.head}`}
                breadcrumbs={[
                    { label: "Organization", href: "/oa/dashboard" },
                    { label: "Departments", href: "/oa/departments" },
                    { label: deptDetail.name },
                ]}
                actions={<Button variant="outline">Edit Department</Button>}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Members" value={deptDetail.employees} icon={Users} delta={{ value: `${deptDetail.activeEmployees} active`, trend: "up" }} />
                <StatCard title="Monthly Requests" value={deptDetail.quota.used.toLocaleString()} icon={Activity} iconColor="text-info bg-info/10" />
                <StatCard title="Total Requests" value={deptDetail.totalRequests.toLocaleString()} icon={Layers} iconColor="text-success bg-success/10" />
                <StatCard title="Accuracy" value={`${deptDetail.accuracy}%`} icon={Shield} iconColor="text-warning bg-warning/10" />
            </div>

            <Card className="mt-6">
                <CardHeader><CardTitle className="text-base font-semibold">Department Quota</CardTitle></CardHeader>
                <CardContent>
                    <QuotaBar used={deptDetail.quota.used} total={deptDetail.quota.total} label="Monthly AI Requests" />
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader><CardTitle className="text-base font-semibold">Department Members</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Requests</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deptDetail.members.map((m) => (
                                <TableRow key={m.email}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">{m.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm capitalize">{m.role.toLowerCase().replace("_", " ")}</TableCell>
                                    <TableCell><StatusBadge status={m.status} /></TableCell>
                                    <TableCell className="text-center text-sm">{m.requests}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
